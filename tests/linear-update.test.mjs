import assert from "node:assert/strict";
import test from "node:test";

let moduleLoadCount = 0;

async function loadLinearModule() {
  moduleLoadCount += 1;
  return import(`../scripts/internal/linear.ts?cacheBust=${moduleLoadCount}`);
}

// ── composeAppendedDescription ─────────────────────────────────────────────

test("composeAppendedDescription appends to non-empty description", async () => {
  const { composeAppendedDescription } = await loadLinearModule();

  const existing = "## AS-IS\n\nOld content here.";
  const append = "## 보류 결정 (2026-05-17)\n\n사유: 의존성 미해결";
  const result = composeAppendedDescription(existing, append);

  assert.ok(result.startsWith(existing.trimEnd()), "Should start with trimmed existing content");
  assert.ok(result.includes("\n\n"), "Should have double newline separator");
  assert.ok(result.endsWith(append), "Should end with appended content");
  assert.equal(result, `${existing}\n\n${append}`);
});

test("composeAppendedDescription handles empty existing description", async () => {
  const { composeAppendedDescription } = await loadLinearModule();

  const result = composeAppendedDescription("", "## New Section\n\nContent");
  assert.equal(result, "## New Section\n\nContent");
});

test("composeAppendedDescription trims trailing whitespace from existing", async () => {
  const { composeAppendedDescription } = await loadLinearModule();

  const existing = "## AS-IS\n\nContent   \n  \n";
  const append = "## Appended";
  const result = composeAppendedDescription(existing, append);

  assert.ok(!result.startsWith(existing), "Should have trimmed trailing whitespace");
  assert.ok(result.includes("## Appended"), "Should include appended section");
});

// ── planUpdateIssue — plan structure ─────────────────────────────────────────

test("planUpdateIssue returns correct plan structure for descriptionAppend", async () => {
  const { planUpdateIssue } = await loadLinearModule();

  const plan = await planUpdateIssue({
    issueIdentifier: "POKIT-170",
    descriptionAppend: "## 보류 결정\n\n사유: 의존성 미해결",
  });

  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].type, "update_issue");
  assert.equal(plan.writes[0].target, "POKIT-170");
  assert.ok(plan.idempotencyKey.startsWith("linear:update_issue:POKIT-170:"), "idempotencyKey should contain issueIdentifier");
  assert.ok(plan.idempotencyKey.includes(":desc"), "idempotencyKey should encode scope");
  assert.equal(plan.summary, "Update Linear issue POKIT-170");
  assert.equal(plan.writes[0].payload.issueIdentifier, "POKIT-170");
  assert.equal(plan.writes[0].payload.descriptionAppend, "## 보류 결정\n\n사유: 의존성 미해결");
});

test("planUpdateIssue returns correct plan structure for stateName change", async () => {
  const { planUpdateIssue } = await loadLinearModule();

  const plan = await planUpdateIssue({
    issueIdentifier: "POKIT-170",
    stateName: "Cancelled",
  });

  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].type, "update_issue");
  assert.ok(plan.idempotencyKey.includes("state-Cancelled"), "idempotencyKey should encode state change");
  assert.equal(plan.writes[0].payload.stateName, "Cancelled");
  assert.equal(plan.writes[0].payload.issueIdentifier, "POKIT-170");
});

test("planUpdateIssue includes both fields when descriptionAppend + stateName provided", async () => {
  const { planUpdateIssue } = await loadLinearModule();

  const plan = await planUpdateIssue({
    issueIdentifier: "POKIT-170",
    descriptionAppend: "## 보류\n\n내용",
    stateName: "Cancelled",
  });

  assert.ok(plan.idempotencyKey.includes("desc"), "idempotencyKey should note desc change");
  assert.ok(plan.idempotencyKey.includes("state-Cancelled"), "idempotencyKey should note state change");
  assert.equal(plan.writes[0].payload.descriptionAppend, "## 보류\n\n내용");
  assert.equal(plan.writes[0].payload.stateName, "Cancelled");
});

test("planUpdateIssue idempotencyKey contains date component", async () => {
  const { planUpdateIssue } = await loadLinearModule();

  const plan = await planUpdateIssue({
    issueIdentifier: "POKIT-159",
    descriptionAppend: "link",
  });

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  assert.ok(plan.idempotencyKey.includes(today), `idempotencyKey should contain today (${today})`);
});

// ── planUpdateIssue — plan is compatible with assertExternalWriteAllowed ────

test("planUpdateIssue produces plan that passes assertExternalWriteAllowed with correct options", async () => {
  const { planUpdateIssue } = await loadLinearModule();
  const { assertExternalWriteAllowed } = await import("../scripts/internal/external-write/guard.ts");

  const plan = await planUpdateIssue({
    issueIdentifier: "POKIT-170",
    stateName: "Cancelled",
  });

  assert.doesNotThrow(() =>
    assertExternalWriteAllowed(plan, {
      approved: true,
      actor: "main_agent",
    })
  );
});

test("planUpdateIssue plan is blocked without approval", async () => {
  const { planUpdateIssue } = await loadLinearModule();
  const { assertExternalWriteAllowed } = await import("../scripts/internal/external-write/guard.ts");

  const plan = await planUpdateIssue({
    issueIdentifier: "POKIT-170",
    stateName: "Cancelled",
  });

  assert.throws(
    () => assertExternalWriteAllowed(plan, { actor: "main_agent" }),
    /explicit approval/,
  );
});
