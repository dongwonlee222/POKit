import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderProgressBar } from "./render/ascii.ts";

export type ProblemErrorReviewInput = {
  title: string;
  problem: string;
  occurredAt?: string;
  actor?: string;
  command?: string;
  cause: string;
  prevention: string;
  nextActions?: string[];
  progress?: {
    current: number;
    total: number;
  };
};

export function renderProblemErrorReview(review: ProblemErrorReviewInput): string {
  return [
    `# 🚨 Problem / Error Review: ${review.title}`,
    "",
    "진행 상황",
    renderProgress(review.progress ?? { current: 1, total: 1 }),
    "",
    "## 1️⃣ 무엇이 문제인가?",
    review.problem,
    "",
    "## 2️⃣ 언제 / 누구로 인하여 / 왜 발생했나?",
    `- 발생 시점: ${review.occurredAt ?? "확인 필요"}`,
    `- 주체: ${review.actor ?? "확인 필요"}`,
    review.command ? `- 관련 명령: \`${review.command}\`` : "- 관련 명령: 없음",
    `- 원인: ${review.cause}`,
    "",
    "## 3️⃣ 근본 해결 방법 제안",
    review.prevention,
    "",
    ...renderNextActions(review.nextActions),
  ].join("\n").trimEnd();
}

export function renderProblemReviewMemo(review: ProblemErrorReviewInput): string {
  return [
    `# 🚨 Problem / Error Review: ${review.title}`,
    "",
    "## 1️⃣ 무엇이 문제인가?",
    review.problem,
    "",
    "## 2️⃣ 언제 / 누구로 인하여 / 왜 발생했나?",
    `- 발생 시점: ${review.occurredAt ?? "확인 필요"}`,
    `- 주체: ${review.actor ?? "확인 필요"}`,
    review.command ? `- 관련 명령: \`${review.command}\`` : "- 관련 명령: 없음",
    `- 원인: ${review.cause}`,
    "",
    "## 3️⃣ 근본 해결 방법 제안",
    review.prevention,
    "",
    ...renderNextActions(review.nextActions),
    "",
  ].join("\n");
}

export function buildProblemReviewMemoPath(rootDir: string, slug: string): string {
  return join(rootDir, "memory", "problem-reviews", `${slug}-problem-review.md`);
}

export function writeProblemReviewMemo(input: {
  rootDir: string;
  slug: string;
  review: ProblemErrorReviewInput;
}): string {
  const artifactDir = join(input.rootDir, "memory", "problem-reviews");
  mkdirSync(artifactDir, { recursive: true });
  const artifactPath = buildProblemReviewMemoPath(input.rootDir, input.slug);
  writeFileSync(artifactPath, renderProblemReviewMemo(input.review), "utf8");
  return artifactPath;
}

export function slugifyProblemTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "problem";
}

function renderProgress(progress: { current: number; total: number }): string {
  return renderProgressBar(progress);
}

function renderNextActions(nextActions?: string[]): string[] {
  if (!nextActions?.length) {
    return [];
  }
  return [
    "## 다음 조치",
    ...nextActions.map((action) => `- ${action}`),
  ];
}
