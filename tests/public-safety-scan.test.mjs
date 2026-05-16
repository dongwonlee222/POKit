import assert from "node:assert/strict";
import test from "node:test";

async function loadPublicSafetyModule() {
  return import(`../scripts/cli/public-safety-scan.ts?cacheBust=${Date.now()}`);
}

test("scanPublicFiles flags private Linear workspace and cycle identifiers", async () => {
  const { scanPublicFiles } = await loadPublicSafetyModule();

  const violations = scanPublicFiles([
    {
      path: "docs/example.md",
      content: [
        "Linear URL: https://linear.app/private-workspace/issue/POKIT-9/example",
        "cycle_id: 11111111-2222-4333-8444-555555555555",
      ].join("\n"),
    },
  ]);

  assert.equal(violations.length, 2);
  assert.deepEqual(violations.map((violation) => violation.ruleId), [
    "private-linear-workspace",
    "private-linear-cycle-id",
  ]);
});

test("scanPublicFiles flags live memory content", async () => {
  const { scanPublicFiles } = await loadPublicSafetyModule();

  const violations = scanPublicFiles([
    {
      path: "memory/resume-brief.md",
      content: "Cycle 3 기준 완료 0건, 남은 묶음: EVM-35, EVM-36",
    },
  ]);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].ruleId, "live-memory-state");
});

test("scanTrackedPublicFiles finds no private POKit dogfood data", async () => {
  const { scanTrackedPublicFiles } = await loadPublicSafetyModule();

  const violations = await scanTrackedPublicFiles({ cwd: new URL("..", import.meta.url).pathname });

  assert.deepEqual(violations, []);
});
