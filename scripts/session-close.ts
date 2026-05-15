import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { renderCycleProgress } from "./cycle-progress.ts";
import { getWorkingContext, type Issue, type WorkingContext, type WorkingCycleContext } from "./linear.ts";
import { profileMemoryPath } from "./profile.ts";
import {
  validateNextAction,
  validateResumeBriefContract,
  type ResumeBriefValidationResult,
} from "./resume-brief-validator.ts";

export type VerificationResult = {
  command: string;
  status: "passed" | "failed" | "skipped";
  summary: string;
};

export type SessionCloseInput = {
  now?: Date;
  context: WorkingCycleContext | WorkingContext;
  completed?: string[];
  verification?: VerificationResult[];
  historyWrites?: ResumeBriefWriteResult[];
};

export type ResumeBriefWriteResult =
  | {
      status: "written";
      path: string;
      hash: string;
    }
  | {
      status: "needs_approval";
      path: string;
      reason: string;
      currentHash: string;
      expectedHash: string;
    };

type ResolvedCloseContext = {
  surface: WorkingCycleContext;
  completed: Issue[];
  pending: Issue[];
};

export function buildSessionCloseReport(input: SessionCloseInput): string {
  const resolved = resolveCloseContext(input.context, input.completed ?? []);
  const verification = input.verification ?? [];
  const historyConflicts = (input.historyWrites ?? []).filter((item) => item.status === "needs_approval");
  const nextAction = buildCycleNextAction(resolved.surface, resolved.pending.length);
  const nextActionCheck = validateNextAction(nextAction);
  const cycleActionName = cycleNameForAction(resolved.surface);
  const pendingLines = resolved.pending.length
    ? resolved.pending.map((issue) => `- ${formatIssueStatus(issue)} · ${cycleActionName} 남은 Todo 묶음 · 다음: ${nextAction}`)
    : ["- 없음"];
  const approvalLines = historyConflicts.map((item) => `- Needs Approval · ${item.path} · ${item.reason}`);
  const verificationLines = verification.length
    ? verification.map((item) => `- ${item.command} · ${item.status} · ${item.summary}`)
    : ["- 별도 입력 없음 · skipped · session-close는 검증을 실행하지 않고, 호출자가 실행한 검증 결과를 여기에 넣습니다."];
  const conflictVerificationLines = historyConflicts.map(
    (item) => `- history write conflict warning · failed · ${item.path} overwrite blocked`,
  );
  const practicalDecisionLines = buildPracticalNextDecisionLines(resolved, nextAction);
  const approvalPreviewLines = buildApprovalPreviewLines(historyConflicts);
  const completionExperienceLines = buildCycleCompletionExperienceLines(resolved);

  return [
    "# POKit 완료보고",
    "",
    `📅 ${formatKoreanDate(input.now ?? new Date())} · ${resolved.surface.cycle.name}`,
    "",
    ...renderCycleProgress({ currentStep: 7 }),
    "",
    ...completionExperienceLines,
    ...(completionExperienceLines.length ? [""] : []),
    "✅ 완료한 것",
    ...formatIssueList(resolved.completed),
    "",
    "⏳ 아직 안 한 것 / 승인 대기",
    ...pendingLines,
    ...approvalLines,
    "",
    "🧪 검증 결과",
    ...verificationLines,
    ...conflictVerificationLines,
    ...(nextActionCheck.valid ? [] : [`- next-action 경고 · failed · ${nextActionCheck.reason}`]),
    "",
    "🧭 다음 실제 결정",
    ...practicalDecisionLines,
    ...(approvalPreviewLines.length ? ["", "🔎 실행 전 확인", ...approvalPreviewLines] : []),
    "",
    "👉 다음에 사용자가 할 말 한 줄",
    nextAction,
    "",
  ].join("\n");
}

export function buildResumeBrief(input: SessionCloseInput): string {
  const resolved = resolveCloseContext(input.context, input.completed ?? []);
  const verification = input.verification ?? [];
  const nextAction = buildCycleNextAction(resolved.surface, resolved.pending.length);
  const pending = resolved.pending.map((issue) => issue.identifier).join(", ") || "없음";
  const blocked = verification.filter((item) => item.status === "failed");
  const blockedLine = blocked.length
    ? blocked.map((item) => `${item.command}: ${item.summary}`).join("; ")
    : "없음";

  return [
    "# Resume Brief",
    "",
    "## 어디서 멈췄나",
    `${resolved.surface.cycle.name} 기준 완료 ${resolved.completed.length}건, 남은 Todo ${resolved.pending.length}건. 남은 묶음: ${pending}.`,
    "",
    "## 다음에 무엇을 하나",
    nextAction,
    "",
    "## 차단된 것",
    blockedLine,
    "",
    "## 참조",
    "- `node --experimental-strip-types scripts/session-brief.ts`",
    "- `node --experimental-strip-types scripts/session-close.ts`",
    "- `docs/OPERATING_MODEL.md#resume-brief-contract`",
    "",
  ].join("\n");
}

export { validateNextAction, validateResumeBriefContract };
export type { ResumeBriefValidationResult };

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function writeResumeBrief(input: {
  path: string;
  content: string;
  expectedHash?: string;
}): Promise<ResumeBriefWriteResult> {
  const currentContent = existsSync(input.path) ? await readFile(input.path, "utf8") : "";
  const currentHash = hashContent(currentContent);
  if (input.expectedHash && currentHash !== input.expectedHash) {
    return {
      status: "needs_approval",
      path: input.path,
      reason: "content hash changed; refusing stale resume-brief overwrite",
      currentHash,
      expectedHash: input.expectedHash,
    };
  }
  await mkdir(dirname(input.path), { recursive: true });
  await writeFile(input.path, input.content);
  return {
    status: "written",
    path: input.path,
    hash: hashContent(input.content),
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const context = await getWorkingContext();
  const report = buildSessionCloseReport({ context });
  console.log(report);
  if (args.includes("--write-resume-brief")) {
    const path = join(process.cwd(), profileMemoryPath("resume-brief.md"));
    const expectedHash = readExpectedHash(args) ?? (existsSync(path) ? hashContent(readFileSync(path, "utf8")) : undefined);
    const result = await writeResumeBrief({
      path,
      content: buildResumeBrief({ context }),
      expectedHash,
    });
    if (result.status === "needs_approval") {
      console.error(`Resume brief not written: ${result.reason}`);
      process.exitCode = 1;
    } else {
      console.log(`Resume brief written: ${result.path}`);
    }
  }
}

function resolveCloseContext(context: WorkingCycleContext | WorkingContext, completedIdentifiers: string[]): ResolvedCloseContext {
  const surface = selectCloseSurface(context);
  const completedSet = new Set(completedIdentifiers);
  const completed = surface.issues
    .filter((issue) => completedSet.has(issue.identifier) || classifyIssueState(issue.state) === "done")
    .sort(compareIssueIdentifier);
  const pending = surface.issues
    .filter((issue) => classifyIssueState(issue.state) !== "done")
    .sort(compareIssueIdentifier);
  return {
    surface,
    completed,
    pending,
  };
}

function selectCloseSurface(context: WorkingCycleContext | WorkingContext): WorkingCycleContext {
  if (!("selected" in context)) {
    return context;
  }
  if (context.activeCycle && isSurfaceFullyComplete(context.activeCycle) && context.upcomingCycle) {
    return toWorkingCycleContext(context.upcomingCycle);
  }
  if (context.activeCycle && isSurfaceReleasePending(context.activeCycle)) {
    return toWorkingCycleContext(context.activeCycle);
  }
  if (context.upcomingCycle?.issues.some((issue) => classifyIssueState(issue.state) !== "done")) {
    return toWorkingCycleContext(context.upcomingCycle);
  }
  if (context.activeCycle) {
    return toWorkingCycleContext(context.activeCycle);
  }
  return toWorkingCycleContext(context.selected);
}

function isSurfaceFullyComplete(context: WorkingContext["activeCycle"] | WorkingContext["upcomingCycle"]): boolean {
  return Boolean(context && isCycleReleaseComplete(toWorkingCycleContext(context)) && context.issues.length > 0 && context.issues.every((issue) => classifyIssueState(issue.state) === "done"));
}

function isSurfaceReleasePending(context: WorkingContext["activeCycle"] | WorkingContext["upcomingCycle"]): boolean {
  return Boolean(context && !isCycleReleaseComplete(toWorkingCycleContext(context)) && context.issues.length > 0 && context.issues.every((issue) => classifyIssueState(issue.state) === "done"));
}

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

function buildCycleNextAction(context: WorkingCycleContext, pendingCount: number): string {
  const cycleName = cycleNameForAction(context);
  if (pendingCount === 0) {
    return isCycleReleaseComplete(context)
      ? `${cycleName} 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘`
      : `${cycleName} release preflight부터 완료 조건까지 이어가줘`;
  }
  return `${cycleName} 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘`;
}

function cycleNameForAction(context: WorkingCycleContext): string {
  const operatingCycleNumber = operatingCycleOrder(context.cycle.name);
  if (operatingCycleNumber) {
    return `Operating Cycle ${operatingCycleNumber}`;
  }
  return context.cycle.number ? `Cycle ${context.cycle.number}` : context.cycle.name.match(/Cycle\s+\d+/i)?.[0] ?? context.cycle.name;
}

function operatingCycleOrder(name: string): number | null {
  const match = name.match(/Operating Cycle\s+(\d+)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function formatIssueList(issues: Issue[]): string[] {
  if (!issues.length) {
    return ["- 없음"];
  }
  return issues.map((issue) => `- ${formatIssueStatus(issue)}`);
}

function formatIssueStatus(issue: Issue): string {
  return `${issue.identifier} ${issue.title} · ${issue.state ?? "No state"}`;
}

function buildPracticalNextDecisionLines(resolved: ResolvedCloseContext, nextAction: string): string[] {
  const completed = resolved.completed.map((issue) => issue.identifier).join(", ") || "없음";
  const pending = resolved.pending.map((issue) => issue.identifier).join(", ") || "없음";
  const cycleActionName = cycleNameForAction(resolved.surface);
  const action = resolved.pending.length
    ? `${cycleActionName} 남은 Todo 전체를 계속 진행할지 결정`
    : isCycleReleaseComplete(resolved.surface)
      ? `${cycleActionName} 완료 상태를 확인하고 다음 Cycle 후보를 준비할지 결정`
      : `${cycleActionName} release gate를 진행할지 결정`;
  return [
    `- 로컬에서 끝난 것: ${completed}`,
    `- repo 밖에 남은 것: ${pending}`,
    `- 필요한 승인/행동: ${action}`,
    `- 다음 추천 행동: ${nextAction}`,
  ];
}

function buildCycleCompletionExperienceLines(resolved: ResolvedCloseContext): string[] {
  if (resolved.pending.length > 0 || resolved.completed.length === 0) {
    return [];
  }
  if (!isCycleReleaseComplete(resolved.surface)) {
    return [
      "Version Run Release Pending",
      `Version Run 작업은 완료됐지만 release gate가 아직 남아 있습니다. 대상: ${resolved.surface.cycle.name}`,
      "",
      "남은 완료 조건",
      "- Release preflight 재확인",
      "- Commit",
      "- Push / Tag / GitHub Release",
      "- Linear Done/status sync",
    ];
  }
  return [
    `🎉 ${resolved.surface.cycle.name} 완료!`,
    "",
    "이번 Cycle 후 달라진 점",
    `- ${resolved.completed.length}개 이슈가 Done 상태로 정리되었습니다.`,
    "- 브리프, 로드맵, Linear 상태를 기준으로 다음 작업면을 더 명확히 볼 수 있습니다.",
    "",
    "기대효과 / 가설",
    "- 다음 세션 시작 시 사용자가 현재 cycle 기준을 확인하는 시간이 줄어듭니다.",
    "- 완료된 cycle과 다음 후보가 분리되어 후속 작업 선택이 쉬워집니다.",
    "",
    "직접 사용해 볼 것",
    "- 새 세션에서 `POKit 시작해줘`를 실행해 브리프가 다음 작업면을 보여주는지 확인합니다.",
    "",
    "새 세션 추천",
    "- Cycle이 끝났으니 새 세션에서 시작해 컨텍스트를 가볍게 유지하는 것을 권장합니다.",
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

function buildApprovalPreviewLines(historyConflicts: Array<Extract<ResumeBriefWriteResult, { status: "needs_approval" }>>): string[] {
  return [
    ...historyConflicts.flatMap((item) => [
      `- 실행하면 바뀌는 것: ${item.path} 재생성 또는 수동 병합`,
      `- 판단 근거: ${item.reason}`,
      `- 현재 hash: ${item.currentHash}`,
      `- 예상 hash: ${item.expectedHash}`,
      "- 실행 후 기대효과: 다음 세션 handoff가 최신 상태로 복구됨",
    ]),
    "",
    "사용자 확인",
    "",
    "A. ✅ 추천대로 실행",
    "B. ✏️ 직접 입력하기",
    "",
    "A/B로 선택해 주세요.",
  ];
}

function classifyIssueState(state: string | undefined): "done" | "inProgress" | "todo" | "review" {
  const normalized = state?.trim().toLowerCase() ?? "";
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

function compareIssueIdentifier(left: Issue, right: Issue): number {
  return issueNumber(left.identifier) - issueNumber(right.identifier);
}

function issueNumber(identifier: string): number {
  return Number(identifier.match(/\d+$/)?.[0] ?? Number.MAX_SAFE_INTEGER);
}

function readExpectedHash(args: string[]): string | undefined {
  const index = args.findIndex((arg) => arg === "--expected-hash");
  return index >= 0 ? args[index + 1] : undefined;
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

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
