import assert from "node:assert/strict";
import test from "node:test";

async function loadOutlineModule() {
  return import(`../scripts/backlog-outline.ts?cacheBust=${Date.now()}`);
}

test("buildBacklogTitle keeps Korean state first and machine variables out of the title", async () => {
  const { buildBacklogTitle } = await loadOutlineModule();

  assert.equal(buildBacklogTitle({
    status: "approval_pending",
    scope: "Problem Review 후속",
    action: "Backlog 등록",
    targetVersion: "v0.8.0",
  }), "[승인대기] Problem Review 후속 - Backlog 등록");

  assert.equal(buildBacklogTitle({
    status: "release_bound",
    scope: "세션 시작 브리프",
    action: "최적화",
    targetVersion: "v0.8.0",
  }), "[배포대상 v0.8.0] 세션 시작 브리프 - 최적화");

  assert.equal(buildBacklogTitle({
    status: "non_release",
    scope: "문서 목차",
    action: "정리",
  }), "[비배포] 문서 목차 - 정리");
});

test("renderLinearBacklogDescription uses fixed Korean headings and explicit variables", async () => {
  const { renderLinearBacklogDescription } = await loadOutlineModule();

  const description = renderLinearBacklogDescription({
    purpose: "Linear 제목만 보고 상태를 알 수 있게 한다.",
    userVisibleChange: "Backlog 목록에서 승인대기/배포대상/비배포가 바로 보인다.",
    doneCondition: "제목 규칙과 description 목차가 테스트로 고정된다.",
    scope: "Backlog memo와 Linear issue 생성 dry-run",
    outOfScope: "기존 Linear issue 일괄 rename",
    evidence: ["docs/architecture/07-backlog-intake-flow.md", "scripts/linear.ts"],
    release: {
      kind: "normal",
      targetVersion: "v0.8.0",
      runId: "vr-2026-05-16-backlog-title",
    },
    linearVariables: {
      state: "Backlog",
      labels: ["pokit:criteria", "type:standardization"],
      source: "chat",
      idempotencyKey: "linear:create_issue:backlog-title-standard",
    },
  });

  assert.match(description, /## 목적/);
  assert.match(description, /## 사용자에게 보이는 변화/);
  assert.match(description, /## 완료 조건/);
  assert.match(description, /## 범위/);
  assert.match(description, /## 제외 범위/);
  assert.match(description, /## 증거 \/ 출처/);
  assert.match(description, /## 배포 여부/);
  assert.match(description, /releaseKind: normal/);
  assert.match(description, /targetVersion: v0\.8\.0/);
  assert.match(description, /## Linear 변수/);
  assert.match(description, /labels: pokit:criteria, type:standardization/);
  assert.match(description, /## idempotency key/);
  assert.match(description, /linear:create_issue:backlog-title-standard/);
});

test("renderLocalBacklogMemo keeps dry-run memo outline distinct from Linear description", async () => {
  const { renderLocalBacklogMemo } = await loadOutlineModule();

  const memo = renderLocalBacklogMemo({
    title: "[정의필요] Backlog 제목/목차 - 표준화",
    summary: "Backlog memo와 Linear issue 제목/목차를 분리한다.",
    source: "chat",
    proposedLinearTitle: "[정의필요] Backlog 제목/목차 - 표준화",
    proposedLabels: ["pokit:criteria"],
    proposedState: "Backlog",
    nonChanges: ["Linear write 없음", "GitHub release 없음"],
    idempotencyKey: "linear:create_issue:backlog-outline-standard",
  });

  assert.match(memo, /^# Backlog Memo: \[정의필요\] Backlog 제목\/목차 - 표준화/);
  assert.match(memo, /## 요약/);
  assert.match(memo, /## 제안 Linear 형태/);
  assert.match(memo, /## 바꾸지 않을 것/);
  assert.match(memo, /## idempotency key/);
  assert.doesNotMatch(memo, /## 사용자에게 보이는 변화/);
});

test("renderSubIssueTaskChecklist keeps tasks inside the sub-issue instead of creating sub-sub-issues", async () => {
  const { renderSubIssueTaskChecklist } = await loadOutlineModule();

  const checklist = renderSubIssueTaskChecklist({
    subIssueId: "POKIT-102",
    tasks: [
      { id: "task:renderer", title: "renderer 함수 추가", doneGate: "scripts/backlog-outline.ts" },
      { id: "task:test", title: "회귀 테스트 추가", doneGate: "tests/backlog-outline.test.mjs" },
      { id: "task:docs", title: "문서 반영", doneGate: "docs/architecture/14-linear-structure-standards.md" },
    ],
  });

  assert.match(checklist, /## Task Checklist/);
  assert.match(checklist, /subIssueId: POKIT-102/);
  assert.match(checklist, /- \[ \] task:renderer · renderer 함수 추가 · doneGate: scripts\/backlog-outline\.ts/);
  assert.match(checklist, /- \[ \] task:test · 회귀 테스트 추가 · doneGate: tests\/backlog-outline\.test\.mjs/);
  assert.doesNotMatch(checklist, /sub-sub-issue/i);
});
