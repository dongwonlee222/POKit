import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getWorkingCycleContext, type Issue, type WorkingCycleContext } from "./linear.ts";
import { buildSprintDryRunSummary } from "./sprint-runner.ts";

export type SessionBriefInput = {
  now?: Date;
  context: WorkingCycleContext;
  rootDir?: string;
};

type IssueCounts = {
  todo: number;
  inProgress: number;
  done: number;
};

export function buildSessionBrief(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const rootDir = input.rootDir ?? ".";
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: input.context,
  });
  const counts = countIssues(input.context.issues);
  const candidates = selectNextCandidates(input.context.issues);
  const recentDone = selectRecentDone(input.context.issues);
  const runSummaryPath = findLatestRunSummary(rootDir, input.context.cycle.name);
  const retroPath = findRetro(rootDir, input.context.cycle.name);
  const candidateIds = candidates.map((issue) => issue.identifier);

  return [
    "# POKit Brief",
    "",
    `📅 ${formatKoreanDate(now)} · ${input.context.cycle.name}`,
    "",
    `📌 현재: Todo ${counts.todo} · 진행 ${counts.inProgress} · 완료 ${counts.done}`,
    `⚠️ 주의: 라벨 필요 ${dryRun.needsLabel.length} · 확인 필요 ${dryRun.needsClarification.length} · 승인 대기 ${dryRun.needsApproval.length}`,
    "",
    `🧺 다음 후보: ${candidateIds.length ? candidateIds.join(", ") : "없음"}`,
    `👉 추천: ${candidateIds.length ? `다음 cycle에 ${candidateIds.join(", ")} 담기` : "새 후보 issue를 백로그에 담기"}`,
    `💬 실행: “${candidateIds.length ? `다음 cycle에 ${candidateIds.join(", ")} 담고 POKit 돌려줘` : "백로그 후보 정리해서 POKit 돌려줘"}”`,
    "",
    `✅ 최근 완료: ${recentDone.length ? recentDone.map((issue) => issue.identifier).join(", ") : "없음"}`,
    `Run Summary: ${runSummaryPath ?? "없음"}`,
    `Retro: ${retroPath ?? "없음"}`,
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const context = await getWorkingCycleContext();
  console.log(buildSessionBrief({ context }));
}

function countIssues(issues: Issue[]): IssueCounts {
  const counts: IssueCounts = {
    todo: 0,
    inProgress: 0,
    done: 0,
  };
  for (const issue of issues) {
    const state = normalizeState(issue.state);
    if (state === "done" || state === "completed") {
      counts.done += 1;
    } else if (state === "in progress" || state === "in review" || state === "started") {
      counts.inProgress += 1;
    } else {
      counts.todo += 1;
    }
  }
  return counts;
}

function selectNextCandidates(issues: Issue[]): Issue[] {
  return issues
    .filter((issue) => {
      const state = normalizeState(issue.state);
      return state !== "done" && state !== "completed" && state !== "canceled" && state !== "cancelled" && state !== "duplicate";
    })
    .filter((issue) => normalizeState(issue.state) !== "in progress" && normalizeState(issue.state) !== "in review")
    .sort(compareIssueIdentifier)
    .slice(0, 3);
}

function selectRecentDone(issues: Issue[]): Issue[] {
  return issues
    .filter((issue) => {
      const state = normalizeState(issue.state);
      return state === "done" || state === "completed";
    })
    .sort((left, right) => compareIssueIdentifier(right, left))
    .slice(0, 2);
}

function compareIssueIdentifier(left: Issue, right: Issue): number {
  return issueNumber(left.identifier) - issueNumber(right.identifier);
}

function issueNumber(identifier: string): number {
  return Number(identifier.match(/\d+$/)?.[0] ?? Number.MAX_SAFE_INTEGER);
}

function findLatestRunSummary(rootDir: string, cycleName: string): string | null {
  const dir = join(rootDir, "artifacts", "sprints", safePathSegment(cycleName));
  if (!existsSync(dir)) {
    return null;
  }
  const filename = readdirSync(dir).filter((name) => name.endsWith("-run-summary.md")).sort().at(-1);
  return filename ? join("artifacts", "sprints", safePathSegment(cycleName), filename) : null;
}

function findRetro(rootDir: string, cycleName: string): string | null {
  const path = join("artifacts", "sprints", safePathSegment(cycleName), "retro.md");
  return existsSync(join(rootDir, path)) ? path : null;
}

function formatKoreanDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(date);
}

function normalizeState(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "") || "working-cycle";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
