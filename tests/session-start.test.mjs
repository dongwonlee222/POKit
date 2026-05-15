import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.POKIT_PROFILE = "";

async function loadSessionStartModule() {
  return import(`../scripts/session-start.ts?cacheBust=${Date.now()}`);
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
  await mkdir(join(tempDir, "workflows"), { recursive: true });
  await writeFile(join(tempDir, "memory/resume-brief.md"), "# Resume Brief\n");
  await writeFile(join(tempDir, "memory/current-cycle.yaml"), "cycle:\n  id: cycle-1\n");
  await writeFile(join(tempDir, "workflows/hooks.yaml"), "hooks:\n  session_start:\n    - read_context_map\n");
  await writeFile(join(tempDir, "memory/context-map.yaml"), [
    "read_order:",
    "  - memory/resume-brief.md",
    "  - memory/current-cycle.yaml",
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
  assert.match(output, /pokit:boot ok cycle=POKit Operating Cycle 1: Memory MVP Foundation hooks=loaded read_order=2/);
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
