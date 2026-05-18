import { existsSync } from "node:fs";
import { chmod, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MARKETPLACE_NAME = "pokit-local";
const PLUGIN_KEY = 'pokit@pokit-local';

function projectRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..");
}

function homeDir(): string {
  const home = process.env.HOME;
  if (!home) {
    throw new Error("HOME is not set; cannot locate ~/.codex/config.toml.");
  }
  return home;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function removeTomlBlock(content: string, header: string): string {
  const lines = content.split(/\r?\n/);
  const output: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() !== header) {
      output.push(lines[i]);
      continue;
    }
    i += 1;
    while (i < lines.length && !/^\s*\[.+\]\s*$/.test(lines[i])) {
      i += 1;
    }
    i -= 1;
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

function appendBlock(content: string, block: string): string {
  const trimmed = content.trimEnd();
  return `${trimmed ? `${trimmed}\n\n` : ""}${block.trimEnd()}\n`;
}

async function upsertCodexConfig(configPath: string, rootDir: string): Promise<void> {
  const existing = existsSync(configPath) ? await readFile(configPath, "utf8") : "";
  let next = existing;
  next = removeTomlBlock(next, `[marketplaces.${MARKETPLACE_NAME}]`);
  next = removeTomlBlock(next, `[plugins."${PLUGIN_KEY}"]`);
  next = appendBlock(
    next,
    [
      `[marketplaces.${MARKETPLACE_NAME}]`,
      `last_updated = ${tomlString(new Date().toISOString().replace(/\.\d{3}Z$/, "Z"))}`,
      `source_type = "local"`,
      `source = ${tomlString(rootDir)}`,
      "",
      `[plugins."${PLUGIN_KEY}"]`,
      "enabled = true",
    ].join("\n"),
  );
  await writeFile(configPath, next);
}

async function installCliWrapper(home: string, rootDir: string): Promise<string> {
  const binDir = join(home, ".local", "bin");
  const wrapperPath = join(binDir, "pokit");
  await mkdir(binDir, { recursive: true });
  await writeFile(
    wrapperPath,
    [
      "#!/usr/bin/env bash",
      `exec "${join(rootDir, "bin", "pokit")}" "$@"`,
      "",
    ].join("\n"),
  );
  await chmod(wrapperPath, 0o755);
  return wrapperPath;
}

async function install(): Promise<void> {
  const rootDir = projectRoot();
  const pluginRoot = join(rootDir, "plugins", "pokit");
  const pluginManifest = join(pluginRoot, ".codex-plugin", "plugin.json");
  const marketplace = join(rootDir, ".agents", "plugins", "marketplace.json");

  if (!existsSync(pluginManifest)) {
    throw new Error(`Missing POKit plugin manifest: ${pluginManifest}`);
  }
  if (!existsSync(marketplace)) {
    throw new Error(`Missing POKit marketplace: ${marketplace}`);
  }

  const codexDir = join(homeDir(), ".codex");
  const cacheDir = join(codexDir, "plugins", "cache", MARKETPLACE_NAME, "pokit");
  const cacheLink = join(cacheDir, "local");
  await mkdir(cacheDir, { recursive: true });
  await rm(cacheLink, { force: true, recursive: true });
  await symlink(pluginRoot, cacheLink, "dir");

  const configPath = join(codexDir, "config.toml");
  await mkdir(dirname(configPath), { recursive: true });
  await upsertCodexConfig(configPath, rootDir);
  const cliWrapper = await installCliWrapper(homeDir(), rootDir);

  console.log("POKit Codex plugin install ok");
  console.log(`- marketplace: ${MARKETPLACE_NAME}`);
  console.log(`- plugin: ${PLUGIN_KEY}`);
  console.log(`- cache: ${cacheLink}`);
  console.log(`- cli: ${cliWrapper}`);
  console.log("");
  console.log("Next:");
  console.log("1. Restart Codex or open a new thread.");
  console.log("2. Try: pokit start");
  console.log("3. Or in Codex plugin mode: $pokit-start");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await install();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`POKit Codex plugin install failed: ${message}`);
    process.exit(1);
  }
}
