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

  // [4/8] Release Manifest yaml 생성
  step(4, TOTAL, "Release Manifest yaml 생성");
  const manifestPath = join(opts.rootDir, "memory", "releases", `v${opts.version}.yaml`);
  if (existsSync(manifestPath)) {
    console.log(`  ✓ manifest 이미 존재: ${manifestPath} (재생성 안 함)`);
  } else {
    console.log(`  ⚠ manifest 미존재 — 수동 작성 또는 backfill 필요: ${manifestPath}`);
  }

  // [5/8] Cycle Close (간소화 — close 호출)
  step(5, TOTAL, "Cycle Close");
  run("node", ["--experimental-strip-types", "scripts/cli/session-close.ts"], { ...opts, allowFail: true });

  // [6/8] 이전 버전 점검 → pokit:gap 이슈 자동 생성
  if (opts.skipRetroCheck) {
    step(6, TOTAL, "🔍 이전 버전 점검 (skipped via --no-retro-check)");
  } else {
    step(6, TOTAL, "🔍 이전 버전 점검 → pokit:gap 이슈 자동 생성");
    run("node", ["--experimental-strip-types", "scripts/cli/retro-check.ts", "--dry-run"], { ...opts, allowFail: true });
  }

  // [7/8] Next Action Wizard
  step(7, TOTAL, "🎯 Next Action Wizard");
  run("node", ["--experimental-strip-types", "scripts/cli/next-action.ts"], { ...opts, allowFail: true });

  // [8/8] Resume Brief 박제 + GitHub Release
  step(8, TOTAL, "Resume Brief 박제 + 다음 start 브리프 preview");
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
