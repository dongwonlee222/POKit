import assert from "node:assert/strict";
import test from "node:test";

async function loadSubagentPayloadModule() {
  return import(`../../scripts/internal/subagent-payload-check.ts?cacheBust=${Date.now()}`);
}

test("validateSubagentPayload accepts bounded schema-only output", async () => {
  const { validateSubagentPayload } = await loadSubagentPayloadModule();

  const result = validateSubagentPayload({
    role: "tdd_agent",
    summary_ko: "실패해야 할 테스트와 완료 기준을 정리했다.",
    artifact_links: [{ path: "artifacts/pokit-133/tdd.md", purpose: "TDD 계획" }],
    decisions_needed: [{ question_ko: "외부 write 승인 여부는 메인이 판단해야 한다.", owner: "main_agent" }],
    external_write_request: "dry_run_only",
    message_catalog_ids: ["external_write.confirmation_title"],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("validateSubagentPayload blocks raw context, non-schema keys, and external write decisions", async () => {
  const { validateSubagentPayload } = await loadSubagentPayloadModule();

  const result = validateSubagentPayload({
    role: "breakdown_agent",
    summary_ko: "원문 전체를 붙여넣고 Linear를 바로 변경한다.",
    artifact_links: [],
    decisions_needed: [],
    external_write_request: "apply",
    message_catalog_ids: [],
    raw_context: "긴 원문 복사",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /unexpected key/);
  assert.match(result.errors.join("\n"), /external_write_request/);
  assert.match(result.errors.join("\n"), /raw context/);
});
