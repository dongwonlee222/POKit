// POKIT-211 T3 — plan CLI 순수 헬퍼.
//
// 책임:
// - parsePlanArgs: argv → 옵션
// - readCarryOverFromManifest: 직전 release manifest unresolved에서 carry-over 후보 추출
// - renderPlanTable: dry-run 출력 렌더링
//
// IO·Linear API 호출은 scripts/cli/plan.ts 가 담당.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type PlanOpts = {
  version: string;
  dryRun: boolean;
  apply: boolean;
  issues: string[];
  rootDir: string;
};

const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function parsePlanArgs(argv: string[]): PlanOpts {
  const args = argv.slice(2);
  const positional = args.find((a) => !a.startsWith("--"));
  if (!positional) {
    throw Object.assign(
      new Error("usage: pokit plan <version> [--dry-run|--apply] [--issues ID,ID,...]"),
      { exitCode: 2 },
    );
  }
  if (!VERSION_RE.test(positional)) {
    throw Object.assign(
      new Error(`error: version "${positional}" is not valid semver (예: 0.17.4)`),
      { exitCode: 2 },
    );
  }
  const apply = args.includes("--apply");
  const issuesArg = args.find((a) => a.startsWith("--issues="));
  let issues: string[] = [];
  if (issuesArg) {
    issues = issuesArg
      .replace(/^--issues=/, "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } else {
    const idx = args.indexOf("--issues");
    if (idx >= 0 && idx + 1 < args.length) {
      issues = args[idx + 1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
  }
  return {
    version: positional,
    dryRun: !apply, // apply 명시 없으면 dry-run
    apply,
    issues,
    rootDir: process.cwd(),
  };
}

export type CarryOverItem = {
  issueId: string; // 예: "POKIT-159"
  note: string;
};

const POKIT_ID_RE = /^POKIT-\d+$/;

/**
 * 직전 release manifest의 unresolved 섹션에서 carry-over 후보 추출.
 * owner 필드가 POKIT-XXX 형식인 항목만.
 */
export function readCarryOverFromManifest(
  rootDir: string,
  prevVersion: string | null,
): CarryOverItem[] {
  if (!prevVersion) return [];
  const path = join(rootDir, "releases", `v${prevVersion}`, "manifest.yaml");
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  return parseUnresolvedSection(raw);
}

/**
 * manifest.yaml 본문에서 unresolved 섹션의 owner=POKIT-XXX 항목 파싱.
 * zero-dep YAML 미사용 (hand-rolled 라인 스캔).
 */
export function parseUnresolvedSection(raw: string): CarryOverItem[] {
  const lines = raw.split("\n");
  const result: CarryOverItem[] = [];
  let inUnresolved = false;
  let currentNote: string | null = null;
  let currentOwner: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^unresolved:\s*$/.test(line)) {
      inUnresolved = true;
      continue;
    }
    if (!inUnresolved) continue;
    // 다른 top-level 섹션 진입 시 종료
    if (/^[a-zA-Z_][a-zA-Z0-9_-]*:\s*$/.test(line) && !line.startsWith(" ")) {
      break;
    }
    // 새 항목 시작: "  - id: ..."
    if (/^\s*-\s+id:\s*/.test(line)) {
      // 이전 항목 flush
      if (currentOwner && POKIT_ID_RE.test(currentOwner)) {
        result.push({ issueId: currentOwner, note: currentNote ?? "" });
      }
      currentNote = null;
      currentOwner = null;
      continue;
    }
    const noteMatch = line.match(/^\s+note:\s*(.*)$/);
    if (noteMatch) {
      currentNote = noteMatch[1].replace(/^["']|["']$/g, "");
      continue;
    }
    const ownerMatch = line.match(/^\s+owner:\s*(.*)$/);
    if (ownerMatch) {
      currentOwner = ownerMatch[1].trim().replace(/^["']|["']$/g, "");
      continue;
    }
  }
  // 마지막 항목 flush
  if (currentOwner && POKIT_ID_RE.test(currentOwner)) {
    result.push({ issueId: currentOwner, note: currentNote ?? "" });
  }
  return result;
}

export type PlanIssue = {
  id: string;
  title: string;
  priority?: string;
};

export function renderPlanTable(
  carryOver: PlanIssue[],
  fresh: PlanIssue[],
  targetVersion: string,
  prevVersion: string | null,
): string {
  const lines: string[] = [];
  lines.push(`🎯 Planning gate — target: v${targetVersion}`);
  lines.push("");
  if (prevVersion) {
    lines.push(`직전 release: v${prevVersion}`);
  }
  lines.push("─".repeat(60));
  lines.push("");
  lines.push("[carry-over from " + (prevVersion ? `v${prevVersion}` : "n/a") + "]");
  if (carryOver.length === 0) {
    lines.push("  (없음)");
  } else {
    for (const issue of carryOver) {
      lines.push(
        `  □ ${issue.id.padEnd(12)} ${truncate(issue.title, 50)}` +
          (issue.priority ? `  · ${issue.priority}` : ""),
      );
    }
  }
  lines.push("");
  lines.push("[fresh — Team Backlog]");
  if (fresh.length === 0) {
    lines.push("  (없음)");
  } else {
    for (const issue of fresh) {
      lines.push(
        `  □ ${issue.id.padEnd(12)} ${truncate(issue.title, 50)}` +
          (issue.priority ? `  · ${issue.priority}` : ""),
      );
    }
  }
  lines.push("");
  lines.push("─".repeat(60));
  lines.push(`총 ${carryOver.length + fresh.length}건 — carry-over ${carryOver.length} / fresh ${fresh.length}`);
  return lines.join("\n");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
