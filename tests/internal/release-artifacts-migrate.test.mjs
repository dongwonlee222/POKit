import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadModule() {
  return import(`../../scripts/internal/release-artifacts-migrate.ts?cacheBust=${Date.now()}`);
}

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), "pokit-mig-"));
  mkdirSync(join(root, "artifacts/prds"), { recursive: true });
  mkdirSync(join(root, "artifacts/criteria"), { recursive: true });
  mkdirSync(join(root, "artifacts/backlog/v0.16.0"), { recursive: true });
  mkdirSync(join(root, "memory/backlog-raw"), { recursive: true });
  mkdirSync(join(root, "releases/v0.16.0"), { recursive: true });
  return root;
}

test("planMigration matches by linked_release", async () => {
  const { planMigration } = await loadModule();
  const root = makeRoot();
  try {
    const p = join(root, "artifacts/prds/POKIT-100.md");
    writeFileSync(p, `---\nkind: memo\nlinked_release: "v0.16.0"\n---\nbody\n`);
    const plans = planMigration("v0.16.0", root);
    assert.equal(plans.length, 1);
    assert.equal(plans[0].matchedBy, "linked_release");
    assert.equal(plans[0].category, "prds");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planMigration matches by target_version on backlog-raw", async () => {
  const { planMigration } = await loadModule();
  const root = makeRoot();
  try {
    const p = join(root, "memory/backlog-raw/bl-001.md");
    writeFileSync(p, `---\nid: bl-001\ntarget_version: v0.16.0\n---\nbody\n`);
    const plans = planMigration("v0.16.0", root);
    assert.equal(plans.length, 1);
    assert.equal(plans[0].matchedBy, "target_version");
    assert.equal(plans[0].category, "backlog-raw");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planMigration matches by parent-dir for artifacts/backlog/vX/", async () => {
  const { planMigration } = await loadModule();
  const root = makeRoot();
  try {
    const p = join(root, "artifacts/backlog/v0.16.0/A1-memo.md");
    writeFileSync(p, `---\nkind: memo\n---\nbody\n`);
    const plans = planMigration("v0.16.0", root);
    assert.equal(plans.length, 1);
    assert.equal(plans[0].matchedBy, "parent-dir");
    assert.equal(plans[0].category, "backlog");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planMigration skips README and non-matching versions", async () => {
  const { planMigration } = await loadModule();
  const root = makeRoot();
  try {
    writeFileSync(join(root, "artifacts/backlog/v0.16.0/README.md"), "readme");
    writeFileSync(
      join(root, "artifacts/backlog/v0.16.0/A1.md"),
      `---\nkind: memo\nlinked_release: "v0.99.0"\n---\nbody\n`,
    );
    const plans = planMigration("v0.16.0", root);
    // README skipped; A1 has linked_release=v0.99.0 (highest priority) so does NOT match v0.16.0
    assert.equal(plans.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("migrateArtifactsToRelease dryRun does not move files", async () => {
  const { migrateArtifactsToRelease } = await loadModule();
  const root = makeRoot();
  try {
    const src = join(root, "artifacts/backlog/v0.16.0/A1.md");
    writeFileSync(src, `---\nkind: memo\n---\nbody\n`);
    const r = migrateArtifactsToRelease("v0.16.0", { rootDir: root, dryRun: true });
    assert.equal(r.moved.length, 1);
    assert.ok(existsSync(src), "source should still exist in dry-run");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("migrateArtifactsToRelease actually moves files", async () => {
  const { migrateArtifactsToRelease } = await loadModule();
  const root = makeRoot();
  try {
    const src = join(root, "artifacts/backlog/v0.16.0/A1.md");
    writeFileSync(src, `---\nkind: memo\n---\nbody\n`);
    const r = migrateArtifactsToRelease("v0.16.0", { rootDir: root, dryRun: false });
    assert.equal(r.moved.length, 1);
    assert.equal(existsSync(src), false);
    assert.ok(existsSync(join(root, "releases/v0.16.0/backlog/A1.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("migrateArtifactsToRelease skips when target file exists", async () => {
  const { migrateArtifactsToRelease } = await loadModule();
  const root = makeRoot();
  try {
    const src = join(root, "artifacts/backlog/v0.16.0/A1.md");
    writeFileSync(src, `---\nkind: memo\n---\nbody\n`);
    mkdirSync(join(root, "releases/v0.16.0/backlog"), { recursive: true });
    writeFileSync(join(root, "releases/v0.16.0/backlog/A1.md"), "existing");
    const r = migrateArtifactsToRelease("v0.16.0", { rootDir: root });
    assert.equal(r.moved.length, 0);
    assert.equal(r.skipped.length, 1);
    assert.ok(existsSync(src), "source preserved when target exists");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("priority: linked_release > target_version > parent-dir", async () => {
  const { planMigration } = await loadModule();
  const root = makeRoot();
  try {
    // linked_release=v0.16.0, parent=v0.15.0 → matches v0.16.0
    mkdirSync(join(root, "artifacts/backlog/v0.15.0"), { recursive: true });
    writeFileSync(
      join(root, "artifacts/backlog/v0.15.0/X.md"),
      `---\nkind: memo\nlinked_release: "v0.16.0"\n---\n`,
    );
    const plans16 = planMigration("v0.16.0", root);
    assert.equal(plans16.length, 1);
    assert.equal(plans16[0].matchedBy, "linked_release");

    const plans15 = planMigration("v0.15.0", root);
    assert.equal(plans15.length, 0, "should not match v0.15.0 because linked_release wins");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
