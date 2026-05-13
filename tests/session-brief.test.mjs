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

test("buildSessionBrief shows upcoming and backlog candidates when active cycle is operationally complete", async () => {
  const { buildBacklogDetail, buildSessionBrief } = await loadBriefModule();

  const context = {
    activeCycle: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        { id: "issue-18", identifier: "EVM-18", title: "Clean check", description: "done", labels: ["pokit:criteria"], state: "Completed" },
      ],
    },
    upcomingCycle: {
      source: "linear_upcoming",
      cycle: { id: "cycle-2", name: "Cycle 2", startsAt: "2026-05-13T00:00:00.000Z" },
      issues: [
        { id: "issue-32", identifier: "EVM-32", title: "Model tier", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-33", identifier: "EVM-33", title: "Resume brief", description: "compact", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-34", identifier: "EVM-34", title: "Session close", description: "script", labels: ["pokit:prd"], state: "Todo" },
      ],
    },
    backlogIssues: [
      { id: "issue-35", identifier: "EVM-35", title: "ICE-lite", description: "score", labels: ["pokit:criteria"], state: "Backlog" },
      { id: "issue-36", identifier: "EVM-36", title: "History maintainer", description: "skill", labels: ["pokit:prd"], state: "Backlog" },
    ],
    selected: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        { id: "issue-18", identifier: "EVM-18", title: "Clean check", description: "done", labels: ["pokit:criteria"], state: "Completed" },
      ],
    },
    fetchedAt: "2026-05-13T00:00:00.000Z",
  };

  const brief = buildSessionBrief({
    now: new Date("2026-05-13T09:00:00+09:00"),
    context,
  });

  assert.match(brief, /✅ Cycle 1 완료/);
  assert.match(brief, /🧺 다음 후보 \(Cycle 2/);
  assert.match(brief, /1\. EVM-32 Model tier · Todo · pokit:criteria/);
  assert.match(brief, /2\. EVM-33 Resume brief · Todo · pokit:criteria/);
  assert.match(brief, /3\. EVM-34 Session close · Todo · pokit:prd/);
  assert.match(brief, /🗂️ 백로그/);
  assert.match(brief, /- EVM-35 ICE-lite · Backlog · pokit:criteria/);
  assert.doesNotMatch(brief, /새 후보 issue를 백로그에 담기/);

  const backlogDetail = buildBacklogDetail({
    now: new Date("2026-05-13T09:00:00+09:00"),
    context,
  });
  assert.match(backlogDetail, /실제 Backlog 이슈/);
  assert.match(backlogDetail, /1\. EVM-35 ICE-lite · Backlog · pokit:criteria/);
  assert.match(backlogDetail, /2\. EVM-36 History maintainer · Backlog · pokit:prd/);
});

test("buildSessionBrief shows completed upcoming cycle instead of stale active cycle when upcoming cycle is done", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-13T09:00:00+09:00"),
    context: {
      activeCycle: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-1", identifier: "EVM-1", title: "old work", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      upcomingCycle: {
        source: "linear_upcoming",
        cycle: { id: "cycle-2", name: "Cycle 2", startsAt: "2026-05-19T00:00:00.000Z" },
        issues: [
          { id: "issue-32", identifier: "EVM-32", title: "Model tier", description: "done", labels: ["pokit:criteria"], state: "Done" },
          { id: "issue-33", identifier: "EVM-33", title: "Resume brief", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      backlogIssues: [
        { id: "issue-35", identifier: "EVM-35", title: "ICE-lite", description: "score", labels: ["pokit:criteria"], state: "Backlog" },
      ],
      selected: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-1", identifier: "EVM-1", title: "old work", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      fetchedAt: "2026-05-13T00:00:00.000Z",
    },
  });

  assert.match(brief, /📅 .* · Cycle 2/);
  assert.match(brief, /✅ Cycle 2 완료: Todo 0 · 진행 0 · 완료 2/);
  assert.match(brief, /✅ 최근 완료: EVM-33, EVM-32/);
  assert.doesNotMatch(brief, /✅ Cycle 1 완료/);
});

test("buildSessionBrief keeps active cycle candidates when active cycle still has remaining work", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-13T09:00:00+09:00"),
    context: {
      activeCycle: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-20", identifier: "EVM-20", title: "LLM-first", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
          { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        ],
      },
      upcomingCycle: {
        source: "linear_upcoming",
        cycle: { id: "cycle-2", name: "Cycle 2", startsAt: "2026-05-20T00:00:00.000Z" },
        issues: [
          { id: "issue-32", identifier: "EVM-32", title: "Model tier", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
        ],
      },
      backlogIssues: [
        { id: "issue-35", identifier: "EVM-35", title: "ICE-lite", description: "score", labels: ["pokit:criteria"], state: "Backlog" },
      ],
      selected: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-20", identifier: "EVM-20", title: "LLM-first", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
          { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        ],
      },
      fetchedAt: "2026-05-13T00:00:00.000Z",
    },
  });

  assert.match(brief, /📌 현재: Todo 1 · 진행 0 · 완료 1/);
  assert.match(brief, /1\. EVM-20 LLM-first · Todo · pokit:criteria/);
  assert.doesNotMatch(brief, /EVM-32 Model tier/);
  assert.doesNotMatch(brief, /✅ Cycle 1 완료/);
});

test("buildSessionBrief uses review-oriented wording when upcoming cycle starts in the future", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-13T09:00:00+09:00"),
    context: {
      activeCycle: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        ],
      },
      upcomingCycle: {
        source: "linear_upcoming",
        cycle: { id: "cycle-2", name: "Cycle 2", startsAt: "2026-05-20T00:00:00.000Z" },
        issues: [
          { id: "issue-32", identifier: "EVM-32", title: "Model tier", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
        ],
      },
      backlogIssues: [],
      selected: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        ],
      },
      fetchedAt: "2026-05-13T00:00:00.000Z",
    },
  });

  assert.match(brief, /시작 예정/);
  assert.match(brief, /👉 추천: 1번 검토/);
  assert.match(brief, /💬 실행: “1번 검토하고 다음 cycle 준비해줘”/);
});

test("buildSessionBrief recommends adding new backlog work only when there are no upcoming or backlog candidates", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-13T09:00:00+09:00"),
    context: {
      activeCycle: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        ],
      },
      backlogIssues: [],
      selected: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1" },
        issues: [
          { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        ],
      },
      fetchedAt: "2026-05-13T00:00:00.000Z",
    },
  });

  assert.match(brief, /👉 추천: 새 후보 issue를 백로그에 담기/);
  assert.match(brief, /💬 실행: “백로그 후보 정리해서 POKit 돌려줘”/);
});
