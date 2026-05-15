import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { loadHookMap, type HookGate, type HookGateSeverity } from "./hook-map.ts";
import { renderPublicSafetyViolations, scanTrackedPublicFiles } from "./public-safety-scan.ts";
import { renderReleaseMarkdownAudit, scanTrackedReleaseMarkdown } from "./release-md-audit.ts";

const execFileAsync = promisify(execFile);

export type ReleaseGateStatus = "passed" | "failed" | "warning";

export type ReleaseGateResult = {
  id: string;
  status: ReleaseGateStatus;
  severity: HookGateSeverity;
  summary: string;
};

export type ReleasePreflightReport = {
  cycleName: string;
  targetVersion: string;
  results: ReleaseGateResult[];
};

export type ReleaseCompletionEvidenceInput = {
  targetVersion: string;
  commit: string;
  tag: string;
  branch: string;
  remote: string;
  releaseUrl?: string;
};

type PublicFile = {
  path: string;
  content: string;
};

export async function runReleasePreflight(options: {
  cwd?: string;
  cycleName?: string;
  targetVersion: string;
}): Promise<ReleasePreflightReport> {
  const cwd = options.cwd ?? process.cwd();
  const hook = loadHookMap(join(cwd, "workflows/hooks.yaml")).before_public_release;
  const gates = hook?.gates ?? [];
  const results: ReleaseGateResult[] = [];

  for (const gate of gates) {
    results.push(await runGate(gate, { cwd, targetVersion: options.targetVersion }));
  }

  return {
    cycleName: options.cycleName ?? "Cycle",
    targetVersion: options.targetVersion,
    results,
  };
}

export function renderReleasePreflight(report: ReleasePreflightReport): string {
  const failedBlockers = report.results.filter((result) => result.status === "failed" && result.severity === "blocker");
  const lines = [
    "# POKit Release Preflight",
    "",
    `${report.cycleName} -> ${report.targetVersion}`,
    "",
    "읽는 법",
    "- blocker가 FAIL이면 release 중단",
    "- warning은 지금은 알림이며, release 판단 때 확인",
    "",
    "+--------------------------------------------------+",
    "| gates                                            |",
  ];

  for (const result of report.results) {
    lines.push(`| ${formatGateStatus(result.status)} ${result.id.padEnd(26)} [${result.severity}] ${gateDescription(result.id)} ${result.summary}`);
  }

  lines.push("+--------------------------------------------------+");
  lines.push(failedBlockers.length ? "-> Release Blocked" : "-> Cycle Release Pending");
  return lines.join("\n");
}

export function renderReleaseCompletionEvidence(input: ReleaseCompletionEvidenceInput): string {
  return [
    "## Release Completion Evidence",
    "",
    `targetVersion: ${input.targetVersion}`,
    `commit: ${input.commit}`,
    `tag: ${input.tag}`,
    `branch: ${input.branch}`,
    `remote: ${input.remote}`,
    `releaseUrl: ${input.releaseUrl ?? "none"}`,
    "release preflight: passed",
    "GitHub push/tag/release: completed",
    "",
    "## Cycle Completion Experience Trigger",
    "",
    "celebrationTrigger: ready",
    "reason: release gate completed and public release boundary was applied.",
    "",
  ].join("\n");
}

function gateDescription(id: string): string {
  const descriptions: Record<string, string> = {
    release_md_audit: "release 문서 확인",
    public_safety_scan: "private 정보 유출 방지",
    full_tests: "전체 테스트",
    git_diff_check: "diff 오류 확인",
    git_status_check: "branch 상태 확인",
    ignored_evidence_scan: "ignored artifact 증거 확인",
  };
  return descriptions[id] ?? "";
}

export function scanIgnoredEvidenceReferences(files: PublicFile[]): Array<{ path: string; reference: string }> {
  const warnings: Array<{ path: string; reference: string }> = [];
  const ignoredArtifactPattern = /\bartifacts\/profiles\/[^\s`)]+/g;

  for (const file of files) {
    for (const line of file.content.split(/\r?\n/).filter((item) => /evidence|증거/i.test(item))) {
      for (const match of line.matchAll(ignoredArtifactPattern)) {
      warnings.push({
        path: file.path,
        reference: match[0],
      });
      }
    }
  }

  return warnings;
}

async function runGate(gate: HookGate, options: { cwd: string; targetVersion: string }): Promise<ReleaseGateResult> {
  try {
    if (gate.id === "release_md_audit") {
      const result = await scanTrackedReleaseMarkdown({ cwd: options.cwd, targetVersion: options.targetVersion });
      return {
        id: gate.id,
        status: result.violations.length ? "failed" : "passed",
        severity: gate.severity,
        summary: renderReleaseMarkdownAudit(result).replace(/^Release markdown audit /, ""),
      };
    }
    if (gate.id === "public_safety_scan") {
      const violations = await scanTrackedPublicFiles({ cwd: options.cwd });
      return {
        id: gate.id,
        status: violations.length ? "failed" : "passed",
        severity: gate.severity,
        summary: renderPublicSafetyViolations(violations).replace(/^Public safety scan /, ""),
      };
    }
    if (gate.id === "full_tests") {
      const testFiles = (await readdir(join(options.cwd, "tests")))
        .filter((file) => file.endsWith(".mjs"))
        .sort()
        .map((file) => join("tests", file));
      const { stdout, stderr } = await execFileAsync("node", ["--test", ...testFiles], { cwd: options.cwd });
      return {
        id: gate.id,
        status: "passed",
        severity: gate.severity,
        summary: summarizeNodeTestOutput(`${stdout}\n${stderr}`),
      };
    }
    if (gate.id === "git_diff_check") {
      await execFileAsync("git", ["diff", "--check"], { cwd: options.cwd });
      return { id: gate.id, status: "passed", severity: gate.severity, summary: "no whitespace errors" };
    }
    if (gate.id === "git_status_check") {
      const { stdout } = await execFileAsync("git", ["status", "--short", "--branch"], { cwd: options.cwd });
      return { id: gate.id, status: "passed", severity: gate.severity, summary: firstLine(stdout) };
    }
    if (gate.id === "ignored_evidence_scan") {
      const files = await readTrackedPublicFiles(options.cwd);
      const warnings = scanIgnoredEvidenceReferences(files);
      return {
        id: gate.id,
        status: warnings.length ? "warning" : "passed",
        severity: gate.severity,
        summary: warnings.length ? `${warnings.length} ignored references` : "no ignored evidence references",
      };
    }
    return { id: gate.id, status: "passed", severity: gate.severity, summary: "policy-only gate" };
  } catch (error) {
    return {
      id: gate.id,
      status: "failed",
      severity: gate.severity,
      summary: error instanceof Error ? firstLine(error.message) : "failed",
    };
  }
}

async function readTrackedPublicFiles(cwd: string): Promise<PublicFile[]> {
  const { stdout } = await execFileAsync("git", ["ls-files"], { cwd });
  const paths = stdout.split(/\r?\n/).filter((path) => /^(?:AGENTS\.md|CHANGELOG\.md|README\.md|docs\/|examples\/|scripts\/README\.md|workflows\/)/.test(path));
  const files: PublicFile[] = [];
  for (const path of paths) {
    files.push({
      path,
      content: await readFile(join(cwd, path), "utf8"),
    });
  }
  return files;
}

function formatGateStatus(status: ReleaseGateStatus): string {
  if (status === "passed") {
    return "OK";
  }
  if (status === "warning") {
    return "WARN";
  }
  return "FAIL";
}

function summarizeNodeTestOutput(output: string): string {
  const pass = output.match(/pass (\d+)/)?.[1];
  const fail = output.match(/fail (\d+)/)?.[1] ?? "0";
  return pass ? `${pass} passed, ${fail} failed` : "tests passed";
}

function firstLine(value: string): string {
  return value.trim().split(/\r?\n/)[0] || "ok";
}

function readArg(args: string[], flag: string): string | undefined {
  const prefixed = args.find((arg) => arg.startsWith(`${flag}=`));
  if (prefixed) {
    return prefixed.slice(flag.length + 1);
  }
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const targetVersion = readArg(args, "--target-version") ?? "v0.4.0";
  const cycleName = readArg(args, "--cycle-name") ?? "Cycle";
  const report = await runReleasePreflight({ targetVersion, cycleName });
  console.log(renderReleasePreflight(report));
  if (report.results.some((result) => result.status === "failed" && result.severity === "blocker")) {
    process.exitCode = 1;
  }
}
