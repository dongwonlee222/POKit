import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadProblemReviewModule() {
  return import(`../../scripts/internal/problem-error-review.ts?cacheBust=${Date.now()}`);
}

test("renderProblemErrorReview shows the required Korean review structure", async () => {
  const { renderProblemErrorReview } = await loadProblemReviewModule();

  const output = renderProblemErrorReview({
    title: "on_error hook 미발동",
    problem: "hooks.yaml에는 on_error가 있지만 실행기가 없어 사용자 화면에 문제 리뷰가 나타나지 않았다.",
    occurredAt: "2026-05-15",
    actor: "Codex",
    command: "node --experimental-strip-types scripts/session-brief.ts --detail hooks",
    cause: "hook 선언과 실행 코드가 분리되어 있고 runner contract가 없었다.",
    prevention: "on_error runner와 contract test를 추가해 동일한 누락을 실패로 만든다.",
    nextActions: ["Backlog 후보를 확인한다.", "Linear 반영은 dry-run 후 승인받는다."],
    progress: { current: 3, total: 5 },
  });

  assert.match(output, /🚨 Problem \/ Error Review/);
  assert.match(output, /진행 상황/);
  assert.match(output, /\[██████░░░░\] 3\/5/);
  assert.match(output, /1️⃣ 무엇이 문제인가\?/);
  assert.match(output, /2️⃣ 언제 \/ 누구로 인하여 \/ 왜 발생했나\?/);
  assert.match(output, /3️⃣ 근본 해결 방법 제안/);
  assert.match(output, /on_error hook 미발동/);
  assert.match(output, /hook 선언과 실행 코드가 분리/);
});

test("writeProblemReviewMemo writes the canonical backlog artifact", async () => {
  const { buildProblemReviewMemoPath, writeProblemReviewMemo } = await loadProblemReviewModule();
  const rootDir = await mkdtemp(join(tmpdir(), "pokit-problem-review-"));

  const memoPath = await writeProblemReviewMemo({
    rootDir,
    slug: "hook-detail-missing",
    review: {
      title: "Hook detail missing",
      problem: "hooks detail 요청이 silent fallback 되었다.",
      occurredAt: "2026-05-15",
      actor: "Codex",
      cause: "--detail hooks 인자가 허용되지 않았다.",
      prevention: "detail arg test와 session-start contract를 추가한다.",
    },
  });

  assert.equal(memoPath, buildProblemReviewMemoPath(rootDir, "hook-detail-missing"));

  const content = await readFile(memoPath, "utf8");
  assert.match(content, /# 🚨 Problem \/ Error Review: Hook detail missing/);
  assert.match(content, /## 1️⃣ 무엇이 문제인가\?/);
  assert.match(content, /## 2️⃣ 언제 \/ 누구로 인하여 \/ 왜 발생했나\?/);
  assert.match(content, /## 3️⃣ 근본 해결 방법 제안/);
  assert.match(content, /detail arg test/);
});
