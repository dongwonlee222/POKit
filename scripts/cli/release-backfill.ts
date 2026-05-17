#!/usr/bin/env node
// POKIT-204 — Release artifact migration + INDEX backfill (일회/반복 사용 가능)
//
// 과거 릴리스 폴더에 산출물이 이관되지 않은 버전을 한 번에 정리한다.
// release.ts의 [4.7/8] + [4.8/8] 단계를 manifest 존재하는 버전 모두에 적용.
//
// 사용:
//   ./bin/pokit release-backfill                     # 모든 버전
//   ./bin/pokit release-backfill 0.17.2              # 단일 버전
//   ./bin/pokit release-backfill --dry-run           # plan만 출력

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  formatMigrateReport,
  migrateArtifactsToRelease,
} from "../internal/release-artifacts-migrate.ts";
import { writeReleaseIndex } from "../internal/release-index.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const explicit = args.find((a) => !a.startsWith("--"));

const rootDir = process.cwd();
const releasesDir = join(rootDir, "releases");

if (!existsSync(releasesDir)) {
  console.error(`error: ${releasesDir} 없음`);
  process.exit(1);
}

const allVersions = readdirSync(releasesDir)
  .filter((n) => /^v\d+\.\d+\.\d+/.test(n))
  .map((n) => n.replace(/^v/, ""))
  .sort();

const targets = explicit ? [explicit.replace(/^v/, "")] : allVersions;

console.log(`🔁 Release Backfill ${dryRun ? "(dry-run) " : ""}— ${targets.length} versions`);

let total = { planned: 0, moved: 0, skipped: 0 };

for (const v of targets) {
  const manifestExists = existsSync(join(releasesDir, `v${v}`, "manifest.yaml"));
  console.log(`\n━━━ v${v} ${manifestExists ? "" : "(manifest 없음 — INDEX skip)"}`);

  try {
    const result = migrateArtifactsToRelease(v, { rootDir, dryRun });
    console.log(formatMigrateReport(result));
    total.planned += result.planned.length;
    total.moved += result.moved.length;
    total.skipped += result.skipped.length;
  } catch (err: any) {
    console.error(`  ⚠ migration 실패: ${err.message}`);
  }

  if (!manifestExists) continue;

  if (dryRun) {
    console.log(`  (dry-run) INDEX.md 생성 skip`);
    continue;
  }

  try {
    const indexPath = writeReleaseIndex(v, rootDir);
    console.log(`  ✓ INDEX: ${indexPath}`);
  } catch (err: any) {
    console.error(`  ⚠ INDEX 생성 실패: ${err.message}`);
  }
}

console.log(`\n━━━ TOTAL planned=${total.planned} moved=${total.moved} skipped=${total.skipped}`);
