import assert from "node:assert/strict";
import test from "node:test";

async function loadMaintenanceModule() {
  return import(`../scripts/cycle-maintenance.ts?cacheBust=${Date.now()}`);
}

test("buildCycleMaintenancePlans returns dry-run completion plans", async () => {
  const { buildCycleMaintenancePlans } = await loadMaintenanceModule();

  const plans = await buildCycleMaintenancePlans({
    completedAt: "2026-05-13T15:00:00.000Z",
    cycles: [
      { cycleId: "cycle-1", cycleName: "Cycle 1", reason: "27/27 Done" },
      { cycleId: "cycle-2", cycleName: "Cycle 2", reason: "6/6 Done" },
    ],
  });

  assert.equal(plans.length, 2);
  assert.equal(plans[0].idempotencyKey, "linear:update_cycle:cycle-1:complete");
  assert.equal(plans[1].idempotencyKey, "linear:update_cycle:cycle-2:complete");
  assert.equal(plans[0].writes[0].type, "update_cycle");
  assert.match(plans[0].writes[0].payload.description, /POKit operational completion/);
  assert.match(plans[0].writes[0].payload.description, /27\/27 Done/);
});

test("renderCycleMaintenanceMarkdown shows no-write warning and cycle ids", async () => {
  const { buildCycleMaintenancePlans, renderCycleMaintenanceMarkdown } = await loadMaintenanceModule();

  const markdown = renderCycleMaintenanceMarkdown(await buildCycleMaintenancePlans({
    completedAt: "2026-05-13T15:00:00.000Z",
    cycles: [
      { cycleId: "cycle-1", cycleName: "Cycle 1", reason: "27/27 Done" },
      { cycleId: "cycle-2", cycleName: "Cycle 2", reason: "6/6 Done" },
    ],
  }));

  assert.match(markdown, /# POKit Cycle Maintenance Dry-run/);
  assert.match(markdown, /No Linear cycles were changed/);
  assert.match(markdown, /Cycle 1/);
  assert.match(markdown, /Cycle 2/);
  assert.match(markdown, /linear:update_cycle:cycle-1:complete/);
  assert.match(markdown, /linear:update_cycle:cycle-2:complete/);
});
