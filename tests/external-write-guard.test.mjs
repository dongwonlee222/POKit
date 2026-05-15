import assert from "node:assert/strict";
import test from "node:test";

async function loadExternalWriteGuardModule() {
  return import(`../scripts/external-write/guard.ts?cacheBust=${Date.now()}`);
}

const releaseBundlePlan = {
  idempotencyKey: "linear:create_issue:v0.7.0",
  summary: "Create release bundle issue",
  writes: [
    {
      type: "create_issue",
      target: "backlog",
      payload: {
        title: "v0.7.0 · 메시지 카탈로그와 훅 하네스",
        description: "Target version: `v0.7.0`\nRelease bundle: 설계 지속성 / 의도 검정",
      },
    },
  ],
};

test("assertExternalWriteAllowed requires the main agent actor", async () => {
  const { assertExternalWriteAllowed } = await loadExternalWriteGuardModule();

  assert.throws(
    () => assertExternalWriteAllowed(releaseBundlePlan, {
      approved: true,
      actor: "subagent",
      semanticPreflight: { ok: true, errors: [] },
    }),
    /main agent/,
  );
});

test("assertExternalWriteAllowed requires semantic preflight for release-bundle issue writes", async () => {
  const { assertExternalWriteAllowed } = await loadExternalWriteGuardModule();

  assert.throws(
    () => assertExternalWriteAllowed(releaseBundlePlan, {
      approved: true,
      actor: "main_agent",
    }),
    /semantic preflight/,
  );
});

test("assertExternalWriteAllowed accepts approved main-agent writes with passing semantic preflight", async () => {
  const { assertExternalWriteAllowed } = await loadExternalWriteGuardModule();

  assert.doesNotThrow(() => assertExternalWriteAllowed(releaseBundlePlan, {
    approved: true,
    actor: "main_agent",
    semanticPreflight: { ok: true, errors: [] },
  }));
});
