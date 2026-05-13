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
  return import(`../scripts/profile.ts?cacheBust=${moduleLoadCount}`);
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
    "  pokit:",
    "    linear_team_key: POKIT",
    "    memory_dir: memory/profiles/pokit",
    "    artifacts_dir: artifacts/profiles/pokit",
    "",
  ].join("\n"));
  process.chdir(tempDir);
  process.env.POKIT_PROFILE = "pokit";
  delete process.env.LINEAR_TEAM_ID;
  delete process.env.LINEAR_TEAM_KEY;
  const { getActiveProfile, profileArtifactPath, profileMemoryPath } = await loadProfileModule();

  assert.deepEqual(getActiveProfile(), {
    name: "pokit",
    configured: true,
    linearTeamId: undefined,
    linearTeamKey: "POKIT",
    memoryDir: "memory/profiles/pokit",
    artifactsDir: "artifacts/profiles/pokit",
  });
  assert.equal(profileArtifactPath("sprints", "Cycle-1"), "artifacts/profiles/pokit/sprints/Cycle-1");
  assert.equal(profileMemoryPath("resume-brief.md"), "memory/profiles/pokit/resume-brief.md");
});

test("getActiveProfile routes evmodu profile to the EVMODU team key", async () => {
  const tempDir = join(tmpdir(), `pokit-profile-evmodu-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  await writeFile(join(tempDir, "pokit.config.yaml"), [
    "profiles:",
    "  evmodu:",
    "    linear_team_key: EVMODU",
    "    memory_dir: memory/profiles/evmodu",
    "    artifacts_dir: artifacts/profiles/evmodu",
    "",
  ].join("\n"));
  process.chdir(tempDir);
  process.env.POKIT_PROFILE = "evmodu";
  delete process.env.LINEAR_TEAM_ID;
  delete process.env.LINEAR_TEAM_KEY;
  const { getActiveProfile } = await loadProfileModule();

  assert.deepEqual(getActiveProfile(), {
    name: "evmodu",
    configured: true,
    linearTeamId: undefined,
    linearTeamKey: "EVMODU",
    memoryDir: "memory/profiles/evmodu",
    artifactsDir: "artifacts/profiles/evmodu",
  });
});
