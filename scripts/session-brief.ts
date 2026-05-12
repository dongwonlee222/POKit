import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildArchiveGuardrail } from "./archive-guardrail.ts";
import { getWorkingCycleContext, type Issue, type WorkingCycleContext } from "./linear.ts";
import { buildSprintDryRunSummary, type SprintDryRunSummary } from "./sprint-runner.ts";

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
  const archiveGuardrail = buildArchiveGuardrail({ issues: input.context.issues });
  const runSummaryPath = findLatestRunSummary(rootDir, input.context.cycle.name);
  const retroPath = findRetro(rootDir, input.context.cycle.name);
  const candidateIds = candidates.map((issue) => issue.identifier);
  const candidateNumbers = candidates.map((_, index) => `${index + 1}번`);

  return [
    "# POKit Brief",
    "",
    `📅 ${formatKoreanDate(now)} · ${input.context.cycle.name}`,
    "",
    `📌 현재: Todo ${counts.todo} · 진행 ${counts.inProgress} · 완료 ${counts.done}`,
    `⚠️ 주의: 라벨 필요 ${dryRun.needsLabel.length} · 확인 필요 ${dryRun.needsClarification.length} · 승인 대기 ${dryRun.needsApproval.length}`,
    "",
    "🧺 다음 후보",
    ...formatNumberedIssues(candidates),
    "",
    `👉 추천: ${candidateIds.length ? `${candidateNumbers.join(", ")}을 다음 cycle에 담기` : "새 후보 issue를 백로그에 담기"}`,
    `💬 실행: “${candidateIds.length ? `${candidateNumbers.join(", ")} 다음 cycle에 담고 POKit 돌려줘` : "백로그 후보 정리해서 POKit 돌려줘"}”`,
    "",
    "⚡ 빠른 명령",
    "1. “1번 자세히 보여줘”",
    "2. “1, 2, 3번 다음 cycle에 담고 돌려줘”",
    "3. “cycle 자세히 보여줘”",
    "4. “backlog 자세히 보여줘”",
    "5. “승인 대기 자세히 보여줘”",
    "",
    `✅ 최근 완료: ${recentDone.length ? recentDone.map((issue) => issue.identifier).join(", ") : "없음"}`,
    ...(archiveGuardrail.briefLine ? [archiveGuardrail.briefLine] : []),
    `Run Summary: ${runSummaryPath ?? "없음"}`,
    `Retro: ${retroPath ?? "없음"}`,
    "",
  ].join("\n");
}

export function buildCycleDetail(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const issuesByState = groupCycleIssues(input.context.issues);
  return [
    "# POKit Cycle Detail",
    "",
    `📅 ${formatKoreanDate(now)} · ${input.context.cycle.name}`,
    "",
    "Todo",
    ...formatNumberedIssues(issuesByState.todo),
    "",
    "In Progress",
    ...formatNumberedIssues(issuesByState.inProgress),
    "",
    "Done",
    ...formatNumberedIssues(issuesByState.done),
    "",
  ].join("\n");
}

export function buildBacklogDetail(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: input.context,
  });
  return [
    "# POKit Backlog Detail",
    "",
    `📅 ${formatKoreanDate(now)} · ${input.context.cycle.name}`,
    "",
    "생성 후보",
    ...formatGenerated(dryRun),
    "",
    "라벨 필요",
    ...formatNeedsLabel(dryRun),
    "",
    "확인 필요",
    ...formatNeedsClarification(dryRun),
    "",
    "승인 대기",
    ...formatNeedsApproval(dryRun),
    "",
  ].join("\n");
}

export function buildApprovalDetail(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: input.context,
  });
  return [
    "# POKit Approval Detail",
    "",
    `📅 ${formatKoreanDate(now)} · ${input.context.cycle.name}`,
    "",
    "승인 대기",
    ...formatNeedsApproval(dryRun),
    "",
  ].join("\n");
}

export function buildCandidateDetail(input: SessionBriefInput, candidateNumber: number): string {
  const candidates = selectNextCandidates(input.context.issues);
  const issue = candidates[candidateNumber - 1];
  if (!issue) {
    return [
      "# POKit Candidate Detail",
      "",
      `${candidateNumber}번 후보가 없습니다. 현재 후보는 ${candidates.length}개입니다.`,
      "",
    ].join("\n");
  }
  return [
    "# POKit Candidate Detail",
    "",
    `${candidateNumber}. ${formatIssue(issue)}`,
    "",
    "Description",
    issue.description?.trim() || "- 없음",
    "",
    `Next: “${candidateNumber}번 다음 cycle에 담고 돌려줘”`,
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const context = await getWorkingCycleContext();
  const args = process.argv.slice(2);
  const candidateNumber = readCandidateArg(args);
  if (candidateNumber) {
    console.log(buildCandidateDetail({ context }, candidateNumber));
    return;
  }
  const detail = readDetailArg(args);
  if (detail === "cycle") {
    console.log(buildCycleDetail({ context }));
    return;
  }
  if (detail === "backlog") {
    console.log(buildBacklogDetail({ context }));
    return;
  }
  if (detail === "approvals") {
    console.log(buildApprovalDetail({ context }));
    return;
  }
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

function groupCycleIssues(issues: Issue[]): { todo: Issue[]; inProgress: Issue[]; done: Issue[] } {
  const groups = {
    todo: [] as Issue[],
    inProgress: [] as Issue[],
    done: [] as Issue[],
  };
  for (const issue of [...issues].sort(compareIssueIdentifier)) {
    const state = normalizeState(issue.state);
    if (state === "done" || state === "completed") {
      groups.done.push(issue);
    } else if (state === "in progress" || state === "in review" || state === "started") {
      groups.inProgress.push(issue);
    } else {
      groups.todo.push(issue);
    }
  }
  return groups;
}

function formatNumberedIssues(issues: Issue[]): string[] {
  if (!issues.length) {
    return ["- 없음"];
  }
  return issues.map((issue, index) => `${index + 1}. ${formatIssue(issue)}`);
}

function formatIssue(issue: Issue): string {
  const labels = issue.labels.length ? issue.labels.join(", ") : "no-label";
  const state = issue.state ?? "No state";
  return `${issue.identifier} ${issue.title} · ${state} · ${labels}`;
}

function formatGenerated(dryRun: SprintDryRunSummary): string[] {
  if (!dryRun.generated.length) {
    return ["- 없음"];
  }
  return dryRun.generated.map((item, index) => `${index + 1}. ${formatIssue(item.issue)} → ${item.artifactType} · ${item.path}`);
}

function formatNeedsLabel(dryRun: SprintDryRunSummary): string[] {
  if (!dryRun.needsLabel.length) {
    return ["- 없음"];
  }
  return dryRun.needsLabel.map((item, index) => `${index + 1}. ${formatIssue(item.issue)} → ${item.proposedLabel} 제안`);
}

function formatNeedsClarification(dryRun: SprintDryRunSummary): string[] {
  if (!dryRun.needsClarification.length) {
    return ["- 없음"];
  }
  return dryRun.needsClarification.map((item, index) => `${index + 1}. ${formatIssue(item.issue)} → ${item.questions.join(" / ")}`);
}

function formatNeedsApproval(dryRun: SprintDryRunSummary): string[] {
  if (!dryRun.needsApproval.length) {
    return ["- 없음"];
  }
  return dryRun.needsApproval.map((plan, index) => `${index + 1}. ${plan.summary} · ${plan.idempotencyKey}`);
}

function readDetailArg(args: string[]): "cycle" | "backlog" | "approvals" | null {
  const detailIndex = args.findIndex((arg) => arg === "--detail");
  const detailValue = detailIndex >= 0 ? args[detailIndex + 1] : undefined;
  if (detailValue === "cycle" || args.includes("--cycle-detail")) {
    return "cycle";
  }
  if (detailValue === "backlog" || args.includes("--backlog-detail")) {
    return "backlog";
  }
  if (detailValue === "approvals" || args.includes("--approval-detail")) {
    return "approvals";
  }
  return null;
}

function readCandidateArg(args: string[]): number | null {
  const candidateIndex = args.findIndex((arg) => arg === "--candidate");
  if (candidateIndex < 0) {
    return null;
  }
  const value = Number(args[candidateIndex + 1]);
  return Number.isInteger(value) && value > 0 ? value : null;
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
