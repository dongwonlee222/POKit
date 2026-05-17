/**
 * migrate-frontmatter-c4.ts — 일회용 마이그레이션 스크립트
 *
 * 대상:
 *   - artifacts/backlog/v0.16.0/*.md (18건) → kind: memo
 *   - memory/decision-log.md          → kind: decision-log
 *   - memory/decision-log.yaml        → kind: decision-log (frontmatter prepend)
 *   - memory/resume-brief.md          → kind: brief
 *
 * 실행:
 *   node --experimental-strip-types scripts/migrate-frontmatter-c4.ts
 */

import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  migrateFile,
  parseFrontmatter,
  scanArtifacts,
  type ArtifactFrontmatterData,
  type MigrateResult,
} from "./internal/artifact-frontmatter.ts";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../");

// ─── action → workflow_action 매핑 ────────────────────────────────────────

function mapWorkflowAction(
  action: string | undefined,
): "create" | "update" | "skip" {
  if (!action) return "create";
  const lower = action.toLowerCase();
  if (lower.startsWith("update")) return "update";
  if (lower.startsWith("skip")) return "skip";
  return "create";
}

// ─── backlog 메모 마이그레이션 ─────────────────────────────────────────────

function migrateBacklogMemo(filePath: string): MigrateResult {
  const content = readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(content);
  const existing = parsed.data;

  // action → workflow_action
  const workflowAction = mapWorkflowAction(existing["action"] as string | undefined);

  // idempotencyKey → idempotency_key
  const idempotencyKey =
    (existing["idempotencyKey"] as string | undefined) ??
    (existing["idempotency_key"] as string | undefined) ??
    "";

  // dependencies: 이미 배열이면 그대로, 없으면 []
  const deps = existing["dependencies"] ?? [];

  // source
  const source = existing["source"] as string | undefined;

  // proposedLabels → proposed_labels
  const proposedLabels =
    (existing["proposedLabels"] as string[] | undefined) ??
    (existing["proposed_labels"] as string[] | undefined);

  // proposedState → proposed_state
  const proposedState =
    (existing["proposedState"] as string | undefined) ??
    (existing["proposed_state"] as string | undefined);

  // linkedIssue → linked_issues (단수 scalar → 배열)
  const linkedIssue = existing["linkedIssue"] as string | undefined;
  const linkedIssues = linkedIssue
    ? [linkedIssue]
    : (existing["linked_issues"] as string[] | undefined) ?? [];

  const newFields: ArtifactFrontmatterData = {
    kind: "memo",
    workflow_action: workflowAction,
    idempotency_key: idempotencyKey,
    dependencies: Array.isArray(deps) ? deps : [],
    ...(source !== undefined && { source }),
    ...(proposedLabels !== undefined && { proposed_labels: proposedLabels }),
    ...(proposedState !== undefined && { proposed_state: proposedState }),
    ...(linkedIssues.length > 0 && { linked_issues: linkedIssues }),
  };

  return migrateFile(filePath, newFields);
}

// ─── decision-log.yaml 마이그레이션 (frontmatter prepend) ─────────────────

function migrateDecisionLogYaml(filePath: string): MigrateResult {
  const bakPath = filePath + ".bak";

  let original: string;
  try {
    original = readFileSync(filePath, "utf8");
  } catch (e) {
    return { status: "error", path: filePath, error: String(e) };
  }

  // 이미 frontmatter 있으면 skip (---로 시작하는지 확인)
  if (original.startsWith("---\n")) {
    return { status: "skipped", path: filePath };
  }

  try {
    copyFileSync(filePath, bakPath);
  } catch (e) {
    return { status: "error", path: filePath, error: `backup failed: ${String(e)}` };
  }

  const frontmatter = [
    "---",
    "kind: decision-log",
    "schema_version: 1",
    "---",
    "",
  ].join("\n");

  const newContent = frontmatter + original;

  // 본문 바이트 보존 확인 (frontmatter 추가이므로 original 전체가 body)
  const originalBytes = Buffer.byteLength(original, "utf8");
  const bodyInNew = newContent.slice(frontmatter.length);
  const bodyBytes = Buffer.byteLength(bodyInNew, "utf8");

  if (originalBytes !== bodyBytes) {
    try {
      writeFileSync(filePath, readFileSync(bakPath, "utf8"), "utf8");
    } catch (_) {}
    return {
      status: "error",
      path: filePath,
      bakPath,
      error: `body byte mismatch: ${originalBytes} vs ${bodyBytes}`,
    };
  }

  try {
    writeFileSync(filePath, newContent, "utf8");
  } catch (e) {
    return { status: "error", path: filePath, bakPath, error: String(e) };
  }

  return { status: "migrated", path: filePath, bakPath };
}

// ─── 메인 ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const results: MigrateResult[] = [];

  // scanArtifacts 전 상태 기록
  const backlogDir = join(ROOT, "artifacts/backlog/v0.16.0");
  const beforeScan = scanArtifacts(backlogDir);
  const invalidBefore = beforeScan.files.filter((f) => !f.valid).length;

  console.log(`\n=== migrate-frontmatter-c4 시작 ===`);
  console.log(`backlog 스캔 전: ${beforeScan.files.length}건 중 미마이그레이션 ${invalidBefore}건`);

  // ── 1. artifacts/backlog/v0.16.0/*.md (backlog memo) ──────────────────

  if (!existsSync(backlogDir)) {
    console.warn(`[경고] 디렉토리 없음: ${backlogDir}`);
  } else {
    const memos = readdirSync(backlogDir)
      .filter((n) => n.endsWith(".md") && n !== "README.md")
      .sort();

    console.log(`\n[1] backlog memo 마이그레이션: ${memos.length}건`);
    for (const name of memos) {
      const filePath = join(backlogDir, name);
      const result = migrateBacklogMemo(filePath);
      results.push(result);
      const icon = result.status === "migrated" ? "✓" : result.status === "skipped" ? "~" : "✗";
      console.log(`  ${icon} ${name} [${result.status}]${result.error ? ` — ${result.error}` : ""}`);
    }
  }

  // ── 2. memory/decision-log.md ─────────────────────────────────────────

  const decisionLogMd = join(ROOT, "memory/decision-log.md");
  console.log(`\n[2] memory/decision-log.md`);
  if (existsSync(decisionLogMd)) {
    const result = migrateFile(decisionLogMd, { kind: "decision-log" });
    results.push(result);
    const icon = result.status === "migrated" ? "✓" : result.status === "skipped" ? "~" : "✗";
    console.log(`  ${icon} decision-log.md [${result.status}]${result.error ? ` — ${result.error}` : ""}`);
  } else {
    console.log(`  — 파일 없음`);
  }

  // ── 3. memory/decision-log.yaml ──────────────────────────────────────

  const decisionLogYaml = join(ROOT, "memory/decision-log.yaml");
  console.log(`\n[3] memory/decision-log.yaml`);
  if (existsSync(decisionLogYaml)) {
    const result = migrateDecisionLogYaml(decisionLogYaml);
    results.push(result);
    const icon = result.status === "migrated" ? "✓" : result.status === "skipped" ? "~" : "✗";
    console.log(`  ${icon} decision-log.yaml [${result.status}]${result.error ? ` — ${result.error}` : ""}`);
  } else {
    console.log(`  — 파일 없음`);
  }

  // ── 4. memory/resume-brief.md ────────────────────────────────────────

  const resumeBrief = join(ROOT, "memory/resume-brief.md");
  console.log(`\n[4] memory/resume-brief.md`);
  if (existsSync(resumeBrief)) {
    const result = migrateFile(resumeBrief, { kind: "brief", brief_kind: "resume" });
    results.push(result);
    const icon = result.status === "migrated" ? "✓" : result.status === "skipped" ? "~" : "✗";
    console.log(`  ${icon} resume-brief.md [${result.status}]${result.error ? ` — ${result.error}` : ""}`);
  } else {
    console.log(`  — 파일 없음`);
  }

  // ── 결과 집계 ────────────────────────────────────────────────────────

  const migrated = results.filter((r) => r.status === "migrated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error");

  console.log(`\n=== 결과 ===`);
  console.log(`  성공: ${migrated}건`);
  console.log(`  스킵: ${skipped}건`);
  console.log(`  실패: ${errors.length}건`);

  if (errors.length > 0) {
    console.log(`\n[실패 목록]`);
    for (const r of errors) {
      console.log(`  ✗ ${r.path}: ${r.error}`);
    }
  }

  // ── scanArtifacts 후 상태 ────────────────────────────────────────────

  const afterScan = scanArtifacts(backlogDir);
  const invalidAfter = afterScan.files.filter((f) => !f.valid).length;
  console.log(`\n[backlog 스캔 후] ${afterScan.files.length}건 중 미마이그레이션 ${invalidAfter}건`);

  if (invalidAfter === 0) {
    console.log("backlog 전체 frontmatter 유효.");
  } else {
    for (const f of afterScan.files.filter((f) => !f.valid)) {
      console.log(`  ✗ ${f.relativePath} — ${f.errors.join(", ")}`);
    }
    process.exitCode = 1;
  }

  // ── .bak 파일 안내 ───────────────────────────────────────────────────

  const bakPaths = results
    .filter((r) => r.bakPath)
    .map((r) => r.bakPath as string);

  if (bakPaths.length > 0) {
    console.log(`\n[.bak 파일] 검토 후 수동 삭제:`);
    for (const p of bakPaths) {
      console.log(`  ${p}`);
    }
  }
}

void main();
