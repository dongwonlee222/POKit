import { cwd } from "node:process";
import {
  renderProblemErrorReview,
  slugifyProblemTitle,
  type ProblemErrorReviewInput,
  writeProblemReviewMemo,
} from "./problem-error-review.ts";

export type OnErrorHookInput = {
  rootDir?: string;
  writeArtifact?: boolean;
  slug?: string;
  review: ProblemErrorReviewInput;
};

export type OnErrorHookResult = {
  output: string;
  artifactPath?: string;
};

export async function runOnErrorHook(input: OnErrorHookInput): Promise<OnErrorHookResult> {
  const output = renderProblemErrorReview(input.review);
  const artifactPath = input.writeArtifact
    ? writeProblemReviewMemo({
      rootDir: input.rootDir ?? cwd(),
      slug: input.slug ?? slugifyProblemTitle(input.review.title),
      review: input.review,
    })
    : undefined;

  return { output, artifactPath };
}

function readArg(name: string, fallback = ""): string {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] ?? fallback;
}

async function main(): Promise<void> {
  const eventName = process.argv[2];
  if (eventName !== "on_error") {
    throw new Error("Usage: scripts/hooks-runner.ts on_error --title ... --problem ... --cause ... --prevention ...");
  }

  const title = readArg("--title");
  const problem = readArg("--problem");
  const cause = readArg("--cause");
  const prevention = readArg("--prevention");
  if (!title || !problem || !cause || !prevention) {
    throw new Error("on_error requires --title, --problem, --cause, and --prevention");
  }

  const result = await runOnErrorHook({
    rootDir: readArg("--root-dir", cwd()),
    writeArtifact: process.argv.includes("--write-artifact"),
    slug: readArg("--slug", slugifyProblemTitle(title)),
    review: {
      title,
      problem,
      occurredAt: readArg("--occurred-at", new Date().toISOString().slice(0, 10)),
      actor: readArg("--actor", "Codex"),
      command: readArg("--command", ""),
      cause,
      prevention,
      progress: {
        current: Number(readArg("--current", "1")),
        total: Number(readArg("--total", "1")),
      },
    },
  });

  console.log(result.output);
  if (result.artifactPath) {
    console.log("");
    console.log(`artifact: ${result.artifactPath}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
