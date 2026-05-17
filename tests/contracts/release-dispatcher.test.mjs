// POKIT-167 G3/T11 — release dispatcher smoke test (--dry-run).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..");

test("./bin/pokit release <version> --dry-run prints 8 steps without exec", () => {
  const r = spawnSync("./bin/pokit", ["release", "0.15.1", "--dry-run"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `exit code = ${r.status}, stderr=${r.stderr}`);
  for (const marker of ["[1/8]", "[2/8]", "[3/8]", "[4/8]", "[5/8]", "[6/8]", "[7/8]", "[8/8]", "✓ Release v0.15.1 완료"]) {
    assert.ok(r.stdout.includes(marker), `missing marker "${marker}" in stdout`);
  }
});

test("./bin/pokit release rejects invalid semver", () => {
  const r = spawnSync("./bin/pokit", ["release", "not-a-semver", "--dry-run"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /not valid semver/);
});

test("./bin/pokit release without version arg prints usage", () => {
  const r = spawnSync("./bin/pokit", ["release"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /usage: pokit release/);
});
