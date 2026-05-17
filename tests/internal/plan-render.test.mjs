import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mkTempDir } from "../_setup/index.mjs";

const {
  parsePlanArgs,
  parseUnresolvedSection,
  readCarryOverFromManifest,
  renderPlanTable,
} = await import("../../scripts/internal/plan-render.ts");

test("parsePlanArgs: 기본 dry-run", () => {
  const opts = parsePlanArgs(["node", "plan.ts", "0.17.4"]);
  assert.equal(opts.version, "0.17.4");
  assert.equal(opts.dryRun, true);
  assert.equal(opts.apply, false);
  assert.deepEqual(opts.issues, []);
});

test("parsePlanArgs: --apply 시 dryRun=false", () => {
  const opts = parsePlanArgs(["node", "plan.ts", "0.17.4", "--apply"]);
  assert.equal(opts.apply, true);
  assert.equal(opts.dryRun, false);
});

test("parsePlanArgs: --issues 쉼표 분리", () => {
  const opts = parsePlanArgs([
    "node",
    "plan.ts",
    "0.17.4",
    "--issues",
    "POKIT-206,POKIT-209,POKIT-211",
  ]);
  assert.deepEqual(opts.issues, ["POKIT-206", "POKIT-209", "POKIT-211"]);
});

test("parsePlanArgs: --issues=A,B 등호 형식", () => {
  const opts = parsePlanArgs([
    "node",
    "plan.ts",
    "0.17.4",
    "--issues=POKIT-206,POKIT-209",
  ]);
  assert.deepEqual(opts.issues, ["POKIT-206", "POKIT-209"]);
});

test("parsePlanArgs: version 누락 시 throw exitCode=2", () => {
  assert.throws(() => parsePlanArgs(["node", "plan.ts"]), {
    exitCode: 2,
  });
});

test("parsePlanArgs: 잘못된 semver throw", () => {
  assert.throws(() => parsePlanArgs(["node", "plan.ts", "abc"]), {
    exitCode: 2,
  });
});

test("parseUnresolvedSection: owner=POKIT-XXX만 추출", () => {
  const raw = `version: 0.17.3
unresolved:
  - id: foo
    note: agent owner 항목
    owner: agent
  - id: pokit-159-retrieval-impl
    note: POKIT-159 retrieval 구현
    owner: POKIT-159
  - id: bar
    note: agent owner 항목
    owner: agent
artifacts:
  code_paths: []
`;
  const items = parseUnresolvedSection(raw);
  assert.equal(items.length, 1);
  assert.equal(items[0].issueId, "POKIT-159");
  assert.match(items[0].note, /retrieval 구현/);
});

test("parseUnresolvedSection: unresolved 섹션 없으면 빈 배열", () => {
  const raw = `version: 0.17.3
issues: []
`;
  assert.deepEqual(parseUnresolvedSection(raw), []);
});

test("parseUnresolvedSection: 인용된 owner 값 파싱", () => {
  const raw = `unresolved:
  - id: a
    note: x
    owner: "POKIT-206"
`;
  const items = parseUnresolvedSection(raw);
  assert.equal(items.length, 1);
  assert.equal(items[0].issueId, "POKIT-206");
});

test("readCarryOverFromManifest: 파일 없으면 빈 배열", () => {
  const dir = mkTempDir();
  const result = readCarryOverFromManifest(dir, "0.99.0");
  assert.deepEqual(result, []);
});

test("readCarryOverFromManifest: prevVersion=null 이면 빈 배열", () => {
  const dir = mkTempDir();
  assert.deepEqual(readCarryOverFromManifest(dir, null), []);
});

test("readCarryOverFromManifest: 실제 파일 fixture", () => {
  const dir = mkTempDir();
  const releaseDir = join(dir, "releases", "v0.17.3");
  mkdirSync(releaseDir, { recursive: true });
  writeFileSync(
    join(releaseDir, "manifest.yaml"),
    `version: 0.17.3
unresolved:
  - id: a
    note: agent stuff
    owner: agent
  - id: b
    note: pokit-211 carry
    owner: POKIT-211
`,
    "utf8",
  );
  const items = readCarryOverFromManifest(dir, "0.17.3");
  assert.equal(items.length, 1);
  assert.equal(items[0].issueId, "POKIT-211");
});

test("renderPlanTable: 빈 carry-over + fresh", () => {
  const out = renderPlanTable([], [], "0.17.4", "0.17.3");
  assert.match(out, /🎯 Planning gate — target: v0\.17\.4/);
  assert.match(out, /직전 release: v0\.17\.3/);
  assert.match(out, /총 0건 — carry-over 0 \/ fresh 0/);
});

test("renderPlanTable: carry-over + fresh 모두 있음", () => {
  const carryOver = [
    { id: "POKIT-159", title: "장기기억 retrieval", priority: "Medium" },
  ];
  const fresh = [
    { id: "POKIT-211", title: "lifecycle 관리", priority: "High" },
    { id: "POKIT-209", title: "active-rules hook 단계 추적" },
  ];
  const out = renderPlanTable(carryOver, fresh, "0.17.4", "0.17.3");
  assert.match(out, /POKIT-159\s+장기기억 retrieval/);
  assert.match(out, /POKIT-211\s+lifecycle 관리/);
  assert.match(out, /POKIT-209\s+active-rules hook 단계 추적/);
  assert.match(out, /총 3건 — carry-over 1 \/ fresh 2/);
});

test("renderPlanTable: prevVersion=null 시 n/a 표기", () => {
  const out = renderPlanTable([], [], "0.17.4", null);
  assert.match(out, /carry-over from n\/a/);
});
