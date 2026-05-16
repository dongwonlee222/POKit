import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadModule() {
  return import(`../scripts/cli/collected-sweep.ts?cacheBust=${Date.now()}`);
}

// ---------------------------------------------------------------------------
// Helper: build a minimal temp rootDir with profile raw fixture files
// ---------------------------------------------------------------------------

async function makeRoot(profile = "test-profile") {
  const rootDir = await mkdtemp(join(tmpdir(), "pokit-sweep-"));
  const rawDir = join(rootDir, "artifacts", "profiles", profile, "collected", "raw");
  await mkdir(rawDir, { recursive: true });
  return { rootDir, rawDir };
}

async function writeRaw(rawDir, name, content = "data") {
  await writeFile(join(rawDir, name), content);
}

async function writeSidecar(rawDir, rawName, meta) {
  const lines = Object.entries(meta).map(([k, v]) => {
    if (typeof v === "boolean") return `${k}: ${v}`;
    if (typeof v === "string" && (v.includes(":") || v.includes("#")))
      return `${k}: "${v}"`;
    return `${k}: ${v}`;
  });
  await writeFile(join(rawDir, rawName + ".meta.yaml"), lines.join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// Test 1: sidecar 없는 raw 파일 감지
// ---------------------------------------------------------------------------

test("missing_sidecar: sidecar 없는 raw 파일을 정확히 감지한다", async () => {
  const { scanCollectedRaw, buildReport } = await loadModule();
  const { rootDir, rawDir } = await makeRoot();

  await writeRaw(rawDir, "data.csv");
  // sidecar 없음

  const entries = await scanCollectedRaw(rootDir);
  const report = buildReport(entries);

  assert.equal(report.missing_sidecar.length, 1);
  assert.ok(report.missing_sidecar[0].includes("data.csv"));
  assert.equal(report.expired_retention.length, 0);
  assert.equal(report.pii_raw_old.length, 0);
});

// ---------------------------------------------------------------------------
// Test 2: retention_until 지난 raw 파일 감지
// ---------------------------------------------------------------------------

test("expired_retention: retention 만료된 파일을 감지한다", async () => {
  const { scanCollectedRaw, buildReport } = await loadModule();
  const { rootDir, rawDir } = await makeRoot();

  await writeRaw(rawDir, "old-data.json");
  await writeSidecar(rawDir, "old-data.json", {
    sensitivity: "low",
    contains_pii: false,
    retention_until: "2020-01-01",
    license: "internal-only",
    source: "test",
  });

  const entries = await scanCollectedRaw(rootDir);
  const report = buildReport(entries);

  assert.equal(report.expired_retention.length, 1);
  assert.ok(report.expired_retention[0].includes("old-data.json"));
  assert.equal(report.missing_sidecar.length, 0);
});

// ---------------------------------------------------------------------------
// Test 3: retention_until 아직 유효한 파일 — 만료 목록에 없어야 함
// ---------------------------------------------------------------------------

test("valid_retention: 만료 안 된 파일은 expired_retention에 포함되지 않는다", async () => {
  const { scanCollectedRaw, buildReport } = await loadModule();
  const { rootDir, rawDir } = await makeRoot();

  await writeRaw(rawDir, "current-data.csv");
  await writeSidecar(rawDir, "current-data.csv", {
    sensitivity: "medium",
    contains_pii: false,
    retention_until: "2099-12-31",
    license: "internal-only",
    source: "test",
  });

  const entries = await scanCollectedRaw(rootDir);
  const report = buildReport(entries);

  assert.equal(report.expired_retention.length, 0);
  assert.equal(report.missing_sidecar.length, 0);
  assert.equal(report.pii_raw_old.length, 0);
});

// ---------------------------------------------------------------------------
// Test 4: contains_pii=true + redaction_status=raw + 30일 이상 초과
// ---------------------------------------------------------------------------

test("pii_raw_old: PII raw 파일이 retention 30일+ 초과 시 플래그된다", async () => {
  const { scanCollectedRaw, buildReport } = await loadModule();
  const { rootDir, rawDir } = await makeRoot();

  await writeRaw(rawDir, "pii-data.csv");
  // retention_until을 60일 이상 과거로 설정 (pii_raw_old 조건: 30일 이상 초과)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 60);
  const pastStr = pastDate.toISOString().slice(0, 10);

  await writeSidecar(rawDir, "pii-data.csv", {
    sensitivity: "high",
    contains_pii: true,
    redaction_status: "raw",
    retention_until: pastStr,
    license: "internal-only",
    source: "test",
  });

  const entries = await scanCollectedRaw(rootDir);
  const report = buildReport(entries);

  assert.equal(report.pii_raw_old.length, 1);
  assert.ok(report.pii_raw_old[0].includes("pii-data.csv"));
});

// ---------------------------------------------------------------------------
// Test 5: contains_pii=true + redaction_status=raw 이지만 retention 최근 — 플래그 안됨
// ---------------------------------------------------------------------------

test("pii_raw_recent: PII raw 파일이 retention 30일 미만 초과면 pii_raw_old에 없다", async () => {
  const { scanCollectedRaw, buildReport } = await loadModule();
  const { rootDir, rawDir } = await makeRoot();

  await writeRaw(rawDir, "pii-new.csv");
  // retention_until을 10일 전으로 설정 (30일 미만)
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 10);
  const recentStr = recentDate.toISOString().slice(0, 10);

  await writeSidecar(rawDir, "pii-new.csv", {
    sensitivity: "high",
    contains_pii: true,
    redaction_status: "raw",
    retention_until: recentStr,
    license: "internal-only",
    source: "test",
  });

  const entries = await scanCollectedRaw(rootDir);
  const report = buildReport(entries);

  // 10일 전 = expired_retention에는 포함, pii_raw_old에는 미포함
  assert.equal(report.expired_retention.length, 1);
  assert.equal(report.pii_raw_old.length, 0);
});

// ---------------------------------------------------------------------------
// Test 6: 여러 케이스 혼합 — 복합 리포트
// ---------------------------------------------------------------------------

test("mixed: 복합 케이스에서 각 카테고리를 독립적으로 집계한다", async () => {
  const { scanCollectedRaw, buildReport } = await loadModule();
  const { rootDir, rawDir } = await makeRoot("mixed-profile");

  // 1) no sidecar
  await writeRaw(rawDir, "no-meta.txt");

  // 2) expired retention (non-PII)
  await writeRaw(rawDir, "expired.json");
  await writeSidecar(rawDir, "expired.json", {
    sensitivity: "low",
    contains_pii: false,
    retention_until: "2019-06-01",
    license: "internal-only",
    source: "test",
  });

  // 3) PII + raw + 60 days overdue
  await writeRaw(rawDir, "pii-old.csv");
  const past60 = new Date();
  past60.setDate(past60.getDate() - 60);
  await writeSidecar(rawDir, "pii-old.csv", {
    sensitivity: "critical",
    contains_pii: true,
    redaction_status: "raw",
    retention_until: past60.toISOString().slice(0, 10),
    license: "internal-only",
    source: "test",
  });

  // 4) valid file — no flags
  await writeRaw(rawDir, "clean.csv");
  await writeSidecar(rawDir, "clean.csv", {
    sensitivity: "low",
    contains_pii: false,
    retention_until: "2099-01-01",
    license: "internal-only",
    source: "test",
  });

  const entries = await scanCollectedRaw(rootDir);
  const report = buildReport(entries);

  assert.equal(report.missing_sidecar.length, 1);
  assert.ok(report.missing_sidecar[0].includes("no-meta.txt"));

  assert.ok(report.expired_retention.length >= 2); // expired.json + pii-old.csv (also expired)
  assert.ok(report.expired_retention.some((p) => p.includes("expired.json")));
  assert.ok(report.expired_retention.some((p) => p.includes("pii-old.csv")));

  assert.equal(report.pii_raw_old.length, 1);
  assert.ok(report.pii_raw_old[0].includes("pii-old.csv"));
});

// ---------------------------------------------------------------------------
// Test 7: JSON 출력 구조 — swept report의 필드 타입 확인
// ---------------------------------------------------------------------------

test("buildReport: 반환값에 expired_retention, missing_sidecar, pii_raw_old 배열이 있다", async () => {
  const { buildReport } = await loadModule();

  const report = buildReport([]);

  assert.ok(Array.isArray(report.expired_retention));
  assert.ok(Array.isArray(report.missing_sidecar));
  assert.ok(Array.isArray(report.pii_raw_old));
});

// ---------------------------------------------------------------------------
// Test 8: parseSimpleYaml — 기본 파싱 검증
// ---------------------------------------------------------------------------

test("parseSimpleYaml: boolean / string / quoted string을 올바르게 파싱한다", async () => {
  const { parseSimpleYaml } = await loadModule();

  const yaml = [
    "sensitivity: high",
    "contains_pii: true",
    'retention_until: "2025-12-31"',
    "license: internal-only",
    "source: some source text",
    "redaction_status: raw",
    "# this is a comment",
  ].join("\n");

  const result = parseSimpleYaml(yaml);

  assert.equal(result.sensitivity, "high");
  assert.equal(result.contains_pii, true);
  assert.equal(result.retention_until, "2025-12-31");
  assert.equal(result.license, "internal-only");
  assert.equal(result.source, "some source text");
  assert.equal(result.redaction_status, "raw");
});

// ---------------------------------------------------------------------------
// Test 9: .meta.yaml 파일 자체는 raw 파일로 취급하지 않는다
// ---------------------------------------------------------------------------

test("scanCollectedRaw: .meta.yaml 파일 자체는 raw 항목으로 처리하지 않는다", async () => {
  const { scanCollectedRaw, buildReport } = await loadModule();
  const { rootDir, rawDir } = await makeRoot("meta-only-profile");

  // sidecar만 있고 대응하는 raw 파일이 없는 경우
  await writeSidecar(rawDir, "ghost.csv", {
    sensitivity: "low",
    contains_pii: false,
    retention_until: "2099-01-01",
    license: "internal-only",
    source: "test",
  });

  const entries = await scanCollectedRaw(rootDir);
  const report = buildReport(entries);

  // ghost.csv 자체가 없으므로 어떤 항목도 리포트되지 않아야 함
  assert.equal(entries.length, 0);
  assert.equal(report.missing_sidecar.length, 0);
  assert.equal(report.expired_retention.length, 0);
});

// ---------------------------------------------------------------------------
// Test 10: _template 프로필은 스캔에서 제외된다
// ---------------------------------------------------------------------------

test("scanCollectedRaw: _template 프로필은 스캔에서 제외된다", async () => {
  const { scanCollectedRaw } = await loadModule();

  // Use project root as rootDir — _template exists but should be skipped
  const projectRoot = new URL("..", import.meta.url).pathname;
  const entries = await scanCollectedRaw(projectRoot);

  // All entries should NOT have _template in path
  for (const e of entries) {
    assert.ok(!e.displayPath.includes("_template"), `_template should be excluded: ${e.displayPath}`);
  }
});
