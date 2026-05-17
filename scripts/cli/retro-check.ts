#!/usr/bin/env node
// POKIT-167 G2/T7 CLI — `pokit retro-check <version> [--dry-run] [--no-dispatch]`
//
// release manifest 의 wiring_status 와 production grep 결과를 비교해 갭을 산출하고,
// 검출된 갭을 pokit:gap 라벨 Linear 이슈로 디스패치한다. 기본 동작은 dry-run.

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { runRetroCheckCli } from "../internal/retro-check.ts";

type ParsedArgs = {
  version?: string;
  dryRun: boolean;
  noDispatch: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { dryRun: true, noDispatch: false, help: false };
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--apply") out.dryRun = false;
    else if (arg === "--no-dispatch") out.noDispatch = true;
    else if (!arg.startsWith("-")) {
      const normalized = arg.startsWith("v") ? arg.slice(1) : arg;
      out.version = normalized;
    }
  }
  return out;
}

function usage(): string {
  return [
    "pokit retro-check <version> [--dry-run | --apply] [--no-dispatch]",
    "",
    "이전 버전 release manifest 의 wiring_status 를 점검하고 검출된 갭을 pokit:gap Linear 이슈로 등록합니다.",
    "",
    "  <version>       대상 버전 (예: 0.14.0 또는 v0.14.0)",
    "  --dry-run       Linear plan 만 생성하고 실제 등록은 하지 않음 (기본값)",
    "  --apply         dry-run 대신 실제 Linear 등록",
    "  --no-dispatch   갭 디스패치 전체 skip — 점검 결과만 출력",
    "",
  ].join("\n");
}

function countHitsViaRipgrep(id: string, rootDir: string): number {
  // production directories: scripts/ skills/ bin/ docs/_details/role-map.yaml — exclude tests/, .claude/, node_modules.
  const result = spawnSync(
    "rg",
    [
      "--count-matches",
      "--no-heading",
      "--glob",
      "!tests/**",
      "--glob",
      "!.claude/**",
      "--glob",
      "!node_modules/**",
      "--glob",
      "!memory/**",
      "--fixed-strings",
      id,
      rootDir,
    ],
    { encoding: "utf8" },
  );
  if (result.status === 1) return 0; // ripgrep: no matches
  if (result.status !== 0) {
    // ripgrep 부재 시 보수적으로 0 반환 — 호출자가 별도 점검 필요.
    return 0;
  }
  let total = 0;
  for (const line of result.stdout.split(/\r?\n/)) {
    const m = line.match(/:(\d+)$/);
    if (m) total += Number.parseInt(m[1], 10);
  }
  return total;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }
  if (!args.version) {
    process.stderr.write(usage());
    process.exitCode = 2;
    return;
  }

  const rootDir = resolve(process.cwd());

  const { report, dispatched } = await runRetroCheckCli({
    version: args.version,
    rootDir,
    dryRun: args.dryRun,
    noDispatch: args.noDispatch,
    countProductionHits: async (id) => countHitsViaRipgrep(id, rootDir),
  });

  const lines: string[] = [];
  lines.push(`# retro-check v${report.version}`);
  lines.push("");
  lines.push("## wiring details");
  for (const d of report.details) {
    lines.push(
      `- ${d.id}  actual=${d.inActual ? "yes" : "no"}  hits=${d.hits}  expectedMin=${d.expectedMin}  category=${d.category}`,
    );
  }
  lines.push("");
  lines.push(`## gaps detected: ${report.gaps.length}`);
  for (const g of report.gaps) {
    lines.push(`- [${g.category}] ${g.note}`);
  }
  lines.push("");
  lines.push(
    `## dispatch (${args.dryRun ? "dry-run" : "apply"}${args.noDispatch ? ", SKIPPED" : ""}): ${dispatched.length} issue(s)`,
  );
  for (const d of dispatched) {
    lines.push(`- title: ${d.title}`);
    lines.push(`  idempotencyKey: ${d.plan.idempotencyKey}`);
  }
  process.stdout.write(lines.join("\n") + "\n");
}

main().catch((err) => {
  process.stderr.write(`retro-check failed: ${(err as Error).message}\n`);
  process.exitCode = 1;
});
