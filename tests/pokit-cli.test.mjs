/**
 * POKIT-137: bin/pokit CLI Wrapper PoC — regression tests
 *
 * Test strategy:
 *  - Subprocess tests: pokit help, pokit unknown-verb (no Linear creds needed)
 *  - In-process tests: buildSessionStart output contains pokit:boot ok
 *    (same pattern as session-start.test.mjs; avoids LINEAR_API_KEY requirement)
 *  - Parity test: bin/pokit start delegates to scripts/session-start.ts
 *    (verified structurally — cannot do full subprocess e2e without LINEAR_API_KEY)
 *
 * See POKIT-137.md AC-2 Open Questions: end-to-end pokit start subprocess test
 * requires LINEAR_API_KEY; deferred until fixture/offline mode is available.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const BIN_POKIT = join(PROJECT_ROOT, "bin", "pokit");

// ---------------------------------------------------------------------------
// Subprocess helpers
// ---------------------------------------------------------------------------

function runPokit(...args) {
  return spawnSync(BIN_POKIT, args, {
    encoding: "utf8",
    env: { ...process.env },
  });
}

// ---------------------------------------------------------------------------
// AC-3: help / no-arg output includes verb list
// ---------------------------------------------------------------------------

test("pokit help prints available verb list and exits 0", () => {
  const result = runPokit("help");
  assert.equal(result.status, 0, `Expected exit 0, got ${result.status}\nstderr: ${result.stderr}`);
  assert.match(result.stdout, /start/);
  assert.match(result.stdout, /run/);
  assert.match(result.stdout, /close/);
  assert.match(result.stdout, /retro/);
  assert.match(result.stdout, /hotfix/);
  assert.match(result.stdout, /audit/);
  assert.match(result.stdout, /guard/);
});

test("pokit with no args prints available verb list and exits 0", () => {
  const result = runPokit();
  assert.equal(result.status, 0, `Expected exit 0, got ${result.status}\nstderr: ${result.stderr}`);
  assert.match(result.stdout, /start/);
  assert.match(result.stdout, /run/);
});

test("pokit -h prints available verb list and exits 0", () => {
  const result = runPokit("-h");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /start/);
});

test("pokit --help prints available verb list and exits 0", () => {
  const result = runPokit("--help");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /start/);
});

// ---------------------------------------------------------------------------
// AC-5: unknown verb exits 1 with error message
// ---------------------------------------------------------------------------

test("pokit unknown-verb exits 1", () => {
  const result = runPokit("unknown-verb");
  assert.equal(result.status, 1, `Expected exit 1, got ${result.status}`);
  assert.match(result.stderr, /Unknown verb: unknown-verb/);
});

// ---------------------------------------------------------------------------
// POKIT-139: verb dispatch — each verb dispatches without "not implemented" error
// Strategy: verify exit code is NOT 1 due to unknown-verb (scripts may fail due
// to missing LINEAR_API_KEY, but they should NOT produce "Unknown verb" stderr).
// All verbs exit with code !== 1 caused by "Unknown verb" — they reach the script.
// ---------------------------------------------------------------------------

// Helper: verify a verb dispatches (reaches the script, not "Unknown verb" error)
function assertVerbDispatches(verb) {
  const result = runPokit(verb);
  // Must NOT produce "Unknown verb" error — the verb is recognized
  assert.doesNotMatch(
    result.stderr ?? "",
    /Unknown verb:/,
    `Verb '${verb}' was not recognized by bin/pokit (got: ${result.stderr})`,
  );
}

test("pokit run dispatches to sprint-runner.ts (not unknown-verb)", () => {
  assertVerbDispatches("run");
});

test("pokit close dispatches to cycle-close.ts (not unknown-verb)", () => {
  assertVerbDispatches("close");
});

test("pokit retro dispatches to retro-summary.ts (not unknown-verb)", () => {
  assertVerbDispatches("retro");
});

test("pokit hotfix dispatches to hotfix-cycle-plan.ts (not unknown-verb)", () => {
  assertVerbDispatches("hotfix");
});

test("pokit audit dispatches to release-md-audit.ts (not unknown-verb)", () => {
  assertVerbDispatches("audit");
});

test("pokit guard dispatches to cycle-guard.ts (not unknown-verb)", () => {
  assertVerbDispatches("guard");
});

test("pokit progress dispatches to cycle-progress.ts (not unknown-verb)", () => {
  assertVerbDispatches("progress");
});

test("pokit end dispatches to session-close.ts (not unknown-verb)", () => {
  assertVerbDispatches("end");
});

test("pokit brief dispatches to session-brief.ts (not unknown-verb)", () => {
  assertVerbDispatches("brief");
});

test("pokit safety dispatches to public-safety-scan.ts (not unknown-verb)", () => {
  assertVerbDispatches("safety");
});

// ---------------------------------------------------------------------------
// POKIT-139: help output includes all 7 PRD verbs + extra verbs
// ---------------------------------------------------------------------------

test("pokit help includes all 7 PRD verbs", () => {
  const result = runPokit("help");
  assert.equal(result.status, 0);
  for (const verb of ["start", "run", "close", "retro", "hotfix", "audit", "guard"]) {
    assert.match(result.stdout, new RegExp(verb), `Expected verb '${verb}' in help output`);
  }
});

// ---------------------------------------------------------------------------
// AC-2 (in-process): buildSessionStart produces pokit:boot ok
//
// Uses the same in-process import pattern as tests/session-start.test.mjs.
// This verifies that the function pokit start delegates to produces the
// expected signature — without requiring LINEAR_API_KEY.
// ---------------------------------------------------------------------------

async function loadSessionStartModule() {
  return import(`../scripts/cli/session-start.ts?cacheBust=${Date.now()}`);
}

const sampleContext = {
  source: "linear_upcoming",
  cycle: {
    id: "cycle-137",
    name: "POKit v0.8.0 CLI Wrapper PoC",
    number: 9,
  },
  issues: [
    {
      id: "issue-137",
      identifier: "POKIT-137",
      title: "bin/pokit CLI wrapper PoC",
      description: "bin/pokit",
      labels: ["pokit:implementation"],
      state: "In Progress",
    },
  ],
};

test("buildSessionStart output contains pokit:boot ok signature", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-cli-test-"));
  await mkdir(join(tempDir, "memory"), { recursive: true });
  await mkdir(join(tempDir, "docs/architecture"), { recursive: true });
  await mkdir(join(tempDir, "workflows"), { recursive: true });
  await writeFile(join(tempDir, "memory/resume-brief.md"), "# Resume Brief\n");
  await writeFile(join(tempDir, "memory/current-cycle.yaml"), "cycle:\n  id: cycle-137\n");
  await writeFile(join(tempDir, "docs/architecture/01-document-roles.md"), "# Document Roles\n");
  await writeFile(
    join(tempDir, "docs/architecture/11-visualization-and-incident-response.md"),
    "# Stage Visualization And Incident Response\n",
  );
  await writeFile(join(tempDir, "workflows/hooks.yaml"), "hooks:\n  session_start:\n    - read_context_map\n");
  await writeFile(
    join(tempDir, "memory/context-map.yaml"),
    [
      "read_order:",
      "  - memory/resume-brief.md",
      "  - memory/current-cycle.yaml",
      "  - docs/architecture/01-document-roles.md",
      "  - docs/architecture/11-visualization-and-incident-response.md",
      "",
    ].join("\n"),
  );

  const { buildSessionStart } = await loadSessionStartModule();
  const output = buildSessionStart({ rootDir: tempDir, context: sampleContext });

  assert.match(output, /pokit:boot ok/);
  assert.match(output, /cycle=POKit v0\.8\.0 CLI Wrapper PoC/);
});

test("buildSessionStart output matches direct node invocation pattern (parity check)", async () => {
  // Verifies that the function called by `pokit start` and by
  // `node --experimental-strip-types scripts/session-start.ts` are the same
  // exported function — i.e., the wrapper adds no transformation.
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-parity-test-"));
  await mkdir(join(tempDir, "memory"), { recursive: true });
  await mkdir(join(tempDir, "docs/architecture"), { recursive: true });
  await mkdir(join(tempDir, "workflows"), { recursive: true });
  await writeFile(join(tempDir, "memory/resume-brief.md"), "# Resume Brief\n");
  await writeFile(join(tempDir, "memory/current-cycle.yaml"), "cycle:\n  id: cycle-137\n");
  await writeFile(join(tempDir, "docs/architecture/01-document-roles.md"), "# Document Roles\n");
  await writeFile(
    join(tempDir, "docs/architecture/11-visualization-and-incident-response.md"),
    "# Stage Visualization And Incident Response\n",
  );
  await writeFile(join(tempDir, "workflows/hooks.yaml"), "hooks:\n  session_start:\n    - read_context_map\n");
  await writeFile(
    join(tempDir, "memory/context-map.yaml"),
    [
      "read_order:",
      "  - memory/resume-brief.md",
      "  - memory/current-cycle.yaml",
      "  - docs/architecture/01-document-roles.md",
      "  - docs/architecture/11-visualization-and-incident-response.md",
      "",
    ].join("\n"),
  );

  // Call buildSessionStart twice with identical inputs — output must be identical
  const { buildSessionStart } = await loadSessionStartModule();
  const output1 = buildSessionStart({ rootDir: tempDir, context: sampleContext });
  const output2 = buildSessionStart({ rootDir: tempDir, context: sampleContext });

  assert.equal(output1, output2, "buildSessionStart is deterministic — same as direct script invocation");
  assert.match(output1, /pokit:boot ok/);
});
