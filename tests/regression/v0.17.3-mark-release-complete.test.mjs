import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { mkTempDir } from "../_setup/index.mjs";

// POKIT-208 — release.ts → markReleaseComplete wire-in 검증.
// v0.17.2 release 후에도 workflow-state.yaml.last_release_version 이 null 인 버그.

test("markReleaseComplete is wired into release.ts", () => {
  const releaseSrc = readFileSync("scripts/cli/release.ts", "utf8");

  assert.match(
    releaseSrc,
    /import\s*\{\s*markReleaseComplete\s*\}\s*from\s*["']\.\.\/internal\/workflow-state\.ts["']/,
    "release.ts must import markReleaseComplete from workflow-state.ts",
  );

  assert.match(
    releaseSrc,
    /markReleaseComplete\(\s*opts\.rootDir\s*,\s*opts\.version\s*\)/,
    "release.ts must call markReleaseComplete(opts.rootDir, opts.version) in apply mode",
  );
});

test("markReleaseComplete writes last_release_version + state=idle", async () => {
  const { markReleaseComplete, loadWorkflowState } = await import(
    "../../scripts/internal/workflow-state.ts"
  );

  const tmp = mkTempDir("pokit-mark-release-");
  const memDir = join(tmp, "memory");
  mkdirSync(memDir, { recursive: true });

  const initial = `---
kind: workflow-state
schema_version: 1
---
current_cycle_id: null
current_cycle_name: null
target_version: "0.17.3"
last_release_version: null
state: active
updated_at: "2026-05-18T00:00:00.000Z"
`;
  writeFileSync(join(memDir, "workflow-state.yaml"), initial, "utf8");

  const next = markReleaseComplete(tmp, "0.17.3", new Date("2026-05-18T06:00:00Z"));

  assert.equal(next.last_release_version, "0.17.3");
  assert.equal(next.state, "idle");
  assert.equal(next.target_version, null);

  const reloaded = loadWorkflowState(tmp);
  assert.equal(reloaded?.last_release_version, "0.17.3");
  assert.equal(reloaded?.state, "idle");
});
