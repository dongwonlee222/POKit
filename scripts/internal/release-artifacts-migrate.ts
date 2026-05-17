// POKIT-204 — Release Artifact Migration
//
// artifacts/ + memory/backlog-raw/ 의 버전 매칭 산출물을 releases/v<X>/ 로 이관한다.
// release.ts [4.7/8] 단계에서 자동 호출되며, 과거 버전 backfill 도 같은 함수를 사용한다.
//
// 매칭 키 우선순위 (가장 강한 신호 → 약한 신호):
//   1. frontmatter `linked_release` / `version`
//   2. frontmatter `target_version`
//   3. frontmatter `proposed_labels: [..., release:vX.Y.Z]`
//   4. 부모 디렉토리 이름이 vX.Y.Z (artifacts/backlog/vX.Y.Z/)

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { parseFrontmatter } from "./artifact-frontmatter.ts";

export type MigrateCategory = "prds" | "criteria" | "backlog" | "backlog-raw";

export type MigratePlan = {
  category: MigrateCategory;
  from: string;
  to: string;
  matchedBy: "linked_release" | "version" | "target_version" | "proposed_labels" | "parent-dir";
};

export type MigrateResult = {
  version: string;
  planned: MigratePlan[];
  moved: MigratePlan[];
  skipped: { path: string; reason: string }[];
};

const VERSION_RE = /v\d+\.\d+\.\d+/;

function normalizeVersion(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const m = String(raw).match(VERSION_RE);
  return m ? m[0] : null;
}

function extractVersionFromFile(filePath: string): { version: string | null; matchedBy: MigratePlan["matchedBy"] | null } {
  const content = readFileSync(filePath, "utf8");
  const { data } = parseFrontmatter(content);

  const linked = normalizeVersion(data["linked_release"] as string | undefined);
  if (linked) return { version: linked, matchedBy: "linked_release" };

  const ver = normalizeVersion(data["version"] as string | undefined);
  if (ver) return { version: ver, matchedBy: "version" };

  const target = normalizeVersion(data["target_version"] as string | undefined);
  if (target) return { version: target, matchedBy: "target_version" };

  const labels = data["proposed_labels"];
  if (Array.isArray(labels)) {
    for (const lab of labels) {
      const m = String(lab).match(/release:(v\d+\.\d+\.\d+)/);
      if (m) return { version: m[1], matchedBy: "proposed_labels" };
    }
  }

  // 부모 디렉토리 이름이 vX.Y.Z 인지 (artifacts/backlog/v0.16.0/A1.md)
  const parent = basename(dirname(filePath));
  const parentVer = normalizeVersion(parent);
  if (parentVer) return { version: parentVer, matchedBy: "parent-dir" };

  return { version: null, matchedBy: null };
}

function listMarkdownFiles(dir: string, recursive = false): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "README.md" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) out.push(...listMarkdownFiles(full, true));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

export function planMigration(version: string, rootDir: string): MigratePlan[] {
  const v = normalizeVersion(version) ?? `v${version.replace(/^v/, "")}`;
  const plans: MigratePlan[] = [];

  const targets: { dir: string; category: MigrateCategory; recursive: boolean }[] = [
    { dir: join(rootDir, "artifacts", "prds"), category: "prds", recursive: false },
    { dir: join(rootDir, "artifacts", "criteria"), category: "criteria", recursive: false },
    { dir: join(rootDir, "artifacts", "backlog"), category: "backlog", recursive: true },
    { dir: join(rootDir, "memory", "backlog-raw"), category: "backlog-raw", recursive: false },
  ];

  for (const t of targets) {
    for (const file of listMarkdownFiles(t.dir, t.recursive)) {
      const { version: fileVer, matchedBy } = extractVersionFromFile(file);
      if (fileVer !== v || !matchedBy) continue;
      const to = join(rootDir, "releases", v, t.category, basename(file));
      plans.push({ category: t.category, from: file, to, matchedBy });
    }
  }

  return plans;
}

export function migrateArtifactsToRelease(
  version: string,
  opts: { rootDir: string; dryRun?: boolean },
): MigrateResult {
  const v = normalizeVersion(version) ?? `v${version.replace(/^v/, "")}`;
  const plans = planMigration(v, opts.rootDir);
  const moved: MigratePlan[] = [];
  const skipped: MigrateResult["skipped"] = [];

  for (const p of plans) {
    if (existsSync(p.to)) {
      skipped.push({ path: p.from, reason: `target exists: ${p.to}` });
      continue;
    }
    if (opts.dryRun) {
      moved.push(p);
      continue;
    }
    mkdirSync(dirname(p.to), { recursive: true });
    renameSync(p.from, p.to);
    moved.push(p);
  }

  // 빈 artifacts/backlog/vX/ 디렉토리는 cleanup 후보지만 일단 남겨둠 (next cycle 안전)
  return { version: v, planned: plans, moved, skipped };
}

export function formatMigrateReport(result: MigrateResult): string {
  const lines: string[] = [];
  lines.push(`📦 Artifact Migration → releases/${result.version}/`);
  lines.push(`   planned: ${result.planned.length}  moved: ${result.moved.length}  skipped: ${result.skipped.length}`);
  const byCat = new Map<MigrateCategory, number>();
  for (const m of result.moved) byCat.set(m.category, (byCat.get(m.category) ?? 0) + 1);
  for (const [cat, n] of byCat) lines.push(`     - ${cat}: ${n}`);
  for (const s of result.skipped) lines.push(`     ⚠ skip ${s.path} (${s.reason})`);
  return lines.join("\n");
}

// 미사용 경고 회피
void statSync;
