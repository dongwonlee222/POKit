import { test } from "node:test";
import assert from "node:assert/strict";

async function load() {
  return await import("../../scripts/internal/wiring-probe.ts");
}

test("scanWiring returns empty actual for empty intended", async () => {
  const { scanWiring } = await load();
  const r = scanWiring([]);
  assert.deepEqual(r.actual, []);
  assert.deepEqual(r.hitCounts, {});
});

test("scanWiring counts production hits and gates actual by threshold", async () => {
  const { scanWiring } = await load();
  // "renderLinearBacklogDescription"은 production에 사용 중. 실제 grep 결과 >= 1.
  // "totally_nonexistent_wiring_xyz_id_2026"는 production에 0건.
  const r = scanWiring(
    ["renderLinearBacklogDescription", "totally_nonexistent_wiring_xyz_id_2026"],
    { threshold: 1 },
  );
  assert.ok(r.hitCounts.renderLinearBacklogDescription >= 1, "render probe should find production hits");
  assert.equal(r.hitCounts.totally_nonexistent_wiring_xyz_id_2026, 0);
  assert.ok(r.actual.includes("renderLinearBacklogDescription"));
  assert.ok(!r.actual.includes("totally_nonexistent_wiring_xyz_id_2026"));
});

test("scanWiring threshold gates actual stricter when raised", async () => {
  const { scanWiring } = await load();
  const r = scanWiring(["renderLinearBacklogDescription"], { threshold: 9999 });
  // 실 production hit 9999 이상은 불가능 — actual 빈 배열.
  assert.deepEqual(r.actual, []);
});
