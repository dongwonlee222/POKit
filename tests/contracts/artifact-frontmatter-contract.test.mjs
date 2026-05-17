// T3: artifact-frontmatter 파서 계약 테스트
// C4 결정: hand-rolled 파서 (zero-dep), linked_issues 인라인·multi-line 배열 지원
import assert from "node:assert/strict";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadModule() {
  return import(`../../scripts/internal/artifact-frontmatter.ts?cacheBust=${Date.now()}`);
}

// ─── parseFrontmatter ────────────────────────────────────────────────────────

test("parseFrontmatter: 기본 scalar 필드 파싱", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: decision-log
version: 1.0
created: 2026-05-17T15:00:00Z
---

# 본문
`);
  assert.equal(result.hasFrontmatter, true);
  assert.equal(result.data.kind, "decision-log");
  assert.equal(result.data.version, "1.0");
  assert.equal(result.data.created, "2026-05-17T15:00:00Z");
});

test("parseFrontmatter: 인라인 배열 [POKIT-189, POKIT-191]", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: memo
linked_issues: [POKIT-189, POKIT-191]
---
`);
  assert.equal(result.hasFrontmatter, true);
  assert.deepEqual(result.data.linked_issues, ["POKIT-189", "POKIT-191"]);
});

test("parseFrontmatter: 빈 인라인 배열 []", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: memo
linked_issues: []
dependencies: []
---
`);
  assert.deepEqual(result.data.linked_issues, []);
  assert.deepEqual(result.data.dependencies, []);
});

test("parseFrontmatter: multi-line 배열 파싱", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: decision-log
linked_issues:
  - POKIT-189
  - POKIT-191
---
`);
  assert.deepEqual(result.data.linked_issues, ["POKIT-189", "POKIT-191"]);
});

test("parseFrontmatter: 단일 항목 multi-line 배열", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: memo
linked_issues:
  - POKIT-50
---
`);
  assert.deepEqual(result.data.linked_issues, ["POKIT-50"]);
});

test("parseFrontmatter: 따옴표 있는 scalar", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: "decision-log"
linked_cycle: "cycle-8"
---
`);
  assert.equal(result.data.kind, "decision-log");
  assert.equal(result.data.linked_cycle, "cycle-8");
});

test("parseFrontmatter: 한국어 값 안전 처리", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: memo
title: "워크플로우 갭 분석"
source: 워크플로우 갭 분석 (산출물 형식 제각각)
---
`);
  assert.equal(result.data.title, "워크플로우 갭 분석");
  assert.equal(result.data.source, "워크플로우 갭 분석 (산출물 형식 제각각)");
});

test("parseFrontmatter: frontmatter 없는 파일 → hasFrontmatter false", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter("# 본문만 있는 파일\n\n내용...\n");
  assert.equal(result.hasFrontmatter, false);
  assert.deepEqual(result.data, {});
});

test("parseFrontmatter: 빈 frontmatter ---\\n---", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter("---\n---\n\n# 본문\n");
  assert.equal(result.hasFrontmatter, true);
  assert.deepEqual(result.data, {});
});

test("parseFrontmatter: proposedLabels 인라인 배열 (backlog 메모 형식)", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
id: C4
title: "[v0.16.0] 산출물 frontmatter 표준"
proposedLabels: [area:artifacts, area:standardization, type:foundation, release:v0.16.0]
proposedState: Backlog
---
`);
  assert.deepEqual(result.data.proposedLabels, [
    "area:artifacts",
    "area:standardization",
    "type:foundation",
    "release:v0.16.0",
  ]);
  assert.equal(result.data.proposedState, "Backlog");
});

// ─── validateArtifactFrontmatter ────────────────────────────────────────────

test("validateArtifactFrontmatter: kind·version·created·updated 있으면 valid", async () => {
  const { validateArtifactFrontmatter } = await loadModule();
  const result = validateArtifactFrontmatter(`---
kind: memo
version: 1.0
created: 2026-05-17T15:00:00Z
updated: 2026-05-17T15:30:00Z
linked_issues: [POKIT-50]
author: main-agent
---
`);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateArtifactFrontmatter: frontmatter 없으면 invalid", async () => {
  const { validateArtifactFrontmatter } = await loadModule();
  const result = validateArtifactFrontmatter("# 본문만\n");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("frontmatter")));
});

test("validateArtifactFrontmatter: kind 누락 시 에러", async () => {
  const { validateArtifactFrontmatter } = await loadModule();
  const result = validateArtifactFrontmatter(`---
version: 1.0
created: 2026-05-17T15:00:00Z
updated: 2026-05-17T15:30:00Z
---
`);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("kind")));
});

test("validateArtifactFrontmatter: 허용된 kind 값 검증", async () => {
  const { validateArtifactFrontmatter } = await loadModule();
  const result = validateArtifactFrontmatter(`---
kind: unknown-kind
version: 1.0
created: 2026-05-17T15:00:00Z
updated: 2026-05-17T15:30:00Z
---
`);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("kind")));
});

// ─── scanArtifacts ───────────────────────────────────────────────────────────

test("scanArtifacts: 디렉토리 내 .md 파일 frontmatter 전수 스캔", async () => {
  const { scanArtifacts } = await loadModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-artifact-scan-"));

  await writeFile(
    join(tempDir, "valid.md"),
    `---
kind: memo
version: 1.0
created: 2026-05-17T15:00:00Z
updated: 2026-05-17T15:30:00Z
linked_issues: [POKIT-50]
author: main-agent
---

# valid
`,
  );

  await writeFile(
    join(tempDir, "no-frontmatter.md"),
    "# 본문만 있는 파일\n",
  );

  await writeFile(join(tempDir, "not-markdown.yaml"), "version: 1.0\n");

  const report = scanArtifacts(tempDir);
  assert.equal(report.files.length, 2); // .md 파일만
  const valid = report.files.find((f) => f.relativePath === "valid.md");
  const invalid = report.files.find((f) => f.relativePath === "no-frontmatter.md");
  assert.equal(valid.valid, true);
  assert.equal(invalid.valid, false);
});

test("scanArtifacts: 없는 디렉토리는 빈 결과", async () => {
  const { scanArtifacts } = await loadModule();
  const report = scanArtifacts("/tmp/pokit-nonexistent-dir-xyz");
  assert.equal(report.files.length, 0);
  assert.equal(report.valid, true);
});

test("scanArtifacts: 마이그레이션 미완 카운트 정확히 반환", async () => {
  const { scanArtifacts } = await loadModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-artifact-scan-"));

  // 2개 유효, 3개 무효
  for (let i = 1; i <= 2; i++) {
    await writeFile(
      join(tempDir, `valid-${i}.md`),
      `---
kind: memo
version: 1.0
created: 2026-05-17T15:00:00Z
updated: 2026-05-17T15:30:00Z
---
`,
    );
  }
  for (let i = 1; i <= 3; i++) {
    await writeFile(join(tempDir, `invalid-${i}.md`), "# 본문\n");
  }

  const report = scanArtifacts(tempDir);
  assert.equal(report.files.length, 5);
  assert.equal(report.valid, false);
  assert.equal(report.files.filter((f) => !f.valid).length, 3);
  assert.equal(report.files.filter((f) => f.valid).length, 2);
});

// ─── renderFrontmatter ───────────────────────────────────────────────────────

test("renderFrontmatter: 기본 객체 → YAML frontmatter 문자열 렌더", async () => {
  const { renderFrontmatter } = await loadModule();
  const output = renderFrontmatter({
    kind: "memo",
    version: "1.0",
    linked_issues: ["POKIT-50", "POKIT-51"],
  });
  assert.ok(output.startsWith("---\n"));
  assert.ok(output.endsWith("\n---\n"));
  assert.ok(output.includes("kind: memo"));
  assert.ok(output.includes("linked_issues:"));
  assert.ok(output.includes("  - POKIT-50"));
  assert.ok(output.includes("  - POKIT-51"));
});

test("renderFrontmatter: 빈 배열은 [] 렌더", async () => {
  const { renderFrontmatter } = await loadModule();
  const output = renderFrontmatter({ kind: "memo", linked_issues: [] });
  assert.ok(output.includes("linked_issues: []"));
});

// ─── 신규 kind 검증 ──────────────────────────────────────────────────────────

test("validateArtifactFrontmatter: analysis kind valid", async () => {
  const { validateArtifactFrontmatter } = await loadModule();
  const result = validateArtifactFrontmatter(`---
kind: analysis
analysis_kind: deep
schema_version: 1
---

# 분석 내용
`);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateArtifactFrontmatter: workflow-state kind valid", async () => {
  const { validateArtifactFrontmatter } = await loadModule();
  const result = validateArtifactFrontmatter(`---
kind: workflow-state
schema_version: 1
---
`);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateArtifactFrontmatter: retro_subkind 필드 파싱", async () => {
  const { parseFrontmatter } = await loadModule();
  const result = parseFrontmatter(`---
kind: retro
cycle_id: cycle-8
retro_subkind: close
external_writes: []
schema_version: 1
---
`);
  assert.equal(result.data.kind, "retro");
  assert.equal(result.data.retro_subkind, "close");
  assert.deepEqual(result.data.external_writes, []);
});

test("validateKind: 허용 kind → true, 미허용 → false", async () => {
  const { validateKind } = await loadModule();
  assert.equal(validateKind("analysis"), true);
  assert.equal(validateKind("workflow-state"), true);
  assert.equal(validateKind("memo"), true);
  assert.equal(validateKind("unknown-xyz"), false);
});

// ─── migrateFile ────────────────────────────────────────────────────────────

test("migrateFile: 기본 마이그레이션 — frontmatter 추가 + body 보존", async () => {
  const { migrateFile, parseFrontmatter } = await loadModule();
  const { writeFile, unlink } = await import("node:fs/promises");
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { readFileSync } = await import("node:fs");

  const dir = await mkdtemp(join(tmpdir(), "pokit-migrate-"));
  const filePath = join(dir, "test.md");
  const body = "\n# 본문\n\n내용입니다.\n";
  await writeFile(filePath, body, "utf8");

  const result = migrateFile(filePath, { kind: "memo" });
  assert.equal(result.status, "migrated");
  assert.ok(result.bakPath);

  const migrated = readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(migrated);
  assert.equal(parsed.hasFrontmatter, true);
  assert.equal(parsed.data.kind, "memo");
  assert.equal(parsed.data.schema_version, "1");
  assert.ok(migrated.includes("# 본문"), "body preserved");
  assert.ok(migrated.includes("내용입니다."), "body content preserved");
});

test("migrateFile: schema_version:1 이미 있으면 skipped", async () => {
  const { migrateFile } = await loadModule();
  const { writeFile } = await import("node:fs/promises");
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const dir = await mkdtemp(join(tmpdir(), "pokit-migrate-skip-"));
  const filePath = join(dir, "already.md");
  await writeFile(filePath, `---\nkind: memo\nschema_version: 1\n---\n\n# 내용\n`, "utf8");

  const result = migrateFile(filePath, { kind: "memo" });
  assert.equal(result.status, "skipped");
});

test("migrateFile: 기존 frontmatter 키 보존 (기존 우선)", async () => {
  const { migrateFile, parseFrontmatter } = await loadModule();
  const { writeFile } = await import("node:fs/promises");
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { readFileSync } = await import("node:fs");

  const dir = await mkdtemp(join(tmpdir(), "pokit-migrate-existing-"));
  const filePath = join(dir, "has-fm.md");
  await writeFile(filePath, `---\nkind: decision-log\nauthor: user\n---\n\n# 기존 파일\n`, "utf8");

  // newFields에 kind: memo를 넣어도 기존 kind: decision-log가 유지
  const result = migrateFile(filePath, { kind: "memo" });
  assert.equal(result.status, "migrated");

  const migrated = readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(migrated);
  assert.equal(parsed.data.kind, "decision-log"); // 기존 값 우선
  assert.equal(parsed.data.author, "user");       // 기존 키 보존
  assert.equal(parsed.data.schema_version, "1");  // 새 필드 추가
});
