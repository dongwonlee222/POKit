import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadModule() {
  return import(`../../scripts/internal/release-index.ts?cacheBust=${Date.now()}`);
}

function setup(version) {
  const root = mkdtempSync(join(tmpdir(), "pokit-idx-"));
  const dir = join(root, "releases", version);
  mkdirSync(dir, { recursive: true });
  return { root, dir };
}

function writeManifest(dir, body) {
  writeFileSync(join(dir, "manifest.yaml"), body);
}

test("renderReleaseIndex with empty issues + no artifacts", async () => {
  const { renderReleaseIndex } = await loadModule();
  const { root, dir } = setup("v0.99.0");
  try {
    writeManifest(
      dir,
      `version: 0.99.0\nreleased_at: "2026-01-01T00:00:00.000Z"\ncycle_id: n/a\nissues: []\nchangelog:\n  - "first"\nartifacts:\n  code_paths: []\n  doc_paths: []\n  skills: []\nwiring_status:\n  intended: []\n  actual: []\n  gaps: []\n`,
    );
    const out = renderReleaseIndex("v0.99.0", root);
    assert.match(out, /# v0\.99\.0 — Release INDEX/);
    assert.match(out, /manifest issues 비어 있음/);
    assert.match(out, /first/);
    assert.match(out, /이관된 산출물 없음/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderReleaseIndex lists Done vs in-progress issues separately", async () => {
  const { renderReleaseIndex } = await loadModule();
  const { root, dir } = setup("v0.99.1");
  try {
    writeManifest(
      dir,
      `version: 0.99.1\nreleased_at: "2026-01-01T00:00:00.000Z"\ncycle_id: c1\nissues:\n  - id: POKIT-1\n    title: alpha\n    state: Done\n    type: feature\n  - id: POKIT-2\n    title: beta\n    state: InProgress\n    type: fix\nchangelog: []\nartifacts:\n  code_paths: []\n  doc_paths: []\n  skills: []\nwiring_status:\n  intended: []\n  actual: []\n  gaps: []\n`,
    );
    const out = renderReleaseIndex("v0.99.1", root);
    assert.match(out, /✅.*POKIT-1.*alpha/);
    assert.match(out, /🔄 진행 중 \/ 미완/);
    assert.match(out, /POKIT-2.*beta/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderReleaseIndex includes artifact links", async () => {
  const { renderReleaseIndex } = await loadModule();
  const { root, dir } = setup("v0.99.2");
  try {
    writeManifest(
      dir,
      `version: 0.99.2\nreleased_at: "2026-01-01T00:00:00.000Z"\ncycle_id: c1\nissues: []\nchangelog: []\nartifacts:\n  code_paths: []\n  doc_paths: []\n  skills: []\nwiring_status:\n  intended: []\n  actual: []\n  gaps: []\n`,
    );
    mkdirSync(join(dir, "backlog-raw"), { recursive: true });
    writeFileSync(join(dir, "backlog-raw", "bl-001.md"), "raw");
    mkdirSync(join(dir, "prds"), { recursive: true });
    writeFileSync(join(dir, "prds", "POKIT-9.md"), "prd");
    const out = renderReleaseIndex("v0.99.2", root);
    assert.match(out, /### PRDs \(1\)/);
    assert.match(out, /\[POKIT-9\.md\]\(\.\/prds\/POKIT-9\.md\)/);
    assert.match(out, /### Backlog \(raw\) \(1\)/);
    assert.match(out, /bl-001\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeReleaseIndex creates INDEX.md file", async () => {
  const { writeReleaseIndex } = await loadModule();
  const { root, dir } = setup("v0.99.3");
  try {
    writeManifest(
      dir,
      `version: 0.99.3\nreleased_at: "2026-01-01T00:00:00.000Z"\ncycle_id: c1\nissues: []\nchangelog: []\nartifacts:\n  code_paths: []\n  doc_paths: []\n  skills: []\nwiring_status:\n  intended: []\n  actual: []\n  gaps: []\n`,
    );
    const path = writeReleaseIndex("v0.99.3", root);
    assert.match(path, /releases\/v0\.99\.3\/INDEX\.md$/);
    const body = readFileSync(path, "utf8");
    assert.match(body, /# v0\.99\.3/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderReleaseIndex throws on missing manifest", async () => {
  const { renderReleaseIndex } = await loadModule();
  const { root } = setup("v0.99.4");
  try {
    assert.throws(() => renderReleaseIndex("v0.99.4", root), /manifest not found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
