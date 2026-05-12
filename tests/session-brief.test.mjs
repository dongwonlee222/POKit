import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadBriefModule() {
  return import(`../scripts/session-brief.ts?cacheBust=${Date.now()}`);
}

test("buildSessionBrief renders compact dashboard with nudge", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-brief-"));
  await mkdir(join(tempDir, "artifacts/sprints/Cycle-1"), { recursive: true });
  await writeFile(join(tempDir, "artifacts/sprints/Cycle-1/2026-05-12-run-summary.md"), "summary");
  await writeFile(join(tempDir, "artifacts/sprints/Cycle-1/retro.md"), "retro");
  const { buildApprovalDetail, buildBacklogDetail, buildCandidateDetail, buildCycleDetail, buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-12T09:00:00+09:00"),
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-21", identifier: "EVM-21", title: "Team optional", description: "env", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-25", identifier: "EVM-25", title: "Brief", description: "dashboard", labels: ["pokit:prd"], state: "In Progress" },
        { id: "issue-20", identifier: "EVM-20", title: "LLM-first", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        { id: "issue-18", identifier: "EVM-18", title: "Clean check", description: "done", labels: ["pokit:criteria"], state: "Done" },
        { id: "issue-unlabeled", identifier: "EVM-26", title: "No label", description: "needs label", labels: [], state: "Todo" },
      ],
    },
  });

  assert.match(brief, /# POKit Brief/);
  assert.match(brief, /📌 현재: Todo 3 · 진행 1 · 완료 2/);
  assert.match(brief, /⚠️ 주의: 라벨 필요 1 · 확인 필요 0 · 승인 대기 1/);
  assert.match(brief, /🧺 다음 후보/);
  assert.match(brief, /1\. EVM-20 LLM-first · Todo · pokit:criteria/);
  assert.match(brief, /2\. EVM-21 Team optional · Todo · pokit:criteria/);
  assert.match(brief, /3\. EVM-26 No label · Todo · no-label/);
  assert.match(brief, /👉 추천: 1번, 2번, 3번을 다음 cycle에 담기/);
  assert.match(brief, /💬 실행: “1번, 2번, 3번 다음 cycle에 담고 POKit 돌려줘”/);
  assert.match(brief, /⚡ 빠른 명령/);
  assert.match(brief, /“1번 자세히 보여줘”/);
  assert.match(brief, /“backlog 자세히 보여줘”/);
  assert.match(brief, /✅ 최근 완료: EVM-19, EVM-18/);
  assert.match(brief, /Run Summary: artifacts\/sprints\/Cycle-1\/2026-05-12-run-summary\.md/);
  assert.match(brief, /Retro: artifacts\/sprints\/Cycle-1\/retro\.md/);

  const cycleDetail = buildCycleDetail({
    now: new Date("2026-05-12T09:00:00+09:00"),
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-21", identifier: "EVM-21", title: "Team optional", description: "env", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-25", identifier: "EVM-25", title: "Brief", description: "dashboard", labels: ["pokit:prd"], state: "In Progress" },
        { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
      ],
    },
  });
  assert.match(cycleDetail, /# POKit Cycle Detail/);
  assert.match(cycleDetail, /Todo\n1\. EVM-21 Team optional · Todo · pokit:criteria/);
  assert.match(cycleDetail, /In Progress\n1\. EVM-25 Brief · In Progress · pokit:prd/);
  assert.match(cycleDetail, /Done\n1\. EVM-19 Release · Done · pokit:prd/);

  const backlogDetail = buildBacklogDetail({
    now: new Date("2026-05-12T09:00:00+09:00"),
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-20", identifier: "EVM-20", title: "LLM-first", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-unlabeled", identifier: "EVM-26", title: "No label", description: "needs label", labels: [], state: "Todo" },
      ],
    },
  });
  assert.match(backlogDetail, /# POKit Backlog Detail/);
  assert.match(backlogDetail, /생성 후보\n1\. EVM-20 LLM-first · Todo · pokit:criteria → criteria · artifacts\/criteria\/EVM-20\.md/);
  assert.match(backlogDetail, /라벨 필요\n1\. EVM-26 No label · Todo · no-label → pokit:criteria 제안/);
  assert.match(backlogDetail, /승인 대기\n1\. Suggest pokit:criteria for EVM-26/);

  const approvalDetail = buildApprovalDetail({
    now: new Date("2026-05-12T09:00:00+09:00"),
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-unlabeled", identifier: "EVM-26", title: "No label", description: "needs label", labels: [], state: "Todo" },
      ],
    },
  });
  assert.match(approvalDetail, /# POKit Approval Detail/);
  assert.match(approvalDetail, /승인 대기\n1\. Suggest pokit:criteria for EVM-26/);

  const candidateDetail = buildCandidateDetail({
    now: new Date("2026-05-12T09:00:00+09:00"),
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-21", identifier: "EVM-21", title: "Team optional", description: "env detail", labels: ["pokit:criteria"], state: "Todo" },
      ],
    },
  }, 1);
  assert.match(candidateDetail, /# POKit Candidate Detail/);
  assert.match(candidateDetail, /1\. EVM-21 Team optional · Todo · pokit:criteria/);
  assert.match(candidateDetail, /env detail/);
});
