import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.POKIT_PROFILE = "";

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
  assert.match(brief, /POKit 진행도\n\[█░░░░░░░░░\] 1\/10 · 현재: 시작 브리프/);
  assert.match(brief, /4\. 작업 Gate 확인\s+⏳/);
  assert.match(brief, /9\. 사용자 승인\s+⏳/);
  assert.match(brief, /📌 현재: Todo 3 · 진행 1 · 완료 2/);
  assert.match(brief, /⚠️ 주의: 라벨 필요 1 · 확인 필요 0 · 승인 대기 1/);
  assert.match(brief, /🧺 다음 후보/);
  assert.match(brief, /1\. EVM-20 LLM-first · Todo · pokit:criteria/);
  assert.match(brief, /2\. EVM-21 Team optional · Todo · pokit:criteria/);
  assert.match(brief, /3\. EVM-26 No label · Todo · no-label/);
  assert.match(brief, /👉 추천: Cycle 1 남은 Todo 전체 진행/);
  assert.match(brief, /💬 실행: “Cycle 1 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘”/);
  assert.doesNotMatch(brief, /⚡ 빠른 명령/);
  assert.doesNotMatch(brief, /“1번 자세히 보여줘”/);
  assert.match(brief, /“Cycle 1 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘”/);
  assert.doesNotMatch(brief, /“backlog 자세히 보여줘”/);
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
  assert.match(backlogDetail, /Problem\/Error Review 메모\n- 없음/);

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

test("buildBacklogDetail includes local Problem/Error Review backlog memos", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-backlog-problem-review-"));
  await mkdir(join(tempDir, "artifacts/backlog"), { recursive: true });
  await writeFile(
    join(tempDir, "artifacts/backlog/linear-cleanup-schema-check-problem-review.md"),
    "# 🚨 Problem / Error Review: Linear cleanup schema check 누락\n",
  );
  const { buildBacklogDetail } = await loadBriefModule();

  const backlogDetail = buildBacklogDetail({
    now: new Date("2026-05-12T09:00:00+09:00"),
    rootDir: tempDir,
    context: {
      source: "team_backlog",
      cycle: { id: "team-backlog", name: "Team Backlog" },
      issues: [],
    },
  });

  assert.match(backlogDetail, /Problem\/Error Review 메모/);
  assert.match(backlogDetail, /1\. Linear Cleanup Schema Check · artifacts\/backlog\/linear-cleanup-schema-check-problem-review\.md/);
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

  assert.match(brief, /📅 .* · Cycle 2/);
  assert.match(brief, /📌 현재: Todo 3 · 진행 0 · 완료 0/);
  assert.match(brief, /🧺 다음 후보 \(Cycle 2/);
  assert.match(brief, /1\. EVM-32 Model tier · Todo · pokit:criteria/);
  assert.match(brief, /2\. EVM-33 Resume brief · Todo · pokit:criteria/);
  assert.match(brief, /3\. EVM-34 Session close · Todo · pokit:prd/);
  assert.match(brief, /👉 추천: Cycle 2 남은 Todo 전체 진행/);
  assert.match(brief, /💬 실행: “Cycle 2 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘”/);
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

test("buildCycleDetail shows upcoming work surface after active cycle is complete", async () => {
  const { buildCycleDetail } = await loadBriefModule();

  const detail = buildCycleDetail({
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
        cycle: { id: "cycle-3", name: "Cycle 3", startsAt: "2026-05-26T00:00:00.000Z" },
        issues: [
          { id: "issue-35", identifier: "EVM-35", title: "Prioritizer", description: "todo", labels: ["pokit:criteria"], state: "Todo" },
        ],
      },
      backlogIssues: [],
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

  assert.match(detail, /📅 .* · Cycle 3/);
  assert.match(detail, /Todo\n1\. EVM-35 Prioritizer · Todo · pokit:criteria/);
  assert.doesNotMatch(detail, /EVM-1 old work/);
});

test("buildCycleDetail groups sub-issues under their parent issues", async () => {
  const { buildCycleDetail } = await loadBriefModule();

  const detail = buildCycleDetail({
    now: new Date("2026-05-14T09:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-5", name: "Cycle 5" },
      issues: [
        { id: "issue-54", identifier: "POKIT-54", title: "Visual layer", description: "parent", labels: ["pokit:prd"], state: "Todo" },
        { id: "issue-57", identifier: "POKIT-57", title: "Brief roadmap position output", description: "child", labels: ["pokit:prd"], state: "Todo", parent: { id: "issue-54", identifier: "POKIT-54" } },
        { id: "issue-58", identifier: "POKIT-58", title: "Before/After artifact", description: "child", labels: ["pokit:prd"], state: "Done", parent: { id: "issue-54", identifier: "POKIT-54" } },
        { id: "issue-55", identifier: "POKIT-55", title: "Signal watch", description: "parent", labels: ["pokit:prd"], state: "Todo" },
      ],
    },
  });

  assert.match(detail, /Todo\n1\. POKIT-54 Visual layer · Todo · pokit:prd\n   - POKIT-57 Brief roadmap position output · Todo · pokit:prd\n   - POKIT-58 Before\/After artifact · Done · pokit:prd\n2\. POKIT-55 Signal watch · Todo · pokit:prd/);
});

test("buildSessionBrief renders ASCII parent progress for cycle issues", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-14T09:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-5f", name: "Cycle 5 Follow-up" },
      issues: [
        { id: "issue-71", identifier: "POKIT-71", title: "운영 규칙 보강", description: "parent", labels: ["pokit:prd"], state: "In Progress" },
        { id: "issue-74", identifier: "POKIT-74", title: "정체성 적합성 체크 규칙 (decomposition-playbook.md)", description: "child", labels: ["pokit:prd"], state: "Done", parent: { id: "issue-71", identifier: "POKIT-71" } },
        { id: "issue-75", identifier: "POKIT-75", title: "발견 브리프 적용 기준 (decomposition-playbook.md)", description: "child", labels: ["pokit:prd"], state: "Todo", parent: { id: "issue-71", identifier: "POKIT-71" } },
        { id: "issue-73", identifier: "POKIT-73", title: "대화형 ASCII 시각화", description: "parent", labels: ["pokit:prd"], state: "Todo" },
      ],
    },
  });

  assert.match(brief, /📊 진행도/);
  assert.match(brief, /POKIT-71 운영 규칙 보강\s+\[█░\] 1\/2/);
  assert.match(brief, /POKIT-73 대화형 ASCII 시각화\s+\[░\] 0\/1/);
});

test("buildSessionBrief renders Focus Run checklist groups from Linear labels", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-15T09:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-6", name: "Cycle 6: Focus Run Visual Grouping", number: 6 },
      issues: [
        { id: "issue-103", identifier: "POKIT-103", title: "Linear view rules", description: "done", labels: ["pokit:prd", "Focus Run / 6.1"], state: "Done" },
        { id: "issue-107", identifier: "POKIT-107", title: "Numbering rules", description: "done", labels: ["pokit:criteria", "Focus Run / 6.1"], state: "Done" },
        { id: "issue-104", identifier: "POKIT-104", title: "Brief checklist", description: "todo", labels: ["pokit:criteria", "Focus Run / 6.2"], state: "Todo" },
        { id: "issue-105", identifier: "POKIT-105", title: "Status rules", description: "started", labels: ["pokit:criteria", "Focus Run / 6.2"], state: "In Progress" },
      ],
    },
  });

  assert.match(brief, /🎯 Focus Runs/);
  assert.match(brief, /6\.1 \[완료\]/);
  assert.match(brief, /\[x\] POKIT-103 Linear view rules/);
  assert.match(brief, /\[x\] POKIT-107 Numbering rules/);
  assert.match(brief, /✅ 6\.1 완료/);
  assert.match(brief, /6\.2 \[진행\]/);
  assert.match(brief, /\[ \] POKIT-104 Brief checklist/);
  assert.match(brief, /\[ \] POKIT-105 Status rules/);
  assert.match(brief, /진행도 \[░░\] 0\/2/);
});

test("buildSessionBrief renders due date focus summary", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-15T09:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-6", name: "Cycle 6", number: 6 },
      issues: [
        { id: "issue-104", identifier: "POKIT-104", title: "Brief checklist", description: "today", labels: ["pokit:criteria"], state: "Todo", dueDate: "2026-05-15" },
        { id: "issue-105", identifier: "POKIT-105", title: "Status rules", description: "overdue", labels: ["pokit:criteria"], state: "Todo", dueDate: "2026-05-14" },
        { id: "issue-106", identifier: "POKIT-106", title: "Due date rules", description: "next", labels: ["pokit:criteria"], state: "Todo", dueDate: "2026-05-20" },
      ],
    },
  });

  assert.match(brief, /🗓️ 오늘 보기/);
  assert.match(brief, /due Today: POKIT-104/);
  assert.match(brief, /overdue: POKIT-105/);
  assert.match(brief, /next: POKIT-106/);
});

test("buildFlowDetail shows release inside the Cycle loop", async () => {
  const { buildFlowDetail } = await loadBriefModule();

  const detail = buildFlowDetail({
    now: new Date("2026-05-14T12:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-5", name: "Cycle 5" },
      issues: [],
    },
  });

  assert.match(detail, /POKit Flow Map/);
  assert.match(detail, /읽는 법/);
  assert.match(detail, /Start/);
  assert.match(detail, /Brief/);
  assert.match(detail, /Backlog/);
  assert.match(detail, /사용자 아이디어를 후보 작업으로 정리/);
  assert.match(detail, /Push \/ Tag \/ GitHub Release/);
  assert.match(detail, /외부 사용자가 받을 수 있게 배포/);
  assert.match(detail, /Cycle Complete/);
});

test("readDetailArg accepts hooks detail instead of silently falling back", async () => {
  const { readDetailArg } = await loadBriefModule();

  assert.equal(readDetailArg(["--detail", "hooks"]), "hooks");
});

test("buildHookDetail shows hooks and enforcement metadata", async () => {
  const { buildHookDetail } = await loadBriefModule();

  const detail = buildHookDetail({
    now: new Date("2026-05-14T12:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-5", name: "Cycle 5" },
      issues: [],
    },
  });

  assert.match(detail, /POKit Hook Map/);
  assert.match(detail, /before_public_release/);
  assert.match(detail, /enforcement: script/);
  assert.match(detail, /scripts\/release-preflight\.ts/);
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
  assert.match(brief, /👉 추천: Cycle 2 남은 Todo 전체 검토/);
  assert.match(brief, /💬 실행: “Cycle 2 남은 Todo 전체를 검토하고 다음 Cycle 준비해줘”/);
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

  assert.match(brief, /👉 추천: 새 후보를 Backlog에 정리/);
  assert.match(brief, /💬 실행: “새 후보를 Backlog에 정리하고 다음 Cycle 후보를 묶어줘”/);
});

test("buildSessionBrief shows backlog candidates when only an empty upcoming cycle exists", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-14T09:00:00+09:00"),
    context: {
      upcomingCycle: {
        source: "linear_upcoming",
        cycle: { id: "cycle-5", name: "Cycle 5", startsAt: "2026-05-14T00:00:00.000Z" },
        issues: [],
      },
      backlogIssues: [
        { id: "issue-53", identifier: "POKIT-53", title: "Brief fallback", description: "show backlog", labels: ["pokit:criteria"], state: "Backlog" },
        { id: "issue-54", identifier: "POKIT-54", title: "Visual layer", description: "show flow", labels: ["pokit:prd"], state: "Backlog" },
      ],
      selected: {
        source: "linear_upcoming",
        cycle: { id: "cycle-5", name: "Cycle 5", startsAt: "2026-05-14T00:00:00.000Z" },
        issues: [],
      },
      fetchedAt: "2026-05-14T00:00:00.000Z",
    },
  });

  assert.match(brief, /📅 .* · Cycle 5/);
  assert.match(brief, /✅ Cycle 5 완료: Todo 0 · 진행 0 · 완료 0/);
  assert.match(brief, /🧺 다음 후보/);
  assert.match(brief, /1\. POKIT-53 Brief fallback · Backlog · pokit:criteria/);
  assert.match(brief, /2\. POKIT-54 Visual layer · Backlog · pokit:prd/);
  assert.match(brief, /👉 추천: Backlog 후보를 다음 Cycle 후보로 묶기/);
  assert.match(brief, /💬 실행: “Backlog 후보를 다음 Cycle 후보로 묶어줘”/);
  assert.doesNotMatch(brief, /새 후보를 Backlog에 정리/);
});

test("buildSessionBrief shows compact roadmap position for roadmap cycles", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-14T09:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-5", name: "Cycle 5: PO Signal Watch -> Backlog & Share" },
      issues: [
        { id: "issue-55", identifier: "POKIT-55", title: "Signal watch", description: "define flow", labels: ["pokit:prd"], state: "Todo" },
      ],
    },
  });

  assert.match(brief, /Roadmap: Cycle 4 → \[Cycle 5\] → Cycle 6/);
});

test("buildSessionBrief uses Linear cycle number as the canonical cycle label", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-15T09:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-10", name: "Hotfix v0.4.4: Cycle Number Display", number: 10 },
      issues: [
        { id: "issue-90", identifier: "POKIT-90", title: "Cycle number display", description: "hotfix", labels: ["pokit:criteria"], state: "Todo" },
      ],
    },
  });

  assert.match(brief, /📅 .* · Cycle 10 · Hotfix v0\.4\.4: Cycle Number Display/);
  assert.match(brief, /Roadmap: Cycle 9 → \[Cycle 10\] → Cycle 11/);
  assert.match(brief, /👉 추천: Cycle 10 남은 Todo 전체 진행/);
  assert.match(brief, /💬 실행: “Cycle 10 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘”/);
});

test("buildSessionBrief warns when cycle name contains a different cycle number", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-15T09:00:00+09:00"),
    context: {
      source: "linear_upcoming",
      cycle: { id: "cycle-6", name: "Cycle 5 Follow-up: Discovery Gate & Visual Communication", number: 6 },
      issues: [
        { id: "issue-71", identifier: "POKIT-71", title: "Follow-up rules", description: "done", labels: ["pokit:prd"], state: "Done" },
      ],
    },
  });

  assert.match(brief, /📅 .* · Cycle 6 · Cycle 5 Follow-up: Discovery Gate & Visual Communication/);
  assert.match(brief, /⚠️ Cycle 번호 확인: Linear number 6 · name contains Cycle 5/);
  assert.match(brief, /Roadmap: Cycle 5 → \[Cycle 6\] → Cycle 7/);
});

test("buildSessionBrief uses Operating Cycle order ahead of Linear backing number", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-15T09:00:00+09:00"),
    context: {
      source: "linear_upcoming",
      cycle: {
        id: "cycle-8",
        name: "POKit Operating Cycle 1: Memory MVP Foundation",
        number: 8,
        startsAt: "2026-05-31T15:00:00.000Z",
      },
      issues: [
        { id: "issue-109", identifier: "POKIT-109", title: "POKit Memory MVP", description: "memory", labels: ["pokit:prd"], state: "Todo" },
      ],
    },
  });

  assert.match(brief, /📅 .* · POKit Operating Cycle 1: Memory MVP Foundation/);
  assert.match(brief, /Roadmap: \[Operating Cycle 1\] → Operating Cycle 2/);
  assert.doesNotMatch(brief, /Cycle 번호 확인/);
  assert.doesNotMatch(brief, /Cycle 8 · POKit Operating Cycle 1/);
  assert.match(brief, /👉 추천: Operating Cycle 1 남은 Todo 전체 진행/);
  assert.match(brief, /💬 실행: “Operating Cycle 1 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘”/);
});
