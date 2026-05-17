/**
 * 공통 테스트 helper (POKIT-202).
 *
 * 사용:
 *   import { mkTempDir, writeFixture, runCli } from "../_setup/index.mjs";
 */
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = new URL("../..", import.meta.url).pathname;

/** 임시 디렉토리 생성. prefix 로 식별. */
export function mkTempDir(prefix = "pokit-test-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** 파일 작성 (디렉토리 자동 생성). */
export function writeFixture(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  return filePath;
}

/** repo 루트 기준 절대 경로. */
export function repoPath(rel) {
  return join(REPO_ROOT, rel);
}

/**
 * scripts/internal/linear.ts CLI 실행 helper.
 * 기존 linear-cli.test.mjs 의 runCli 함수와 동일 구조.
 */
export function runLinearCli(args, { env = {} } = {}) {
  const cliPath = repoPath("scripts/internal/linear.ts");
  const result = spawnSync(
    "node",
    ["--experimental-strip-types", cliPath, ...args],
    {
      encoding: "utf8",
      env: { ...process.env, LINEAR_API_KEY: undefined, ...env },
    },
  );
  return { exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
}

/**
 * pokit verb 실행 helper. ./bin/pokit <verb> [args...] 호출.
 */
export function runPokitVerb(verb, args = [], { env = {} } = {}) {
  const bin = repoPath("bin/pokit");
  const result = spawnSync(bin, [verb, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** 임시 backlog-raw 메모 작성 (frontmatter + body). */
export function writeBacklogMemo(rootDir, filename, frontmatter, body = "## AS-IS\n본문\n") {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${v === null ? "null" : v}`)
    .join("\n");
  return writeFixture(
    join(rootDir, "memory/backlog-raw", filename),
    `---\n${fm}\n---\n\n${body}`,
  );
}

/** 파일 읽기 short-cut (utf8). */
export function readUtf8(path) {
  return readFileSync(path, "utf8");
}
