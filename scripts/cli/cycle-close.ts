import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { getWorkingCycleContext, type Issue, type WorkingCycleContext } from "../internal/linear.ts";
import { discoverMarkdownArtifacts, safePathSegment } from "../internal/lib/history-collector.ts";
import { profileArtifactPath } from "../internal/profile.ts";
import type { ResumeBriefWriteResult } from "./session-close.ts";

export type CycleCloseInput = {
  generatedAt?: string;
  context: WorkingCycleContext;
  rootDir?: string;
  historyWrites?: ResumeBriefWriteResult[];
};

export type CycleCompleteMessageInput = {
  context: WorkingCycleContext;
  runSummaryPath: string;
  retroPath: string;
  approvalPendingCount?: number;
  clarificationCount?: number;
  previousCelebrationKey?: string;
};

export type CycleCompleteMessage = {
  message: string;
  stateKey: string;
};

export function buildCycleCloseDraft(input: CycleCloseInput): string {
  const rootDir = input.rootDir ?? ".";
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const cycleSegment = safePathSegment(input.context.cycle.name || input.context.cycle.id);
  const sprintDir = profileArtifactPath("sprints", cycleSegment);
  const runSummaryPath = `${sprintDir}/run-summary.md`;
  const retroPath = `${sprintDir}/retro.md`;
  const completedIssues = input.context.issues.filter(isCompletedIssue).sort(compareIssueIdentifier);
  const carryOverIssues = input.context.issues.filter((issue) => !isCompletedIssue(issue)).sort(compareIssueIdentifier);
  const approvalPending = (input.historyWrites ?? []).filter((item) => item.status === "needs_approval");
  const artifacts = discoverMarkdownArtifacts(rootDir, [
    profileArtifactPath("prds"),
    profileArtifactPath("criteria"),
    sprintDir,
  ]);
  const changelog = extractChangelogCandidates(completedIssues);
  const runSummaryOnly = completedIssues.filter((issue) => !changelog.some((item) => item.issue.identifier === issue.identifier));
  const decisionCandidates = buildDecisionLogCandidates(input.context.issues).slice(0, 3);
  const approvalPreview = buildExternalWriteApprovalPreview(input.context, completedIssues, carryOverIssues);
  const releaseComplete = isCycleReleaseComplete(input.context);
  const completionExperience = releaseComplete
    ? buildCycleCompletionExperience(input.context, completedIssues, carryOverIssues)
    : buildCycleReleasePendingSection(input.context, completedIssues, carryOverIssues);
  const nextAction = carryOverIssues.length
    ? `${cycleName(input.context)} 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘`
    : releaseComplete
      ? `${cycleName(input.context)} 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘`
      : `${cycleName(input.context)} release preflight부터 완료 조건까지 이어가줘`;

  return [
    "---",
    `cycle_id: ${input.context.cycle.id}`,
    `cycle_name: ${input.context.cycle.name}`,
    `generated_at: ${generatedAt}`,
    "status: draft",
    "external_writes: none",
    "---",
    "",
    `# Cycle Close Draft: ${input.context.cycle.name}`,
    "",
    "## Summary",
    "",
    `- Completed issues: ${completedIssues.length}`,
    `- Carry-over candidates: ${carryOverIssues.length}`,
    `- Approval pending: ${approvalPending.length}`,
    `- Generated artifacts found: ${artifacts.length}`,
    `- Run Summary: ${existsSync(join(rootDir, runSummaryPath)) ? `\`${runSummaryPath}\`` : "not found"}`,
    `- Retro: ${existsSync(join(rootDir, retroPath)) ? `\`${retroPath}\`` : "not found"}`,
    "- Linear/GitHub writes performed by this close draft: none",
    "",
    ...completionExperience,
    ...(completionExperience.length ? [""] : []),
    "## Completed Issues",
    "",
    ...renderIssueList(completedIssues),
    "",
    "## Carry-over Candidates",
    "",
    ...renderIssueList(carryOverIssues),
    "",
    "## Approval Pending",
    "",
    ...renderApprovalList(approvalPending),
    "",
    "## Generated Artifacts",
    "",
    ...renderArtifactList(artifacts),
    "",
    "## Changelog Candidates",
    "",
    ...renderChangelogCandidates(changelog),
    "",
    "## Run-summary-only Items",
    "",
    ...renderIssueList(runSummaryOnly),
    "",
    "## Decision-log Candidates",
    "",
    ...decisionCandidates,
    "",
    "## External Write Preflight",
    "",
    ...approvalPreview,
    "",
    "## Next Action",
    "",
    nextAction,
    "",
  ].join("\n");
}

export function writeCycleCloseDraft(input: CycleCloseInput): string {
  const rootDir = input.rootDir ?? ".";
  const cycleSegment = safePathSegment(input.context.cycle.name || input.context.cycle.id);
  const outputDir = join(rootDir, profileArtifactPath("sprints", cycleSegment));
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, "cycle-close.md");
  writeFileSync(outputPath, buildCycleCloseDraft(input), "utf8");
  return outputPath;
}

export function buildAfterCycleCompleteMessage(input: CycleCompleteMessageInput): CycleCompleteMessage | null {
  const completedIssues = input.context.issues.filter(isCompletedIssue);
  const incompleteCount = input.context.issues.length - completedIssues.length;
  const approvalPendingCount = input.approvalPendingCount ?? 0;
  const clarificationCount = input.clarificationCount ?? 0;
  if (incompleteCount > 0 || approvalPendingCount > 0 || clarificationCount > 0) {
    return null;
  }
  if (!isCycleReleaseComplete(input.context)) {
    return null;
  }

  const stateKey = createHash("sha256")
    .update([
      input.context.cycle.id,
      completedIssues.map((issue) => `${issue.identifier}:${issue.state}`).sort().join("|"),
      input.runSummaryPath,
      input.retroPath,
    ].join("\n"))
    .digest("hex");
  if (input.previousCelebrationKey === stateKey) {
    return null;
  }

  const name = cycleName(input.context);
  return {
    stateKey,
    message: [
      `🎉 ${name} 완료 · 완료 ${completedIssues.length}건`,
      `Run Summary: \`${input.runSummaryPath}\``,
      `Retro: \`${input.retroPath}\``,
      `다음: ${name} 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘`,
    ].join("\n"),
  };
}

export function extractChangelogCandidates(issues: Issue[]): Array<{ issue: Issue; note: string }> {
  return issues
    .filter(isCompletedIssue)
    .filter((issue) => !isRunSummaryOnlyIssue(issue))
    .filter((issue) => isChangelogCandidateIssue(issue))
    .sort((left, right) => issueNumber(left.identifier) - issueNumber(right.identifier))
    .map((issue) => ({
      issue,
      note: releaseNoteFor(issue),
    }));
}

function renderIssueList(issues: Issue[]): string[] {
  if (issues.length === 0) {
    return ["- 없음"];
  }
  return issues.map((issue) => `- ${issue.identifier} ${issue.title} (${issue.state ?? "unknown"})`);
}

function renderApprovalList(items: ResumeBriefWriteResult[]): string[] {
  if (items.length === 0) {
    return ["- 없음"];
  }
  return items.map((item) => item.status === "needs_approval" ? `- Needs Approval · ${item.path} · ${item.reason}` : `- ${item.path} · ${item.status}`);
}

function renderArtifactList(artifacts: ReturnType<typeof discoverMarkdownArtifacts>): string[] {
  if (artifacts.length === 0) {
    return ["- 없음"];
  }
  return artifacts.map((artifact) => `- ${artifact.issueId}: \`${artifact.path}\` (${artifact.artifactType})`);
}

function renderChangelogCandidates(candidates: Array<{ issue: Issue; note: string }>): string[] {
  if (candidates.length === 0) {
    return ["- 없음"];
  }
  return candidates.map(({ issue, note }) => `- ${issue.identifier} ${issue.title} → ${note}`);
}

function buildDecisionLogCandidates(issues: Issue[]): string[] {
  const candidates = issues
    .filter((issue) => /정책|policy|override|승인|approval|version|버전|우선순위|priority/i.test(`${issue.title} ${issue.description ?? ""}`))
    .sort(compareIssueIdentifier)
    .map((issue) => `- ${issue.identifier}: ${issue.title} 관련 결정이 정본 정책으로 남아야 하는지 확인한다.`);
  return candidates.length ? candidates : ["- 없음"];
}

function buildExternalWriteApprovalPreview(context: WorkingCycleContext, completedIssues: Issue[], carryOverIssues: Issue[]): string[] {
  const completedIds = completedIssues.map((issue) => issue.identifier).sort(compareIssueIdentifierText);
  const idempotencyKey = `linear:cycle-close:${context.cycle.id}:done:${completedIds.join(",")}`;
  return [
    "실행하면 Linear에서 바뀌는 것",
    "",
    ...completedIssues.map((issue) => `- ${issue.identifier} ${issue.title} · Done 유지 · local evidence: completed in close draft`),
    ...carryOverIssues.map((issue) => `- ${issue.identifier} ${issue.title} · ${issue.state ?? "No state"} → carry-over 유지 · reason: not completed locally`),
    "",
    "판단 근거",
    "",
    `- completed count: ${completedIssues.length}`,
    `- carry-over count: ${carryOverIssues.length}`,
    "- external writes already performed: none",
    "- 실제 승인 전에는 Linear 현재 상태를 다시 조회해야 한다.",
    "",
    `idempotency key: \`${idempotencyKey}\``,
    "",
    "실행 후 기대효과",
    "",
    `- ${cycleName(context)}의 운영 상태가 로컬 완료 증거와 일치한다.`,
    "- 다음 brief가 완료된 작업 대신 다음 작업면을 보여준다.",
    "",
    "사용자 확인",
    "",
    "A. ✅ 추천대로 실행",
    "B. ✏️ 직접 입력하기",
    "",
    "A/B로 선택해 주세요.",
  ];
}

function buildCycleCompletionExperience(context: WorkingCycleContext, completedIssues: Issue[], carryOverIssues: Issue[]): string[] {
  if (carryOverIssues.length > 0 || completedIssues.length === 0) {
    return [];
  }
  return [
    "## Cycle Completion Experience",
    "",
    `🎉 ${context.cycle.name} 완료!`,
    "",
    "### 이번 Cycle 후 달라진 점",
    "",
    `- ${completedIssues.length}개 이슈가 Done 상태로 정리되었습니다.`,
    "- 브리프, 로드맵, Linear 상태를 기준으로 다음 작업면을 더 명확히 볼 수 있습니다.",
    "",
    "### 기대효과 / 가설",
    "",
    "- 다음 세션 시작 시 사용자가 현재 cycle 기준을 확인하는 시간이 줄어듭니다.",
    "- 완료된 cycle과 다음 후보가 분리되어 후속 작업 선택이 쉬워집니다.",
    "",
    "### 직접 사용해 볼 것",
    "",
    "- 새 세션에서 `POKit 시작해줘`를 실행해 브리프가 다음 작업면을 보여주는지 확인합니다.",
    "",
    "### 새 세션 추천",
    "",
    "- Cycle이 끝났으니 새 세션에서 시작해 컨텍스트를 가볍게 유지하는 것을 권장합니다.",
  ];
}

function buildCycleReleasePendingSection(context: WorkingCycleContext, completedIssues: Issue[], carryOverIssues: Issue[]): string[] {
  if (carryOverIssues.length > 0 || completedIssues.length === 0) {
    return [];
  }
  return [
    "## Version Run Release Pending",
    "",
    `Version Run 작업은 완료됐지만 release gate가 아직 남아 있습니다. 대상: ${cycleName(context)}`,
    "",
    "### 남은 완료 조건",
    "",
    "- Release preflight 재확인",
    "- Commit",
    "- Push / Tag / GitHub Release",
    "- Linear Done/status sync",
  ];
}

function isCycleReleaseComplete(context: WorkingCycleContext): boolean {
  return Boolean(context.cycle.completedAt || hasReleaseCompletionEvidence(context));
}

function hasReleaseCompletionEvidence(context: WorkingCycleContext): boolean {
  const evidenceText = [
    context.cycle.description,
    ...context.issues.map((issue) => issue.description),
  ].filter(Boolean).join("\n");

  if (!evidenceText) {
    return false;
  }

  return /release gate completed|GitHub release published|GitHub push\/tag\/release:\s*completed|release preflight:\s*passed/i.test(evidenceText)
    && /targetVersion:\s*v\d+\.\d+\.\d+/i.test(evidenceText);
}

function isCompletedIssue(issue: Issue): boolean {
  const normalized = issue.state?.trim().toLowerCase();
  return normalized === "done" || normalized === "completed" || normalized === "canceled" || normalized === "cancelled" || normalized === "duplicate";
}

function isRunSummaryOnlyIssue(issue: Issue): boolean {
  return /테스트|test|refactor|내부 정리|internal cleanup/i.test(`${issue.title} ${issue.description ?? ""}`);
}

function isChangelogCandidateIssue(issue: Issue): boolean {
  return /사용자|workflow|script|skill|안전|safety|policy|정책|warning|version|버전|changelog|release|cycle-close|prioritizer|history-maintainer/i.test(`${issue.title} ${issue.description ?? ""}`);
}

function releaseNoteFor(issue: Issue): string {
  const note = issue.title
    .replace(/\s*구현$/, "")
    .replace(/\s*추가$/, "")
    .replace(/\s*정리$/, "")
    .trim();
  return note.replace(/^[a-z]/, (char) => char.toUpperCase());
}

function cycleName(context: WorkingCycleContext): string {
  return context.cycle.number ? `Cycle ${context.cycle.number}` : context.cycle.name.match(/Cycle\s+\d+/i)?.[0] ?? context.cycle.name;
}

function compareIssueIdentifier(left: Issue, right: Issue): number {
  return issueNumber(left.identifier) - issueNumber(right.identifier);
}

function issueNumber(identifier: string): number {
  return Number(identifier.match(/\d+$/)?.[0] ?? Number.MAX_SAFE_INTEGER);
}

function compareIssueIdentifierText(left: string, right: string): number {
  return issueNumber(left) - issueNumber(right);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const context = await getWorkingCycleContext();
  const outputPath = writeCycleCloseDraft({ context });
  console.log(`Wrote ${outputPath}`);
}
