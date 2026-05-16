import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const SKILLS_DIR = join(PROJECT_ROOT, "skills");

async function loadDispatchModule() {
  return import(`../scripts/internal/dispatch.ts?cacheBust=${Date.now()}`);
}

// ──────────────────────────────────────────────
// loadSkillManifests
// ──────────────────────────────────────────────

test("loadSkillManifests loads all 8 SKILL manifests", async () => {
  const { loadSkillManifests } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  assert.equal(manifests.length, 8, `Expected 8 manifests, got ${manifests.length}`);
});

test("loadSkillManifests: each manifest has required fields", async () => {
  const { loadSkillManifests } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const REQUIRED_FIELDS = ["name", "description", "entry", "labels", "trigger_phrases", "body"];
  for (const m of manifests) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(
        field in m,
        `Manifest '${m.name ?? "unknown"}' is missing field '${field}'`
      );
    }
    assert.ok(typeof m.name === "string" && m.name.length > 0, `Manifest name must be non-empty string`);
    assert.ok(Array.isArray(m.labels), `Manifest '${m.name}' labels must be an array`);
    assert.ok(Array.isArray(m.trigger_phrases), `Manifest '${m.name}' trigger_phrases must be an array`);
    assert.ok(typeof m.body === "string", `Manifest '${m.name}' body must be a string`);
  }
});

test("loadSkillManifests: all 8 expected skill names are present", async () => {
  const { loadSkillManifests } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const names = manifests.map((m) => m.name);
  const EXPECTED = [
    "acceptance-criteria-author",
    "backlog-manager",
    "backlog-router",
    "history-maintainer",
    "prd-author",
    "prioritizer",
    "release-md-auditor",
    "sprint-runner",
  ];
  for (const expected of EXPECTED) {
    assert.ok(names.includes(expected), `Missing skill: '${expected}'. Found: ${JSON.stringify(names)}`);
  }
});

test("loadSkillManifests: SKILL.md bodies still contain original content markers", async () => {
  const { loadSkillManifests } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  // 각 SKILL.md 본문에는 원본 ## Trigger 또는 ## Workflow 섹션이 있어야 함
  const hasContent = manifests.filter((m) => m.body.includes("## "));
  assert.ok(
    hasContent.length >= 7,
    `Expected at least 7 manifests with '## ' sections, got ${hasContent.length}`
  );
});

// ──────────────────────────────────────────────
// dispatchByLabels
// ──────────────────────────────────────────────

test("dispatchByLabels: pokit:prd → prd-author", async () => {
  const { loadSkillManifests, dispatchByLabels } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByLabels(["pokit:prd"], manifests);
  const names = result.map((m) => m.name);
  assert.ok(names.includes("prd-author"), `Expected 'prd-author', got ${JSON.stringify(names)}`);
});

test("dispatchByLabels: pokit:criteria → acceptance-criteria-author", async () => {
  const { loadSkillManifests, dispatchByLabels } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByLabels(["pokit:criteria"], manifests);
  const names = result.map((m) => m.name);
  assert.ok(
    names.includes("acceptance-criteria-author"),
    `Expected 'acceptance-criteria-author', got ${JSON.stringify(names)}`
  );
});

test("dispatchByLabels: unknown label → empty array", async () => {
  const { loadSkillManifests, dispatchByLabels } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByLabels(["pokit:unknown-xyz"], manifests);
  assert.equal(result.length, 0, `Expected 0 results for unknown label, got ${result.length}`);
});

test("dispatchByLabels: empty labels array → empty array", async () => {
  const { loadSkillManifests, dispatchByLabels } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByLabels([], manifests);
  assert.equal(result.length, 0);
});

test("dispatchByLabels: backlog-router matches both pokit:prd and pokit:criteria", async () => {
  const { loadSkillManifests, dispatchByLabels } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const resultPrd = dispatchByLabels(["pokit:prd"], manifests);
  const resultCriteria = dispatchByLabels(["pokit:criteria"], manifests);
  const prdNames = resultPrd.map((m) => m.name);
  const criteriaNames = resultCriteria.map((m) => m.name);
  assert.ok(prdNames.includes("backlog-router"), `backlog-router should match pokit:prd`);
  assert.ok(criteriaNames.includes("backlog-router"), `backlog-router should match pokit:criteria`);
});

// ──────────────────────────────────────────────
// dispatchByTriggerPhrase
// ──────────────────────────────────────────────

test("dispatchByTriggerPhrase: '이번 cycle 실행' → sprint-runner", async () => {
  const { loadSkillManifests, dispatchByTriggerPhrase } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByTriggerPhrase("이번 cycle 실행", manifests);
  assert.ok(result !== null, "Expected a match, got null");
  assert.equal(result.name, "sprint-runner");
});

test("dispatchByTriggerPhrase: '이번 cycle 준비' → sprint-runner", async () => {
  const { loadSkillManifests, dispatchByTriggerPhrase } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByTriggerPhrase("이번 cycle 준비 시작해줘", manifests);
  assert.ok(result !== null, "Expected a match, got null");
  assert.equal(result.name, "sprint-runner");
});

test("dispatchByTriggerPhrase: 'PRD 작성해줘' → prd-author", async () => {
  const { loadSkillManifests, dispatchByTriggerPhrase } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByTriggerPhrase("PRD 작성해줘", manifests);
  assert.ok(result !== null, "Expected a match, got null");
  assert.equal(result.name, "prd-author");
});

test("dispatchByTriggerPhrase: unmatched input → null", async () => {
  const { loadSkillManifests, dispatchByTriggerPhrase } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  const result = dispatchByTriggerPhrase("완전히 알 수 없는 요청 xyz123", manifests);
  assert.equal(result, null);
});

test("dispatchByTriggerPhrase: case-insensitive matching", async () => {
  const { loadSkillManifests, dispatchByTriggerPhrase } = await loadDispatchModule();
  const manifests = loadSkillManifests(SKILLS_DIR);
  // "release audit" is a trigger_phrase for release-md-auditor
  const result = dispatchByTriggerPhrase("Release Audit 실행", manifests);
  assert.ok(result !== null, "Expected a match for 'Release Audit 실행', got null");
  assert.equal(result.name, "release-md-auditor");
});
