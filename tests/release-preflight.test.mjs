import assert from "node:assert/strict";
import test from "node:test";

async function loadPreflightModule() {
  return import(`../scripts/release-preflight.ts?cacheBust=${Date.now()}`);
}

test("renderReleasePreflight prints ASCII gate map with blocker and warning states", async () => {
  const { renderReleasePreflight } = await loadPreflightModule();

  const output = renderReleasePreflight({
    cycleName: "Cycle 5",
    targetVersion: "v0.4.0",
    results: [
      { id: "full_tests", status: "passed", severity: "blocker", summary: "100/100" },
      { id: "ignored_evidence_scan", status: "warning", severity: "warning", summary: "2 ignored references" },
    ],
  });

  assert.match(output, /Cycle 5 -> v0\.4\.0/);
  assert.match(output, /읽는 법/);
  assert.match(output, /OK full_tests\s+\[blocker\]\s+전체 테스트\s+100\/100/);
  assert.match(output, /WARN ignored_evidence_scan\s+\[warning\]\s+ignored artifact 증거 확인\s+2 ignored references/);
  assert.match(output, /Cycle Release Pending/);
});

test("scanIgnoredEvidenceReferences warns when public files reference ignored artifacts", async () => {
  const { scanIgnoredEvidenceReferences } = await loadPreflightModule();

  const warnings = scanIgnoredEvidenceReferences([
    {
      path: "CHANGELOG.md",
      content: "Evidence: artifacts/profiles/pokit/operations/decomposition-playbook.md",
    },
    {
      path: "docs/SAFE.md",
      content: "Evidence: docs/OPERATING_MODEL.md",
    },
  ]);

  assert.deepEqual(warnings, [
    {
      path: "CHANGELOG.md",
      reference: "artifacts/profiles/pokit/operations/decomposition-playbook.md",
    },
  ]);
});
