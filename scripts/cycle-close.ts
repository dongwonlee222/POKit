import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { getWorkingCycleContext, type Issue, type WorkingCycleContext } from "./linear.ts";
import { discoverMarkdownArtifacts, safePathSegment } from "./lib/history-collector.ts";
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
  const sprintDir = `artifacts/sprints/${cycleSegment}`;
  const runSummaryPath = `${sprintDir}/run-summary.md`;
  const retroPath = `${sprintDir}/retro.md`;
  const completedIssues = input.context.issues.filter(isCompletedIssue).sort(compareIssueIdentifier);
  const carryOverIssues = input.context.issues.filter((issue) => !isCompletedIssue(issue)).sort(compareIssueIdentifier);
  const approvalPending = (input.historyWrites ?? []).filter((item) => item.status === "needs_approval");
  const artifacts = discoverMarkdownArtifacts(rootDir, [
    "artifacts/prds",
    "artifacts/criteria",
    sprintDir,
  ]);
  const changelog = extractChangelogCandidates(completedIssues);
  const runSummaryOnly = completedIssues.filter((issue) => !changelog.some((item) => item.issue.identifier === issue.identifier));
  const decisionCandidates = buildDecisionLogCandidates(input.context.issues).slice(0, 3);
  const approvalPreview = buildExternalWriteApprovalPreview(input.context, completedIssues, carryOverIssues);
  const nextAction = carryOverIssues.length
    ? `${cycleName(input.context)} 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘`
    : `${cycleName(input.context)} 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘`;

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
  const outputDir = join(rootDir, "artifacts", "sprints", cycleSegment);
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
    `진행 문장: "${cycleName(context)} 완료 증거를 확인했고, 위 Linear 상태 변경을 실행해"`,
  ];
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
  return context.cycle.name.match(/Cycle\s+\d+/i)?.[0] ?? context.cycle.name;
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
