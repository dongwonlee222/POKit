import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadHooksRunnerModule() {
  return import(`../../scripts/internal/hooks-runner.ts?cacheBust=${Date.now()}`);
}

test("runOnErrorHook renders a Problem/Error Review and can write the memo artifact", async () => {
  const { runOnErrorHook } = await loadHooksRunnerModule();
  const rootDir = await mkdtemp(join(tmpdir(), "pokit-hooks-runner-"));

  const result = await runOnErrorHook({
    rootDir,
    writeArtifact: true,
    slug: "on-error-runner-missing",
    review: {
      title: "on_error runner missing",
      problem: "에러 발생 시 표준 리뷰가 사용자 화면에 나오지 않았다.",
      occurredAt: "2026-05-15",
      actor: "Codex",
      command: "node --experimental-strip-types scripts/hooks-runner.ts on_error",
      cause: "hooks.yaml 선언만 있고 실행기 contract가 없었다.",
      prevention: "hooks-runner와 contract test를 추가한다.",
      progress: { current: 4, total: 5 },
    },
  });

  assert.match(result.output, /🚨 Problem \/ Error Review/);
  assert.match(result.output, /on_error runner missing/);
  assert.ok(result.artifactPath?.endsWith("memory/problem-reviews/on-error-runner-missing-problem-review.md"));

  const artifact = await readFile(result.artifactPath, "utf8");
  assert.match(artifact, /hooks-runner와 contract test/);
});
