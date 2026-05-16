import assert from "node:assert/strict";
import test from "node:test";

process.env.POKIT_PROFILE = "";

async function loadArchiveModule() {
  return import(`../scripts/internal/archive-guardrail.ts?cacheBust=${Date.now()}`);
}

function makeDoneIssue(number) {
  return {
    id: `issue-${number}`,
    identifier: `EVM-${number}`,
    title: `Completed task ${number}`,
    description: `Archived task body ${number}`,
    labels: ["pokit:criteria"],
    state: "Done",
    url: `https://linear.app/example/issue/EVM-${number}`,
  };
}

test("buildArchiveGuardrail warns when completed issues reach the soft limit", async () => {
  const { buildArchiveGuardrail } = await loadArchiveModule();
  const issues = Array.from({ length: 205 }, (_, index) => makeDoneIssue(index + 1));

  const guardrail = buildArchiveGuardrail({ issues });

  assert.equal(guardrail.completedCount, 205);
  assert.equal(guardrail.shouldNudge, true);
  assert.equal(guardrail.candidateCount, 55);
  assert.match(guardrail.briefLine, /🗄️ Archive 권장: 완료 205개/);
  assert.match(guardrail.briefLine, /오래된 55개 후보/);
});

test("buildArchivePlan creates local archive dry-run contract without Linear writes", async () => {
  const { buildArchivePlan } = await loadArchiveModule();
  const issues = Array.from({ length: 203 }, (_, index) => makeDoneIssue(index + 1));

  const plan = buildArchivePlan({
    issues,
    generatedAt: new Date("2026-05-13T09:00:00+09:00"),
  });

  assert.equal(plan.summary, "Archive 53 completed Linear issues locally before Linear cleanup.");
  assert.equal(plan.writes.length, 2);
  assert.equal(plan.writes[0].type, "write_archive_jsonl");
  assert.equal(plan.writes[0].target, "artifacts/archive/linear-completed-2026-05.jsonl");
  assert.equal(plan.writes[1].type, "write_archive_markdown");
  assert.equal(plan.linearCleanup.allowed, false);
  assert.equal(plan.linearCleanup.reason, "POKit never archives, deletes, or mutates Linear issues without explicit approval.");
  assert.deepEqual(plan.linearCleanup.requiredSchemaCheck.candidates, ["issueArchive", "issueDelete"]);
  assert.equal(plan.linearCleanup.requiredSchemaCheck.preferred, "issueArchive");
  assert.match(plan.linearCleanup.requiredSchemaCheck.command, /archive-guardrail\.ts --check-linear-schema/);
  assert.deepEqual(plan.candidates.slice(0, 2).map((issue) => issue.identifier), ["EVM-1", "EVM-2"]);
});
