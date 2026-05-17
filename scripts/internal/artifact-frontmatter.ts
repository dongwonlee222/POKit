/**
 * artifact-frontmatter.ts — C4 (zero-dep hand-rolled 파서)
 *
 * 지원 형식:
 *   scalar:        key: value  /  key: "quoted value"
 *   인라인 배열:  key: [item1, item2]  /  key: []
 *   multi-line:   key:\n  - item1\n  - item2
 *   한국어 UTF-8 값 안전 처리
 */

import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

// ─── 허용 kind 값 ──────────────────────────────────────────────────────────

export const ALLOWED_KINDS = [
  "decision-log",
  "manifest",
  "brief",
  "memo",
  "prd",
  "criteria",
  "history",
  "retro",
  "linear-desc",
  "analysis",
  "workflow-state",
] as const;

export type AllowedKind = (typeof ALLOWED_KINDS)[number];

/** T6 audit 반영 — ArtifactKind union (ALLOWED_KINDS와 동기화 유지) */
export type ArtifactKind =
  | "decision-log"
  | "manifest"
  | "brief"
  | "memo"
  | "prd"
  | "criteria"
  | "linear-desc"
  | "retro"
  | "analysis"
  | "workflow-state";

// ─── 공통 frontmatter 필드 ────────────────────────────────────────────────

export type CommonFrontmatter = {
  kind: ArtifactKind;
  version?: string;
  schema_version?: string;
  created?: string;
  updated?: string;
  linked_issues?: string[];
  linked_cycle?: string;
  linked_release?: string;
  author?: string;
};

// ─── kind별 discriminated union ───────────────────────────────────────────

export type MemoFrontmatter = CommonFrontmatter & {
  kind: "memo";
  workflow_action: "create" | "update" | "skip";
  idempotency_key: string;
  dependencies: string[];
  source?: string;
  proposed_labels?: string[];
  proposed_state?: string;
};

export type RetroFrontmatter = CommonFrontmatter & {
  kind: "retro";
  cycle_id: string;
  external_writes: string[];
  retro_subkind?: "close" | "retro";
};

export type CriteriaFrontmatter = CommonFrontmatter & {
  kind: "criteria";
  linear_issue_id: string;
  status: string;
  content_hash: string;
  skill_used?: string;
};

export type AnalysisFrontmatter = CommonFrontmatter & {
  kind: "analysis";
  analysis_kind?: string;
};

export type WorkflowStateFrontmatter = CommonFrontmatter & {
  kind: "workflow-state";
};

export type TypedFrontmatter =
  | MemoFrontmatter
  | RetroFrontmatter
  | CriteriaFrontmatter
  | AnalysisFrontmatter
  | WorkflowStateFrontmatter
  | CommonFrontmatter;

// ─── 타입 ──────────────────────────────────────────────────────────────────

export type ArtifactFrontmatterData = {
  kind?: string;
  version?: string;
  schema_version?: string;
  created?: string;
  updated?: string;
  linked_issues?: string[];
  linked_cycle?: string;
  linked_release?: string;
  author?: string;
  [key: string]: string | string[] | undefined;
};

export type ParseResult = {
  hasFrontmatter: boolean;
  data: ArtifactFrontmatterData;
};

export type ValidationResult = {
  valid: boolean;
  data: ArtifactFrontmatterData;
  errors: string[];
};

export type ArtifactScanReport = {
  valid: boolean;
  files: Array<{
    relativePath: string;
    valid: boolean;
    errors: string[];
  }>;
};

export type MigrateStatus = "migrated" | "skipped" | "error";

export type MigrateResult = {
  status: MigrateStatus;
  path: string;
  bakPath?: string;
  error?: string;
};

// ─── 파서 내부 유틸 ────────────────────────────────────────────────────────

/** 따옴표 제거 */
function stripQuotes(s: string): string {
  return s.replace(/^["']|["']$/g, "").trim();
}

/** 인라인 배열 파싱: "[POKIT-189, POKIT-191]" → ["POKIT-189", "POKIT-191"] */
function parseInlineArray(s: string): string[] {
  const inner = s.trim().slice(1, -1).trim(); // 앞뒤 [ ] 제거
  if (!inner) return [];
  return inner.split(",").map((item) => stripQuotes(item.trim()));
}

/**
 * YAML frontmatter 블록 raw 문자열 → ArtifactFrontmatterData
 * 지원: scalar, 인라인 배열, multi-line 배열
 */
function parseFrontmatterBlock(block: string): ArtifactFrontmatterData {
  const data: ArtifactFrontmatterData = {};
  const lines = block.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 최상위 key: 로 시작하는 라인만 처리
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1];
    const rest = keyMatch[2].trim();

    // 인라인 배열: [...]
    if (rest.startsWith("[")) {
      data[key] = parseInlineArray(rest);
      i++;
      continue;
    }

    // multi-line 배열: 값이 비어있고 다음 줄이 '  - '로 시작
    if (rest === "") {
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemMatch = lines[j].match(/^\s+-\s+(.+)$/);
        if (!itemMatch) break;
        items.push(stripQuotes(itemMatch[1].trim()));
        j++;
      }
      if (j > i + 1) {
        // multi-line 배열로 처리
        data[key] = items;
        i = j;
        continue;
      }
      // 값이 없는 scalar → undefined (기록 안 함)
      i++;
      continue;
    }

    // scalar
    data[key] = stripQuotes(rest);
    i++;
  }

  return data;
}

// ─── 공개 API ──────────────────────────────────────────────────────────────

/**
 * YAML frontmatter 파싱
 * `---\n...\n---` 블록 추출 후 hand-rolled 파서 적용
 */
export function parseFrontmatter(content: string): ParseResult {
  const match = content.match(/^---\r?\n([\s\S]*?)(?:\r?\n)?---(?:\r?\n|$)/);
  if (!match) {
    return { hasFrontmatter: false, data: {} };
  }
  const data = parseFrontmatterBlock(match[1]);
  return { hasFrontmatter: true, data };
}

/**
 * C4 스키마 검증
 * 필수: kind (허용값 제한)
 * 권장: version, created, updated — 없어도 valid (마이그레이션 과도기 허용)
 */
export function validateArtifactFrontmatter(content: string): ValidationResult {
  const parsed = parseFrontmatter(content);
  const errors: string[] = [];

  if (!parsed.hasFrontmatter) {
    errors.push("missing frontmatter (--- 블록 없음)");
    return { valid: false, data: {}, errors };
  }

  const { data } = parsed;

  if (!data.kind) {
    errors.push("missing required field: kind");
  } else if (!ALLOWED_KINDS.includes(data.kind as AllowedKind)) {
    errors.push(`invalid kind: "${data.kind}" — 허용값: ${ALLOWED_KINDS.join(", ")}`);
  }

  return { valid: errors.length === 0, data, errors };
}

/**
 * validateKind — kind 값이 ALLOWED_KINDS에 포함되는지 검사
 */
export function validateKind(kind: string): boolean {
  return ALLOWED_KINDS.includes(kind as AllowedKind);
}

/**
 * 디렉토리 내 모든 .md 파일 frontmatter 전수 스캔
 * 없는 디렉토리 → 빈 결과 (fail-open)
 * .yaml/.yml은 스캔 제외
 * options.warn: true → console.warn으로 미마이그레이션 파일 출력
 */
export function scanArtifacts(
  dir: string,
  options?: { warn?: boolean },
): ArtifactScanReport {
  if (!existsSync(dir)) {
    return { valid: true, files: [] };
  }

  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();

  const files = entries.map((name) => {
    const content = readFileSync(join(dir, name), "utf8");
    const result = validateArtifactFrontmatter(content);
    return { relativePath: name, valid: result.valid, errors: result.errors };
  });

  if (options?.warn) {
    for (const file of files.filter((f) => !f.valid)) {
      console.warn(`[artifact-frontmatter] 미마이그레이션: ${file.relativePath} — ${file.errors.join(", ")}`);
    }
  }

  return { valid: files.every((f) => f.valid), files };
}

/**
 * ArtifactFrontmatterData → YAML frontmatter 문자열
 * 배열은 multi-line 형식으로 렌더 (빈 배열은 [])
 */
export function renderFrontmatter(data: ArtifactFrontmatterData): string {
  const lines: string[] = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push("---");
  return lines.join("\n") + "\n";
}

/**
 * 파일에서 frontmatter 블록과 body를 분리
 * frontmatter 없는 경우 { fmRaw: null, body: content }
 */
function splitFrontmatterBody(content: string): {
  fmRaw: string | null;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)(?:\r?\n)?---(?:\r?\n|$)/);
  if (!match) {
    return { fmRaw: null, body: content };
  }
  const full = match[0];
  const body = content.slice(full.length);
  return { fmRaw: match[1], body };
}

/**
 * migrateFile — 단일 파일 frontmatter 마이그레이션
 *
 * 안전장치:
 * 1. .bak 백업 생성 (성공 후에도 유지)
 * 2. schema_version: 1 이미 있으면 "skipped" 반환
 * 3. 마이그레이션 후 body 바이트 동일성 검증 — 불일치 시 .bak 복구 + "error"
 * 4. 기존 frontmatter 키 보존 (merge, 기존 우선)
 *
 * @param filePath 절대 경로
 * @param newFields 추가/표준화할 필드 (기존 frontmatter보다 낮은 우선순위)
 */
export function migrateFile(
  filePath: string,
  newFields: ArtifactFrontmatterData,
): MigrateResult {
  const bakPath = filePath + ".bak";

  let original: string;
  try {
    original = readFileSync(filePath, "utf8");
  } catch (e) {
    return { status: "error", path: filePath, error: String(e) };
  }

  // Idempotent guard: schema_version: 1 이미 있으면 skip
  const parsed = parseFrontmatter(original);
  if (parsed.hasFrontmatter && parsed.data.schema_version === "1") {
    return { status: "skipped", path: filePath };
  }

  // .bak 백업
  try {
    copyFileSync(filePath, bakPath);
  } catch (e) {
    return { status: "error", path: filePath, error: `backup failed: ${String(e)}` };
  }

  // body 분리 및 바이트 기록
  const { fmRaw, body } = splitFrontmatterBody(original);
  const bodyBytesBefore = Buffer.byteLength(body, "utf8");

  // frontmatter merge: newFields 먼저 적용, 기존 frontmatter가 덮어씀 (기존 우선)
  const existingData: ArtifactFrontmatterData = fmRaw
    ? parseFrontmatterBlock(fmRaw)
    : {};

  // schema_version 강제 추가
  const merged: ArtifactFrontmatterData = {
    ...newFields,
    ...existingData,
    schema_version: "1",
  };

  // 새 frontmatter 렌더
  const newFm = renderFrontmatter(merged);
  const newContent = newFm + body;

  // 본문 바이트 동일성 검증
  const { body: bodyAfter } = splitFrontmatterBody(newContent);
  const bodyBytesAfter = Buffer.byteLength(bodyAfter, "utf8");

  if (bodyBytesBefore !== bodyBytesAfter) {
    // 복구
    try {
      const bak = readFileSync(bakPath, "utf8");
      writeFileSync(filePath, bak, "utf8");
    } catch (_) {
      // 복구 실패 — 원본 .bak 유지됨
    }
    return {
      status: "error",
      path: filePath,
      bakPath,
      error: `body byte mismatch: before=${bodyBytesBefore} after=${bodyBytesAfter}`,
    };
  }

  // 파일 쓰기
  try {
    writeFileSync(filePath, newContent, "utf8");
  } catch (e) {
    return {
      status: "error",
      path: filePath,
      bakPath,
      error: `write failed: ${String(e)}`,
    };
  }

  return { status: "migrated", path: filePath, bakPath };
}

// ─── CLI (일괄 스캔) ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const targetDir = process.argv[2] ?? "artifacts";
  const report = scanArtifacts(targetDir);

  const total = report.files.length;
  const invalid = report.files.filter((f) => !f.valid).length;
  const valid = total - invalid;

  console.log(`\nartifact-frontmatter scan: ${targetDir}`);
  console.log(`총 ${total}건 — 유효 ${valid}건 / 미마이그레이션 ${invalid}건`);

  for (const file of report.files.filter((f) => !f.valid)) {
    console.log(`  ✗ ${file.relativePath} — ${file.errors.join(", ")}`);
  }

  if (report.valid) {
    console.log("모든 산출물 frontmatter 유효.");
  } else {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
