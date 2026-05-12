import assert from "node:assert/strict";
import test from "node:test";

async function loadSeedModule() {
  return import(`../scripts/backlog-seed-plan.ts?cacheBust=${Date.now()}`);
}

test("buildBacklogSeedPlans returns dry-run issue creation plans only", async () => {
  const { buildBacklogSeedPlans } = await loadSeedModule();

  const plans = await buildBacklogSeedPlans();

  assert.ok(plans.length >= 4);
  assert.ok(plans.every((plan) => plan.idempotencyKey.startsWith("linear:create_issue:")));
  assert.ok(plans.every((plan) => plan.writes.length === 1));
  assert.ok(plans.every((plan) => plan.writes[0].type === "create_issue"));
  assert.ok(plans.some((plan) => String(plan.writes[0].payload).includes("dry-run runner") || JSON.stringify(plan.writes[0].payload).includes("dry-run runner")));
  assert.ok(plans.some((plan) => JSON.stringify(plan.writes[0].payload).includes("pokit:prd")));
  assert.ok(plans.some((plan) => JSON.stringify(plan.writes[0].payload).includes("pokit:criteria")));
});

test("renderBacklogSeedPlanMarkdown shows approval-first warning", async () => {
  const { buildBacklogSeedPlans, renderBacklogSeedPlanMarkdown } = await loadSeedModule();

  const markdown = renderBacklogSeedPlanMarkdown(await buildBacklogSeedPlans());

  assert.match(markdown, /# POKit Backlog Seed Plan/);
  assert.match(markdown, /No Linear issues were created/);
  assert.match(markdown, /idempotencyKey/);
  assert.match(markdown, /pokit:prd|pokit:criteria/);
});
