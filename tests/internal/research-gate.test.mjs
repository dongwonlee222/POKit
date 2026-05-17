import assert from "node:assert/strict";
import test from "node:test";

async function loadModule() {
  return import(`../../scripts/internal/intent-classifier.ts?cacheBust=${Date.now()}`);
}

test("'폴더 역할 뭐야?' → research", async () => {
  const { classifyIntent } = await loadModule();
  assert.equal(classifyIntent("폴더 역할 뭐야?"), "research");
});

test("'구현해줘' → build", async () => {
  const { classifyIntent } = await loadModule();
  assert.equal(classifyIntent("구현해줘"), "build");
});

test("'정리하고 추가해줘' → build", async () => {
  const { classifyIntent } = await loadModule();
  assert.equal(classifyIntent("정리하고 추가해줘"), "build");
});

test("'어디 있어?' → research", async () => {
  const { classifyIntent } = await loadModule();
  assert.equal(classifyIntent("어디 있어?"), "research");
});

test("'이거 해도 돼?' → ambiguous", async () => {
  const { classifyIntent } = await loadModule();
  assert.equal(classifyIntent("이거 해도 돼?"), "ambiguous");
});

test("'이슈 메타 보여줘' → research", async () => {
  const { classifyIntent } = await loadModule();
  assert.equal(classifyIntent("이슈 메타 보여줘"), "research");
});

test("'파일 수정해줘' → build", async () => {
  const { classifyIntent } = await loadModule();
  assert.equal(classifyIntent("파일 수정해줘"), "build");
});
