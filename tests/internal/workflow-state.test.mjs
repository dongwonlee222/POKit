import test from "node:test";
import assert from "node:assert/strict";
import { mkTempDir } from "../_setup/index.mjs";
import {
  renderWorkflowState,
  parseWorkflowState,
  loadWorkflowState,
  saveWorkflowState,
  markSessionStart,
  markSessionClose,
  markReleaseStart,
  markReleaseComplete,
} from "../../scripts/internal/workflow-state.ts";

function fixture() {
  return {
    schema_version: 1,
    current_cycle_id: "team-backlog",
    current_cycle_name: "Team Backlog",
    target_version: "v0.17.2",
    last_release_version: "v0.17.1",
    state: "active",
    updated_at: "2026-05-18T00:00:00.000Z",
    last_session_at: "2026-05-18T00:00:00.000Z",
    active_issue_ids: ["POKIT-200", "POKIT-201"],
  };
}

test("render → parse round trip 보존", () => {
  const before = fixture();
  const raw = renderWorkflowState(before);
  const after = parseWorkflowState(raw);
  assert.equal(after.current_cycle_id, before.current_cycle_id);
  assert.equal(after.current_cycle_name, before.current_cycle_name);
  assert.equal(after.target_version, before.target_version);
  assert.equal(after.last_release_version, before.last_release_version);
  assert.equal(after.state, before.state);
  assert.deepEqual(after.active_issue_ids, before.active_issue_ids);
});

test("loadWorkflowState: 파일 없으면 null", () => {
  const dir = mkTempDir();
  assert.equal(loadWorkflowState(dir), null);
});

test("saveWorkflowState + loadWorkflowState round trip", () => {
  const dir = mkTempDir();
  saveWorkflowState(fixture(), dir);
  const loaded = loadWorkflowState(dir);
  assert.ok(loaded);
  assert.equal(loaded.current_cycle_name, "Team Backlog");
});

test("markSessionStart: 신규 파일 + state=active + last_session_at", () => {
  const dir = mkTempDir();
  const now = new Date("2026-05-18T10:00:00.000Z");
  const state = markSessionStart(dir, now);
  assert.equal(state.state, "active");
  assert.equal(state.last_session_at, now.toISOString());
});

test("markSessionStart: 기존 state 보존 (cycle/target/last_release)", () => {
  const dir = mkTempDir();
  saveWorkflowState(
    {
      ...fixture(),
      state: "idle",
    },
    dir,
  );
  const state = markSessionStart(dir, new Date("2026-05-18T11:00:00.000Z"));
  assert.equal(state.state, "active");
  assert.equal(state.target_version, "v0.17.2");
  assert.equal(state.last_release_version, "v0.17.1");
});

test("markSessionClose: state=idle + last_session_closed_at", () => {
  const dir = mkTempDir();
  markSessionStart(dir, new Date("2026-05-18T10:00:00.000Z"));
  const closed = markSessionClose(dir, new Date("2026-05-18T11:00:00.000Z"));
  assert.equal(closed.state, "idle");
  assert.ok(closed.last_session_closed_at);
});

test("markReleaseStart: state=releasing + target_version 갱신", () => {
  const dir = mkTempDir();
  const s = markReleaseStart(dir, "v0.18.0");
  assert.equal(s.state, "releasing");
  assert.equal(s.target_version, "v0.18.0");
});

test("markReleaseComplete: last_release_version 갱신 + target_version 비움", () => {
  const dir = mkTempDir();
  markReleaseStart(dir, "v0.18.0");
  const done = markReleaseComplete(dir, "v0.18.0");
  assert.equal(done.last_release_version, "v0.18.0");
  assert.equal(done.target_version, null);
  assert.equal(done.state, "idle");
});
