import assert from "node:assert/strict";
import test from "node:test";

async function loadHotfixModule() {
  return import(`../scripts/hotfix-cycle-plan.ts?cacheBust=${Date.now()}`);
}

test("buildHotfixCyclePlans returns create-cycle and move-issue dry-run plans", async () => {
  const { buildHotfixCyclePlans } = await loadHotfixModule();

  const plans = await buildHotfixCyclePlans({
    hotfixCycleName: "Hotfix v0.1.0",
    startsAt: "2026-05-13T00:00:00.000Z",
    endsAt: "2026-05-14T00:00:00.000Z",
    sourceCycle: "Cycle 2",
    targetVersion: "v0.1.0",
    resumeCycle: "Cycle 3",
    releaseScope: "GitHub push/tag/release",
    issueId: "issue-44",
    issueIdentifier: "EVM-44",
  });

  assert.equal(plans.length, 2);
  assert.equal(plans[0].writes[0].type, "create_cycle");
  assert.equal(plans[0].idempotencyKey, "linear:create_cycle:Hotfix v0.1.0:v0.1.0");
  assert.equal(plans[1].writes[0].type, "update_issue");
  assert.equal(plans[1].idempotencyKey, "linear:assign_cycle:EVM-44:<created-hotfix-cycle-id>");
});

test("renderHotfixCyclePlanMarkdown shows no-write dry-run and approval boundary", async () => {
  const { buildHotfixCyclePlans, renderHotfixCyclePlanMarkdown } = await loadHotfixModule();

  const markdown = renderHotfixCyclePlanMarkdown(await buildHotfixCyclePlans({
    hotfixCycleName: "Hotfix v0.1.0",
    startsAt: "2026-05-13T00:00:00.000Z",
    endsAt: "2026-05-14T00:00:00.000Z",
    sourceCycle: "Cycle 2",
    targetVersion: "v0.1.0",
    resumeCycle: "Cycle 3",
    releaseScope: "GitHub push/tag/release",
    issueId: "issue-44",
    issueIdentifier: "EVM-44",
  }));

  assert.match(markdown, /# POKit Hotfix Cycle Dry-run/);
  assert.match(markdown, /No Linear cycles or issues were changed/);
  assert.match(markdown, /Hotfix v0\.1\.0/);
  assert.match(markdown, /EVM-44/);
  assert.match(markdown, /sourceCycle: Cycle 2/);
  assert.match(markdown, /targetVersion: v0\.1\.0/);
  assert.match(markdown, /resumeCycle: Cycle 3/);
  assert.match(markdown, /GitHub push\/tag\/release still requires a separate final approval/);
});
