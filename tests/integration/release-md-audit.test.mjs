import assert from "node:assert/strict";
import test from "node:test";

async function loadAuditModule() {
  return import(`../../scripts/ci/release-md-audit.ts?cacheBust=${Date.now()}`);
}

test("auditReleaseMarkdown flags oversized agent rules and stale release checklist targets", async () => {
  const { auditReleaseMarkdown } = await loadAuditModule();

  const result = auditReleaseMarkdown([
    {
      path: "AGENTS.md",
      content: [
        "# POKit Agent Instructions",
        "x".repeat(9001),
      ].join("\n"),
    },
    {
      path: "docs/RELEASE_CHECKLIST.md",
      content: [
        "# POKit Release Checklist",
        "## v0.1.1 Hotfix Clean Check",
        "- [ ] User approved `v0.1.1` tag creation in the final deploy request.",
      ].join("\n"),
    },
  ], { targetVersion: "v0.2.0" });

  assert.deepEqual(result.violations.map((violation) => violation.ruleId), [
    "agents-md-too-large",
    "stale-release-checklist-target",
  ]);
});

test("auditReleaseMarkdown requires canonical role markers in current docs", async () => {
  const { auditReleaseMarkdown } = await loadAuditModule();

  const result = auditReleaseMarkdown([
    {
      path: "docs/OPERATING_MODEL.md",
      content: "# POKit Operating Model\n\nPolicy.",
    },
  ], { targetVersion: "v0.2.0" });

  assert.deepEqual(result.violations.map((violation) => violation.ruleId), [
    "missing-operating-model-role",
  ]);
});

test("auditReleaseMarkdown requires docs policy and changelog docs section for releases", async () => {
  const { auditReleaseMarkdown } = await loadAuditModule();

  const result = auditReleaseMarkdown([
    {
      path: "docs/VERSIONING.md",
      content: "# POKit Versioning\n\n## CHANGELOG Structure\n\nRelease notes.",
    },
    {
      path: "CHANGELOG.md",
      content: "# Changelog\n\n## v0.2.0 - 2026-05-13\n\n- Added scripts.",
    },
  ], { targetVersion: "v0.2.0" });

  assert.deepEqual(result.violations.map((violation) => violation.ruleId), [
    "missing-doc-versioning-policy",
    "missing-changelog-docs-section",
  ]);
});

test("scanTrackedReleaseMarkdown passes for repository release docs", async () => {
  const { scanTrackedReleaseMarkdown } = await loadAuditModule();

  const result = await scanTrackedReleaseMarkdown({
    cwd: new URL("..", import.meta.url).pathname,
    targetVersion: "v0.2.0",
  });

  assert.deepEqual(result.violations, []);
});

test("release docs use execution preflight terminology instead of approval preview", async () => {
  const files = [
    "AGENTS.md",
    "CHANGELOG.md",
    "skills/release-md-auditor/SKILL.md",
    "workflows/hooks.yaml",
  ];

  for (const path of files) {
    const content = await import("node:fs/promises").then((fs) => fs.readFile(path, "utf8"));
    assert.doesNotMatch(content, /approval preview|승인 미리보기|require_release_approval_preview/i, path);
  }
});
