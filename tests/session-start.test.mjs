import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.POKIT_PROFILE = "";

async function loadSessionStartModule() {
  return import(`../scripts/cli/session-start.ts?cacheBust=${Date.now()}`);
}

const context = {
  source: "linear_upcoming",
  cycle: {
    id: "cycle-1",
    name: "POKit Operating Cycle 1: Memory MVP Foundation",
    number: 8,
  },
  issues: [
    { id: "issue-128", identifier: "POKIT-128", title: "Session Bootstrap Contract", description: "boot", labels: ["pokit:criteria"], state: "Todo" },
  ],
};

test("buildSessionStart renders brief with boot signature after reading context map", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-session-start-"));
  await mkdir(join(tempDir, "memory"), { recursive: true });
  await mkdir(join(tempDir, "docs/architecture"), { recursive: true });
  await mkdir(join(tempDir, "workflows"), { recursive: true });
  await writeFile(join(tempDir, "memory/resume-brief.md"), "# Resume Brief\n");
  await writeFile(join(tempDir, "memory/current-cycle.yaml"), "cycle:\n  id: cycle-1\n");
  await writeFile(join(tempDir, "docs/architecture/01-document-roles.md"), "# Document Roles\n");
  await writeFile(join(tempDir, "docs/architecture/11-visualization-and-incident-response.md"), "# Stage Visualization And Incident Response\n");
  await writeFile(join(tempDir, "workflows/hooks.yaml"), "hooks:\n  session_start:\n    - read_context_map\n");
  await writeFile(join(tempDir, "memory/context-map.yaml"), [
    "read_order:",
    "  - memory/resume-brief.md",
    "  - memory/current-cycle.yaml",
    "  - docs/architecture/01-document-roles.md",
    "  - docs/architecture/11-visualization-and-incident-response.md",
    "",
  ].join("\n"));
  const { buildSessionStart } = await loadSessionStartModule();

  const output = buildSessionStart({
    rootDir: tempDir,
    now: new Date("2026-05-15T09:00:00+09:00"),
    context,
  });

  assert.match(output, /# POKit Brief/);
  assert.match(output, /POKit Operating Cycle 1: Memory MVP Foundation/);
  assert.match(output, /POKit 진행도\n\[█░░░░░░░░░\] 1\/10 · 현재: 시작 브리프/);
  assert.match(output, /📌 현재: Todo 1 · 진행 0 · 완료 0/);
  assert.match(output, /🧺 다음 후보/);
  assert.match(output, /1\. POKIT-128 Session Bootstrap Contract · Todo · pokit:criteria/);
  assert.match(output, /💬 추천 다음 행동: Operating Cycle 1 남은 Todo 전체 진행/);
  assert.doesNotMatch(output, /2\. Cycle 기준 확인/);
  assert.doesNotMatch(output, /📊 진행도/);
  assert.match(output, /pokit:boot ok cycle=POKit Operating Cycle 1: Memory MVP Foundation hooks=loaded orchestrator=loaded read_order=4/);
});

test("buildSessionStart fails loudly when read_order files are missing", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-session-start-missing-"));
  await mkdir(join(tempDir, "memory"), { recursive: true });
  await writeFile(join(tempDir, "memory/context-map.yaml"), [
    "read_order:",
    "  - memory/missing.md",
    "",
  ].join("\n"));
  const { buildSessionStart } = await loadSessionStartModule();

  assert.throws(
    () => buildSessionStart({ rootDir: tempDir, context }),
    /Session start blocked: missing read_order file memory\/missing\.md/,
  );
});

test("resolveBootError maps context-map.yaml missing to ASCII boot error", async () => {
  const { resolveBootError, renderBootErrorAscii } = await loadSessionStartModule();

  const review = resolveBootError(new Error("Session start blocked: missing memory/context-map.yaml"));
  const output = renderBootErrorAscii(review);

  assert.match(output, /🚨 pokit:boot FAILED/);
  assert.match(output, /context-map\.yaml/);
  assert.match(output, /1\) 문제:/);
  assert.match(output, /2\) 원인:/);
  assert.match(output, /3\) 해결:/);
  assert.doesNotMatch(output, /^#/m);
});

test("resolveBootError maps read_order missing file to ASCII boot error with filename", async () => {
  const { resolveBootError, renderBootErrorAscii } = await loadSessionStartModule();

  const review = resolveBootError(new Error("Session start blocked: missing read_order file docs/architecture/01-document-roles.md"));
  const output = renderBootErrorAscii(review);

  assert.match(output, /🚨 pokit:boot FAILED/);
  assert.match(output, /docs\/architecture\/01-document-roles\.md/);
  assert.match(output, /3\) 해결:/);
  assert.doesNotMatch(output, /^#/m);
});

test("resolveBootError maps Linear API failure to ASCII boot error", async () => {
  const { resolveBootError, renderBootErrorAscii } = await loadSessionStartModule();

  const review = resolveBootError(new Error("fetch failed: 401 Unauthorized"));
  const output = renderBootErrorAscii(review);

  assert.match(output, /🚨 pokit:boot FAILED/);
  assert.match(output, /Linear API/);
  assert.match(output, /LINEAR_API_KEY/);
  assert.doesNotMatch(output, /^#/m);
});

test("resolveBootError falls back gracefully for unknown errors", async () => {
  const { resolveBootError, renderBootErrorAscii } = await loadSessionStartModule();

  const review = resolveBootError(new Error("something completely unexpected"));
  const output = renderBootErrorAscii(review);

  assert.match(output, /🚨 pokit:boot FAILED/);
  assert.match(output, /something completely unexpected/);
  assert.doesNotMatch(output, /^#/m);
});
