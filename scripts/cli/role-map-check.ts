/**
 * role-map-check.ts
 * role-map.yaml을 읽어 각 path 실존 여부 확인 + max_lines 위반 감지
 * 결과: PASS / WARN / FAIL 출력
 *
 * 종료 코드:
 *   0 — PASS (경고 있어도 0)
 *   1 — FAIL (path 미존재)
 */

import { readFileSync, existsSync, statSync, readFileSync as rf } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── 경로 설정 ────────────────────────────────────────────────────────────────

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..");
const ROLE_MAP_PATH = join(ROOT, "docs/_details/role-map.yaml");

// ── 최소 yaml 파서 ───────────────────────────────────────────────────────────
// paths: 아래 블록을 파싱. 각 항목은 "  - path:", 나머지 키는 들여쓰기된 필드.

type RoleEntry = {
  path: string;
  role: string;
  source_of_truth?: boolean;
  max_lines?: number;
  notes?: string;
};

function parseRoleMap(content: string): RoleEntry[] {
  const entries: RoleEntry[] = [];
  let current: Partial<RoleEntry> | null = null;
  let inPaths = false;

  for (const raw of content.split(/\r?\n/)) {
    const line = raw;

    // 주석·빈 줄 스킵
    if (line.trim().startsWith("#") || line.trim() === "") continue;

    // paths: 블록 시작
    if (/^paths:/.test(line)) {
      inPaths = true;
      continue;
    }

    if (!inPaths) continue;

    // 새 항목 시작
    if (/^\s{2}-\s+path:\s*"(.+)"/.test(line)) {
      if (current?.path) entries.push(current as RoleEntry);
      const m = line.match(/path:\s*"(.+)"/);
      current = { path: m![1] };
      continue;
    }

    if (!current) continue;

    // role
    const roleM = line.match(/^\s+role:\s*"(.+)"/);
    if (roleM) { current.role = roleM[1]; continue; }

    // source_of_truth
    const sotM = line.match(/^\s+source_of_truth:\s*(true|false)/);
    if (sotM) { current.source_of_truth = sotM[1] === "true"; continue; }

    // max_lines
    const mlM = line.match(/^\s+max_lines:\s*(\d+)/);
    if (mlM) { current.max_lines = parseInt(mlM[1], 10); continue; }

    // notes — 따옴표 있거나 없거나
    const notesM = line.match(/^\s+notes:\s*"?(.+?)"?\s*$/);
    if (notesM) { current.notes = notesM[1]; continue; }
  }

  if (current?.path) entries.push(current as RoleEntry);
  return entries;
}

// ── 줄 수 계산 ───────────────────────────────────────────────────────────────

function countLines(filePath: string): number {
  try {
    const content = rf(filePath, "utf8");
    return content.split(/\r?\n/).length;
  } catch {
    return -1;
  }
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

type CheckResult = {
  entry: RoleEntry;
  exists: boolean;
  isDir: boolean;
  lineCount?: number;
  lineWarn?: boolean;
};

function runCheck(): void {
  if (!existsSync(ROLE_MAP_PATH)) {
    console.error(`FAIL — role-map.yaml 없음: ${ROLE_MAP_PATH}`);
    process.exit(1);
  }

  const content = readFileSync(ROLE_MAP_PATH, "utf8");
  const entries = parseRoleMap(content);

  if (entries.length === 0) {
    console.error("FAIL — role-map.yaml에서 항목을 파싱하지 못했습니다.");
    process.exit(1);
  }

  const results: CheckResult[] = [];

  for (const entry of entries) {
    const abs = join(ROOT, entry.path);
    const exists = existsSync(abs);
    let isDir = false;
    if (exists) {
      try { isDir = statSync(abs).isDirectory(); } catch { /* ignore */ }
    }

    const result: CheckResult = { entry, exists, isDir };

    // 파일인 경우만 줄 수 체크
    if (exists && !isDir && entry.max_lines !== undefined) {
      result.lineCount = countLines(abs);
      result.lineWarn = result.lineCount > entry.max_lines;
    }

    results.push(result);
  }

  // ── 출력 ─────────────────────────────────────────────────────────────────
  const width = 70;
  const sep = "─".repeat(width);

  console.log(`\n┌${sep}┐`);
  console.log(`│  pokit role-check — Role Map 검증${" ".repeat(width - 34)}│`);
  console.log(`│  소스: docs/_details/role-map.yaml${" ".repeat(width - 35)}│`);
  console.log(`└${sep}┘\n`);

  let failCount = 0;
  let warnCount = 0;
  let passCount = 0;

  for (const r of results) {
    const { entry, exists, isDir, lineCount, lineWarn } = r;

    if (!exists) {
      failCount++;
      console.log(`  FAIL  ${entry.path}`);
      console.log(`         └─ 경로 미존재`);
    } else if (lineWarn) {
      warnCount++;
      console.log(`  WARN  ${entry.path}`);
      console.log(`         └─ ${lineCount}줄 > max_lines ${entry.max_lines}`);
    } else {
      passCount++;
      const suffix = isDir ? "/" : "";
      const mlInfo = lineCount !== undefined ? `  (${lineCount}줄)` : "";
      console.log(`  PASS  ${entry.path}${suffix}${mlInfo}`);
    }
  }

  // ── 요약 ─────────────────────────────────────────────────────────────────
  console.log(`\n${sep}`);
  console.log(`총 ${entries.length}개 — PASS: ${passCount}  WARN: ${warnCount}  FAIL: ${failCount}`);

  if (failCount > 0) {
    console.log(`\nFAIL — 미존재 경로 ${failCount}개. role-map.yaml 수정 또는 경로 생성 필요.`);
    process.exit(1);
  } else if (warnCount > 0) {
    console.log(`\nWARN — max_lines 초과 ${warnCount}개. 파일 슬림화 또는 max_lines 상향 검토.`);
    process.exit(0);
  } else {
    console.log(`\nPASS — 모든 경로 정상.`);
    process.exit(0);
  }
}

runCheck();
