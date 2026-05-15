import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadCatalogModule() {
  return import(`../scripts/message-catalog.ts?cacheBust=${Date.now()}`);
}

test("loadMessageCatalog reads message ids and Korean user-facing text", async () => {
  const { loadMessageCatalog, getMessage } = await loadCatalogModule();

  const catalog = loadMessageCatalog("workflows/messages.yaml");

  assert.equal(getMessage(catalog, "session_start.next_action_label").text, "추천 다음 행동");
  assert.equal(getMessage(catalog, "resume_compaction.title").text, "세션 복구 확인");
  assert.equal(getMessage(catalog, "backlog_intake.title").emoji, "🧺");
  assert.equal(getMessage(catalog, "backlog_outline.title_rule").text, "제목은 한글 상태로 시작합니다");
  assert.equal(getMessage(catalog, "backlog_outline.description_rule").emoji, "🧾");
  assert.equal(getMessage(catalog, "verification.failed").text, "검증 실패");
  assert.equal(getMessage(catalog, "external_write.confirmation_title").text, "사용자 확인");
  assert.equal(getMessage(catalog, "decision_choice.prompt").text, "A/B로 선택해 주세요");
  assert.equal(getMessage(catalog, "error_incident.title").emoji, "🚨");
  assert.equal(getMessage(catalog, "linear_backlog_create.title_prefix").text, "{targetVersion} · {title}");
});

test("validateMessageCatalog blocks missing Korean text and unknown surfaces", async () => {
  const { parseMessageCatalog, validateMessageCatalog } = await loadCatalogModule();

  const catalog = parseMessageCatalog(`
messages:
  bad.example:
    surface: unknown_surface
    text: "English only text"
`);

  const result = validateMessageCatalog(catalog);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /unknown surface/);
  assert.match(result.errors.join("\n"), /Korean user-facing text/);
});

test("renderMessage replaces variables without changing the catalog text", async () => {
  const { loadMessageCatalog, renderMessage, getMessage } = await loadCatalogModule();
  const catalog = loadMessageCatalog("workflows/messages.yaml");

  const rendered = renderMessage(catalog, "linear_backlog_create.title_prefix", {
    targetVersion: "v0.7.0",
    title: "메시지 카탈로그와 훅 하네스",
  });

  assert.equal(rendered, "v0.7.0 · 메시지 카탈로그와 훅 하네스");
  assert.equal(getMessage(catalog, "linear_backlog_create.title_prefix").text, "{targetVersion} · {title}");
});

test("session-start fixture keeps the user-facing start copy stable", async () => {
  const fixture = await readFile("tests/fixtures/session-start.expected.md", "utf8");

  assert.match(fixture, /# POKit Brief/);
  assert.match(fixture, /📌 현재:/);
  assert.match(fixture, /🧺 다음 후보/);
  assert.match(fixture, /💬 추천 다음 행동/);
  assert.doesNotMatch(fixture, /👉 추천:/);
  assert.doesNotMatch(fixture, /💬 실행:/);
});
