import assert from "node:assert/strict";
import test from "node:test";

async function loadRunIdentityModule() {
  return import(`../scripts/pokit-run-identity.ts?cacheBust=${Date.now()}`);
}

test("buildPokitRunId tracks release and non-release runs without relying on titles", async () => {
  const { buildPokitRunId } = await loadRunIdentityModule();

  assert.equal(buildPokitRunId({
    kind: "release",
    targetVersion: "v0.8.0",
  }), "pokit:run:release:v0.8.0");

  assert.equal(buildPokitRunId({
    kind: "non_release",
    runId: "docs-review-2026-05-16",
  }), "pokit:run:non-release:docs-review-2026-05-16");
});

test("buildPokitRunId requires hotfix routing variables", async () => {
  const { buildPokitRunId } = await loadRunIdentityModule();

  assert.throws(() => buildPokitRunId({
    kind: "hotfix",
    targetVersion: "v0.8.1",
  }), /sourceCycle/);

  assert.equal(buildPokitRunId({
    kind: "hotfix",
    targetVersion: "v0.8.1",
    sourceCycle: "Cycle 7",
    resumeCycle: "Cycle 8",
  }), "pokit:run:hotfix:v0.8.1:source=Cycle 7:resume=Cycle 8");
});

test("renderPokitRunMetadata separates user-facing title from tracking variables", async () => {
  const { renderPokitRunMetadata } = await loadRunIdentityModule();

  const metadata = renderPokitRunMetadata({
    title: "[포킷서클 v0.8.0] Backlog 표준화 - 적용",
    kind: "release",
    targetVersion: "v0.8.0",
    linearCycleId: "linear-cycle-2026-w21",
    linearCycleName: "2026-W21",
    cycleBundleId: "bundle-backlog-standard",
    issueIds: ["POKIT-101", "POKIT-102"],
  });

  assert.match(metadata, /## POKit Circle 표시/);
  assert.match(metadata, /title: \[포킷서클 v0\.8\.0\] Backlog 표준화 - 적용/);
  assert.match(metadata, /## POKit Circle 변수/);
  assert.match(metadata, /pokitRunId: pokit:run:release:v0\.8\.0/);
  assert.match(metadata, /linearCycleId: linear-cycle-2026-w21/);
  assert.match(metadata, /cycleBundleId: bundle-backlog-standard/);
  assert.match(metadata, /issueIds: POKIT-101, POKIT-102/);
});
