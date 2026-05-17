import assert from "node:assert/strict";
import test from "node:test";

async function load() {
  return import(`../scripts/internal/retro-check.ts?cacheBust=${Date.now()}`);
}

function baseManifest(overrides = {}) {
  return {
    version: "0.14.0",
    released_at: "2026-05-01T00:00:00Z",
    cycle_id: "2026-W18",
    issues: [
      { id: "POKIT-115", title: "Working Notes archive", state: "Done", type: "feature" },
    ],
    changelog: ["feat: memory MVP"],
    artifacts: {
      code_paths: ["scripts/internal/memory-index.ts"],
      doc_paths: ["memory/releases/SCHEMA.md"],
      skills: [],
    },
    wiring_status: {
      intended: ["memory_index", "renderLinearBacklogDescription", "collected_sweep_writer"],
      actual: ["collected_sweep_writer"],
      gaps: [],
    },
    ...overrides,
  };
}

test("analyzeVersionWiring detects structural gap when intended id has no actual and no grep hits", async () => {
  const { analyzeVersionWiring } = await load();
  const report = analyzeVersionWiring(baseManifest(), {
    productionHitCounts: {
      memory_index: 0,
      renderLinearBacklogDescription: 5,
      collected_sweep_writer: 3,
    },
  });
  const structural = report.gaps.filter((g) => g.category === "structural");
  assert.equal(structural.length, 1);
  assert.match(structural[0].note, /memory_index/);
  assert.match(structural[0].note, /actual=∅/);
});

test("analyzeVersionWiring detects partial gap when intended id has hits but actual missing", async () => {
  const { analyzeVersionWiring } = await load();
  const report = analyzeVersionWiring(baseManifest(), {
    productionHitCounts: {
      memory_index: 2,
      renderLinearBacklogDescription: 0,
      collected_sweep_writer: 3,
    },
  });
  const partial = report.gaps.filter((g) => g.category === "partial");
  assert.equal(partial.length, 1);
  assert.match(partial[0].note, /memory_index/);
  assert.match(partial[0].note, /manifest drift/);
});

test("analyzeVersionWiring detects bitrot when actual lists id but grep finds zero", async () => {
  const { analyzeVersionWiring } = await load();
  const report = analyzeVersionWiring(baseManifest(), {
    productionHitCounts: {
      memory_index: 1,
      renderLinearBacklogDescription: 1,
      collected_sweep_writer: 0,
    },
  });
  const bitrot = report.gaps.filter((g) => g.category === "bitrot");
  assert.equal(bitrot.length, 1);
  assert.match(bitrot[0].note, /collected_sweep_writer/);
  assert.match(bitrot[0].note, /grep finds 0/);
});

test("analyzeVersionWiring respects expectedMinHits threshold for partial classification", async () => {
  const { analyzeVersionWiring } = await load();
  const manifest = baseManifest({
    wiring_status: {
      intended: ["foo"],
      actual: ["foo"],
      gaps: [],
    },
  });
  const report = analyzeVersionWiring(manifest, {
    productionHitCounts: { foo: 1 },
    expectedMinHits: 3,
  });
  assert.equal(report.gaps.length, 1);
  assert.equal(report.gaps[0].category, "partial");
  assert.match(report.gaps[0].note, /grep hits=1 < expected 3/);
});

test("analyzeVersionWiring returns ok (no gap) when actual lists id and grep hits >= expected", async () => {
  const { analyzeVersionWiring } = await load();
  const manifest = baseManifest({
    wiring_status: {
      intended: ["foo"],
      actual: ["foo"],
      gaps: [],
    },
  });
  const report = analyzeVersionWiring(manifest, {
    productionHitCounts: { foo: 5 },
  });
  assert.equal(report.gaps.length, 0);
  assert.equal(report.details[0].category, "ok");
});

test("dispatchGapsToLinear (dry-run) renders 4-section body for each gap and uses planCreateIssue", async () => {
  const { dispatchGapsToLinear } = await load();
  const gaps = [
    { category: "structural", note: "v0.14.0 \"memory_index\" intended but no production wiring (actual=∅, grep=0)." },
    { category: "bitrot", note: "v0.14.0 \"collected_sweep_writer\" recorded in actual but grep finds 0." },
  ];
  const dispatched = await dispatchGapsToLinear("0.14.0", gaps, { dryRun: true });

  assert.equal(dispatched.length, 2);
  for (const d of dispatched) {
    assert.match(d.title, /\[정의필요\] v0\.14\.0 wiring/);
    // 4 mandatory sections present
    assert.match(d.description, /## AS-IS \(문제 정의\)/);
    assert.match(d.description, /## TO-BE \(해결\)/);
    assert.match(d.description, /## 성공 검증/);
    assert.match(d.description, /## 담당 에이전트/);
    // Linear variables include pokit:gap label
    assert.match(d.description, /labels: pokit:gap/);
    // source = retro for retro-check origin
    assert.match(d.description, /source: retro/);
    // plan shape (planCreateIssue contract)
    assert.equal(d.plan.writes.length, 1);
    assert.equal(d.plan.writes[0].type, "create_issue");
    // dry-run: no issue returned
    assert.equal(d.issue, undefined);
  }

  // idempotency keys differ per gap
  assert.notEqual(dispatched[0].plan.idempotencyKey, dispatched[1].plan.idempotencyKey);
  assert.match(dispatched[0].plan.idempotencyKey, /^linear:create_issue:/);
});

test("dispatchGapsToLinear description includes the gap's note in AS-IS and references retro-check command in 성공 검증", async () => {
  const { dispatchGapsToLinear } = await load();
  const gaps = [
    { category: "partial", note: "v0.14.0 \"renderLinearBacklogDescription\" wiring only partial (grep hits=2 < expected 5)." },
  ];
  const [d] = await dispatchGapsToLinear("0.14.0", gaps, { dryRun: true });
  assert.match(d.description, /renderLinearBacklogDescription/);
  assert.match(d.description, /pokit retro-check 0\.14\.0/);
  assert.match(d.description, /memory\/releases\/v0\.14\.0\.yaml/);
});

test("runRetroCheckCli with injected readers produces report and dispatches in dry-run by default", async () => {
  const { runRetroCheckCli } = await load();
  const manifest = baseManifest();
  const result = await runRetroCheckCli({
    version: "0.14.0",
    readManifest: async () => manifest,
    countProductionHits: async (id) => {
      if (id === "memory_index") return 0;
      if (id === "renderLinearBacklogDescription") return 4;
      if (id === "collected_sweep_writer") return 3;
      return 0;
    },
  });
  // structural for memory_index (intended, no actual, 0 hits)
  // ok for collected_sweep_writer (actual + hits)
  // partial for renderLinearBacklogDescription (intended, !actual, hits>0)
  const cats = new Set(result.report.gaps.map((g) => g.category));
  assert.ok(cats.has("structural"));
  assert.ok(cats.has("partial"));
  assert.equal(result.dispatched.length, result.report.gaps.length);
  for (const d of result.dispatched) {
    assert.equal(d.issue, undefined, "dry-run should not apply");
  }
});

test("runRetroCheckCli with noDispatch returns report only, no plans built", async () => {
  const { runRetroCheckCli } = await load();
  const result = await runRetroCheckCli({
    version: "0.14.0",
    noDispatch: true,
    readManifest: async () => baseManifest(),
    countProductionHits: async () => 0,
  });
  assert.ok(result.report.gaps.length > 0);
  assert.equal(result.dispatched.length, 0);
});
