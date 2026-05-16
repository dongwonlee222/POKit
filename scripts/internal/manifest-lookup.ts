import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getActiveProfile } from "./profile.ts";

export type CycleManifest = {
  cycle_name: string;
  started_at: string;
  closed_at: string | null;
  release_version: string | null;
  included_issue_ids: string[];
  notes?: string;
};

export type ReleaseManifest = {
  version: string;
  released_at: string;
  included_issue_ids: string[];
  cycle_refs: string[];
  changelog_summary: string;
};

// --- YAML native parsers (no external dependency) ---

function parseStringField(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, "m"));
  return match ? match[1].trim() : null;
}

function parseNullableStringField(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
  if (!match) return null;
  const value = match[1].trim();
  if (value === "null" || value === "~" || value === "") return null;
  return value.replace(/^["']|["']$/g, "");
}

function parseStringList(content: string, key: string): string[] {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start < 0) return [];
  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s*-\s+["']?(.+?)["']?\s*$/);
    if (match) values.push(match[1].trim());
  }
  return values;
}

// --- Manifest loaders ---

function parseCycleManifest(content: string): CycleManifest | null {
  const cycle_name = parseStringField(content, "cycle_name");
  if (!cycle_name) return null;
  const started_at = parseStringField(content, "started_at") ?? "";
  const closed_at = parseNullableStringField(content, "closed_at");
  const release_version = parseNullableStringField(content, "release_version");
  const included_issue_ids = parseStringList(content, "included_issue_ids");
  const notes = parseStringField(content, "notes") ?? undefined;
  return { cycle_name, started_at, closed_at, release_version, included_issue_ids, notes };
}

function parseReleaseManifest(content: string): ReleaseManifest | null {
  const version = parseStringField(content, "version");
  if (!version) return null;
  const released_at = parseStringField(content, "released_at") ?? "";
  const included_issue_ids = parseStringList(content, "included_issue_ids");
  const cycle_refs = parseStringList(content, "cycle_refs");
  const changelog_summary = parseStringField(content, "changelog_summary") ?? "";
  return { version, released_at, included_issue_ids, cycle_refs, changelog_summary };
}

function loadYamlFiles<T>(dir: string, parser: (content: string) => T | null): T[] {
  if (!existsSync(dir)) return [];
  const results: T[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".yaml") && !name.endsWith(".yml")) continue;
    try {
      const content = readFileSync(join(dir, name), "utf8");
      const parsed = parser(content);
      if (parsed) results.push(parsed);
    } catch {
      // skip malformed files — fail open
    }
  }
  return results;
}

function getCyclesDir(rootDir = process.cwd()): string {
  const profile = getActiveProfile(rootDir);
  return join(rootDir, profile.artifactsDir, "cycles");
}

function getReleasesDir(rootDir = process.cwd()): string {
  const profile = getActiveProfile(rootDir);
  return join(rootDir, profile.artifactsDir, "releases");
}

export function loadCycleManifests(rootDir = process.cwd()): CycleManifest[] {
  return loadYamlFiles(getCyclesDir(rootDir), parseCycleManifest);
}

export function loadReleaseManifests(rootDir = process.cwd()): ReleaseManifest[] {
  return loadYamlFiles(getReleasesDir(rootDir), parseReleaseManifest);
}

/**
 * Returns the cycle_name of the cycle manifest that contains the given issue ID,
 * or null if no matching manifest is found.
 */
export function lookupCycleForIssue(issueId: string, rootDir = process.cwd()): string | null {
  for (const manifest of loadCycleManifests(rootDir)) {
    if (manifest.included_issue_ids.includes(issueId)) {
      return manifest.cycle_name;
    }
  }
  return null;
}

/**
 * Returns the version string of the release manifest that contains the given issue ID,
 * or null if no matching manifest is found.
 */
export function lookupReleaseForIssue(issueId: string, rootDir = process.cwd()): string | null {
  for (const manifest of loadReleaseManifests(rootDir)) {
    if (manifest.included_issue_ids.includes(issueId)) {
      return manifest.version;
    }
  }
  return null;
}

/**
 * Returns the open cycle manifest (closed_at == null) if one exists.
 */
export function findOpenCycleManifest(rootDir = process.cwd()): CycleManifest | null {
  for (const manifest of loadCycleManifests(rootDir)) {
    if (manifest.closed_at === null) {
      return manifest;
    }
  }
  return null;
}
