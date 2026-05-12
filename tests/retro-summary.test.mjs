import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadRetroModule() {
  return import(`../scripts/retro-summary.ts?cacheBust=${Date.now()}`);
}

test("buildRetroDraft summarizes completed, unfinished, artifacts, and questions", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-retro-"));
  await mkdir(join(tempDir, "artifacts/prds"), { recursive: true });
  await writeFile(join(tempDir, "artifacts/prds/EVM-9.md"), [
    "---",
    "linear_issue_id: EVM-9",
    "artifact_type: prd",
    "---",
    "",
    "# PRD Draft: Retro",
    "",
    "## Open Questions",
    "",
    "- 회고에서 결정할 범위는?",
    "",
  ].join("\n"));
  const { buildRetroDraft } = await loadRetroModule();
  const markdown = buildRetroDraft({
    generatedAt: "2026-05-12T12:00:00+09:00",
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-1", identifier: "EVM-8", title: "Label preflight", labels: [], state: "Done" },
        { id: "issue-2", identifier: "EVM-9", title: "Retro", labels: [], state: "Todo" },
      ],
    },
  });

  assert.match(markdown, /external_writes: none/);
  assert.match(markdown, /Completed issues: 1/);
  assert.match(markdown, /Unfinished issues: 1/);
  assert.match(markdown, /EVM-9: `artifacts\/prds\/EVM-9\.md`/);
  assert.match(markdown, /EVM-9: 회고에서 결정할 범위는\?/);
  assert.match(markdown, /Decision-log Candidates/);
});

test("writeRetroDraft writes artifacts/sprints/[cycle]/retro.md", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-retro-"));
  const { writeRetroDraft } = await loadRetroModule();
  const outputPath = writeRetroDraft({
    generatedAt: "2026-05-12T12:00:00+09:00",
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [],
    },
  });

  assert.equal(outputPath, join(tempDir, "artifacts/sprints/Cycle-1/retro.md"));
  const markdown = await readFile(outputPath, "utf8");
  assert.match(markdown, /# Cycle Retro Draft: Cycle 1/);
});
