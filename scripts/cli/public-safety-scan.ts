import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type PublicFile = {
  path: string;
  content: string;
};

export type PublicSafetyViolation = {
  path: string;
  line: number;
  ruleId: string;
  message: string;
};

type PublicSafetyRule = {
  id: string;
  message: string;
  test: (file: PublicFile, line: string) => boolean;
};

const issueIdentifierPattern = /\b[A-Z][A-Z0-9]+-\d+\b/;
const cycleNamePattern = /\bCycle\s+\d+\b/;
const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
const publicContentPathPattern = /^(?:AGENTS\.md|CHANGELOG\.md|README\.md|docs\/|examples\/|memory\/|scripts\/README\.md)/;

const publicSafetyRules: PublicSafetyRule[] = [
  {
    id: "private-linear-workspace",
    message: "Private Linear workspace slug must not be committed to the public template.",
    test: (_file, line) => /linear\.app\/(?!example\/)[a-z0-9-]+\/issue\//i.test(line),
  },
  {
    id: "private-linear-cycle-id",
    message: "Private Linear cycle IDs must not be committed to the public template.",
    test: (file, line) => publicContentPathPattern.test(file.path) && uuidPattern.test(line),
  },
  {
    id: "live-memory-state",
    message: "Tracked memory files must stay as public-safe placeholders, not live workspace state.",
    test: (file, line) => (
      /^memory\/(?:resume-brief|current-cycle|decision-log)/.test(file.path)
      && (issueIdentifierPattern.test(line) || cycleNamePattern.test(line))
    ),
  },
];

const scannerFixturePaths = new Set([
  "scripts/cli/public-safety-scan.ts",
  "tests/public-safety-scan.test.mjs",
  "tests/integration/public-safety-scan.test.mjs",
]);

export function scanPublicFiles(files: PublicFile[]): PublicSafetyViolation[] {
  const violations: PublicSafetyViolation[] = [];

  for (const file of files) {
    if (scannerFixturePaths.has(file.path)) {
      continue;
    }
    const lines = file.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of publicSafetyRules) {
        if (rule.test(file, line)) {
          violations.push({
            path: file.path,
            line: index + 1,
            ruleId: rule.id,
            message: rule.message,
          });
        }
      }
    });
  }

  return violations;
}

export async function listTrackedFiles(cwd = process.cwd()): Promise<string[]> {
  const { stdout } = await execFileAsync("git", ["ls-files"], { cwd });
  return stdout.split(/\r?\n/).filter(Boolean);
}

export async function listUntrackedFiles(cwd = process.cwd()): Promise<string[]> {
  const { stdout } = await execFileAsync("git", ["ls-files", "--others", "--exclude-standard"], { cwd });
  return stdout.split(/\r?\n/).filter(Boolean);
}

export async function scanTrackedPublicFiles(options: { cwd?: string } = {}): Promise<PublicSafetyViolation[]> {
  const cwd = options.cwd ?? process.cwd();
  const paths = Array.from(new Set([
    ...await listTrackedFiles(cwd),
    ...await listUntrackedFiles(cwd),
  ])).sort();
  const files: PublicFile[] = [];

  for (const path of paths) {
    try {
      files.push({
        path,
        content: await readFile(join(cwd, path), "utf8"),
      });
    } catch (error) {
      if (["ENOENT", "EISDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) {
        continue;
      }
      throw error;
    }
  }

  return scanPublicFiles(files);
}

export function renderPublicSafetyViolations(violations: PublicSafetyViolation[]): string {
  if (violations.length === 0) {
    return "Public safety scan passed: no private POKit dogfood data found.";
  }

  return [
    "Public safety scan failed:",
    ...violations.map((violation) => [
      `- ${violation.path}:${violation.line}`,
      `[${violation.ruleId}]`,
      violation.message,
    ].join(" ")),
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = await scanTrackedPublicFiles();
  console.log(renderPublicSafetyViolations(violations));
  console.log("\n<!-- AGENT: output above verbatim, no summary, no interpretation -->");
  if (violations.length > 0) {
    process.exitCode = 1;
  }
}
