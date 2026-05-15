import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.POKIT_PROFILE = "";

async function loadCycleCloseModule() {
  return import(`../scripts/cycle-close.ts?cacheBust=${Date.now()}`);
}

const cycle3Context = {
  source: "linear_upcoming",
  cycle: { id: "cycle-3", name: "Cycle 3" },
  issues: [
    { id: "issue-35", identifier: "EVM-35", title: "prioritizer ICE-lite 시범 구현", description: "skills/prioritizer/SKILL.md를 추가한다.", labels: ["pokit:criteria"], state: "Done" },
    { id: "issue-36", identifier: "EVM-36", title: "history-maintainer skill 추가", description: "낮은 모델이 completion evidence만 정리한다.", labels: ["pokit:criteria"], state: "Done" },
    { id: "issue-37", identifier: "EVM-37", title: "cycle-close 사이클 종료 초안 생성", description: "scripts/cycle-close.ts를 추가한다.", labels: ["pokit:prd"], state: "Done" },
    { id: "issue-38", identifier: "EVM-38", title: "changelog 후보 자동 추출", description: "release note에 들어갈 문장 초안이 생성된다.", labels: ["pokit:criteria"], state: "Done" },
    { id: "issue-39", identifier: "EVM-39", title: "history write conflict warning 구현", description: "conflict warning을 출력한다.", labels: ["pokit:criteria"], state: "Done" },
    { id: "issue-46", identifier: "EVM-46", title: "버전 관리 정책 정리", description: "docs/VERSIONING.md에 정본 규칙이 있다.", labels: ["pokit:criteria"], state: "Todo" },
    { id: "issue-47", identifier: "EVM-47", title: "테스트 보강", description: "내부 테스트만 보강한다.", labels: [], state: "Done" },
  ],
};

test("buildCycleCloseDraft separates completed, carry-over, approvals, artifacts, and changelog candidates", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-cycle-close-"));
  await mkdir(join(tempDir, "artifacts/sprints/Cycle-3"), { recursive: true });
  await writeFile(join(tempDir, "artifacts/sprints/Cycle-3/run-summary.md"), "# Run Summary\n");
  await writeFile(join(tempDir, "artifacts/sprints/Cycle-3/retro.md"), "# Retro\n");
  const { buildCycleCloseDraft } = await loadCycleCloseModule();

  const markdown = buildCycleCloseDraft({
    generatedAt: "2026-05-13T12:00:00+09:00",
    rootDir: tempDir,
    context: cycle3Context,
    historyWrites: [
      {
        status: "needs_approval",
        path: "memory/resume-brief.md",
        reason: "content hash changed; refusing stale resume-brief overwrite",
        currentHash: "current-hash",
        expectedHash: "expected-hash",
      },
    ],
  });

  assert.match(markdown, /# Cycle Close Draft: Cycle 3/);
  assert.match(markdown, /Completed issues: 6/);
  assert.match(markdown, /Carry-over candidates: 1/);
  assert.match(markdown, /Approval pending: 1/);
  assert.match(markdown, /EVM-46 버전 관리 정책 정리 \(Todo\)/);
  assert.match(markdown, /Needs Approval · memory\/resume-brief\.md · content hash changed/);
  assert.match(markdown, /Run Summary: `artifacts\/sprints\/Cycle-3\/run-summary\.md`/);
  assert.match(markdown, /Retro: `artifacts\/sprints\/Cycle-3\/retro\.md`/);
  assert.match(markdown, /EVM-38 changelog 후보 자동 추출 → Changelog 후보 자동 추출/);
  assert.doesNotMatch(markdown, /EVM-47 테스트 보강 →/);
  assert.match(markdown, /Decision-log Candidates/);
  assert.match(markdown, /External Write Preflight/);
  assert.match(markdown, /실행하면 Linear에서 바뀌는 것/);
  assert.match(markdown, /EVM-35 prioritizer ICE-lite 시범 구현 · Done 유지 · local evidence: completed in close draft/);
  assert.match(markdown, /EVM-46 버전 관리 정책 정리 · Todo → carry-over 유지 · reason: not completed locally/);
  assert.match(markdown, /idempotency key: `linear:cycle-close:cycle-3:done:EVM-35,EVM-36,EVM-37,EVM-38,EVM-39,EVM-47`/);
  assert.match(markdown, /실행 후 기대효과/);
  assert.match(markdown, /사용자 확인/);
  assert.match(markdown, /A\. ✅ 추천대로 실행/);
  assert.match(markdown, /B\. ✏️ 직접 입력하기/);
  assert.match(markdown, /A\/B로 선택해 주세요\./);
  assert.doesNotMatch(markdown, /1\. ✅ 추천대로 실행/);
  assert.doesNotMatch(markdown, /번호로 선택해 주세요\./);
  assert.match(markdown, /Cycle 3 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘/);
});

test("writeCycleCloseDraft writes artifacts/sprints/[cycle]/cycle-close.md", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-cycle-close-"));
  const { writeCycleCloseDraft } = await loadCycleCloseModule();

  const outputPath = writeCycleCloseDraft({
    generatedAt: "2026-05-13T12:00:00+09:00",
    rootDir: tempDir,
    context: cycle3Context,
  });

  assert.equal(outputPath, join(tempDir, "artifacts/sprints/Cycle-3/cycle-close.md"));
  const markdown = await readFile(outputPath, "utf8");
  assert.match(markdown, /# Cycle Close Draft: Cycle 3/);
  assert.match(markdown, /external_writes: none/);
});

test("buildCycleCloseDraft includes completion celebration and usage nudge when cycle is complete", async () => {
  const { buildCycleCloseDraft } = await loadCycleCloseModule();
  const completeContext = {
    ...cycle3Context,
    cycle: { ...cycle3Context.cycle, completedAt: "2026-05-13T15:00:00.000Z" },
    issues: cycle3Context.issues.filter((issue) => issue.state === "Done"),
  };

  const markdown = buildCycleCloseDraft({
    generatedAt: "2026-05-13T12:00:00+09:00",
    context: completeContext,
  });

  assert.match(markdown, /🎉 Cycle 3 완료!/);
  assert.match(markdown, /이번 Cycle 후 달라진 점/);
  assert.match(markdown, /기대효과 \/ 가설/);
  assert.match(markdown, /직접 사용해 볼 것/);
  assert.match(markdown, /새 세션 추천/);
  assert.match(markdown, /POKit 시작해줘/);
});

test("buildCycleCloseDraft shows Version Run release pending instead of completion before release gate", async () => {
  const { buildCycleCloseDraft } = await loadCycleCloseModule();
  const releasePendingContext = {
    ...cycle3Context,
    cycle: { ...cycle3Context.cycle, completedAt: null },
    issues: cycle3Context.issues.filter((issue) => issue.state === "Done"),
  };

  const markdown = buildCycleCloseDraft({
    generatedAt: "2026-05-13T12:00:00+09:00",
    context: releasePendingContext,
  });

  assert.match(markdown, /## Version Run Release Pending/);
  assert.match(markdown, /Version Run 작업은 완료됐지만 release gate가 아직 남아 있습니다/);
  assert.match(markdown, /Push \/ Tag \/ GitHub Release/);
  assert.doesNotMatch(markdown, /🎉 Cycle 3 완료!/);
  assert.doesNotMatch(markdown, /Cycle 3 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘/);
});

test("buildCycleCloseDraft accepts release evidence when completedAt is unavailable", async () => {
  const { buildCycleCloseDraft } = await loadCycleCloseModule();
  const context = {
    ...cycle3Context,
    cycle: {
      ...cycle3Context.cycle,
      completedAt: null,
      description: [
        "POKit operational completion after approved release gate.",
        "targetVersion: v0.4.2",
        "releaseUrl: https://github.com/example/repo/releases/tag/v0.4.2",
        "reason: 7/7 issues Done; v0.4.2 GitHub release published; release preflight passed.",
      ].join("\n"),
    },
    issues: cycle3Context.issues.map((issue) => ({ ...issue, state: "Done" })),
  };

  const markdown = buildCycleCloseDraft({
    context,
    completedAt: new Date("2026-05-13T12:00:00+09:00"),
  });

  assert.match(markdown, /🎉 Cycle 3 완료!/);
  assert.doesNotMatch(markdown, /Cycle Release Pending/);
});

test("buildCycleCloseDraft uses Linear cycle number in next actions", async () => {
  const { buildCycleCloseDraft } = await loadCycleCloseModule();

  const markdown = buildCycleCloseDraft({
    generatedAt: "2026-05-15T12:00:00+09:00",
    context: {
      source: "linear_active",
      cycle: { id: "cycle-10", name: "Hotfix v0.4.4: Cycle Number Display", number: 10 },
      issues: [
        { id: "issue-90", identifier: "POKIT-90", title: "Cycle number display", description: "todo", labels: ["pokit:criteria"], state: "Todo" },
      ],
    },
  });

  assert.match(markdown, /Cycle 10 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘/);
  assert.doesNotMatch(markdown, /Hotfix v0\.4\.4: Cycle Number Display 남은 Todo/);
});

test("buildAfterCycleCompleteMessage shows once per complete cycle state", async () => {
  const { buildAfterCycleCompleteMessage } = await loadCycleCloseModule();

  const first = buildAfterCycleCompleteMessage({
    context: {
      ...cycle3Context,
      cycle: { ...cycle3Context.cycle, completedAt: "2026-05-13T15:00:00.000Z" },
      issues: cycle3Context.issues.map((issue) => ({ ...issue, state: "Done" })),
    },
    runSummaryPath: "artifacts/sprints/Cycle-3/run-summary.md",
    retroPath: "artifacts/sprints/Cycle-3/retro.md",
  });

  assert.ok(first);
  assert.match(first.message, /🎉 Cycle 3 완료/);
  assert.match(first.message, /완료 7건/);
  assert.match(first.message, /Run Summary: `artifacts\/sprints\/Cycle-3\/run-summary\.md`/);
  assert.match(first.message, /Retro: `artifacts\/sprints\/Cycle-3\/retro\.md`/);

  const second = buildAfterCycleCompleteMessage({
    context: {
      ...cycle3Context,
      cycle: { ...cycle3Context.cycle, completedAt: "2026-05-13T15:00:00.000Z" },
      issues: cycle3Context.issues.map((issue) => ({ ...issue, state: "Done" })),
    },
    runSummaryPath: "artifacts/sprints/Cycle-3/run-summary.md",
    retroPath: "artifacts/sprints/Cycle-3/retro.md",
    previousCelebrationKey: first.stateKey,
  });

  assert.equal(second, null);
});

test("buildAfterCycleCompleteMessage waits for release gate before celebrating", async () => {
  const { buildAfterCycleCompleteMessage } = await loadCycleCloseModule();

  const message = buildAfterCycleCompleteMessage({
    context: {
      ...cycle3Context,
      cycle: { ...cycle3Context.cycle, completedAt: null },
      issues: cycle3Context.issues.map((issue) => ({ ...issue, state: "Done" })),
    },
    runSummaryPath: "artifacts/sprints/Cycle-3/run-summary.md",
    retroPath: "artifacts/sprints/Cycle-3/retro.md",
  });

  assert.equal(message, null);
});
