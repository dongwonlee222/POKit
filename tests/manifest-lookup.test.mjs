import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.POKIT_PROFILE = "";

async function loadModule() {
  return import(`../scripts/internal/manifest-lookup.ts?cacheBust=${Date.now()}`);
}

async function makeTempDir() {
  return mkdtemp(join(tmpdir(), "pokit-manifest-"));
}

async function writeCycleManifest(dir, name, content) {
  await mkdir(join(dir, "artifacts", "cycles"), { recursive: true });
  await writeFile(join(dir, "artifacts", "cycles", name), content, "utf8");
}

async function writeReleaseManifest(dir, name, content) {
  await mkdir(join(dir, "artifacts", "releases"), { recursive: true });
  await writeFile(join(dir, "artifacts", "releases", name), content, "utf8");
}

const VALID_CYCLE = `cycle_name: "POKit Cycle 8"
started_at: "2026-04-01T00:00:00Z"
closed_at: null
release_version: "v0.13.0"
included_issue_ids:
  - POKIT-100
  - POKIT-101
notes: "test cycle"
`;

const VALID_RELEASE = `version: "v0.13.0"
released_at: "2026-04-15T12:00:00Z"
included_issue_ids:
  - POKIT-100
  - POKIT-101
cycle_refs:
  - "POKit Cycle 8"
changelog_summary: "Memory MVP initial implementation"
`;

test("lookupCycleForIssue returns cycle_name when issue found", async () => {
  const dir = await makeTempDir();
  await writeCycleManifest(dir, "cycle-8.yaml", VALID_CYCLE);
  const { lookupCycleForIssue } = await loadModule();
  assert.equal(lookupCycleForIssue("POKIT-100", dir), "POKit Cycle 8");
  assert.equal(lookupCycleForIssue("POKIT-101", dir), "POKit Cycle 8");
});

test("lookupCycleForIssue returns null when issue not found", async () => {
  const dir = await makeTempDir();
  await writeCycleManifest(dir, "cycle-8.yaml", VALID_CYCLE);
  const { lookupCycleForIssue } = await loadModule();
  assert.equal(lookupCycleForIssue("POKIT-999", dir), null);
});

test("lookupCycleForIssue returns null when cycles dir does not exist", async () => {
  const dir = await makeTempDir();
  const { lookupCycleForIssue } = await loadModule();
  assert.equal(lookupCycleForIssue("POKIT-100", dir), null);
});

test("lookupReleaseForIssue returns version when issue found", async () => {
  const dir = await makeTempDir();
  await writeReleaseManifest(dir, "v0.13.0.yaml", VALID_RELEASE);
  const { lookupReleaseForIssue } = await loadModule();
  assert.equal(lookupReleaseForIssue("POKIT-100", dir), "v0.13.0");
});

test("lookupReleaseForIssue returns null when issue not found", async () => {
  const dir = await makeTempDir();
  await writeReleaseManifest(dir, "v0.13.0.yaml", VALID_RELEASE);
  const { lookupReleaseForIssue } = await loadModule();
  assert.equal(lookupReleaseForIssue("POKIT-999", dir), null);
});

test("lookupReleaseForIssue returns null when releases dir does not exist", async () => {
  const dir = await makeTempDir();
  const { lookupReleaseForIssue } = await loadModule();
  assert.equal(lookupReleaseForIssue("POKIT-100", dir), null);
});

test("findOpenCycleManifest returns manifest with closed_at null", async () => {
  const dir = await makeTempDir();
  await writeCycleManifest(dir, "cycle-8.yaml", VALID_CYCLE);
  const { findOpenCycleManifest } = await loadModule();
  const result = findOpenCycleManifest(dir);
  assert.ok(result !== null);
  assert.equal(result.cycle_name, "POKit Cycle 8");
  assert.equal(result.closed_at, null);
});

test("findOpenCycleManifest returns null when all cycles are closed", async () => {
  const dir = await makeTempDir();
  const closedCycle = VALID_CYCLE.replace("closed_at: null", 'closed_at: "2026-04-30T00:00:00Z"');
  await writeCycleManifest(dir, "cycle-8.yaml", closedCycle);
  const { findOpenCycleManifest } = await loadModule();
  assert.equal(findOpenCycleManifest(dir), null);
});

test("malformed yaml file is silently skipped", async () => {
  const dir = await makeTempDir();
  await writeCycleManifest(dir, "bad.yaml", "this: is: not: valid: yaml: [[[");
  await writeCycleManifest(dir, "cycle-8.yaml", VALID_CYCLE);
  const { lookupCycleForIssue } = await loadModule();
  // bad.yaml has no cycle_name so it's skipped; valid one still works
  assert.equal(lookupCycleForIssue("POKIT-100", dir), "POKit Cycle 8");
});

test("loadCycleManifests parses included_issue_ids list correctly", async () => {
  const dir = await makeTempDir();
  await writeCycleManifest(dir, "cycle-8.yaml", VALID_CYCLE);
  const { loadCycleManifests } = await loadModule();
  const manifests = loadCycleManifests(dir);
  assert.equal(manifests.length, 1);
  assert.deepEqual(manifests[0].included_issue_ids, ["POKIT-100", "POKIT-101"]);
  assert.equal(manifests[0].release_version, "v0.13.0");
});

test("loadReleaseManifests parses cycle_refs list correctly", async () => {
  const dir = await makeTempDir();
  await writeReleaseManifest(dir, "v0.13.0.yaml", VALID_RELEASE);
  const { loadReleaseManifests } = await loadModule();
  const manifests = loadReleaseManifests(dir);
  assert.equal(manifests.length, 1);
  assert.deepEqual(manifests[0].cycle_refs, ["POKit Cycle 8"]);
  assert.equal(manifests[0].changelog_summary, "Memory MVP initial implementation");
});
