import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadModule() {
  return import(`../scripts/internal/next-action-wizard.ts?cacheBust=${Date.now()}`);
}

test("isValidSemver accepts v-prefixed and bare semver", async () => {
  const { isValidSemver } = await loadModule();
  assert.ok(isValidSemver("0.15.1"));
  assert.ok(isValidSemver("v0.15.1"));
  assert.ok(isValidSemver("1.2.3"));
  assert.equal(isValidSemver("0.15"), false);
  assert.equal(isValidSemver("abc"), false);
  assert.equal(isValidSemver(""), false);
});

test("isValidLinearId accepts POKIT-style IDs, rejects malformed", async () => {
  const { isValidLinearId } = await loadModule();
  assert.ok(isValidLinearId("POKIT-167"));
  assert.ok(isValidLinearId("POKIT-1, POKIT-2 POKIT-3"));
  assert.ok(isValidLinearId("")); // empty list valid
  assert.equal(isValidLinearId("POKIT"), false);
  assert.equal(isValidLinearId("167"), false);
});

test("parseIssueList normalises to uppercase IDs", async () => {
  const { parseIssueList } = await loadModule();
  assert.deepEqual(parseIssueList("pokit-1, pokit-2"), ["POKIT-1", "POKIT-2"]);
  assert.deepEqual(parseIssueList(""), []);
});

test("serializeNextActionYaml + parseNextActionYaml round-trip", async () => {
  const { serializeNextActionYaml, parseNextActionYaml } = await loadModule();
  const input = {
    target_version: "0.15.2",
    issues: ["POKIT-200", "POKIT-201"],
    intent: "Hook 검증 강화",
    created_at: "2026-05-17T12:00:00Z",
  };
  const yaml = serializeNextActionYaml(input);
  const parsed = parseNextActionYaml(yaml);
  assert.deepEqual(parsed, input);
});

test("serialize handles empty issue list", async () => {
  const { serializeNextActionYaml, parseNextActionYaml } = await loadModule();
  const input = {
    target_version: "0.15.2",
    issues: [],
    intent: "no issues yet",
    created_at: "2026-05-17T12:00:00Z",
  };
  const yaml = serializeNextActionYaml(input);
  const parsed = parseNextActionYaml(yaml);
  assert.deepEqual(parsed?.issues, []);
});

test("writeNextAction + readNextAction round-trip via filesystem", async () => {
  const { writeNextAction, readNextAction } = await loadModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-nextaction-"));
  const input = {
    target_version: "0.15.2",
    issues: ["POKIT-300"],
    intent: "release dogfood",
    created_at: "2026-05-17T13:00:00Z",
  };
  await writeNextAction(input, tempDir);
  const loaded = readNextAction(tempDir);
  assert.deepEqual(loaded, input);
});

test("readNextAction returns null when file missing", async () => {
  const { readNextAction } = await loadModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-nextaction-missing-"));
  assert.equal(readNextAction(tempDir), null);
});
