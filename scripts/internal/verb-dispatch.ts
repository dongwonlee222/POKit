import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { resolveVerbError, renderVerbErrorAscii } from "./error-mappings.ts";
import {
  slugifyProblemTitle,
  writeProblemReviewMemo,
  type ProblemErrorReviewInput,
} from "./problem-error-review.ts";

export type VerbRoute = {
  path: string;
};

export const VERB_ROUTES: Record<string, VerbRoute> = {
  start:      { path: "scripts/cli/session-start.ts" },
  brief:      { path: "scripts/cli/session-brief.ts" },
  run:        { path: "scripts/cli/sprint-runner.ts" },
  close:      { path: "scripts/cli/cycle-close.ts" },
  retro:      { path: "scripts/cli/retro-summary.ts" },
  hotfix:     { path: "scripts/cli/hotfix-cycle-plan.ts" },
  audit:      { path: "scripts/ci/release-md-audit.ts" },
  guard:      { path: "scripts/ci/cycle-guard.ts" },
  progress:   { path: "scripts/cli/cycle-progress.ts" },
  end:        { path: "scripts/cli/session-close.ts" },
  safety:     { path: "scripts/cli/public-safety-scan.ts" },
  "role-check": { path: "scripts/cli/role-map-check.ts" },
  sweep:      { path: "scripts/cli/collected-sweep.ts" },
  "retro-check": { path: "scripts/cli/retro-check.ts" },
  "next-action": { path: "scripts/cli/next-action.ts" },
  release:    { path: "scripts/cli/release.ts" },
};

export type DispatchInput = {
  verb: string;
  args: string[];
  rootDir?: string;
  stdio?: "inherit" | "pipe";
};

export type DispatchResult = {
  exitCode: number;
  stdout?: string;
  stderr?: string;
  artifactPath?: string;
};

function projectRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..");
}

function extractErrorMessage(stderr: string): string {
  const lines = stderr.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^(?:[A-Z][A-Za-z]*Error|Error):\s*(.+)$/);
    if (match) return match[1];
  }
  for (const line of lines) {
    if (line.startsWith("throw ") || /^\s*\^\s*$/.test(line) || /^Node\.js /.test(line)) continue;
    if (/^\s*at\s/.test(line)) continue;
    if (line.includes(".ts:") || line.includes(".js:")) continue;
    return line;
  }
  return lines[lines.length - 1] ?? stderr.trim() ?? "unknown error";
}

export function isKnownVerb(verb: string): boolean {
  return Object.prototype.hasOwnProperty.call(VERB_ROUTES, verb);
}

export function listKnownVerbs(): string[] {
  return Object.keys(VERB_ROUTES);
}

export async function dispatchVerb(input: DispatchInput): Promise<DispatchResult> {
  const rootDir = input.rootDir ?? projectRoot();
  if (!isKnownVerb(input.verb)) {
    const review: ProblemErrorReviewInput = {
      ...resolveVerbError("dispatcher", `Unknown verb: ${input.verb}. Known: ${listKnownVerbs().join(", ")}`),
      occurredAt: new Date().toISOString().slice(0, 10),
      actor: "verb-dispatch",
      command: `pokit ${input.verb}`,
    };
    const ascii = renderVerbErrorAscii("dispatcher", review);
    process.stderr.write(`${ascii}\n`);
    const artifactPath = writeProblemReviewMemo({
      rootDir,
      slug: slugifyProblemTitle(review.title),
      review,
    });
    process.stderr.write(`\nartifact: ${artifactPath}\n`);
    return { exitCode: 1, stderr: ascii, artifactPath };
  }

  const route = VERB_ROUTES[input.verb];
  const scriptPath = join(rootDir, route.path);
  const stdio = input.stdio ?? "inherit";
  const captureStderr = stdio === "pipe";

  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", scriptPath, ...input.args],
    {
      cwd: rootDir,
      stdio: captureStderr ? ["inherit", "inherit", "pipe"] : "inherit",
      env: process.env,
      encoding: "utf8",
    },
  );

  if (result.error) {
    const review: ProblemErrorReviewInput = {
      ...resolveVerbError(input.verb, result.error.message),
      occurredAt: new Date().toISOString().slice(0, 10),
      actor: `pokit ${input.verb}`,
      command: `pokit ${input.verb}`,
    };
    const ascii = renderVerbErrorAscii(input.verb, review);
    process.stderr.write(`${ascii}\n`);
    const artifactPath = writeProblemReviewMemo({
      rootDir,
      slug: slugifyProblemTitle(review.title),
      review,
    });
    process.stderr.write(`\nartifact: ${artifactPath}\n`);
    return { exitCode: 1, stderr: ascii, artifactPath };
  }

  const exitCode = result.status ?? 0;

  if (exitCode !== 0) {
    const capturedStderr = captureStderr ? (result.stderr ?? "") : "";
    const message = extractErrorMessage(capturedStderr || `pokit ${input.verb} exited with code ${exitCode}`);
    const review: ProblemErrorReviewInput = {
      ...resolveVerbError(input.verb, message),
      occurredAt: new Date().toISOString().slice(0, 10),
      actor: `pokit ${input.verb}`,
      command: `pokit ${input.verb}`,
    };
    const ascii = renderVerbErrorAscii(input.verb, review);
    process.stderr.write(`${ascii}\n`);
    const artifactPath = writeProblemReviewMemo({
      rootDir,
      slug: slugifyProblemTitle(review.title),
      review,
    });
    process.stderr.write(`\nartifact: ${artifactPath}\n`);
    return { exitCode, stderr: ascii, artifactPath };
  }

  return { exitCode: 0 };
}

async function main(): Promise<void> {
  const [verb, ...args] = process.argv.slice(2);
  if (!verb) {
    process.stderr.write("Usage: verb-dispatch <verb> [args...]\n");
    process.exit(2);
  }
  const result = await dispatchVerb({ verb, args, stdio: "pipe" });
  process.exit(result.exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`🚨 pokit:dispatcher FAILED reason=${message}\n`);
    process.exit(1);
  }
}
