import test from "node:test";
import assert from "node:assert/strict";
import { mkTempDir, writeFixture } from "../_setup/index.mjs";
import { join } from "node:path";
import {
  collectCycleIssues,
  carryForwardUnresolved,
  snapshotWiringActual,
  escalateUnresolved,
  runManifestBackfill,
  findPreviousReleaseManifest,
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

test("carryForwardUnresolved: routed_to / absorbed_by 있는 항목은 제외 (POKIT-192 후속)", () => {
  const prev = baseManifest({
    unresolved: [
      { id: "raw-1", note: "real", owner: "human" },
      { id: "routed", note: "handled", owner: "agent", routed_to: "bl-x" },
      { id: "absorbed", note: "merged", owner: "agent", absorbed_by: "bl-y" },
    ],
  });
  const curr = baseManifest();
  const result = carryForwardUnresolved(curr, prev);
  assert.equal(result.unresolved?.length, 1);
  assert.equal(result.unresolved?.[0].id, "raw-1");
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

test("findPreviousReleaseManifest: 직전 prev 에 raw unresolved 있으면 그것 반환", () => {
  const dir = mkTempDir();
  writeFixture(
    join(dir, "releases/v0.16.0/manifest.yaml"),
    `version: 0.16.0
released_at: "2026-05-17T00:00:00.000Z"
cycle_id: c1
issues: []
changelog: []
artifacts:
  code_paths: []
  doc_paths: []
  skills: []
wiring_status:
  intended: []
  actual: []
  gaps: []
unresolved:
  - id: real-raw
    note: real
    owner: human
`,
  );
  const prev = findPreviousReleaseManifest(dir, "0.17.0");
  assert.ok(prev);
  assert.equal(prev.version, "0.16.0");
});

test("findPreviousReleaseManifest: 직전 prev 가 비었으면 walk-back 으로 더 거슬러 검색 (POKIT-192 후속)", () => {
  const dir = mkTempDir();
  // v0.16.0: real unresolved
  writeFixture(
    join(dir, "releases/v0.16.0/manifest.yaml"),
    `version: 0.16.0
released_at: "2026-05-17T00:00:00.000Z"
cycle_id: c1
issues: []
changelog: []
artifacts:
  code_paths: []
  doc_paths: []
  skills: []
wiring_status:
  intended: []
  actual: []
  gaps: []
unresolved:
  - id: real-raw
    note: deep-raw
    owner: human
`,
  );
  // v0.17.1: 모두 routed (raw 0)
  writeFixture(
    join(dir, "releases/v0.17.1/manifest.yaml"),
    `version: 0.17.1
released_at: "2026-05-18T00:00:00.000Z"
cycle_id: c2
issues: []
changelog: []
artifacts:
  code_paths: []
  doc_paths: []
  skills: []
wiring_status:
  intended: []
  actual: []
  gaps: []
unresolved:
  - id: routed-one
    note: routed
    owner: agent
    routed_to: bl-x
`,
  );
  // v0.17.2 입장에서 prev = v0.17.1 (routed only) → walk back → v0.16.0
  const prev = findPreviousReleaseManifest(dir, "0.17.2");
  assert.ok(prev);
  assert.equal(prev.version, "0.16.0");
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
