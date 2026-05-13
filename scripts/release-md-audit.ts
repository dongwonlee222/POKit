import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ReleaseMarkdownFile = {
  path: string;
  content: string;
};

export type ReleaseMarkdownViolation = {
  path: string;
  ruleId: string;
  message: string;
};

export type ReleaseMarkdownAuditResult = {
  violations: ReleaseMarkdownViolation[];
};

export type ReleaseMarkdownAuditOptions = {
  targetVersion: string;
  maxAgentsBytes?: number;
};

const defaultMaxAgentsBytes = 9000;
const releaseDocPattern = /^(?:AGENTS\.md|README\.md|CHANGELOG\.md|docs\/|scripts\/README\.md|skills\/[^/]+\/SKILL\.md|workflows\/.*\.md)/;

export function auditReleaseMarkdown(files: ReleaseMarkdownFile[], options: ReleaseMarkdownAuditOptions): ReleaseMarkdownAuditResult {
  const maxAgentsBytes = options.maxAgentsBytes ?? defaultMaxAgentsBytes;
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  const violations: ReleaseMarkdownViolation[] = [];
  const agents = byPath.get("AGENTS.md");
  const releaseChecklist = byPath.get("docs/RELEASE_CHECKLIST.md");
  const operatingModel = byPath.get("docs/OPERATING_MODEL.md");
  const design = byPath.get("docs/DESIGN.md");

  if (agents && Buffer.byteLength(agents, "utf8") > maxAgentsBytes) {
    violations.push({
      path: "AGENTS.md",
      ruleId: "agents-md-too-large",
      message: `AGENTS.md should stay under ${maxAgentsBytes} bytes and link to canonical docs for detail.`,
    });
  }

  if (releaseChecklist && releaseChecklist.includes("v0.1.1") && options.targetVersion !== "v0.1.1") {
    violations.push({
      path: "docs/RELEASE_CHECKLIST.md",
      ruleId: "stale-release-checklist-target",
      message: `Release checklist still references v0.1.1 instead of ${options.targetVersion}.`,
    });
  }

  if (operatingModel && !/canonical policy source/i.test(operatingModel)) {
    violations.push({
      path: "docs/OPERATING_MODEL.md",
      ruleId: "missing-operating-model-role",
      message: "OPERATING_MODEL must identify itself as the canonical policy source.",
    });
  }

  if (design && !/design reference/i.test(design)) {
    violations.push({
      path: "docs/DESIGN.md",
      ruleId: "missing-design-reference-role",
      message: "DESIGN must identify itself as a design reference, not current policy source.",
    });
  }

  return { violations };
}

export async function scanTrackedReleaseMarkdown(options: ReleaseMarkdownAuditOptions & { cwd?: string }): Promise<ReleaseMarkdownAuditResult> {
  const cwd = options.cwd ?? process.cwd();
  const paths = await listTrackedFiles(cwd);
  const files: ReleaseMarkdownFile[] = [];

  for (const path of paths.filter((item) => releaseDocPattern.test(item)).sort()) {
    try {
      files.push({
        path,
        content: await readFile(join(cwd, path), "utf8"),
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }

  return auditReleaseMarkdown(files, options);
}

export function renderReleaseMarkdownAudit(result: ReleaseMarkdownAuditResult): string {
  if (result.violations.length === 0) {
    return "Release markdown audit passed: docs have clear roles and no stale release target markers.";
  }
  return [
    "Release markdown audit failed:",
    ...result.violations.map((violation) => `- ${violation.path} [${violation.ruleId}] ${violation.message}`),
  ].join("\n");
}

async function listTrackedFiles(cwd: string): Promise<string[]> {
  const { stdout } = await execFileAsync("git", ["ls-files"], { cwd });
  return stdout.split(/\r?\n/).filter(Boolean);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targetVersionArg = process.argv.find((arg) => arg.startsWith("--target-version="));
  const targetVersion = targetVersionArg?.split("=")[1] ?? "v0.2.0";
  const result = await scanTrackedReleaseMarkdown({ targetVersion });
  console.log(renderReleaseMarkdownAudit(result));
  if (result.violations.length > 0) {
    process.exitCode = 1;
  }
}
