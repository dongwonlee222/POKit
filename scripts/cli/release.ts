#!/usr/bin/env node
// POKIT-167 G3/T9 — `./bin/pokit release <version>` 8단계 dispatcher.
// Dogfood 대상: v0.15.1.
//
// 사용:
//   ./bin/pokit release 0.15.1                 # 정식 실행 (각 단계 사용자 확인)
//   ./bin/pokit release 0.15.1 --dry-run       # 단계만 출력, 외부 액션 없음
//   ./bin/pokit release 0.15.1 --resume        # next-action wizard만 재실행
//   ./bin/pokit release 0.15.1 --no-github-release
//   ./bin/pokit release 0.15.1 --no-retro-check
//
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildReleaseManifest,
  parseReleaseManifest,
  releaseManifestPath,
  renderReleaseManifest,
  writeReleaseManifest,
} from "../internal/release-manifest.ts";
import { backfillForRelease } from "../internal/manifest-backfill.ts";

type Opts = {
  version: string;
  dryRun: boolean;
  resume: boolean;
  skipGithubRelease: boolean;
  skipRetroCheck: boolean;
  rootDir: string;
};

const VALID_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const parseArgs = (argv: string[]): Opts => {
  const args = argv.slice(2);
  const version = args.find((a) => !a.startsWith("--"));
  if (!version) {
    console.error("usage: pokit release <version> [--dry-run] [--resume] [--no-github-release] [--no-retro-check]");
    process.exit(2);
  }
  if (!VALID_VERSION.test(version)) {
    console.error(`error: version "${version}" is not valid semver (예: 0.15.1)`);
    process.exit(2);
  }
  return {
    version,
    dryRun: args.includes("--dry-run"),
    resume: args.includes("--resume"),
    skipGithubRelease: args.includes("--no-github-release"),
    skipRetroCheck: args.includes("--no-retro-check"),
    rootDir: process.cwd(),
  };
};

const step = (n: number, total: number, title: string) =>
  console.log(`\n[${n}/${total}] ${title}`);

const run = (cmd: string, args: string[], opts: { dryRun: boolean; allowFail?: boolean }) => {
  console.log(`  $ ${cmd} ${args.join(" ")}`);
  if (opts.dryRun) return { ok: true, stdout: "" };
  const r = spawnSync(cmd, args, { stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0 && !opts.allowFail) {
    console.error(`  ✗ ${cmd} exited with code ${r.status}`);
    process.exit(r.status ?? 1);
  }
  return { ok: r.status === 0, stdout: r.stdout ?? "" };
};

const main = async () => {
  const opts = parseArgs(process.argv);
  const TOTAL = 8;
  console.log(`🚀 POKit Release v${opts.version}${opts.dryRun ? " (dry-run)" : ""}`);

  // Resume-only mode: just rerun the wizard.
  if (opts.resume) {
    step(7, TOTAL, "🎯 Next Action Wizard (resume only)");
    run("node", ["--experimental-strip-types", "scripts/cli/next-action.ts"], opts);
    return;
  }

  // [1/8] 버전 검증
  step(1, TOTAL, "버전 검증");
  const pkgPath = join(opts.rootDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  console.log(`  package.json version: ${pkg.version}`);
  if (pkg.version !== opts.version) {
    console.error(`  ✗ package.json version (${pkg.version}) ≠ release version (${opts.version}). 먼저 package.json 갱신 필요.`);
    if (!opts.dryRun) process.exit(1);
  }
  const changelog = readFileSync(join(opts.rootDir, "CHANGELOG.md"), "utf8");
  if (!changelog.includes(`## v${opts.version}`)) {
    console.error(`  ✗ CHANGELOG.md에 "## v${opts.version}" 섹션 없음.`);
    if (!opts.dryRun) process.exit(1);
  }
  console.log(`  ✓ version + changelog OK`);

  // [2/8] Safety Scan
  step(2, TOTAL, "Safety Scan");
  run("node", ["--experimental-strip-types", "scripts/cli/public-safety-scan.ts"], { ...opts, allowFail: false });

  // [3/8] 배포 (tag + push + GitHub Release)
  step(3, TOTAL, "배포 (tag + push)");
  const tagName = `v${opts.version}`;
  run("git", ["tag", tagName], opts);
  run("git", ["push", "origin", "main"], opts);
  run("git", ["push", "origin", tagName], opts);

  // [4/8] Release Manifest yaml 생성 (POKIT-171 — 미존재 시 자동 생성)
  step(4, TOTAL, "Release Manifest yaml 생성");
  const manifestPath = releaseManifestPath(opts.version, opts.rootDir);
  if (existsSync(manifestPath)) {
    console.log(`  ✓ manifest 이미 존재: ${manifestPath} (재생성 안 함)`);
    try {
      parseReleaseManifest(readFileSync(manifestPath, "utf8"));
      console.log(`  ✓ parse OK`);
    } catch (err: any) {
      console.error(`  ✗ manifest parse 실패: ${err.message}`);
      if (!opts.dryRun) process.exit(1);
    }
  } else if (opts.dryRun) {
    console.log(`  (dry-run) manifest 자동 생성 skip: ${manifestPath}`);
  } else {
    console.log(`  manifest 미존재 — 자동 생성 시작: ${manifestPath}`);
    const manifest = buildReleaseManifest(opts.version, {
      rootDir: opts.rootDir,
      changelogPath: join(opts.rootDir ?? process.cwd(), "CHANGELOG.md"),
    });
    const writtenPath = await writeReleaseManifest(opts.version, manifest, opts.rootDir);
    console.log(`  ✓ 자동 생성 완료: ${writtenPath}`);
    console.log(`    - issues: ${manifest.issues.length}건 (cycle ${manifest.cycle_id})`);
    console.log(`    - changelog: ${manifest.changelog.length} bullet`);
    console.log(`    - wiring intended/actual/gaps: ${manifest.wiring_status.intended.length}/${manifest.wiring_status.actual.length}/${manifest.wiring_status.gaps.length}`);
    console.log(`    ※ issues·artifacts·wiring_status는 빈 상태로 시작. 후속 단계가 채움.`);
  }

  // [4.5/8] Manifest Backfill (POKIT-192) — issues + carry-forward + wiring.actual + escalation
  if (existsSync(manifestPath) && !opts.dryRun) {
    console.log("");
    console.log(`[4.5/8] Manifest Backfill (POKIT-192)`);
    try {
      const current = parseReleaseManifest(readFileSync(manifestPath, "utf8"));
      const result = await backfillForRelease(current, { rootDir: opts.rootDir });
      const written = await writeReleaseManifest(opts.version, result.manifest, opts.rootDir);
      console.log(`  ✓ backfill 완료: ${written}`);
      console.log(`    - issues_added: ${result.log.issues_added}`);
      console.log(`    - carry_forward: ${result.log.carry_forward_count}`);
      console.log(`    - wiring actual/gaps: ${result.log.wiring_actual}/${result.log.wiring_gaps}`);
      console.log(`    - escalations: ${result.log.escalations}`);
    } catch (err: any) {
      console.error(`  ⚠ backfill 실패: ${err.message} (다음 단계 계속 진행)`);
    }
  } else if (opts.dryRun) {
    console.log("");
    console.log(`[4.5/8] Manifest Backfill (dry-run skip)`);
  }

  // [5/8] Cycle Close (간소화 — close 호출)
  step(5, TOTAL, "Cycle Close");
  run("node", ["--experimental-strip-types", "scripts/cli/session-close.ts"], { ...opts, allowFail: true });

  // [6/8] 이전 버전 점검 → pokit:gap 이슈 자동 생성 (POKIT-172 M3 — dry-run plan → 승인 → apply)
  if (opts.skipRetroCheck) {
    step(6, TOTAL, "🔍 이전 버전 점검 (skipped via --no-retro-check)");
  } else {
    step(6, TOTAL, "🔍 이전 버전 점검 → pokit:gap 이슈 plan");
    const previousVersion = await findPreviousReleaseVersion(opts.rootDir, opts.version);
    if (!previousVersion) {
      console.log(`  (이전 release manifest 없음 — retro-check skip)`);
    } else {
      console.log(`  이전 버전: v${previousVersion}`);
      run("node", ["--experimental-strip-types", "scripts/cli/retro-check.ts", previousVersion, "--dry-run"], { ...opts, allowFail: true });
      if (opts.dryRun) {
        console.log(`  (dry-run mode — apply 단계 skip)`);
      } else if (!process.stdin.isTTY) {
        console.error(`  ⚠ TTY 없음 — retro-check apply skip. plan만 출력됨. (수동 처리 필요)`);
      } else {
        const answer = await promptYesNo("  pokit:gap 이슈를 Linear에 실제 등록할까요?");
        if (answer) {
          run("node", ["--experimental-strip-types", "scripts/cli/retro-check.ts", previousVersion, "--apply"], { ...opts, allowFail: true });
        } else {
          console.log(`  (사용자 거부 — apply skip)`);
        }
      }
    }
  }

  // [7/8] Next Action Wizard
  step(7, TOTAL, "🎯 Next Action Wizard");
  run("node", ["--experimental-strip-types", "scripts/cli/next-action.ts"], { ...opts, allowFail: true });

  // [8/8] Resume Brief 기록 + GitHub Release
  step(8, TOTAL, "Resume Brief 기록 + 다음 start 브리프 preview");
  if (!opts.skipGithubRelease) {
    const releaseTitle = `${tagName} — Release via pokit release dispatcher`;
    run("gh", [
      "release",
      "create",
      tagName,
      "--title",
      releaseTitle,
      "--notes-from-tag",
    ], { ...opts, allowFail: true });
  } else {
    console.log("  (--no-github-release: skipped)");
  }
  run("node", ["--experimental-strip-types", "scripts/cli/session-brief.ts"], { ...opts, allowFail: true });

  console.log(`\n✓ Release v${opts.version} 완료.`);
};

// ---------- helpers (M3) ----------
import { readdirSync } from "node:fs";

async function findPreviousReleaseVersion(rootDir: string, currentVersion: string): Promise<string | null> {
  const dir = join(rootDir, "releases");
  if (!existsSync(dir)) return null;
  const versions = readdirSync(dir)
    .filter((name) => /^v\d+\.\d+\.\d+/.test(name))
    .map((name) => name.replace(/^v/, ""))
    .filter((v) => v !== currentVersion);
  if (versions.length === 0) return null;
  // semver sort desc
  versions.sort((a, b) => compareSemver(b, a));
  return versions[0];
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10));
  const pb = b.split(".").map((n) => parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

async function promptYesNo(question: string): Promise<boolean> {
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = (await rl.question(`${question} [y/N]: `)).trim().toLowerCase();
    return ans === "y" || ans === "yes";
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
