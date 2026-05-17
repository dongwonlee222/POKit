import assert from "node:assert/strict";
import test from "node:test";

async function loadModule() {
  return import(`../../scripts/internal/error-mappings.ts?cacheBust=${Date.now()}`);
}

test("mapSessionStartError maps context-map.yaml missing", async () => {
  const { mapSessionStartError } = await loadModule();
  const result = mapSessionStartError("Session start blocked: missing memory/context-map.yaml");
  assert.ok(result);
  assert.match(result.title, /context-map\.yaml 없음/);
  assert.match(result.prevention, /cp memory\/context-map\.yaml\.example/);
});

test("mapSessionStartError maps read_order missing file with filename", async () => {
  const { mapSessionStartError } = await loadModule();
  const result = mapSessionStartError("Session start blocked: missing read_order file docs/architecture/01-document-roles.md");
  assert.ok(result);
  assert.match(result.problem, /docs\/architecture\/01-document-roles\.md/);
});

test("mapSessionStartError maps Linear API failure", async () => {
  const { mapSessionStartError } = await loadModule();
  const result = mapSessionStartError("fetch failed: 401 Unauthorized");
  assert.ok(result);
  assert.match(result.title, /Linear API/);
  assert.match(result.prevention, /LINEAR_API_KEY/);
});

test("mapSessionStartError returns null for unknown message", async () => {
  const { mapSessionStartError } = await loadModule();
  assert.equal(mapSessionStartError("something completely unexpected"), null);
});

test("resolveVerbError uses verb-specific mapper when available", async () => {
  const { resolveVerbError } = await loadModule();
  const result = resolveVerbError("start", "Session start blocked: missing memory/context-map.yaml");
  assert.match(result.title, /context-map\.yaml 없음/);
});

test("resolveVerbError falls back when verb has no mapper or no match", async () => {
  const { resolveVerbError } = await loadModule();
  const result = resolveVerbError("brief", "some unrelated error");
  assert.match(result.title, /brief: 알 수 없는 오류/);
  assert.match(result.cause, /some unrelated error/);
});

test("renderVerbErrorAscii produces ASCII format without markdown headings", async () => {
  const { renderVerbErrorAscii, resolveVerbError } = await loadModule();
  const review = resolveVerbError("start", "Session start blocked: missing memory/context-map.yaml");
  const output = renderVerbErrorAscii("start", review);
  assert.match(output, /🚨 pokit:start FAILED/);
  assert.match(output, /1\) 문제:/);
  assert.match(output, /2\) 원인:/);
  assert.match(output, /3\) 해결:/);
  assert.doesNotMatch(output, /^#/m);
});
