import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const originalEnv = { ...process.env };
const originalCwd = process.cwd();
let moduleLoadCount = 0;

async function loadProfileModule() {
  moduleLoadCount += 1;
  return import(`../../scripts/internal/profile.ts?cacheBust=${moduleLoadCount}`);
}

test.afterEach(() => {
  process.env = { ...originalEnv };
  process.chdir(originalCwd);
});

test("getActiveProfile returns default paths when no profile is selected", async () => {
  const tempDir = join(tmpdir(), `pokit-profile-default-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  process.chdir(tempDir);
  delete process.env.POKIT_PROFILE;
  delete process.env.LINEAR_TEAM_ID;
  process.env.LINEAR_TEAM_KEY = "EVM";
  const { getActiveProfile } = await loadProfileModule();

  assert.deepEqual(getActiveProfile(), {
    name: "default",
    configured: false,
    linearTeamId: undefined,
    linearTeamKey: "EVM",
    memoryDir: "memory",
    artifactsDir: "artifacts",
  });
});

test("getActiveProfile reads team and storage paths from pokit.config.yaml", async () => {
  const tempDir = join(tmpdir(), `pokit-profile-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  await writeFile(join(tempDir, "pokit.config.yaml"), [
    "profiles:",
    "  product_a:",
    "    linear_team_key: PRODA",
    "    memory_dir: memory/profiles/product-a",
    "    artifacts_dir: artifacts/profiles/product-a",
    "",
  ].join("\n"));
  process.chdir(tempDir);
  process.env.POKIT_PROFILE = "product_a";
  delete process.env.LINEAR_TEAM_ID;
  delete process.env.LINEAR_TEAM_KEY;
  const { getActiveProfile, profileArtifactPath, profileMemoryPath } = await loadProfileModule();

  assert.deepEqual(getActiveProfile(), {
    name: "product_a",
    configured: true,
    linearTeamId: undefined,
    linearTeamKey: "PRODA",
    memoryDir: "memory/profiles/product-a",
    artifactsDir: "artifacts/profiles/product-a",
  });
  assert.equal(profileArtifactPath("sprints", "Cycle-1"), "artifacts/profiles/product-a/sprints/Cycle-1");
  assert.equal(profileMemoryPath("resume-brief.md"), "memory/profiles/product-a/resume-brief.md");
});

test("getActiveProfile reads private profiles from pokit.local.config.yaml", async () => {
  const tempDir = join(tmpdir(), `pokit-profile-local-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  await writeFile(join(tempDir, "pokit.local.config.yaml"), [
    "profiles:",
    "  private_product:",
    "    linear_team_key: PRIV",
    "    memory_dir: memory/profiles/private-product",
    "    artifacts_dir: artifacts/profiles/private-product",
    "",
  ].join("\n"));
  process.chdir(tempDir);
  process.env.POKIT_PROFILE = "private_product";
  delete process.env.LINEAR_TEAM_ID;
  delete process.env.LINEAR_TEAM_KEY;
  const { getActiveProfile } = await loadProfileModule();

  assert.deepEqual(getActiveProfile(), {
    name: "private_product",
    configured: true,
    linearTeamId: undefined,
    linearTeamKey: "PRIV",
    memoryDir: "memory/profiles/private-product",
    artifactsDir: "artifacts/profiles/private-product",
  });
});

test("getActiveProfile lets selected profile override global Linear team env", async () => {
  const tempDir = join(tmpdir(), `pokit-profile-env-override-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  await writeFile(join(tempDir, "pokit.local.config.yaml"), [
    "profiles:",
    "  private_product:",
    "    linear_team_key: PRIV",
    "    memory_dir: memory/profiles/private-product",
    "    artifacts_dir: artifacts/profiles/private-product",
    "",
  ].join("\n"));
  process.chdir(tempDir);
  process.env.POKIT_PROFILE = "private_product";
  process.env.LINEAR_TEAM_ID = "stale-shared-team-id";
  process.env.LINEAR_TEAM_KEY = "SHARED";
  const { getActiveProfile } = await loadProfileModule();

  assert.deepEqual(getActiveProfile(), {
    name: "private_product",
    configured: true,
    linearTeamId: undefined,
    linearTeamKey: "PRIV",
    memoryDir: "memory/profiles/private-product",
    artifactsDir: "artifacts/profiles/private-product",
  });
});

test("getActiveProfile explains how to fix an unconfigured selected profile", async () => {
  const tempDir = join(tmpdir(), `pokit-profile-missing-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  await writeFile(join(tempDir, "pokit.config.yaml"), [
    "language: ko-KR",
    "",
  ].join("\n"));
  process.chdir(tempDir);
  process.env.POKIT_PROFILE = "evmodu";
  delete process.env.LINEAR_TEAM_ID;
  delete process.env.LINEAR_TEAM_KEY;
  const { getActiveProfile } = await loadProfileModule();

  assert.throws(
    () => getActiveProfile(),
    new RegExp([
      "POKIT_PROFILE=evmodu is set but no matching profile is defined",
      "For single-team/default use, clear POKIT_PROFILE",
      "profiles:\\n  evmodu:",
    ].join("[\\s\\S]*"))
  );
});
