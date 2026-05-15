import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("prioritizer skill documents ICE-lite dry-run boundaries", async () => {
  const content = await readFile("skills/prioritizer/SKILL.md", "utf8");

  assert.match(content, /Impact/);
  assert.match(content, /Confidence/);
  assert.match(content, /Ease/);
  assert.match(content, /resume-brief/);
  assert.match(content, /run summary/);
  assert.match(content, /decision-log/);
  assert.match(content, /Linear priority\/status/);
  assert.match(content, /maximum of 3 decision-log candidates/);
});

test("history-maintainer skill separates draftable history from approval-only decisions", async () => {
  const content = await readFile("skills/history-maintainer/SKILL.md", "utf8");

  assert.match(content, /Task History/);
  assert.match(content, /Session History/);
  assert.match(content, /Cycle History/);
  assert.match(content, /Product History/);
  assert.match(content, /Decision History/);
  assert.match(content, /completion evidence/);
  assert.match(content, /must not mark Linear issues Done/);
  assert.match(content, /maximum of 3 decision-log candidates/);
  assert.match(content, /user approval/);
});

test("versioning policy defines first release, semver, hotfixes, and release checklist checks", async () => {
  const versioning = await readFile("docs/VERSIONING.md", "utf8");
  const checklist = await readFile("docs/RELEASE_CHECKLIST.md", "utf8");

  assert.match(versioning, /v0\.1\.0/);
  assert.match(versioning, /unreleased/);
  assert.match(versioning, /SemVer/);
  assert.match(versioning, /patch/);
  assert.match(versioning, /minor/);
  assert.match(versioning, /major/);
  assert.match(versioning, /Hotfix/);
  assert.match(versioning, /VERSION file/);
  assert.match(versioning, /Unreleased/);
  assert.match(checklist, /VERSION/);
  assert.match(checklist, /tag/);
  assert.match(checklist, /CHANGELOG/);
});

test("DESIGN documents orchestrator recovery after session start and compaction", async () => {
  const design = await readFile("docs/DESIGN.md", "utf8");

  assert.match(design, /Orchestrator Recovery Contract/);
  assert.match(design, /orchestrator=loaded/);
  assert.match(design, /docs\/architecture\/01-document-roles\.md/);
  assert.match(design, /docs\/architecture\/11-visualization-and-incident-response\.md/);
  assert.match(design, /context 희석과 무관하게/);
  assert.match(design, /session-start\.ts/);
  assert.match(design, /memory\/context-map\.yaml/);
});

test("architecture index documents Linear structure standards", async () => {
  const roles = await readFile("docs/architecture/01-document-roles.md", "utf8");
  const structure = await readFile("docs/architecture/14-linear-structure-standards.md", "utf8");
  const contextMap = await readFile("memory/context-map.yaml", "utf8");

  assert.match(roles, /14-linear-structure-standards/);
  assert.match(structure, /Linear Cycle/);
  assert.match(structure, /POKit Circle/);
  assert.match(structure, /Parent issue/);
  assert.match(structure, /Sub-issue/);
  assert.match(structure, /pokitRunId/);
  assert.match(structure, /parentIssueId/);
  assert.match(structure, /subIssueIds/);
  assert.match(structure, /Sub-issue Task Checklist/);
  assert.match(structure, /renderSubIssueTaskChecklist/);
  assert.match(contextMap, /docs\/architecture\/14-linear-structure-standards\.md/);
});

test("release flow documents completion evidence before celebration", async () => {
  const releaseFlow = await readFile("docs/architecture/09-release-and-non-release-flow.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(releaseFlow, /Release Completion Evidence/);
  assert.match(releaseFlow, /Cycle Completion Experience/);
  assert.match(releaseFlow, /renderReleaseCompletionEvidence/);
  assert.match(operatingModel, /release completion evidence/);
  assert.match(operatingModel, /Cycle Completion Experience/);
});
