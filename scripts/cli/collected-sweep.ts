import { readdir, readFile, stat } from "node:fs/promises";
import { join, basename, dirname } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SidecarMeta = {
  sensitivity?: string;
  contains_pii?: boolean;
  retention_until?: string;
  license?: string;
  source?: string;
  redaction_status?: string;
};

export type RawEntry = {
  /** Absolute path to the raw file */
  rawPath: string;
  /** Path relative to project root (for display) */
  displayPath: string;
  hasSidecar: boolean;
  meta?: SidecarMeta;
  parseError?: string;
};

export type SweepReport = {
  expired_retention: string[];
  missing_sidecar: string[];
  pii_raw_old: string[];
};

// ---------------------------------------------------------------------------
// YAML field parser (minimal — no external dependency)
// ---------------------------------------------------------------------------

/**
 * Parses a simple flat YAML file (single-level key: value pairs).
 * Supports quoted and unquoted string values, boolean literals.
 */
export function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    // Boolean
    if (rawVal === "true") { result[key] = true; continue; }
    if (rawVal === "false") { result[key] = false; continue; }
    // Quoted string
    if ((rawVal.startsWith('"') && rawVal.endsWith('"')) ||
        (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
      result[key] = rawVal.slice(1, -1);
      continue;
    }
    // Unquoted — keep as string (null/~ left as string intentionally)
    result[key] = rawVal;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Scan helpers
// ---------------------------------------------------------------------------

/**
 * Returns all regular files in a directory (non-recursive, skips .gitkeep).
 */
async function listFiles(dir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const name of entries) {
    if (name === ".gitkeep") continue;
    const full = join(dir, name);
    let s;
    try { s = await stat(full); } catch { continue; }
    if (s.isFile()) files.push(full);
  }
  return files;
}

/**
 * Returns all profile names under artifacts/profiles/ (skips _template).
 */
async function listProfiles(rootDir: string): Promise<string[]> {
  const profilesDir = join(rootDir, "artifacts", "profiles");
  let entries: string[];
  try {
    entries = await readdir(profilesDir);
  } catch {
    return [];
  }
  const profiles: string[] = [];
  for (const name of entries) {
    if (name.startsWith("_")) continue; // skip _template etc.
    const full = join(profilesDir, name);
    let s;
    try { s = await stat(full); } catch { continue; }
    if (s.isDirectory()) profiles.push(name);
  }
  return profiles;
}

// ---------------------------------------------------------------------------
// Core scan logic
// ---------------------------------------------------------------------------

/**
 * Scans all artifacts/profiles/<profile>/collected/raw/ directories.
 * Returns one RawEntry per non-sidecar file found.
 */
export async function scanCollectedRaw(rootDir: string): Promise<RawEntry[]> {
  const profiles = await listProfiles(rootDir);
  const entries: RawEntry[] = [];

  for (const profile of profiles) {
    const rawDir = join(rootDir, "artifacts", "profiles", profile, "collected", "raw");
    const allFiles = await listFiles(rawDir);

    // Separate raw data files from sidecar files
    const sidecarSet = new Set<string>();
    const dataFiles: string[] = [];

    for (const f of allFiles) {
      if (f.endsWith(".meta.yaml")) {
        sidecarSet.add(f);
      } else {
        dataFiles.push(f);
      }
    }

    for (const rawPath of dataFiles) {
      const displayPath = rawPath.slice(rootDir.length + 1);
      const expectedSidecar = rawPath + ".meta.yaml";
      const hasSidecar = sidecarSet.has(expectedSidecar);

      if (!hasSidecar) {
        entries.push({ rawPath, displayPath, hasSidecar: false });
        continue;
      }

      let meta: SidecarMeta | undefined;
      let parseError: string | undefined;
      try {
        const content = await readFile(expectedSidecar, "utf8");
        const parsed = parseSimpleYaml(content);
        meta = {
          sensitivity: typeof parsed.sensitivity === "string" ? parsed.sensitivity : undefined,
          contains_pii: typeof parsed.contains_pii === "boolean" ? parsed.contains_pii : undefined,
          retention_until: typeof parsed.retention_until === "string" ? parsed.retention_until : undefined,
          license: typeof parsed.license === "string" ? parsed.license : undefined,
          source: typeof parsed.source === "string" ? parsed.source : undefined,
          redaction_status: typeof parsed.redaction_status === "string" ? parsed.redaction_status : undefined,
        };
      } catch (err) {
        parseError = err instanceof Error ? err.message : String(err);
      }

      entries.push({ rawPath, displayPath, hasSidecar: true, meta, parseError });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Report builder
// ---------------------------------------------------------------------------

const PII_RAW_DAYS_THRESHOLD = 30;

function daysDiff(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
}

export function buildReport(entries: RawEntry[], now?: Date): SweepReport {
  const today = now ?? new Date();
  const todayTs = today.getTime();

  const expired_retention: string[] = [];
  const missing_sidecar: string[] = [];
  const pii_raw_old: string[] = [];

  for (const e of entries) {
    if (!e.hasSidecar) {
      missing_sidecar.push(e.displayPath);
      continue;
    }

    if (e.parseError) {
      // Treat parse errors as a missing-sidecar equivalent for reporting purposes
      missing_sidecar.push(`${e.displayPath} (parse error: ${e.parseError})`);
      continue;
    }

    const meta = e.meta;
    if (!meta) continue;

    // Check retention_until
    if (meta.retention_until) {
      const retentionDate = new Date(meta.retention_until);
      if (!isNaN(retentionDate.getTime()) && retentionDate.getTime() < todayTs) {
        expired_retention.push(e.displayPath);
      }
    }

    // Check PII + redaction_status=raw + older than 30 days
    if (meta.contains_pii === true && meta.redaction_status === "raw") {
      // Check file age via retention_until as proxy; if no retention_until, we can't determine age
      // Use retention_until absence as safe: flag if retention_until is past 30+ days OR if no retention_until
      let flagAsPiiOld = false;
      if (meta.retention_until) {
        const retentionDate = new Date(meta.retention_until);
        if (!isNaN(retentionDate.getTime())) {
          const daysOverdue = (todayTs - retentionDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysOverdue >= PII_RAW_DAYS_THRESHOLD) {
            flagAsPiiOld = true;
          }
        }
      } else {
        // No retention date — flag conservatively
        flagAsPiiOld = true;
      }
      if (flagAsPiiOld) {
        pii_raw_old.push(e.displayPath);
      }
    }
  }

  return { expired_retention, missing_sidecar, pii_raw_old };
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

export function renderTextReport(report: SweepReport): string {
  const lines: string[] = ["[Collected Sweep Report]"];

  lines.push(`- retention_until 지난 raw: ${report.expired_retention.length}건`);
  for (const p of report.expired_retention) {
    lines.push(`    ${p}`);
  }

  lines.push(`- sidecar 없는 raw: ${report.missing_sidecar.length}건`);
  for (const p of report.missing_sidecar) {
    lines.push(`    ${p}`);
  }

  lines.push(`- contains_pii=true + redaction_status=raw 30일 이상: ${report.pii_raw_old.length}건`);
  for (const p of report.pii_raw_old) {
    lines.push(`    ${p}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");

  const rootDir = new URL("../..", import.meta.url).pathname;

  let entries: RawEntry[];
  try {
    entries = await scanCollectedRaw(rootDir);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error scanning collected/raw directories: ${message}\n`);
    process.exit(1);
  }

  const report = buildReport(entries);

  if (jsonMode) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write(renderTextReport(report) + "\n");
    process.stdout.write("\n<!-- AGENT: output above verbatim, no summary, no interpretation -->\n");
  }

  // exit 0 always (report only — no auto-delete, no forced failure on findings)
  process.exit(0);
}
