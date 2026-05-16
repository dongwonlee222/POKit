import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type PokitProfile = {
  name: string;
  configured: boolean;
  linearTeamId?: string;
  linearTeamKey?: string;
  memoryDir: string;
  artifactsDir: string;
};

type ProfileConfig = {
  linearTeamId?: string;
  linearTeamKey?: string;
  memoryDir?: string;
  artifactsDir?: string;
};

const loadedEnvRoots = new Set<string>();
const SHARED_CONFIG_FILE = "pokit.config.yaml";
const LOCAL_CONFIG_FILE = "pokit.local.config.yaml";

export function loadDotEnvOnce(rootDir = process.cwd()): void {
  if (loadedEnvRoots.has(rootDir)) {
    return;
  }
  loadedEnvRoots.add(rootDir);
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) {
    return;
  }
  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = cleanConfigValue(rawValue);
  }
}

export function getActiveProfile(rootDir = process.cwd()): PokitProfile {
  loadDotEnvOnce(rootDir);
  const profileName = process.env.POKIT_PROFILE?.trim();
  if (!profileName) {
    return {
      name: "default",
      configured: false,
      linearTeamId: process.env.LINEAR_TEAM_ID,
      linearTeamKey: process.env.LINEAR_TEAM_KEY,
      memoryDir: "memory",
      artifactsDir: "artifacts",
    };
  }

  const profiles = readProfilesConfig(rootDir);
  const profile = profiles.get(profileName);
  if (!profile) {
    throw new Error(formatMissingProfileError(profileName, profiles));
  }
  return {
    name: profileName,
    configured: true,
    linearTeamId: profile.linearTeamId,
    linearTeamKey: profile.linearTeamKey,
    memoryDir: profile.memoryDir ?? `memory/profiles/${profileName}`,
    artifactsDir: profile.artifactsDir ?? `artifacts/profiles/${profileName}`,
  };
}

export function profileArtifactPath(...segments: string[]): string {
  return normalizePath(join(getActiveProfile().artifactsDir, ...segments));
}

export function profileMemoryPath(...segments: string[]): string {
  return normalizePath(join(getActiveProfile().memoryDir, ...segments));
}

function readProfilesConfig(rootDir: string): Map<string, ProfileConfig> {
  const sharedConfigPath = join(rootDir, SHARED_CONFIG_FILE);
  const localConfigPath = join(rootDir, LOCAL_CONFIG_FILE);
  if (!existsSync(sharedConfigPath) && !existsSync(localConfigPath)) {
    throw new Error(`POKIT_PROFILE is set, but neither ${SHARED_CONFIG_FILE} nor ${LOCAL_CONFIG_FILE} was found.`);
  }
  const profiles = new Map<string, ProfileConfig>();
  if (existsSync(sharedConfigPath)) {
    mergeProfiles(profiles, parseProfilesConfig(readFileSync(sharedConfigPath, "utf8")));
  }
  if (existsSync(localConfigPath)) {
    mergeProfiles(profiles, parseProfilesConfig(readFileSync(localConfigPath, "utf8")));
  }
  return profiles;
}

export function parseProfilesConfig(contents: string): Map<string, ProfileConfig> {
  const profiles = new Map<string, ProfileConfig>();
  let insideProfiles = false;
  let currentName: string | undefined;

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) {
      continue;
    }
    if (/^\S/.test(line)) {
      insideProfiles = line.trim() === "profiles:";
      currentName = undefined;
      continue;
    }
    if (!insideProfiles) {
      continue;
    }
    const profileMatch = line.match(/^  ([A-Za-z0-9_-]+):\s*$/);
    if (profileMatch) {
      currentName = profileMatch[1];
      profiles.set(currentName, {});
      continue;
    }
    const fieldMatch = line.match(/^    ([A-Za-z0-9_]+):\s*(.*?)\s*$/);
    if (!fieldMatch || !currentName) {
      continue;
    }
    const profile = profiles.get(currentName);
    if (!profile) {
      continue;
    }
    const value = cleanConfigValue(fieldMatch[2]);
    if (fieldMatch[1] === "linear_team_id") {
      profile.linearTeamId = value;
    }
    if (fieldMatch[1] === "linear_team_key") {
      profile.linearTeamKey = value;
    }
    if (fieldMatch[1] === "memory_dir") {
      profile.memoryDir = value;
    }
    if (fieldMatch[1] === "artifacts_dir") {
      profile.artifactsDir = value;
    }
  }

  return profiles;
}

function cleanConfigValue(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function formatProfileOptions(profiles: Map<string, ProfileConfig>): string {
  return [...profiles.keys()].join(", ") || "none";
}

function formatMissingProfileError(profileName: string, profiles: Map<string, ProfileConfig>): string {
  return [
    `POKIT_PROFILE=${profileName} is set but no matching profile is defined.`,
    `Available profiles: ${formatProfileOptions(profiles)}.`,
    "For single-team/default use, clear POKIT_PROFILE in .env.",
    `For multi-profile use, add this to ${LOCAL_CONFIG_FILE}:`,
    "profiles:",
    `  ${profileName}:`,
    "    linear_team_key: YOUR_TEAM_KEY",
    `    memory_dir: memory/profiles/${profileName}`,
    `    artifacts_dir: artifacts/profiles/${profileName}`,
  ].join("\n");
}

function mergeProfiles(target: Map<string, ProfileConfig>, source: Map<string, ProfileConfig>): void {
  for (const [name, profile] of source.entries()) {
    target.set(name, profile);
  }
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
