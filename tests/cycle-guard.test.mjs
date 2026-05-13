import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadCycleGuardModule() {
  return import(`../scripts/cycle-guard.ts?cacheBust=${Date.now()}`);
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
    cycleId: "169a76a8-2867-45f0-b380-3e35e504c9c7",
    cycleName: "Cycle 2",
  });

  assert.equal(result.allowed, true);
  assert.match(result.message, /EVM-42/);
  assert.match(result.message, /Cycle 2/);
});

test("evaluateCycleGuard allows implementation with an approved cycle bundle", async () => {
  const { evaluateCycleGuard } = await loadCycleGuardModule();
  const dir = mkdtempSync(join(tmpdir(), "pokit-cycle-guard-"));
  const bundlePath = join(dir, "bundle.json");
  writeFileSync(bundlePath, JSON.stringify({
    approved: true,
    cycle: { id: "cycle-2", name: "Cycle 2" },
    issues: ["EVM-42"],
  }));

  const result = evaluateCycleGuard({
    mode: "implementation",
    approvedBundlePath: bundlePath,
  });

  assert.equal(result.allowed, true);
  assert.match(result.message, /approved cycle bundle/);
  assert.match(result.message, /Cycle 2/);
});

