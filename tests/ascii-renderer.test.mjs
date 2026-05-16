import assert from "node:assert/strict";
import test from "node:test";

async function loadAsciiModule() {
  return import(`../scripts/internal/render/ascii.ts?cacheBust=${Date.now()}`);
}

test("renderProgressBar clamps values and keeps a stable ten-slot visual", async () => {
  const { renderProgressBar } = await loadAsciiModule();

  assert.equal(renderProgressBar({ current: 3, total: 5 }), "[██████░░░░] 3/5");
  assert.equal(renderProgressBar({ current: 8, total: 10, label: "POKit 진행도" }), "POKit 진행도 [████████░░] 8/10");
  assert.equal(renderProgressBar({ current: 12, total: 10 }), "[██████████] 10/10");
  assert.equal(renderProgressBar({ current: -1, total: 0 }), "[░░░░░░░░░░] 0/1");
});

test("renderStatusBlock creates compact conversation status blocks", async () => {
  const { renderStatusBlock } = await loadAsciiModule();

  const output = renderStatusBlock({
    title: "POKit 상태",
    rows: [
      { label: "부팅", value: "ok" },
      { label: "hooks", value: "loaded" },
    ],
  });

  assert.equal(output.join("\n"), [
    "POKit 상태",
    "- 부팅: ok",
    "- hooks: loaded",
  ].join("\n"));
});

test("renderProblemReview and renderApprovalRequest standardize common response visuals", async () => {
  const { renderApprovalRequest, renderProblemReview } = await loadAsciiModule();

  assert.match(renderProblemReview({
    problem: "compact 후 bootstrap 누락",
    options: ["session-start contract", "manual reminder"],
    recommendation: "session-start contract",
  }).join("\n"), /추천: session-start contract/);

  assert.match(renderApprovalRequest({
    action: "Linear Done 반영",
    impact: "POKIT-127 상태 변경",
    confirmRequired: true,
  }).join("\n"), /승인 필요/);
});

test("renderPreflightStatusBlock standardizes external write progress visuals", async () => {
  const { renderPreflightStatusBlock } = await loadAsciiModule();

  const output = renderPreflightStatusBlock({
    title: "Linear Backlog 등록 사전 확인",
    percent: 80,
    items: [
      { state: "done", label: "로컬 Problem/Error Review 메모 생성 완료" },
      { state: "done", label: "Linear issue 생성 payload 준비 완료" },
      { state: "done", label: "idempotency key 확인 완료" },
      { state: "pending", label: "실제 Linear write는 승인 대기" },
    ],
  }).join("\n");

  assert.equal(output, [
    "Linear Backlog 등록 사전 확인",
    "[████████░░] 80%",
    "",
    "✅ 로컬 Problem/Error Review 메모 생성 완료",
    "✅ Linear issue 생성 payload 준비 완료",
    "✅ idempotency key 확인 완료",
    "⏳ 실제 Linear write는 승인 대기",
  ].join("\n"));
});

test("renderDecisionChoiceBlock centralizes A/B choice wording", async () => {
  const { renderDecisionChoiceBlock } = await loadAsciiModule();

  const output = renderDecisionChoiceBlock({
    reason: "Linear 외부 write 승인 경계",
    recommended: "준비한 Backlog issue를 생성",
    recommendedReason: "dry-run payload와 idempotency key가 확인됨",
    alternative: "생성하지 않고 로컬 메모만 유지",
    alternativeTradeoff: "Linear 추적은 남지 않음",
  }).join("\n");

  assert.match(output, /사용자 확인/);
  assert.match(output, /✅ 추천안 A: 준비한 Backlog issue를 생성/);
  assert.match(output, /↩️ 대안 B: 생성하지 않고 로컬 메모만 유지/);
  assert.match(output, /A\/B로 선택해 주세요\./);
});
