import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function load() {
  return import(`../../scripts/internal/release-manifest.ts?cacheBust=${Date.now()}`);
}

function sampleManifest(overrides = {}) {
  return {
    version: "0.16.0",
    released_at: "2026-05-17T12:34:56Z",
    cycle_id: "2026-W20",
    issues: [
      { id: "POKIT-167", title: "release dispatcher", state: "Done", type: "feature" },
      { id: "POKIT-168", title: "fix yaml writer trailing newline", state: "Done", type: "fix" },
    ],
    changelog: [
      "feat: release manifest writer",
      "fix: yaml trailing newline",
    ],
    artifacts: {
      code_paths: ["scripts/internal/release-manifest.ts"],
      doc_paths: ["releases/SCHEMA.md"],
      skills: [],
    },
    wiring_status: {
      intended: ["release_dispatcher"],
      actual: ["release_dispatcher"],
      gaps: [
        { category: "partial", note: "backfill T10 still pending" },
      ],
    },
    ...overrides,
  };
}

test("release manifest round-trips through render → parse", async () => {
  const { renderReleaseManifest, parseReleaseManifest } = await load();
  const manifest = sampleManifest();
  const yaml = renderReleaseManifest(manifest);
  const parsed = parseReleaseManifest(yaml);
  assert.deepEqual(parsed, manifest);
});

test("renderReleaseManifest ends with a single trailing newline and stable key order", async () => {
  const { renderReleaseManifest } = await load();
  const yaml = renderReleaseManifest(sampleManifest());
  assert.equal(yaml.endsWith("\n"), true);
  assert.equal(yaml.endsWith("\n\n"), false);
  const order = ["version:", "released_at:", "cycle_id:", "issues:", "changelog:", "artifacts:", "wiring_status:"];
  let cursor = 0;
  for (const key of order) {
    const idx = yaml.indexOf(key, cursor);
    assert.notEqual(idx, -1, `missing key ${key}`);
    cursor = idx;
  }
});

test("renderReleaseManifest emits optional fields only when present", async () => {
  const { renderReleaseManifest } = await load();
  const withOptional = renderReleaseManifest(
    sampleManifest({
      retro: { kept: ["bring own yaml"], problem: [], try: ["backfill"] },
      github_release_url: "https://github.com/x/y/releases/tag/v0.16.0",
      git_tag: "v0.16.0",
    }),
  );
  assert.match(withOptional, /retro:/);
  assert.match(withOptional, /github_release_url:/);
  assert.match(withOptional, /git_tag:/);

  const minimal = renderReleaseManifest(sampleManifest());
  assert.equal(/retro:/.test(minimal), false);
  assert.equal(/github_release_url:/.test(minimal), false);
  assert.equal(/git_tag:/.test(minimal), false);
});

test("parseReleaseManifest rejects invalid semver", async () => {
  const { parseReleaseManifest, renderReleaseManifest } = await load();
  // Render fails first because validation runs in render too.
  assert.throws(
    () => renderReleaseManifest(sampleManifest({ version: "v0.16" })),
    /invalid semver/,
  );
  const goodYaml = renderReleaseManifest(sampleManifest());
  const broken = goodYaml.replace("version: 0.16.0", "version: nope");
  assert.throws(() => parseReleaseManifest(broken), /invalid semver/);
});

test("parseReleaseManifest rejects missing required fields", async () => {
  const { parseReleaseManifest, renderReleaseManifest } = await load();
  const yaml = renderReleaseManifest(sampleManifest());
  const noCycle = yaml.replace(/cycle_id: .*\n/, "");
  assert.throws(() => parseReleaseManifest(noCycle), /cycle_id/);

  const noWiring = yaml.replace(/wiring_status:[\s\S]*?(?=\n[a-z]|$)/, "");
  assert.throws(() => parseReleaseManifest(noWiring), /wiring_status/);
});

test("parseReleaseManifest rejects unknown issue type and gap category", async () => {
  const { renderReleaseManifest } = await load();
  assert.throws(
    () =>
      renderReleaseManifest(
        sampleManifest({
          issues: [{ id: "POKIT-1", title: "x", state: "Done", type: "bogus" }],
        }),
      ),
    /invalid type/,
  );
  assert.throws(
    () =>
      renderReleaseManifest(
        sampleManifest({
          wiring_status: {
            intended: [],
            actual: [],
            gaps: [{ category: "weird", note: "n" }],
          },
        }),
      ),
    /invalid category/,
  );
});

test("writeReleaseManifest writes to releases/v<version>/manifest.yaml and is idempotent", async () => {
  const { writeReleaseManifest, parseReleaseManifest } = await load();
  const root = await mkdtemp(join(tmpdir(), "release-manifest-"));
  try {
    const manifest = sampleManifest();
    const path1 = await writeReleaseManifest("0.16.0", manifest, root);
    const path2 = await writeReleaseManifest("0.16.0", manifest, root);
    assert.equal(path1, path2);
    assert.equal(path1, join(root, "releases", "v0.16.0", "manifest.yaml"));
    const body1 = await readFile(path1, "utf8");
    const body2 = await readFile(path2, "utf8");
    assert.equal(body1, body2);
    const reparsed = parseReleaseManifest(body1);
    assert.deepEqual(reparsed, manifest);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parseChangelogSection: header line date suffix is not a bullet", async () => {
  const { parseChangelogSection } = await load();
  const root = await mkdtemp(join(tmpdir(), "changelog-test-"));
  try {
    await writeFile(
      join(root, "CHANGELOG.md"),
      "## v0.15.3 - 2026-05-15\n\n- 실제 첫 bullet\n- 두 번째 bullet\n",
    );
    const bullets = parseChangelogSection(root, "0.15.3");
    assert.deepEqual(bullets, ["실제 첫 bullet", "두 번째 bullet"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parseChangelogSection: header with parenthesized date is not a bullet", async () => {
  const { parseChangelogSection } = await load();
  const root = await mkdtemp(join(tmpdir(), "changelog-test-"));
  try {
    await writeFile(
      join(root, "CHANGELOG.md"),
      "## v0.15.3 (2026-05-15)\n\n- 실제 첫 bullet\n- 두 번째 bullet\n",
    );
    const bullets = parseChangelogSection(root, "0.15.3");
    assert.deepEqual(bullets, ["실제 첫 bullet", "두 번째 bullet"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parseChangelogSection: header only (no bullets) returns empty array", async () => {
  const { parseChangelogSection } = await load();
  const root = await mkdtemp(join(tmpdir(), "changelog-test-"));
  try {
    await writeFile(
      join(root, "CHANGELOG.md"),
      "## v0.15.3 - 2026-05-15\n",
    );
    const bullets = parseChangelogSection(root, "0.15.3");
    assert.deepEqual(bullets, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("writeReleaseManifest rejects when arg version mismatches manifest.version", async () => {
  const { writeReleaseManifest } = await load();
  const root = await mkdtemp(join(tmpdir(), "release-manifest-mismatch-"));
  try {
    await assert.rejects(
      () => writeReleaseManifest("0.99.0", sampleManifest(), root),
      /does not match/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// ---------- A2 (POKIT-178) — extractIntendedWiring 단위 테스트 ----------

test("extractIntendedWiring: 백틱 camelCase 식별자 추출", async () => {
  const { extractIntendedWiring } = await load();
  const prd = "기능: `buildReleaseManifest` 와 `renderLinearBacklogDescription` 호출.";
  const changelog = "- `parseChangelogSection` 헬퍼 추가.";
  const result = extractIntendedWiring(prd, changelog);
  assert.ok(result.includes("buildReleaseManifest"), "buildReleaseManifest 추출");
  assert.ok(result.includes("renderLinearBacklogDescription"), "renderLinearBacklogDescription 추출");
  assert.ok(result.includes("parseChangelogSection"), "parseChangelogSection 추출");
});

test("extractIntendedWiring: 중복 제거 + 알파벳 정렬", async () => {
  const { extractIntendedWiring } = await load();
  const prd = "`buildFoo` 와 `applyBar` 사용. `buildFoo` 재언급.";
  const changelog = "`applyBar` 추가.";
  const result = extractIntendedWiring(prd, changelog);
  assert.deepEqual(result, ["applyBar", "buildFoo"]);
});

test("extractIntendedWiring: wiring intended 마커 다음 식별자 추출", async () => {
  const { extractIntendedWiring } = await load();
  const prd = "wiring intended: `planCreateIssue` `applyUpdateIssue`\n다음 줄.";
  const result = extractIntendedWiring(prd, "");
  assert.ok(result.includes("planCreateIssue"), "planCreateIssue 추출");
  assert.ok(result.includes("applyUpdateIssue"), "applyUpdateIssue 추출");
});

test("extractIntendedWiring: production 호출 마커 다음 줄 식별자 추출", async () => {
  const { extractIntendedWiring } = await load();
  const prd = "production 호출:\n`countProductionHits`";
  const result = extractIntendedWiring(prd, "");
  assert.ok(result.includes("countProductionHits"), "countProductionHits 추출");
});

test("extractIntendedWiring: false positive 회피 (플래그·경로·콜론·공백)", async () => {
  const { extractIntendedWiring } = await load();
  const text = [
    "- `--apply` 플래그",
    "- `--dry-run` 옵션",
    "- `tests/linear-update.test.mjs` 파일",
    "- `memory/releases/` 경로",
    "- `pokit:gap` 라벨",
    "- `./bin/pokit release 0.15.3` 명령",
    "- `node` 런타임",
    "- `releases/v0.15.3/manifest.yaml`",
  ].join("\n");
  const result = extractIntendedWiring(text, "");
  assert.deepEqual(result, [], `false positive: ${JSON.stringify(result)}`);
});

test("extractIntendedWiring: 코드 펜스 내부 식별자 무시", async () => {
  const { extractIntendedWiring } = await load();
  const text = "설명 본문.\n```typescript\nfunction buildFoo() {}\n```\n실제 참조: `applyBar`.";
  const result = extractIntendedWiring(text, "");
  assert.ok(!result.includes("buildFoo"), "코드 펜스 내 buildFoo 제외");
  assert.ok(result.includes("applyBar"), "인라인 applyBar 포함");
});

test("extractIntendedWiring: 빈 입력 → 빈 배열", async () => {
  const { extractIntendedWiring } = await load();
  const result = extractIntendedWiring("", "");
  assert.deepEqual(result, []);
});

test("extractIntendedWiring: v0.15.3 CHANGELOG 섹션에서 ≥ 2건 추출", async () => {
  const { extractIntendedWiring } = await load();
  // v0.15.3 CHANGELOG 섹션 발췌 (실제 데이터)
  const changelogSection = [
    "### Fixed",
    "",
    "- `scripts/cli/session-brief.ts` `buildUnresolvedCard` — 옛 경로 `memory/releases/v<X>.yaml` 하드코딩을 `releaseManifestPath()` 헬퍼 경유로 교체. POKIT-175(M6) 마이그레이션 직후 unresolved 카드 미렌더 버그 해소. (commit 408090e)",
    "",
    "### Added",
    "",
    "- 회귀 가드 (POKIT-173 회귀 방지) — 동일 클래스의 미래 버그 차단 (commit 07ed02c):",
    "  - `tests/session-brief.test.mjs` — `buildSessionBrief` start variant의 unresolved 카드 렌더 회귀 테스트 1건 신설.",
    "  - `docs/architecture/15-folder-layout.md` — `releases/` 항목 옆 가드 문구.",
    "",
    "### Notes",
    "",
    "- `./bin/pokit release 0.15.3` dispatcher [4/8]가 manifest를 **자동 생성** — POKIT-171(M2) `buildReleaseManifest` dogfood 검증.",
  ].join("\n");
  const result = extractIntendedWiring("", changelogSection);
  // buildUnresolvedCard, releaseManifestPath, buildSessionBrief, buildReleaseManifest 중 ≥ 2건
  assert.ok(result.length >= 2, `추출 건수 부족: ${JSON.stringify(result)}`);
  // 경로 패턴이 결과에 없어야 함
  assert.ok(!result.some((x) => x.includes("/")), `경로 false positive: ${JSON.stringify(result)}`);
});

test("buildReleaseManifest: changelogPath 통해 intended 자동 추출", async () => {
  const { buildReleaseManifest } = await load();
  const root = await mkdtemp(join(tmpdir(), "build-manifest-a2-"));
  try {
    await writeFile(
      join(root, "CHANGELOG.md"),
      "## v1.0.0\n\n- `buildFoo` 와 `applyBar` 추가.\n",
    );
    const manifest = buildReleaseManifest("1.0.0", {
      rootDir: root,
      changelogPath: join(root, "CHANGELOG.md"),
    });
    assert.ok(manifest.wiring_status.intended.includes("buildFoo"), "buildFoo 포함");
    assert.ok(manifest.wiring_status.intended.includes("applyBar"), "applyBar 포함");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("buildReleaseManifest: intendedManual과 자동 추출 merge (수동 우선)", async () => {
  const { buildReleaseManifest } = await load();
  const root = await mkdtemp(join(tmpdir(), "build-manifest-merge-"));
  try {
    await writeFile(
      join(root, "CHANGELOG.md"),
      "## v1.0.0\n\n- `buildFoo` 와 `applyBar` 추가.\n",
    );
    const manifest = buildReleaseManifest("1.0.0", {
      rootDir: root,
      changelogPath: join(root, "CHANGELOG.md"),
      intendedManual: ["manualFirst", "buildFoo"],
    });
    // manualFirst가 맨 앞 (수동 우선)
    assert.equal(manifest.wiring_status.intended[0], "manualFirst");
    // buildFoo 중복 없음
    assert.equal(manifest.wiring_status.intended.filter((x) => x === "buildFoo").length, 1);
    // applyBar도 포함 (자동 추출 추가)
    assert.ok(manifest.wiring_status.intended.includes("applyBar"), "applyBar 자동 추가");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
