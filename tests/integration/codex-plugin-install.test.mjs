import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstat, mkdtemp, readFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../..");
const INSTALLER = join(PROJECT_ROOT, "bin", "install-codex-plugin");

async function tempHome() {
  return mkdtemp(join(tmpdir(), "pokit-codex-home-"));
}

function runInstaller(home) {
  return spawnSync(INSTALLER, [], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
    },
  });
}

test("install-codex-plugin enables pokit local plugin in an empty home", async () => {
  const home = await tempHome();
  const result = runInstaller(home);

  assert.equal(result.status, 0, `stderr:\n${result.stderr}\nstdout:\n${result.stdout}`);
  assert.match(result.stdout, /POKit Codex plugin install ok/);
  assert.match(result.stdout, /\$pokit-start/);

  const config = await readFile(join(home, ".codex/config.toml"), "utf8");
  assert.match(config, /\[marketplaces\.pokit-local\]/);
  assert.match(config, /source = "\/Users\/dongwon\.lee\/PoKit"/);
  assert.match(config, /\[plugins\."pokit@pokit-local"\]/);
  assert.match(config, /enabled = true/);

  const linkPath = join(home, ".codex/plugins/cache/pokit-local/pokit/local");
  const linkStat = await lstat(linkPath);
  assert.ok(linkStat.isSymbolicLink(), "installed plugin cache entry must be a symlink");
  assert.equal(await realpath(linkPath), join(PROJECT_ROOT, "plugins/pokit"));
});

test("install-codex-plugin is idempotent and re-enables a disabled plugin", async () => {
  const home = await tempHome();
  const first = runInstaller(home);
  assert.equal(first.status, 0, first.stderr);

  const configPath = join(home, ".codex/config.toml");
  const disabled = (await readFile(configPath, "utf8")).replace(
    /\[plugins\."pokit@pokit-local"\]\nenabled = true/,
    '[plugins."pokit@pokit-local"]\nenabled = false',
  );
  await import("node:fs/promises").then(({ writeFile }) => writeFile(configPath, disabled));

  const second = runInstaller(home);
  assert.equal(second.status, 0, second.stderr);

  const config = await readFile(configPath, "utf8");
  assert.equal((config.match(/\[marketplaces\.pokit-local\]/g) ?? []).length, 1);
  assert.equal((config.match(/\[plugins\."pokit@pokit-local"\]/g) ?? []).length, 1);
  assert.match(config, /\[plugins\."pokit@pokit-local"\]\nenabled = true/);
});
