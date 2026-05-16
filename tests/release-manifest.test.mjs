import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function load() {
  return import(`../scripts/internal/release-manifest.ts?cacheBust=${Date.now()}`);
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
      doc_paths: ["memory/releases/SCHEMA.md"],
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

test("writeReleaseManifest writes to memory/releases/v<version>.yaml and is idempotent", async () => {
  const { writeReleaseManifest, parseReleaseManifest } = await load();
  const root = await mkdtemp(join(tmpdir(), "release-manifest-"));
  try {
    const manifest = sampleManifest();
    const path1 = await writeReleaseManifest("0.16.0", manifest, root);
    const path2 = await writeReleaseManifest("0.16.0", manifest, root);
    assert.equal(path1, path2);
    assert.equal(path1, join(root, "memory", "releases", "v0.16.0.yaml"));
    const body1 = await readFile(path1, "utf8");
    const body2 = await readFile(path2, "utf8");
    assert.equal(body1, body2);
    const reparsed = parseReleaseManifest(body1);
    assert.deepEqual(reparsed, manifest);
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
