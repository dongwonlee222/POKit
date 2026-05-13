import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildArchiveGuardrail } from "./archive-guardrail.ts";
import { getWorkingContext, type Issue, type WorkingContext, type WorkingCycleContext } from "./linear.ts";
import { buildSprintDryRunSummary, type SprintDryRunSummary } from "./sprint-runner.ts";

export type SessionBriefInput = {
  now?: Date;
  context: WorkingCycleContext | WorkingContext;
  rootDir?: string;
};

type IssueCounts = {
  todo: number;
  inProgress: number;
  done: number;
  review: number;
};

type ResolvedSessionContext = {
  activeSurface?: WorkingCycleContext;
  displaySurface: WorkingCycleContext;
  primarySurface: WorkingCycleContext;
  backlogSurface?: WorkingCycleContext;
  primaryCandidates: Issue[];
  backlogCandidates: Issue[];
  recentDone: Issue[];
  currentCounts: IssueCounts;
  warningReviewCount: number;
  activeOperationallyComplete: boolean;
  futureUpcoming: boolean;
};

export function buildSessionBrief(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const rootDir = input.rootDir ?? ".";
  const resolved = resolveSessionContext(input.context, now);
  const currentSurface = resolved.displaySurface;
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: resolved.primarySurface,
  });
  const archiveGuardrail = buildArchiveGuardrail({ issues: currentSurface.issues });
  const runSummaryPath = findLatestRunSummary(rootDir, currentSurface.cycle.name);
  const retroPath = findRetro(rootDir, currentSurface.cycle.name);
  const candidateNumbers = resolved.primaryCandidates.map((_, index) => `${index + 1}번`);
  const recommendation = buildRecommendation({
    activeOperationallyComplete: resolved.activeOperationallyComplete,
    futureUpcoming: resolved.futureUpcoming,
    candidateNumbers,
    hasBacklogCandidates: resolved.backlogCandidates.length > 0,
    primarySource: resolved.primarySurface.source,
    cycleName: resolved.primarySurface.cycle.name,
  });
  const cycleLine = isOperationallyComplete(resolved.currentCounts)
    ? `✅ ${currentSurface.cycle.name} 완료: ${formatCounts(resolved.currentCounts)}`
    : `📌 현재: ${formatCounts(resolved.currentCounts)}`;

  return [
    "# POKit Brief",
    "",
    `📅 ${formatKoreanDate(now)} · ${currentSurface.cycle.name}`,
    "",
    cycleLine,
    formatWarningLine(dryRun, resolved.warningReviewCount),
    "",
    buildCandidateHeading(resolved.primarySurface, resolved.futureUpcoming),
    ...formatNumberedIssues(resolved.primaryCandidates),
    ...formatBacklogSection(resolved.backlogCandidates),
    "",
    `👉 추천: ${recommendation.summary}`,
    `💬 실행: “${recommendation.command}”`,
    "",
    "⚡ 빠른 명령",
    "1. “1번 자세히 보여줘”",
    `2. “${recommendation.command}”`,
    "3. “cycle 자세히 보여줘”",
    "4. “backlog 자세히 보여줘”",
    "5. “승인 대기 자세히 보여줘”",
    "",
    `✅ 최근 완료: ${resolved.recentDone.length ? resolved.recentDone.map((issue) => issue.identifier).join(", ") : "없음"}`,
    ...(archiveGuardrail.briefLine ? [archiveGuardrail.briefLine] : []),
    `Run Summary: ${runSummaryPath ?? "없음"}`,
    `Retro: ${retroPath ?? "없음"}`,
    "",
  ].join("\n");
}

export function buildCycleDetail(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const resolved = resolveSessionContext(input.context, now);
  const cycleSurface = resolved.displaySurface;
  const issuesByState = groupCycleIssues(cycleSurface.issues);
  return [
    "# POKit Cycle Detail",
    "",
    `📅 ${formatKoreanDate(now)} · ${cycleSurface.cycle.name}`,
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
  const resolved = resolveSessionContext(input.context, now);
  const backlogSurface = resolved.backlogSurface ?? resolved.primarySurface;
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: backlogSurface,
  });
  return [
    "# POKit Backlog Detail",
    "",
    `📅 ${formatKoreanDate(now)} · ${backlogSurface.cycle.name}`,
    "",
    ...(resolved.backlogSurface ? ["실제 Backlog 이슈", ...formatNumberedIssues(resolved.backlogSurface.issues), ""] : []),
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
  const resolved = resolveSessionContext(input.context, now);
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: resolved.primarySurface,
  });
  return [
    "# POKit Approval Detail",
    "",
    `📅 ${formatKoreanDate(now)} · ${resolved.primarySurface.cycle.name}`,
    "",
    "승인 대기",
    ...formatNeedsApproval(dryRun),
    "",
  ].join("\n");
}

export function buildCandidateDetail(input: SessionBriefInput, candidateNumber: number): string {
  const now = input.now ?? new Date();
  const resolved = resolveSessionContext(input.context, now);
  const candidates = resolved.primaryCandidates;
  const issue = candidates[candidateNumber - 1];
  if (!issue) {
    return [
      "# POKit Candidate Detail",
      "",
      `${candidateNumber}번 후보가 없습니다. 현재 후보는 ${candidates.length}개입니다.`,
      "",
    ].join("\n");
  }
  const recommendation = buildRecommendation({
    activeOperationallyComplete: resolved.activeOperationallyComplete,
    futureUpcoming: resolved.futureUpcoming,
    candidateNumbers: [`${candidateNumber}번`],
    hasBacklogCandidates: resolved.backlogCandidates.length > 0,
    primarySource: resolved.primarySurface.source,
    cycleName: resolved.primarySurface.cycle.name,
  });
  return [
    "# POKit Candidate Detail",
    "",
    `${candidateNumber}. ${formatIssue(issue)}`,
    "",
    "Description",
    issue.description?.trim() || "- 없음",
    "",
    `Next: “${recommendation.command}”`,
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const context = await getWorkingContext();
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
    review: 0,
  };
  for (const issue of issues) {
    const state = classifyIssueState(issue.state);
    if (state === "done") {
      counts.done += 1;
    } else if (state === "inProgress") {
      counts.inProgress += 1;
    } else if (state === "todo") {
      counts.todo += 1;
    } else {
      counts.review += 1;
    }
  }
  return counts;
}

function selectNextCandidates(issues: Issue[]): Issue[] {
  return issues
    .filter((issue) => {
      const state = classifyIssueState(issue.state);
      return state === "todo";
    })
    .sort(compareIssueIdentifier)
    .slice(0, 3);
}

function selectRecentDone(issues: Issue[]): Issue[] {
  return issues
    .filter((issue) => {
      return classifyIssueState(issue.state) === "done";
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
    const state = classifyIssueState(issue.state);
    if (state === "done") {
      groups.done.push(issue);
    } else if (state === "inProgress") {
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

function formatBulletedIssues(issues: Issue[]): string[] {
  if (!issues.length) {
    return ["- 없음"];
  }
  return issues.map((issue) => `- ${formatIssue(issue)}`);
}

function formatIssue(issue: Issue): string {
  const labels = issue.labels.length ? issue.labels.join(", ") : "no-label";
  const state = issue.state ?? "No state";
  return `${issue.identifier} ${issue.title} · ${state} · ${labels}`;
}

function formatCounts(counts: IssueCounts): string {
  const parts = [`Todo ${counts.todo}`, `진행 ${counts.inProgress}`, `완료 ${counts.done}`];
  if (counts.review > 0) {
    parts.push(`검토 ${counts.review}`);
  }
  return parts.join(" · ");
}

function formatWarningLine(dryRun: SprintDryRunSummary, reviewCount: number): string {
  const parts = [
    `라벨 필요 ${dryRun.needsLabel.length}`,
    `확인 필요 ${dryRun.needsClarification.length}`,
    `승인 대기 ${dryRun.needsApproval.length}`,
  ];
  if (reviewCount > 0) {
    parts.push(`상태 검토 ${reviewCount}`);
  }
  return `⚠️ 주의: ${parts.join(" · ")}`;
}

function formatBacklogSection(issues: Issue[]): string[] {
  if (!issues.length) {
    return [];
  }
  return [
    "",
    "🗂️ 백로그",
    ...formatBulletedIssues(issues),
  ];
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

function resolveSessionContext(context: WorkingCycleContext | WorkingContext, now: Date): ResolvedSessionContext {
  if (!isWorkingContext(context)) {
    const currentCounts = countIssues(context.issues);
    return {
      displaySurface: context,
      primarySurface: context,
      primaryCandidates: selectNextCandidates(context.issues),
      backlogCandidates: [],
      recentDone: selectRecentDone(context.issues),
      currentCounts,
      warningReviewCount: currentCounts.review,
      activeOperationallyComplete: isOperationallyComplete(currentCounts),
      futureUpcoming: false,
    };
  }

  const activeSurface = context.activeCycle ? toWorkingCycleContext(context.activeCycle) : undefined;
  const upcomingSurface = context.upcomingCycle ? toWorkingCycleContext(context.upcomingCycle) : undefined;
  const backlogSurface = context.backlogIssues.length
    ? {
        source: "team_backlog" as const,
        cycle: {
          id: "team-backlog",
          name: "Team Backlog",
        },
        issues: context.backlogIssues,
      }
    : undefined;

  const activeCounts = activeSurface ? countIssues(activeSurface.issues) : undefined;
  const activeOperationallyComplete = Boolean(activeCounts && isOperationallyComplete(activeCounts));
  const displayUpcoming = Boolean(
    activeOperationallyComplete &&
      upcomingSurface &&
      upcomingSurface.issues.length > 0,
  );
  const currentSurface = displayUpcoming
    ? upcomingSurface!
    : activeSurface ?? toWorkingCycleContext(context.selected);
  const currentCounts = countIssues(currentSurface.issues);
  const primarySurface = activeOperationallyComplete
    ? upcomingSurface ?? backlogSurface ?? currentSurface
    : currentSurface;

  return {
    activeSurface,
    displaySurface: currentSurface,
    primarySurface,
    backlogSurface,
    primaryCandidates: selectNextCandidates(primarySurface.issues),
    backlogCandidates:
      activeOperationallyComplete && backlogSurface && primarySurface.source !== "team_backlog"
        ? selectNextCandidates(backlogSurface.issues)
        : [],
    recentDone: selectRecentDone(currentSurface.issues),
    currentCounts,
    warningReviewCount: currentCounts.review,
    activeOperationallyComplete,
    futureUpcoming: Boolean(
      activeOperationallyComplete &&
        upcomingSurface &&
        primarySurface.source === "linear_upcoming" &&
        isFutureCycle(upcomingSurface, now),
    ),
  };
}

function isWorkingContext(context: WorkingCycleContext | WorkingContext): context is WorkingContext {
  return "selected" in context && "backlogIssues" in context;
}

function toWorkingCycleContext(context: WorkingCycleContext): WorkingCycleContext;
function toWorkingCycleContext(context: WorkingContext["selected"]): WorkingCycleContext;
function toWorkingCycleContext(context: WorkingContext["activeCycle"] | WorkingContext["upcomingCycle"] | WorkingCycleContext): WorkingCycleContext {
  if (!context) {
    throw new Error("Working cycle context is required.");
  }
  return {
    source: context.source,
    cycle: context.cycle,
    issues: context.issues,
  };
}

function isOperationallyComplete(counts: IssueCounts): boolean {
  return counts.todo === 0 && counts.inProgress === 0 && counts.review === 0;
}

function isFutureCycle(context: WorkingCycleContext, now: Date): boolean {
  if (!context.cycle.startsAt) {
    return false;
  }
  return new Date(context.cycle.startsAt).getTime() > now.getTime();
}

function buildCandidateHeading(context: WorkingCycleContext, futureUpcoming: boolean): string {
  if (context.source !== "linear_upcoming") {
    return "🧺 다음 후보";
  }
  const suffix = futureUpcoming
    ? cycleStartsAtLabel(context.cycle.startsAt, true)
    : cycleStartsAtLabel(context.cycle.startsAt, false);
  return suffix ? `🧺 다음 후보 (${context.cycle.name}, ${suffix})` : `🧺 다음 후보 (${context.cycle.name})`;
}

function cycleStartsAtLabel(startsAt: string | undefined, future: boolean): string | null {
  if (!startsAt) {
    return null;
  }
  const label = formatDateOnly(startsAt);
  return future ? `${label} 시작 예정` : `${label} 시작`;
}

function buildRecommendation(input: {
  activeOperationallyComplete: boolean;
  futureUpcoming: boolean;
  candidateNumbers: string[];
  hasBacklogCandidates: boolean;
  primarySource: WorkingCycleContext["source"];
  cycleName: string;
}): { summary: string; command: string } {
  if (input.candidateNumbers.length) {
    if (input.futureUpcoming) {
      return {
        summary: `${input.cycleName} 남은 Todo 전체 검토`,
        command: `${input.cycleName} 남은 Todo 전체를 검토하고 다음 Cycle 준비해줘`,
      };
    }
    return {
      summary: `${input.cycleName} 남은 Todo 전체 진행`,
      command: `${input.cycleName} 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘`,
    };
  }
  if (!input.activeOperationallyComplete && input.primarySource === "linear_active") {
    return {
      summary: "현재 cycle 상태 먼저 검토",
      command: "현재 cycle 상태 확인하고 POKit 이어서 돌려줘",
    };
  }
  if (input.hasBacklogCandidates) {
    return {
      summary: "Backlog 후보를 다음 Cycle 후보로 묶기",
      command: "Backlog 후보를 다음 Cycle 후보로 묶어줘",
    };
  }
  return {
    summary: "새 후보를 Backlog에 정리",
    command: "새 후보를 Backlog에 정리하고 다음 Cycle 후보를 묶어줘",
  };
}

function classifyIssueState(state: string | undefined): "done" | "inProgress" | "todo" | "review" {
  const normalized = normalizeState(state);
  if (normalized === "done" || normalized === "completed") {
    return "done";
  }
  if (normalized === "in progress" || normalized === "in review" || normalized === "started") {
    return "inProgress";
  }
  if (normalized === "todo" || normalized === "backlog" || normalized === "unstarted" || normalized === "open") {
    return "todo";
  }
  return "review";
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

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
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
