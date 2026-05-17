import assert from "node:assert/strict";
import test from "node:test";

async function loadPreflightModule() {
  return import(`../../scripts/ci/label-preflight.ts?cacheBust=${Date.now()}`);
}

test("renderLabelPreflightPlanMarkdown is dry-run and shows idempotency key", async () => {
  const { renderLabelPreflightPlanMarkdown } = await loadPreflightModule();
  const markdown = renderLabelPreflightPlanMarkdown({
    idempotencyKey: "linear:create_labels:pokit:criteria",
    summary: "Create missing POKit labels: pokit:criteria",
    writes: [
      {
        type: "create_label",
        target: "linear_workspace",
        payload: { name: "pokit:criteria" },
      },
    ],
  });

  assert.match(markdown, /No Linear labels were created/);
  assert.match(markdown, /idempotencyKey: `linear:create_labels:pokit:criteria`/);
  assert.match(markdown, /type: `create_label`/);
  assert.match(markdown, /"name": "pokit:criteria"/);
});

test("renderLabelPreflightPlanMarkdown handles no missing labels", async () => {
  const { renderLabelPreflightPlanMarkdown } = await loadPreflightModule();
  const markdown = renderLabelPreflightPlanMarkdown({
    idempotencyKey: "linear:create_labels:",
    summary: "Create missing POKit labels: none",
    writes: [],
  });

  assert.match(markdown, /writes:\n  - none/);
});
