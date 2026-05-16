import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { buildArchiveGuardrail } from "../internal/archive-guardrail.ts";
import { renderCycleProgress } from "./cycle-progress.ts";
import { loadHookMap, renderHookMap } from "../internal/hook-map.ts";
import { getWorkingContext, type Issue, type WorkingContext, type WorkingCycleContext } from "../internal/linear.ts";
import { getActiveProfile, profileArtifactPath } from "../internal/profile.ts";
import { renderProgressBar } from "../internal/render/ascii.ts";
import { loadMessageCatalog, renderMessage } from "../internal/message-catalog.ts";
import { buildSprintDryRunSummary, type SprintDryRunSummary } from "./sprint-runner.ts";

export type SessionBriefInput = {
  now?: Date;
  context: WorkingCycleContext | WorkingContext;
  rootDir?: string;
  variant?: "dashboard" | "start";
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
  backlogCandidateFallback: boolean;
};

export function buildSessionBrief(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const rootDir = input.rootDir ?? ".";
  const resolved = resolveSessionContext(input.context, now);
  const currentSurface = resolved.displaySurface;
  const profile = getActiveProfile();
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: resolved.primarySurface,
  });
  const archiveGuardrail = buildArchiveGuardrail({ issues: currentSurface.issues });
  const runSummaryPath = findLatestRunSummary(rootDir, currentSurface.cycle.name);
  const retroPath = findRetro(rootDir, currentSurface.cycle.name);
  const roadmapLine = buildRoadmapLine(currentSurface.cycle);
  const cycleDisplayName = formatCycleDisplayName(currentSurface.cycle);
  const primaryCycleReference = formatCycleReference(resolved.primarySurface.cycle);
  const cycleNumberWarning = buildCycleNumberWarning(currentSurface.cycle);
  const candidateNumbers = resolved.primaryCandidates.map((_, index) => `${index + 1}번`);
  const recommendation = buildRecommendation({
    activeOperationallyComplete: resolved.activeOperationallyComplete,
    futureUpcoming: resolved.futureUpcoming,
    candidateNumbers,
    hasBacklogCandidates: resolved.backlogCandidates.length > 0,
    backlogCandidateFallback: resolved.backlogCandidateFallback,
    primarySource: resolved.primarySurface.source,
    cycleName: primaryCycleReference,
  });
  const currentLabel = messageLabel(rootDir, "session_start.current_status_label", "📌 현재");
  const cycleLine = isOperationallyComplete(resolved.currentCounts)
    ? `✅ ${cycleDisplayName} 완료: ${formatCounts(resolved.currentCounts)}`
    : `${currentLabel}: ${formatCounts(resolved.currentCounts)}`;

  if (input.variant === "start") {
    const version = readReleaseVersion(rootDir);
    const teamLabel = profile.linearTeamKey ?? "POKIT";
    const resumeNext = readResumeBriefNextAction(rootDir);
    const nextActionText = resumeNext ?? recommendation.summary;
    const top3 = resolved.primaryCandidates.slice(0, 3);
    return [
      "🪧 POKit 시작 Brief",
      `📅 ${formatKoreanDate(now)} · Team ${teamLabel}`,
      "",
      `- 스프린트(배포 버전): ${version}`,
      `- 💬 추천 다음 행동: ${nextActionText}`,
      "",
      "📋 Linear 우선순위 Top 3",
      ...formatStartTopIssues(top3),
      "",
    ].join("\n");
  }

  return [
    "# POKit Brief",
    "",
    `📅 ${formatKoreanDate(now)} · ${cycleDisplayName}`,
    `Profile: ${profile.name}${profile.linearTeamKey ? ` · Team Key: ${profile.linearTeamKey}` : ""}`,
    ...(roadmapLine ? [roadmapLine] : []),
    ...(cycleNumberWarning ? [cycleNumberWarning] : []),
    "",
    ...renderCycleProgress({ currentStep: 1 }),
    "",
    cycleLine,
    formatWarningLine(dryRun, resolved.warningReviewCount),
    ...formatProgressSection(currentSurface.issues),
    ...formatFocusRunSection(currentSurface.issues),
    ...formatDueDateSection(currentSurface.issues, now),
    "",
    buildCandidateHeading(resolved.primarySurface, resolved.futureUpcoming, rootDir),
    ...formatNumberedIssues(resolved.primaryCandidates),
    ...formatBacklogSection(resolved.backlogCandidates),
    "",
    `${messageLabel(rootDir, "session_start.next_action_label", "💬 추천 다음 행동")}: ${recommendation.summary}`,
    `“${recommendation.command}”`,
    "",
    `✅ 최근 완료: ${resolved.recentDone.length ? resolved.recentDone.map((issue) => issue.identifier).join(", ") : "없음"}`,
    ...(archiveGuardrail.briefLine ? [archiveGuardrail.briefLine] : []),
    `Run Summary: ${runSummaryPath ?? "없음"}`,
    `Retro: ${retroPath ?? "없음"}`,
    "",
  ].join("\n");
}

function buildPreviousSessionBlock(rootDir: string): string[] {
  const path = join(rootDir, "memory/resume-brief.md");
  const headerLabel = messageLabel(rootDir, "session_start.previous_session_label", "🪧 이전 세션");
  if (!existsSync(path)) {
    const missing = messageLabel(rootDir, "session_start.previous_missing", "이전 세션 기록 없음");
    return [headerLabel, `- ${missing}`, ""];
  }
  const content = readFileSync(path, "utf8");
  const sections = parseResumeBriefSections(content);
  const stoppedLabel = messageLabel(rootDir, "session_start.previous_stopped_label", "어디서 멈췄나");
  const nextLabel = messageLabel(rootDir, "session_start.previous_next_label", "다음에 무엇을 하나");
  const blockedLabel = messageLabel(rootDir, "session_start.previous_blocked_label", "차단된 것");
  const lines: string[] = [headerLabel];
  if (sections.stopped) {
    lines.push(`- ${stoppedLabel}: ${sections.stopped}`);
  }
  if (sections.next.length) {
    lines.push(`- ${nextLabel}:`);
    for (const item of sections.next) {
      lines.push(`  - ${item}`);
    }
  }
  if (sections.blocked) {
    lines.push(`- ${blockedLabel}: ${sections.blocked}`);
  }
  if (lines.length === 1) {
    const missing = messageLabel(rootDir, "session_start.previous_missing", "이전 세션 기록 없음");
    lines.push(`- ${missing}`);
  }
  lines.push("");
  return lines;
}

function parseResumeBriefSections(content: string): { stopped: string; next: string[]; blocked: string } {
  const lines = content.split(/\r?\n/);
  const sectionMap: Record<string, string[]> = {};
  let currentKey: string | null = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      currentKey = heading[1].trim();
      sectionMap[currentKey] = [];
      continue;
    }
    if (currentKey) {
      sectionMap[currentKey].push(line);
    }
  }
  const stoppedRaw = (sectionMap["어디서 멈췄나"] ?? []).map((l) => l.trim()).filter(Boolean);
  const nextRaw = (sectionMap["다음에 무엇을 하나"] ?? []).map((l) => l.trim()).filter(Boolean);
  const blockedRaw = (sectionMap["차단된 것"] ?? []).map((l) => l.trim()).filter(Boolean);
  return {
    stopped: stoppedRaw[0] ?? "",
    next: nextRaw
      .filter((l) => l.startsWith("-"))
      .map((l) => l.replace(/^-\s*/, ""))
      .slice(0, 5),
    blocked: blockedRaw[0] ?? "",
  };
}

function messageLabel(rootDir: string, id: string, fallback: string): string {
  const path = join(rootDir, "workflows/messages.yaml");
  if (!existsSync(path)) {
    return fallback;
  }
  const catalog = loadMessageCatalog(path);
  const message = catalog.messages[id];
  if (!message) {
    return fallback;
  }
  return `${message.emoji ? `${message.emoji} ` : ""}${renderMessage(catalog, id)}`;
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
    ...formatHierarchicalIssues(issuesByState.todo, cycleSurface.issues),
    "",
    "In Progress",
    ...formatHierarchicalIssues(issuesByState.inProgress, cycleSurface.issues),
    "",
    "Done",
    ...formatHierarchicalIssues(issuesByState.done, cycleSurface.issues),
    "",
  ].join("\n");
}

export function buildBacklogDetail(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const rootDir = input.rootDir ?? ".";
  const resolved = resolveSessionContext(input.context, now);
  const backlogSurface = resolved.backlogSurface ?? resolved.primarySurface;
  const dryRun = buildSprintDryRunSummary({
    generatedAt: now.toISOString(),
    context: backlogSurface,
  });
  const problemReviewMemos = listProblemReviewMemos(rootDir);
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
    "Problem/Error Review 메모",
    ...formatProblemReviewMemos(problemReviewMemos),
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

export function buildFlowDetail(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const resolved = resolveSessionContext(input.context, now);
  const cycleName = resolved.displaySurface.cycle.name;
  return [
    "# POKit Flow Map",
    "",
    `📅 ${formatKoreanDate(now)} · ${cycleName}`,
    "",
    "읽는 법",
    "- 왼쪽 단계는 사용자가 겪는 흐름입니다.",
    "- `|` 오른쪽 설명은 그 단계에서 POKit이 실제로 읽거나 실행하는 것들입니다.",
    "- release는 Cycle 밖 후속작업이 아니라 Cycle 완료 직전 gate입니다.",
    "",
    "Cycle loop:",
    "",
    "Start",
    "  |",
    "  v",
    "Context Load",
    "  |  이전 세션 요약 · 현재 Cycle · Linear 상태를 읽음",
    "  |  files: memory/context-map.yaml · memory/resume-brief.md",
    "  v",
    "Brief",
    "  |  사용자가 지금 무엇부터 볼지 정리",
    "  |  script: scripts/cli/session-brief.ts · hook: session_start",
    "  v",
    "Backlog",
    "  |  사용자 아이디어를 후보 작업으로 정리",
    "  |  checks: Identity Fit · Discovery depth · Backlog Candidate",
    "  v",
    "Cycle Plan",
    "  |  후보를 Linear Parent/Sub-issue 작업 묶음으로 배치",
    "  |  hook: before_implementation",
    "  v",
    "Cycle Run",
    "  |  실제 변경과 산출물이 생김",
    "  |  outputs: docs/ · scripts/ · examples/ · tests/ · artifacts/",
    "  v",
    "Issue Done",
    "  |  증거 확인 후 사용자 승인으로 Linear Done 반영",
    "  v",
    "Verification",
    "  |  테스트와 안전검사로 release 가능성 확인",
    "  v",
    "Commit",
    "  |",
    "  v",
    "Push / Tag / GitHub Release",
    "  |  외부 사용자가 받을 수 있게 배포",
    "  |  hook: before_public_release · script: scripts/release-preflight.ts",
    "  v",
    "Cycle Complete",
    "  |",
    "  v",
    "Next Cycle",
    "",
    "Rule: release는 Cycle 바깥 후속작업이 아니라 Cycle 완료 조건 안쪽 gate입니다.",
    "",
  ].join("\n");
}

export function buildHookDetail(input: SessionBriefInput): string {
  const now = input.now ?? new Date();
  const resolved = resolveSessionContext(input.context, now);
  return [
    renderHookMap(loadHookMap()),
    `Context: ${formatKoreanDate(now)} · ${resolved.displaySurface.cycle.name}`,
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
    backlogCandidateFallback: resolved.backlogCandidateFallback,
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
  if (detail === "flow") {
    console.log(buildFlowDetail({ context }));
    return;
  }
  if (detail === "hooks") {
    console.log(buildHookDetail({ context }));
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
    .sort(compareIssuePriority)
    .slice(0, 3);
}

function compareIssuePriority(left: Issue, right: Issue): number {
  // Linear priority: 1=Urgent, 2=High, 3=Medium, 4=Low, 0=None
  // 0 (No priority) goes last
  const leftP = left.priority === 0 || left.priority === undefined ? Number.MAX_SAFE_INTEGER : left.priority;
  const rightP = right.priority === 0 || right.priority === undefined ? Number.MAX_SAFE_INTEGER : right.priority;
  if (leftP !== rightP) return leftP - rightP;
  return compareIssueIdentifier(left, right);
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

function formatProblemReviewMemos(memos: Array<{ title: string; path: string }>): string[] {
  if (!memos.length) {
    return ["- 없음"];
  }
  return memos.map((memo, index) => `${index + 1}. ${memo.title} · ${memo.path}`);
}

function listProblemReviewMemos(rootDir: string): Array<{ title: string; path: string }> {
  const backlogDir = join(rootDir, "memory", "problem-reviews");
  if (!existsSync(backlogDir)) {
    return [];
  }
  return readdirSync(backlogDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith("problem-review.md"))
    .sort()
    .map((name) => {
      const path = join("memory", "problem-reviews", name);
      return {
        title: problemReviewTitleFromFilename(name),
        path,
      };
    });
}

function problemReviewTitleFromFilename(name: string): string {
  return name
    .replace(/-problem-review\.md$/, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatHierarchicalIssues(issues: Issue[], allIssues: Issue[]): string[] {
  const parentIssues = issues.filter((issue) => !issue.parent);
  if (!parentIssues.length) {
    return ["- 없음"];
  }
  const childrenByParent = groupSubIssuesByParent(allIssues);
  return parentIssues.flatMap((issue, index) => {
    const children = childrenByParent.get(issue.id) ?? [];
    return [
      `${index + 1}. ${formatIssue(issue)}`,
      ...children.map((child) => `   - ${formatIssue(child)}`),
    ];
  });
}

function formatProgressSection(issues: Issue[]): string[] {
  if (!issues.length) {
    return [];
  }
  const childrenByParent = groupSubIssuesByParent(issues);
  const parentIssues = [...issues]
    .filter((issue) => !issue.parent)
    .sort(compareIssueIdentifier);
  if (!parentIssues.length) {
    return [];
  }
  return [
    "",
    "📊 진행도",
    ...parentIssues.map((issue) => formatParentProgress(issue, childrenByParent.get(issue.id) ?? [])),
  ];
}

function formatParentProgress(parent: Issue, children: Issue[]): string {
  const units = children.length ? children : [parent];
  const done = units.filter((issue) => classifyIssueState(issue.state) === "done").length;
  const total = units.length;
  return `- ${parent.identifier} ${parent.title} ${renderProgressBar({ current: done, total, width: total })}`;
}

function formatFocusRunSection(issues: Issue[]): string[] {
  const groups = groupIssuesByFocusRun(issues);
  if (!groups.length) {
    return [];
  }
  return [
    "",
    "🎯 Focus Runs",
    ...groups.flatMap(([runNumber, runIssues]) => formatFocusRun(runNumber, runIssues)),
  ];
}

function groupIssuesByFocusRun(issues: Issue[]): Array<[string, Issue[]]> {
  const groups = new Map<string, Issue[]>();
  for (const issue of issues) {
    const runNumber = issue.labels.map(readFocusRunNumber).find(Boolean);
    if (!runNumber) {
      continue;
    }
    const existing = groups.get(runNumber) ?? [];
    existing.push(issue);
    groups.set(runNumber, existing);
  }
  return [...groups.entries()]
    .map(([runNumber, runIssues]) => [runNumber, runIssues.sort(compareIssueIdentifier)] as [string, Issue[]])
    .sort(([left], [right]) => compareFocusRunNumber(left, right));
}

function readFocusRunNumber(label: string): string | null {
  const trimmed = label.trim();
  const match = trimmed.match(/^(?:Focus Run\s*\/\s*|focus:)?(\d+\.\d+)$/i);
  return match?.[1] ?? null;
}

function compareFocusRunNumber(left: string, right: string): number {
  const [leftCycle, leftRun] = left.split(".").map(Number);
  const [rightCycle, rightRun] = right.split(".").map(Number);
  return (leftCycle - rightCycle) || (leftRun - rightRun);
}

function formatFocusRun(runNumber: string, issues: Issue[]): string[] {
  const done = issues.filter((issue) => classifyIssueState(issue.state) === "done").length;
  const total = issues.length;
  const status = classifyFocusRunStatus(issues);
  const lines = [
    `${runNumber} [${status}]`,
    ...issues.map((issue) => `${classifyIssueState(issue.state) === "done" ? "[x]" : "[ ]"} ${issue.identifier} ${issue.title}`),
  ];
  if (status === "완료") {
    lines.push(`✅ ${runNumber} 완료`);
  } else if (status === "대기") {
    lines.push("대기");
  } else {
    lines.push(`진행도 ${renderProgressBar({ current: done, total, width: total })}`);
  }
  return lines;
}

function classifyFocusRunStatus(issues: Issue[]): "완료" | "진행" | "대기" {
  const states = issues.map((issue) => classifyIssueState(issue.state));
  if (states.every((state) => state === "done")) {
    return "완료";
  }
  if (states.every((state) => state === "todo")) {
    return "대기";
  }
  return "진행";
}

function formatDueDateSection(issues: Issue[], now: Date): string[] {
  const withDueDate = issues.filter((issue) => issue.dueDate && classifyIssueState(issue.state) !== "done");
  if (!withDueDate.length) {
    return [];
  }
  const today = formatIsoDate(now);
  const dueToday = withDueDate.filter((issue) => issue.dueDate === today).sort(compareIssueIdentifier);
  const overdue = withDueDate.filter((issue) => issue.dueDate && issue.dueDate < today).sort(compareIssueIdentifier);
  const next = withDueDate.filter((issue) => issue.dueDate && issue.dueDate > today).sort(compareIssueIdentifier);
  return [
    "",
    "🗓️ 오늘 보기",
    `- due Today: ${formatIssueIdentifiers(dueToday)}`,
    `- overdue: ${formatIssueIdentifiers(overdue)}`,
    `- next: ${formatIssueIdentifiers(next)}`,
  ];
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatIssueIdentifiers(issues: Issue[]): string {
  return issues.length ? issues.map((issue) => issue.identifier).join(", ") : "없음";
}

function groupSubIssuesByParent(issues: Issue[]): Map<string, Issue[]> {
  const grouped = new Map<string, Issue[]>();
  for (const issue of issues) {
    if (!issue.parent?.id) {
      continue;
    }
    const existing = grouped.get(issue.parent.id) ?? [];
    existing.push(issue);
    grouped.set(issue.parent.id, existing);
  }
  for (const children of grouped.values()) {
    children.sort(compareIssueIdentifier);
  }
  return grouped;
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
      backlogCandidateFallback: false,
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
  const shouldUseBacklogCandidates = Boolean(
    !activeSurface &&
      upcomingSurface &&
      upcomingSurface.issues.length === 0 &&
      backlogSurface,
  );
  const displayUpcoming = Boolean(
    (activeOperationallyComplete || shouldUseBacklogCandidates) &&
      upcomingSurface &&
      upcomingSurface.issues.length > 0,
  );
  const currentSurface = displayUpcoming
    ? upcomingSurface!
    : activeSurface ?? toWorkingCycleContext(context.selected);
  const currentCounts = countIssues(currentSurface.issues);
  const emptyUpcomingWithBacklog = Boolean(
    (activeOperationallyComplete || shouldUseBacklogCandidates) &&
      upcomingSurface &&
      upcomingSurface.issues.length === 0 &&
      backlogSurface,
  );
  const primarySurface = activeOperationallyComplete
    ? emptyUpcomingWithBacklog
      ? backlogSurface!
      : upcomingSurface ?? backlogSurface ?? currentSurface
    : shouldUseBacklogCandidates
      ? backlogSurface!
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
    backlogCandidateFallback: shouldUseBacklogCandidates,
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

function buildCandidateHeading(context: WorkingCycleContext, futureUpcoming: boolean, rootDir = "."): string {
  const label = messageLabel(rootDir, "session_start.next_candidates_label", "Linear 우선순위 Top 3");
  if (context.source !== "linear_upcoming") {
    return label;
  }
  const cycleName = formatCycleDisplayName(context.cycle);
  const suffix = futureUpcoming
    ? cycleStartsAtLabel(context.cycle.startsAt, true)
    : cycleStartsAtLabel(context.cycle.startsAt, false);
  return suffix ? `${label} (${cycleName}, ${suffix})` : `${label} (${cycleName})`;
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
  backlogCandidateFallback: boolean;
  primarySource: WorkingCycleContext["source"];
  cycleName: string;
}): { summary: string; command: string } {
  if (input.backlogCandidateFallback) {
    return {
      summary: "Backlog 후보를 다음 Cycle 후보로 묶기",
      command: "Backlog 후보를 다음 Cycle 후보로 묶어줘",
    };
  }
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

function buildRoadmapLine(cycle: WorkingCycleContext["cycle"]): string | null {
  const operatingCycleNumber = operatingCycleOrder(cycle.name);
  if (operatingCycleNumber) {
    return operatingCycleNumber === 1
      ? "Roadmap: [Operating Cycle 1] → Operating Cycle 2"
      : `Roadmap: Operating Cycle ${operatingCycleNumber - 1} → [Operating Cycle ${operatingCycleNumber}] → Operating Cycle ${operatingCycleNumber + 1}`;
  }
  const current = cycle.number ?? cycle.name.match(/Cycle\s+(\d+)/i)?.[1];
  const cycleNumber = Number(current);
  if (!Number.isFinite(cycleNumber) || cycleNumber < 2) {
    return null;
  }
  return `Roadmap: Cycle ${cycleNumber - 1} → [Cycle ${cycleNumber}] → Cycle ${cycleNumber + 1}`;
}

function formatCycleReference(cycle: WorkingCycleContext["cycle"]): string {
  const operatingCycleNumber = operatingCycleOrder(cycle.name);
  if (operatingCycleNumber) {
    return `Operating Cycle ${operatingCycleNumber}`;
  }
  return cycle.number ? `Cycle ${cycle.number}` : cycle.name;
}

function formatCycleDisplayName(cycle: WorkingCycleContext["cycle"]): string {
  if (operatingCycleOrder(cycle.name)) {
    return cycle.name;
  }
  const reference = formatCycleReference(cycle);
  if (!cycle.number || cycle.name === reference) {
    return cycle.name;
  }
  return `${reference} · ${cycle.name}`;
}

function buildCycleNumberWarning(cycle: WorkingCycleContext["cycle"]): string | null {
  if (!cycle.number || operatingCycleOrder(cycle.name)) {
    return null;
  }
  const nameCycleNumber = cycle.name.match(/Cycle\s+(\d+)/i)?.[1];
  if (!nameCycleNumber || Number(nameCycleNumber) === cycle.number) {
    return null;
  }
  return `⚠️ Cycle 번호 확인: Linear number ${cycle.number} · name contains Cycle ${nameCycleNumber}`;
}

function operatingCycleOrder(name: string): number | null {
  const match = name.match(/Operating Cycle\s+(\d+)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
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

export function readDetailArg(args: string[]): "cycle" | "backlog" | "approvals" | "flow" | "hooks" | null {
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
  if (detailValue === "flow") {
    return "flow";
  }
  if (detailValue === "hooks") {
    return "hooks";
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
  const dir = join(rootDir, profileArtifactPath("sprints", safePathSegment(cycleName)));
  if (!existsSync(dir)) {
    return null;
  }
  const filename = readdirSync(dir).filter((name) => name.endsWith("-run-summary.md")).sort().at(-1);
  return filename ? profileArtifactPath("sprints", safePathSegment(cycleName), filename) : null;
}

function findRetro(rootDir: string, cycleName: string): string | null {
  const path = profileArtifactPath("sprints", safePathSegment(cycleName), "retro.md");
  return existsSync(join(rootDir, path)) ? path : null;
}

function readReleaseVersion(rootDir: string): string {
  try {
    const tag = execSync("git describe --tags --abbrev=0", {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (tag) return tag;
  } catch {
    // fall through to package.json
  }
  try {
    const pkgPath = join(rootDir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
      if (pkg.version) return `v${pkg.version}`;
    }
  } catch {
    // ignore
  }
  return "v0.0.0";
}

function readResumeBriefNextAction(rootDir: string): string | null {
  const path = join(rootDir, "memory/resume-brief.md");
  if (!existsSync(path)) return null;
  const content = readFileSync(path, "utf8");
  const sections = parseResumeBriefSections(content);
  if (sections.next.length > 0) {
    return sections.next.join(" · ");
  }
  const match = content.match(/##\s*다음에 무엇을 하나\s*\n+([^\n#][^\n]*)/);
  if (match && match[1].trim()) {
    return match[1].trim();
  }
  return null;
}

function priorityLabel(priority?: number): string {
  switch (priority) {
    case 1: return "Urgent";
    case 2: return "High";
    case 3: return "Medium";
    case 4: return "Low";
    default: return "No priority";
  }
}

function formatStartTopIssues(issues: Issue[]): string[] {
  if (!issues.length) {
    return ["- 없음"];
  }
  return issues.map((issue, index) => `${index + 1}. ${issue.identifier} ${issue.title} · ${priorityLabel(issue.priority)}`);
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
