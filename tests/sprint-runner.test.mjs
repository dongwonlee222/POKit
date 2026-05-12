import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadRunnerModule() {
  return import(`../scripts/sprint-runner.ts?cacheBust=${Date.now()}`);
}

test("buildSprintDryRunSummary groups generated, needs-label, clarification, and approval items", async () => {
  const { buildSprintDryRunSummary } = await loadRunnerModule();

  const result = buildSprintDryRunSummary({
    generatedAt: "2026-05-12T12:00:00+09:00",
    context: {
      source: "linear_active",
      cycle: {
        id: "cycle-1",
        name: "Cycle 1",
        number: 1,
        startsAt: "2026-05-11T15:00:00.000Z",
        endsAt: "2026-05-18T15:00:00.000Z",
      },
      issues: [
        {
          id: "issue-prd",
          identifier: "EVM-10",
          title: "결제 실패 사유 안내",
          description: "고객이 다음 행동을 알 수 있게 한다.",
          labels: ["pokit:prd"],
          state: "Todo",
        },
        {
          id: "issue-criteria",
          identifier: "EVM-11",
          title: "State Brief 표시",
          description: "세션 시작 시 cycle 상태를 보여준다.",
          labels: ["pokit:criteria"],
          state: "Todo",
        },
        {
          id: "issue-unlabeled",
          identifier: "EVM-12",
          title: "알림 설정 개선",
          description: "사용자가 알림을 고르게 한다.",
          labels: [],
          state: "Todo",
        },
        {
          id: "issue-unclear",
          identifier: "EVM-13",
          title: "정책 개선",
          labels: ["pokit:prd"],
          state: "Todo",
        },
        {
          id: "issue-done",
          identifier: "EVM-14",
          title: "완료된 보안 문서",
          description: "이미 완료된 issue다.",
          labels: ["pokit:criteria"],
          state: "Done",
        },
      ],
    },
  });

  assert.equal(result.generated.length, 2);
  assert.equal(result.skipped[0].issue.identifier, "EVM-14");
  assert.equal(result.needsLabel[0].issue.identifier, "EVM-12");
  assert.equal(result.needsClarification[0].issue.identifier, "EVM-13");
  assert.equal(result.needsApproval[0].idempotencyKey, "linear:comment:EVM-12:label-suggestion");
  assert.match(result.markdown, /## 1\. AI가 하지 않은 것/);
  assert.match(result.markdown, /EVM-14: Issue state is Done/);
  assert.match(result.markdown, /EVM-10: `artifacts\/prds\/EVM-10\.md`/);
  assert.match(result.markdown, /EVM-11: `artifacts\/criteria\/EVM-11\.md`/);
  assert.match(result.markdown, /EVM-12 알림 설정 개선/);
  assert.match(result.markdown, /idempotencyKey: `linear:comment:EVM-12:label-suggestion`/);
  assert.doesNotMatch(result.markdown, /applyCreateIssue/);
});

test("buildSprintDryRunSummary handles empty cycle without external writes", async () => {
  const { buildSprintDryRunSummary } = await loadRunnerModule();

  const result = buildSprintDryRunSummary({
    generatedAt: "2026-05-12T12:00:00+09:00",
    context: {
      source: "linear_active",
      cycle: {
        id: "cycle-empty",
        name: "Cycle 1",
      },
      issues: [],
    },
  });

  assert.equal(result.generated.length, 0);
  assert.equal(result.needsApproval.length, 0);
  assert.match(result.markdown, /Cycle issue가 없음/);
  assert.match(result.markdown, /Linear\/GitHub 외부 write를 실행하지 않음/);
});

test("writeArtifactDrafts creates PRD and criteria drafts with content hash", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-artifacts-"));
  const { attachArtifactWriteResult, buildSprintDryRunSummary, writeArtifactDrafts } = await loadRunnerModule();
  const summary = buildSprintDryRunSummary({
    generatedAt: "2026-05-12T12:00:00+09:00",
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        {
          id: "issue-prd",
          identifier: "EVM-10",
          title: "결제 실패 사유 안내",
          description: "고객이 다음 행동을 알 수 있게 한다.\n\nPOKit labels requested: pokit:prd\n\nPOKit idempotency key: linear:create_issue:test",
          labels: ["pokit:prd"],
        },
        {
          id: "issue-criteria",
          identifier: "EVM-11",
          title: "State Brief 표시",
          description: "세션 시작 시 cycle 상태를 보여준다.",
          labels: ["pokit:criteria"],
        },
      ],
    },
  });

  const result = writeArtifactDrafts(summary, { rootDir: tempDir });

  assert.deepEqual(result.written.sort(), [
    "artifacts/criteria/EVM-11.md",
    "artifacts/prds/EVM-10.md",
  ]);
  const prd = await readFile(join(tempDir, "artifacts/prds/EVM-10.md"), "utf8");
  const criteria = await readFile(join(tempDir, "artifacts/criteria/EVM-11.md"), "utf8");
  assert.match(prd, /artifact_type: prd/);
  assert.match(prd, /content_hash: [a-f0-9]{64}/);
  assert.match(prd, /# PRD Draft: 결제 실패 사유 안내/);
  assert.doesNotMatch(prd, /POKit idempotency key/);
  assert.match(criteria, /artifact_type: acceptance_criteria/);
  assert.match(criteria, /# Acceptance Criteria Draft: State Brief 표시/);

  const updatedSummary = attachArtifactWriteResult(summary, result);
  assert.match(updatedSummary.markdown, /## 7\. Artifact Write Result/);
  assert.match(updatedSummary.markdown, /`artifacts\/prds\/EVM-10\.md`/);
  assert.match(updatedSummary.markdown, /needs approval:\n  - 없음/);
});

test("writeArtifactDrafts does not overwrite edited artifact when hash changed", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-artifacts-"));
  const { buildSprintDryRunSummary, writeArtifactDrafts } = await loadRunnerModule();
  const summary = buildSprintDryRunSummary({
    generatedAt: "2026-05-12T12:00:00+09:00",
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        {
          id: "issue-prd",
          identifier: "EVM-10",
          title: "결제 실패 사유 안내",
          description: "고객이 다음 행동을 알 수 있게 한다.",
          labels: ["pokit:prd"],
        },
      ],
    },
  });

  writeArtifactDrafts(summary, { rootDir: tempDir });
  await writeFile(join(tempDir, "artifacts/prds/EVM-10.md"), "---\ncontent_hash: edited\n---\n\nhuman edit\n");
  const result = writeArtifactDrafts(summary, { rootDir: tempDir });

  assert.deepEqual(result.written, []);
  assert.equal(result.needsApproval[0].path, "artifacts/prds/EVM-10.md");
  assert.equal(existsSync(join(tempDir, "artifacts/prds/EVM-10.md")), true);
});
