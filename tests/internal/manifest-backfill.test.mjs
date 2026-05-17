import test from "node:test";
import assert from "node:assert/strict";
import {
  collectCycleIssues,
  carryForwardUnresolved,
  snapshotWiringActual,
  escalateUnresolved,
  runManifestBackfill,
} from "../../scripts/internal/manifest-backfill.ts";

function baseManifest(overrides = {}) {
  return {
    version: "0.17.2",
    released_at: "2026-05-18T00:00:00.000Z",
    cycle_id: "test-cycle",
    issues: [],
    changelog: [],
    artifacts: { code_paths: [], doc_paths: [], skills: [] },
    wiring_status: { intended: [], actual: [], gaps: [] },
    ...overrides,
  };
}

test("collectCycleIssues: issues 배열 채움", () => {
  const m = baseManifest();
  const result = collectCycleIssues(m, [
    { id: "u1", identifier: "POKIT-200", title: "Test A", state: "Backlog" },
    { id: "u2", identifier: "POKIT-201", title: "Test B" },
  ]);
  assert.equal(result.issues.length, 2);
  assert.equal(result.issues[0].identifier, "POKIT-200");
  assert.equal(result.issues[0].state, "Backlog");
  assert.equal(result.issues[1].state, undefined);
});

test("carryForwardUnresolved: 이전 unresolved 이월 + cycle_count + carried_from", () => {
  const prev = baseManifest({
    version: "0.17.1",
    unresolved: [
      { id: "u-1", note: "old", owner: "human" },
      { id: "u-2", note: "older", owner: "agent", cycle_count: 2 },
    ],
  });
  const curr = baseManifest({ version: "0.17.2" });
  const result = carryForwardUnresolved(curr, prev);
  assert.equal(result.unresolved?.length, 2);
  assert.equal(result.unresolved?.[0].carried_from, "0.17.1");
  assert.equal(result.unresolved?.[0].cycle_count, 2);
  assert.equal(result.unresolved?.[1].cycle_count, 3);
});

test("carryForwardUnresolved: 이미 존재하는 id 는 중복 추가 X", () => {
  const prev = baseManifest({
    unresolved: [{ id: "dup", note: "old", owner: "human" }],
  });
  const curr = baseManifest({
    unresolved: [{ id: "dup", note: "current", owner: "human" }],
  });
  const result = carryForwardUnresolved(curr, prev);
  assert.equal(result.unresolved?.length, 1);
  assert.equal(result.unresolved?.[0].note, "current");
});

test("snapshotWiringActual: intended 비면 actual/gaps 비움", () => {
  const m = baseManifest();
  const result = snapshotWiringActual(m);
  assert.deepEqual(result.wiring_status.actual, []);
  assert.deepEqual(result.wiring_status.gaps, []);
});

test("escalateUnresolved: human + cycle_count>=threshold → agent + escalated_at", () => {
  const m = baseManifest({
    unresolved: [
      { id: "u-1", note: "stuck", owner: "human", cycle_count: 3 },
      { id: "u-2", note: "fresh", owner: "human", cycle_count: 1 },
      { id: "u-3", note: "agent-owned", owner: "agent", cycle_count: 3 },
    ],
  });
  const result = escalateUnresolved(m, 2);
  assert.equal(result.unresolved?.[0].owner, "agent");
  assert.ok(result.unresolved?.[0].escalated_at);
  assert.equal(result.unresolved?.[1].owner, "human");
  assert.equal(result.unresolved?.[2].owner, "agent");
});

test("runManifestBackfill: 4단계 모두 실행 + log 생성", () => {
  const m = baseManifest();
  const prev = baseManifest({
    version: "0.17.1",
    unresolved: [{ id: "old", note: "to carry", owner: "human", cycle_count: 1 }],
  });
  const result = runManifestBackfill(m, {
    issues: [{ id: "u1", identifier: "POKIT-300", title: "X" }],
    previousManifest: prev,
    escalationThreshold: 2,
  });
  assert.equal(result.manifest.issues.length, 1);
  assert.equal(result.manifest.unresolved?.length, 1);
  assert.equal(result.log.issues_added, 1);
  assert.equal(result.log.carry_forward_count, 1);
  // cycle_count 2 >= threshold 2 → escalated
  assert.equal(result.manifest.unresolved?.[0].owner, "agent");
});
