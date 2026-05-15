import assert from "node:assert/strict";
import test from "node:test";

async function loadHookMapModule() {
  return import(`../scripts/hook-map.ts?cacheBust=${Date.now()}`);
}

test("loadHookMap reads before_public_release enforcement metadata", async () => {
  const { parseHookMap } = await loadHookMapModule();

  const map = parseHookMap(`
hooks:
  session_start:
    - read_context_map

  before_public_release:
    enforcement: script
    runner: scripts/release-preflight.ts
    gates:
      - id: full_tests
        severity: blocker
      - id: ignored_evidence_scan
        severity: warning
`);

  assert.equal(map.before_public_release.enforcement, "script");
  assert.equal(map.before_public_release.runner, "scripts/release-preflight.ts");
  assert.deepEqual(map.before_public_release.gates.map((gate) => `${gate.id}:${gate.severity}`), [
    "full_tests:blocker",
    "ignored_evidence_scan:warning",
  ]);
  assert.deepEqual(map.session_start.steps, ["read_context_map"]);
});

test("renderHookMap shows enforcement status for users", async () => {
  const { parseHookMap, renderHookMap } = await loadHookMapModule();

  const output = renderHookMap(parseHookMap(`
hooks:
  before_public_release:
    enforcement: script
    runner: scripts/release-preflight.ts
    gates:
      - id: full_tests
        severity: blocker
      - id: ignored_evidence_scan
        severity: warning
`));

  assert.match(output, /POKit Hook Map/);
  assert.match(output, /읽는 법/);
  assert.match(output, /before_public_release/);
  assert.match(output, /release 전 필수 점검/);
  assert.match(output, /enforcement: script/);
  assert.match(output, /강제됨/);
  assert.match(output, /runner: scripts\/release-preflight\.ts/);
  assert.match(output, /full_tests\s+\[blocker\]\s+전체 테스트/);
  assert.match(output, /ignored_evidence_scan\s+\[warning\]\s+release에 안 들어가는 artifact만 증거로 삼는지 확인/);
});

test("hooks include executable validators for message, subagent, and external write contracts", async () => {
  const content = await import("node:fs/promises").then((fs) => fs.readFile("workflows/hooks.yaml", "utf8"));

  assert.match(content, /validate_message_catalog/);
  assert.match(content, /validate_subagent_payload/);
  assert.match(content, /validate_semantic_payload/);
  assert.match(content, /require_external_write_entrypoint/);
});
