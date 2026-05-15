import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadSessionCloseModule() {
  return import(`../scripts/session-close.ts?cacheBust=${Date.now()}`);
}

const cycle2Context = {
  source: "linear_upcoming",
  cycle: { id: "cycle-2", name: "Cycle 2" },
  issues: [
    { id: "issue-32", identifier: "EVM-32", title: "model-tier policy 문서화", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
    { id: "issue-33", identifier: "EVM-33", title: "resume-brief compact contract 강화", description: "memory", labels: ["pokit:criteria"], state: "Todo" },
    { id: "issue-34", identifier: "EVM-34", title: "session-close 종료 리포트 스크립트 구현", description: "script", labels: ["pokit:prd"], state: "In Progress" },
    { id: "issue-41", identifier: "EVM-41", title: "Session Brief working target 개선", description: "done", labels: ["pokit:prd"], state: "Done" },
  ],
};

test("buildSessionCloseReport renders grouped Cycle-level completion report", async () => {
  const { buildSessionCloseReport } = await loadSessionCloseModule();

  const report = buildSessionCloseReport({
    now: new Date("2026-05-13T12:00:00+09:00"),
    context: cycle2Context,
    completed: ["EVM-41"],
    verification: [
      { command: "node --test", status: "passed", summary: "9 tests passed" },
    ],
  });

  assert.match(report, /# POKit 완료보고/);
  assert.match(report, /✅ 완료한 것/);
  assert.match(report, /EVM-41 Session Brief working target 개선 · Done/);
  assert.match(report, /⏳ 아직 안 한 것 \/ 승인 대기/);
  assert.match(report, /EVM-32 model-tier policy 문서화 · Todo · Cycle 2 남은 Todo/);
  assert.match(report, /EVM-33 resume-brief compact contract 강화 · Todo · Cycle 2 남은 Todo/);
  assert.match(report, /EVM-34 session-close 종료 리포트 스크립트 구현 · In Progress · Cycle 2 남은 Todo/);
  assert.match(report, /🧪 검증 결과/);
  assert.match(report, /node --test · passed · 9 tests passed/);
  assert.match(report, /👉 다음에 사용자가 할 말 한 줄/);
  assert.match(report, /🧭 다음 실제 결정/);
  assert.match(report, /로컬에서 끝난 것: EVM-41/);
  assert.match(report, /repo 밖에 남은 것: EVM-32, EVM-33, EVM-34/);
  assert.match(report, /필요한 승인\/행동: Cycle 2 남은 Todo 전체를 계속 진행할지 결정/);
  assert.match(report, /Cycle 2 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘/);
  assert.doesNotMatch(report, /커밋해줘|Done 처리해줘|테스트 돌려줘/);
});

test("buildSessionCloseReport surfaces history write conflict warnings as Needs Approval", async () => {
  const { buildSessionCloseReport } = await loadSessionCloseModule();

  const report = buildSessionCloseReport({
    now: new Date("2026-05-13T12:00:00+09:00"),
    context: cycle2Context,
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

  assert.match(report, /⏳ 아직 안 한 것 \/ 승인 대기/);
  assert.match(report, /Needs Approval · memory\/resume-brief\.md · content hash changed; refusing stale resume-brief overwrite/);
  assert.match(report, /🧪 검증 결과/);
  assert.match(report, /history write conflict warning · failed · memory\/resume-brief\.md overwrite blocked/);
  assert.match(report, /🔎 실행 전 확인/);
  assert.match(report, /실행하면 바뀌는 것: memory\/resume-brief\.md 재생성 또는 수동 병합/);
  assert.match(report, /판단 근거: content hash changed; refusing stale resume-brief overwrite/);
  assert.match(report, /실행 후 기대효과/);
  assert.match(report, /사용자 확인/);
  assert.match(report, /A\. ✅ 추천대로 실행/);
  assert.match(report, /B\. ✏️ 직접 입력하기/);
  assert.match(report, /A\/B로 선택해 주세요\./);
  assert.doesNotMatch(report, /1\. ✅ 추천대로 실행/);
  assert.doesNotMatch(report, /번호로 선택해 주세요\./);
});

test("buildSessionCloseReport stays on upcoming Cycle when active Cycle is already complete", async () => {
  const { buildSessionCloseReport } = await loadSessionCloseModule();

  const report = buildSessionCloseReport({
    now: new Date("2026-05-13T12:00:00+09:00"),
    context: {
      activeCycle: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1", completedAt: "2026-05-13T15:00:00.000Z" },
        issues: [
          { id: "issue-1", identifier: "EVM-1", title: "old work", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      upcomingCycle: {
        source: "linear_upcoming",
        cycle: { id: "cycle-2", name: "Cycle 2", completedAt: "2026-05-13T16:00:00.000Z" },
        issues: [
          { id: "issue-32", identifier: "EVM-32", title: "model-tier policy 문서화", description: "done", labels: ["pokit:criteria"], state: "Done" },
          { id: "issue-33", identifier: "EVM-33", title: "resume-brief compact contract 강화", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      backlogIssues: [],
      selected: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1", completedAt: "2026-05-13T15:00:00.000Z" },
        issues: [
          { id: "issue-1", identifier: "EVM-1", title: "old work", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      fetchedAt: "2026-05-13T03:00:00.000Z",
    },
  });

  assert.match(report, /📅 .* · Cycle 2/);
  assert.match(report, /🎉 Cycle 2 완료!/);
  assert.match(report, /이번 Cycle 후 달라진 점/);
  assert.match(report, /기대효과 \/ 가설/);
  assert.match(report, /직접 사용해 볼 것/);
  assert.match(report, /새 세션 추천/);
  assert.match(report, /POKit 시작해줘/);
  assert.match(report, /EVM-32 model-tier policy 문서화 · Done/);
  assert.match(report, /Cycle 2 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘/);
  assert.doesNotMatch(report, /EVM-1 old work/);
});

test("buildSessionCloseReport keeps all-done active Cycle release pending until release gate completes", async () => {
  const { buildSessionCloseReport } = await loadSessionCloseModule();

  const report = buildSessionCloseReport({
    now: new Date("2026-05-13T12:00:00+09:00"),
    context: {
      activeCycle: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1", completedAt: null },
        issues: [
          { id: "issue-1", identifier: "EVM-1", title: "release pending work", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      upcomingCycle: {
        source: "linear_upcoming",
        cycle: { id: "cycle-2", name: "Cycle 2" },
        issues: [
          { id: "issue-32", identifier: "EVM-32", title: "next work", description: "todo", labels: ["pokit:criteria"], state: "Todo" },
        ],
      },
      backlogIssues: [],
      selected: {
        source: "linear_active",
        cycle: { id: "cycle-1", name: "Cycle 1", completedAt: null },
        issues: [
          { id: "issue-1", identifier: "EVM-1", title: "release pending work", description: "done", labels: ["pokit:criteria"], state: "Done" },
        ],
      },
      fetchedAt: "2026-05-13T03:00:00.000Z",
    },
  });

  assert.match(report, /📅 .* · Cycle 1/);
  assert.match(report, /Cycle 작업은 완료됐지만 release gate가 아직 남아 있습니다/);
  assert.match(report, /Cycle 1 release preflight부터 완료 조건까지 이어가줘/);
  assert.doesNotMatch(report, /🎉 Cycle 1 완료!/);
  assert.doesNotMatch(report, /EVM-32 next work/);
});

test("buildSessionCloseReport treats release evidence as Cycle completion when completedAt is unavailable", async () => {
  const { buildSessionCloseReport } = await loadSessionCloseModule();

  const report = buildSessionCloseReport({
    now: new Date("2026-05-15T12:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: {
        id: "cycle-1",
        name: "Cycle 1",
        completedAt: null,
        description: [
          "POKit operational completion after approved release gate.",
          "targetVersion: v0.4.2",
          "releaseUrl: https://github.com/example/repo/releases/tag/v0.4.2",
          "reason: 5/5 issues Done; v0.4.2 GitHub release published; release preflight passed.",
        ].join("\n"),
      },
      issues: [
        { id: "issue-1", identifier: "EVM-1", title: "release evidence work", description: "done", labels: ["pokit:criteria"], state: "Done" },
      ],
    },
  });

  assert.match(report, /🎉 Cycle 1 완료!/);
  assert.match(report, /Cycle 1 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘/);
  assert.doesNotMatch(report, /Cycle Release Pending/);
});

test("buildSessionCloseReport uses Linear cycle number in next actions", async () => {
  const { buildSessionCloseReport } = await loadSessionCloseModule();

  const report = buildSessionCloseReport({
    now: new Date("2026-05-15T12:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-10", name: "Hotfix v0.4.4: Cycle Number Display", number: 10 },
      issues: [
        { id: "issue-90", identifier: "POKIT-90", title: "Cycle number display", description: "todo", labels: ["pokit:criteria"], state: "Todo" },
      ],
    },
  });

  assert.match(report, /📅 .* · Hotfix v0\.4\.4: Cycle Number Display/);
  assert.match(report, /Cycle 10 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘/);
  assert.doesNotMatch(report, /Hotfix v0\.4\.4: Cycle Number Display 남은 Todo/);
});

test("buildResumeBrief keeps compact contract and Cycle-level next action", async () => {
  const { buildResumeBrief, validateResumeBriefContract } = await loadSessionCloseModule();

  const brief = buildResumeBrief({
    now: new Date("2026-05-13T12:00:00+09:00"),
    context: cycle2Context,
    verification: [
      { command: "node --test", status: "failed", summary: "session-close missing" },
    ],
  });

  assert.match(brief, /# Resume Brief/);
  assert.match(brief, /## 어디서 멈췄나/);
  assert.match(brief, /## 다음에 무엇을 하나/);
  assert.match(brief, /## 차단된 것/);
  assert.match(brief, /## 참조/);
  assert.match(brief, /Cycle 2 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘/);
  assert.ok(Buffer.byteLength(brief, "utf8") <= 2048);
  assert.deepEqual(validateResumeBriefContract(brief), { valid: true, reasons: [] });
});

test("validateNextAction rejects mechanical and issue-only wording unless explicitly selected", async () => {
  const { validateNextAction } = await loadSessionCloseModule();

  assert.deepEqual(validateNextAction("커밋해줘"), {
    valid: false,
    reason: "mechanical next action",
  });
  assert.deepEqual(validateNextAction("EVM-43 문서 정리 변경 커밋해줘"), {
    valid: false,
    reason: "mechanical next action",
  });
  assert.deepEqual(validateNextAction("EVM-43 문서 중복/정본 정리 시작해줘"), {
    valid: false,
    reason: "issue-only next action without explicit selection",
  });
  assert.deepEqual(validateNextAction("EVM-43 문서 중복/정본 정리 시작해줘", { explicitIssueSelection: true }), {
    valid: true,
    reason: null,
  });
  assert.deepEqual(validateNextAction("Cycle 2 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘"), {
    valid: true,
    reason: null,
  });
});

test("writeResumeBrief refuses stale overwrite when expected hash changed", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-session-close-"));
  const path = join(tempDir, "resume-brief.md");
  await writeFile(path, "# Resume Brief\n\nold\n");
  const { hashContent, writeResumeBrief } = await loadSessionCloseModule();
  const expectedHash = hashContent("# Resume Brief\n\nold\n");
  await writeFile(path, "# Resume Brief\n\nchanged elsewhere\n");

  const result = await writeResumeBrief({
    path,
    content: "# Resume Brief\n\nnew\n",
    expectedHash,
  });

  assert.equal(result.status, "needs_approval");
  assert.match(result.reason, /content hash changed/);
  assert.equal(await readFile(path, "utf8"), "# Resume Brief\n\nchanged elsewhere\n");
});
