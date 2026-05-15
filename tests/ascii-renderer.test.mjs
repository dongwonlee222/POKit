import assert from "node:assert/strict";
import test from "node:test";

async function loadAsciiModule() {
  return import(`../scripts/render/ascii.ts?cacheBust=${Date.now()}`);
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
