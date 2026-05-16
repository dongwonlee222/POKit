import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadCycleGuardModule() {
  return import(`../scripts/ci/cycle-guard.ts?cacheBust=${Date.now()}`);
}

test("evaluateCycleGuard blocks implementation without cycle or approved bundle context", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();

  const result = evaluateCycleGuard({ mode: "implementation" });

  assert.equal(result.allowed, false);
  assert.match(result.message, /Cycle-first guard blocked implementation/);
  assert.match(result.message, /Attach the work to a Linear cycle/);
});

test("evaluateCycleGuard allows read-only planning without cycle context", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();

  const result = evaluateCycleGuard({ mode: "planning" });

  assert.equal(result.allowed, true);
  assert.match(result.message, /Planning and dry-run work may proceed/);
});

test("evaluateCycleGuard allows implementation when a cycle issue context exists", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();

  const result = evaluateCycleGuard({
    mode: "implementation",
    issueIdentifier: "EVM-42",
    cycleId: "00000000-0000-4000-8000-000000000042",
    cycleName: "Cycle N",
  });

  assert.equal(result.allowed, true);
  assert.match(result.message, /EVM-42/);
  assert.match(result.message, /Cycle N/);
});

test("evaluateCycleGuard allows implementation with an approved cycle bundle", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();
  const dir = mkdtempSync(join(tmpdir(), "pokit-cycle-guard-"));
  const bundlePath = join(dir, "bundle.json");
  writeFileSync(bundlePath, JSON.stringify({
    approved: true,
    cycle: { id: "cycle-2", name: "Cycle N" },
    issues: ["EVM-42"],
  }));

  const result = evaluateCycleGuard({
    mode: "implementation",
    approvedBundlePath: bundlePath,
  });

  assert.equal(result.allowed, true);
  assert.match(result.message, /approved cycle bundle/);
  assert.match(result.message, /Cycle N/);
});

test("evaluateCycleGuard blocks assigning new work to an operationally complete cycle", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();

  const result = evaluateCycleGuard({
    mode: "implementation",
    issueIdentifier: "EVM-35",
    cycleId: "cycle-2",
    cycleName: "Cycle N",
    targetCycleComplete: true,
    operation: "cycle_assignment",
  });

  assert.equal(result.allowed, false);
  assert.match(result.message, /Completed cycle is immutable/);
  assert.match(result.message, /Move new work to the next cycle/);
});

test("evaluateCycleGuard allows reopening a complete cycle only when explicit", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();

  const result = evaluateCycleGuard({
    mode: "implementation",
    issueIdentifier: "EVM-35",
    cycleId: "cycle-2",
    cycleName: "Cycle N",
    targetCycleComplete: true,
    operation: "cycle_assignment",
    reopenCompletedCycle: true,
  });

  assert.equal(result.allowed, true);
  assert.match(result.message, /explicit completed-cycle reopen/);
});

test("evaluateCycleGuard blocks hotfix release work without version and cycle metadata", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();

  const result = evaluateCycleGuard({
    mode: "implementation",
    operation: "external_release",
    issueIdentifier: "POKIT-44",
    cycleId: "hotfix-cycle",
    cycleName: "Hotfix vX.Y.Z",
    releaseKind: "hotfix",
    sourceCycle: "Cycle N",
  });

  assert.equal(result.allowed, false);
  assert.match(result.message, /Hotfix release guard blocked/);
  assert.match(result.message, /targetVersion/);
  assert.match(result.message, /resumeCycle/);
});

test("evaluateCycleGuard allows hotfix release work with version and cycle metadata", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();

  const result = evaluateCycleGuard({
    mode: "implementation",
    operation: "external_release",
    issueIdentifier: "POKIT-44",
    cycleId: "hotfix-cycle",
    cycleName: "Hotfix vX.Y.Z",
    releaseKind: "hotfix",
    sourceCycle: "Cycle N",
    targetVersion: "vX.Y.Z",
    resumeCycle: "Cycle N+1",
  });

  assert.equal(result.allowed, true);
  assert.match(result.message, /Hotfix release guard passed/);
  assert.match(result.message, /Cycle N/);
  assert.match(result.message, /vX.Y.Z/);
  assert.match(result.message, /Cycle N\+1/);
});
