import assert from "node:assert/strict";
import test from "node:test";

let loadCount = 0;

async function loadModule() {
  loadCount += 1;
  return import(`../../scripts/internal/dry-run-format.ts?cacheBust=${loadCount}`);
}

// ── 기본 렌더링 — 3섹션 마커 존재 ───────────────────────────────────────────

test("renderDryRunPlan: [dry-run plan] 헤더 포함", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "linear:update:POKIT-185:20260517:abc", expectedImpact: "Linear API 1건", rollback: "auto" },
  );
  assert.ok(out.includes("[dry-run plan]"), `헤더 없음: ${out}`);
});

test("renderDryRunPlan: ## 1. 대상 섹션 마커 존재", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "linear:update:POKIT-185:20260517:abc", expectedImpact: "Linear API 1건", rollback: "auto" },
  );
  assert.ok(out.includes("## 1. 대상 (Target)"), `대상 섹션 없음: ${out}`);
});

test("renderDryRunPlan: ## 2. 변경 섹션 마커 존재", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "linear:update:POKIT-185:20260517:abc", expectedImpact: "Linear API 1건", rollback: "auto" },
  );
  assert.ok(out.includes("## 2. 변경 (Change)"), `변경 섹션 없음: ${out}`);
});

test("renderDryRunPlan: ## 3. 승인 섹션 마커 존재", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "linear:update:POKIT-185:20260517:abc", expectedImpact: "Linear API 1건", rollback: "auto" },
  );
  assert.ok(out.includes("## 3. 승인 (Approval)"), `승인 섹션 없음: ${out}`);
});

test("renderDryRunPlan: 승인 프롬프트 포함", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "linear:update:POKIT-185:20260517:abc", expectedImpact: "Linear API 1건", rollback: "auto" },
  );
  assert.ok(out.includes("▶ 진행하시려면"), `승인 프롬프트 없음: ${out}`);
});

// ── target / change / approval 필드 정상 렌더링 ──────────────────────────────

test("renderDryRunPlan: target.kind 출력 포함", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "create-issue", identifier: "backlog" },
    { body: "title: 신규 이슈" },
    { idempotencyKey: "linear:create:backlog:20260517:xyz", expectedImpact: "Linear API 1건", rollback: "manual", rollbackGuide: "Linear UI 수동 삭제" },
  );
  assert.ok(out.includes("- 종류: create-issue"), `kind 없음: ${out}`);
});

test("renderDryRunPlan: target.identifier 출력 포함", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "create-issue", identifier: "backlog" },
    { body: "title: 신규 이슈" },
    { idempotencyKey: "linear:create:backlog:20260517:xyz", expectedImpact: "Linear API 1건", rollback: "manual", rollbackGuide: "Linear UI 수동 삭제" },
  );
  assert.ok(out.includes("- 식별자: backlog"), `identifier 없음: ${out}`);
});

test("renderDryRunPlan: currentState 제공 시 출력", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185", currentState: "In Progress" },
    { body: "state → Done" },
    { idempotencyKey: "k", expectedImpact: "1건", rollback: "auto" },
  );
  assert.ok(out.includes("- 현재 상태: In Progress"), `currentState 없음: ${out}`);
});

test("renderDryRunPlan: currentState 미제공 시 (미조회) 출력", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "k", expectedImpact: "1건", rollback: "auto" },
  );
  assert.ok(out.includes("- 현재 상태: (미조회)"), `미조회 placeholder 없음: ${out}`);
});

test("renderDryRunPlan: change.body 본문이 출력에 포함", async () => {
  const { renderDryRunPlan } = await loadModule();
  const body = "state → Done\ndescription append: 3줄";
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body },
    { idempotencyKey: "k", expectedImpact: "1건", rollback: "auto" },
  );
  assert.ok(out.includes(body.trimEnd()), `body 없음: ${out}`);
});

test("renderDryRunPlan: idempotencyKey 출력 포함", async () => {
  const { renderDryRunPlan } = await loadModule();
  const key = "linear:update_issue:POKIT-185:20260517:abc123";
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: key, expectedImpact: "1건", rollback: "auto" },
  );
  assert.ok(out.includes(`- idempotencyKey: ${key}`), `key 없음: ${out}`);
});

test("renderDryRunPlan: expectedImpact 출력 포함", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "k", expectedImpact: "Linear API 1건 (issue update)", rollback: "auto" },
  );
  assert.ok(out.includes("- 예상 영향: Linear API 1건 (issue update)"), `expectedImpact 없음: ${out}`);
});

// ── rollback 케이스 ───────────────────────────────────────────────────────────

test("renderDryRunPlan: rollback=auto 출력", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "update-issue", identifier: "POKIT-185" },
    { body: "state → Done" },
    { idempotencyKey: "k", expectedImpact: "1건", rollback: "auto" },
  );
  assert.ok(out.includes("- 되돌리기: auto"), `auto rollback 없음: ${out}`);
});

test("renderDryRunPlan: rollback=manual 시 guide 링크 표시", async () => {
  const { renderDryRunPlan } = await loadModule();
  const guide = "Linear UI 수동 편집";
  const out = renderDryRunPlan(
    { kind: "create-issue", identifier: "backlog" },
    { body: "title: 이슈" },
    { idempotencyKey: "k", expectedImpact: "1건", rollback: "manual", rollbackGuide: guide },
  );
  assert.ok(out.includes(`- 되돌리기: manual (${guide})`), `manual guide 없음: ${out}`);
});

test("renderDryRunPlan: rollback=impossible 출력", async () => {
  const { renderDryRunPlan } = await loadModule();
  const out = renderDryRunPlan(
    { kind: "release", identifier: "v0.16.0" },
    { body: "GitHub release 게시" },
    { idempotencyKey: "k", expectedImpact: "GitHub 1건", rollback: "impossible" },
  );
  assert.ok(out.includes("- 되돌리기: impossible"), `impossible rollback 없음: ${out}`);
});

// ── 오류 케이스 ───────────────────────────────────────────────────────────────

test("renderDryRunPlan: 빈 body 거부 — Error throw", async () => {
  const { renderDryRunPlan } = await loadModule();
  assert.throws(
    () => renderDryRunPlan(
      { kind: "update-issue", identifier: "POKIT-185" },
      { body: "" },
      { idempotencyKey: "k", expectedImpact: "1건", rollback: "auto" },
    ),
    (err) => err instanceof Error && err.message.includes("body"),
  );
});

test("renderDryRunPlan: 공백만 있는 body 거부 — Error throw", async () => {
  const { renderDryRunPlan } = await loadModule();
  assert.throws(
    () => renderDryRunPlan(
      { kind: "update-issue", identifier: "POKIT-185" },
      { body: "   \n  " },
      { idempotencyKey: "k", expectedImpact: "1건", rollback: "auto" },
    ),
    (err) => err instanceof Error && err.message.includes("body"),
  );
});

test("renderDryRunPlan: rollback=manual + rollbackGuide 없음 — Error throw", async () => {
  const { renderDryRunPlan } = await loadModule();
  assert.throws(
    () => renderDryRunPlan(
      { kind: "create-issue", identifier: "backlog" },
      { body: "title: 이슈" },
      { idempotencyKey: "k", expectedImpact: "1건", rollback: "manual" },
    ),
    (err) => err instanceof Error && err.message.includes("rollbackGuide"),
  );
});
