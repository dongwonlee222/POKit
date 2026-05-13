import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { getWorkingContext, type Issue, type WorkingContext, type WorkingCycleContext } from "./linear.ts";

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

const DEFAULT_NEXT_ACTION = "Cycle 2 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘";
const REQUIRED_RESUME_SECTIONS = [
  "## 어디서 멈췄나",
  "## 다음에 무엇을 하나",
  "## 차단된 것",
  "## 참조",
];

export function buildSessionCloseReport(input: SessionCloseInput): string {
  const resolved = resolveCloseContext(input.context, input.completed ?? []);
  const verification = input.verification ?? [];
  const nextAction = buildCycleNextAction(resolved.surface, resolved.pending.length);
  const nextActionCheck = validateNextAction(nextAction);
  const pendingLines = resolved.pending.length
    ? resolved.pending.map((issue) => `- ${formatIssueStatus(issue)} · ${resolved.surface.cycle.name} 남은 Todo 묶음 · 다음: ${nextAction}`)
    : ["- 없음"];
  const verificationLines = verification.length
    ? verification.map((item) => `- ${item.command} · ${item.status} · ${item.summary}`)
    : ["- 미실행 · skipped · 종료 리포트에 검증 결과를 추가해야 합니다."];

  return [
    "# POKit 완료보고",
    "",
    `📅 ${formatKoreanDate(input.now ?? new Date())} · ${resolved.surface.cycle.name}`,
    "",
    "✅ 완료한 것",
    ...formatIssueList(resolved.completed),
    "",
    "⏳ 아직 안 한 것 / 승인 대기",
    ...pendingLines,
    "",
    "🧪 검증 결과",
    ...verificationLines,
    ...(nextActionCheck.valid ? [] : [`- next-action 경고 · failed · ${nextActionCheck.reason}`]),
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
    "",
  ].join("\n");
}

export function validateResumeBriefContract(content: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const section of REQUIRED_RESUME_SECTIONS) {
    if (!content.includes(section)) {
      reasons.push(`missing ${section}`);
    }
  }
  if (Buffer.byteLength(content, "utf8") > 2048) {
    reasons.push("resume brief exceeds 2048 bytes");
  }
  const nextActionLine = content.split(/\r?\n/).find((line) => line.includes("Cycle ") && line.includes("완료까지 진행해줘"));
  if (!nextActionLine) {
    reasons.push("missing Cycle-level next action");
  } else {
    const nextActionCheck = validateNextAction(nextActionLine);
    if (!nextActionCheck.valid) {
      reasons.push(`invalid next action: ${nextActionCheck.reason}`);
    }
  }
  return {
    valid: reasons.length === 0,
    reasons,
  };
}

export function validateNextAction(
  nextAction: string,
  options: { explicitIssueSelection?: boolean } = {},
): { valid: boolean; reason: string | null } {
  if (/커밋해줘|Done 처리해줘|테스트 돌려줘/.test(nextAction)) {
    return {
      valid: false,
      reason: "mechanical next action",
    };
  }
  if (!options.explicitIssueSelection && /\b[A-Z]+-\d+\b/.test(nextAction) && !/\bCycle\s+\d+\b/i.test(nextAction)) {
    return {
      valid: false,
      reason: "issue-only next action without explicit selection",
    };
  }
  return {
    valid: true,
    reason: null,
  };
}

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
    const path = join(process.cwd(), "memory", "resume-brief.md");
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
  if (context.activeCycle && isSurfaceComplete(context.activeCycle) && context.upcomingCycle) {
    return toWorkingCycleContext(context.upcomingCycle);
  }
  if (context.upcomingCycle?.issues.some((issue) => classifyIssueState(issue.state) !== "done")) {
    return toWorkingCycleContext(context.upcomingCycle);
  }
  if (context.activeCycle) {
    return toWorkingCycleContext(context.activeCycle);
  }
  return toWorkingCycleContext(context.selected);
}

function isSurfaceComplete(context: WorkingContext["activeCycle"] | WorkingContext["upcomingCycle"]): boolean {
  return Boolean(context && context.issues.length > 0 && context.issues.every((issue) => classifyIssueState(issue.state) === "done"));
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
  const cycleName = context.cycle.name.match(/Cycle\s+\d+/i)?.[0] ?? context.cycle.name;
  if (pendingCount === 0) {
    return `${cycleName} 완료 상태를 확인하고 다음 Cycle 후보를 묶어줘`;
  }
  if (cycleName === "Cycle 2") {
    return DEFAULT_NEXT_ACTION;
  }
  return `${cycleName} 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘`;
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
