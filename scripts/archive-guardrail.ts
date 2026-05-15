import { checkLinearIssueCleanupMutationSchema, getWorkingCycleContext, type Issue } from "./linear.ts";
import { profileArtifactPath } from "./profile.ts";

export const COMPLETED_ISSUE_SOFT_LIMIT = 200;
export const COMPLETED_ISSUE_KEEP_COUNT = 150;

export type ArchiveGuardrailInput = {
  issues: Issue[];
};

export type ArchiveGuardrail = {
  completedCount: number;
  candidateCount: number;
  shouldNudge: boolean;
  briefLine: string | null;
};

export type ArchivePlan = {
  idempotencyKey: string;
  summary: string;
  candidates: Issue[];
  writes: Array<{
    type: "write_archive_jsonl" | "write_archive_markdown";
    target: string;
    payload: unknown;
  }>;
  linearCleanup: {
    allowed: false;
    reason: string;
    requiredSchemaCheck: {
      candidates: string[];
      preferred: string;
      command: string;
    };
  };
};

export function buildArchiveGuardrail(input: ArchiveGuardrailInput): ArchiveGuardrail {
  const completed = selectCompletedIssues(input.issues);
  const candidateCount = archiveCandidateCount(completed.length);
  const shouldNudge = completed.length >= COMPLETED_ISSUE_SOFT_LIMIT;
  return {
    completedCount: completed.length,
    candidateCount,
    shouldNudge,
    briefLine: shouldNudge
      ? `🗄️ Archive 권장: 완료 ${completed.length}개 · 오래된 ${candidateCount}개 후보 · “archive plan 보여줘”`
      : null,
  };
}

export function buildArchivePlan(input: ArchiveGuardrailInput & { generatedAt?: Date }): ArchivePlan {
  const generatedAt = input.generatedAt ?? new Date();
  const candidates = selectArchiveCandidates(input.issues);
  const month = formatArchiveMonth(generatedAt);
  const jsonlPath = profileArtifactPath("archive", `linear-completed-${month}.jsonl`);
  const markdownPath = profileArtifactPath("archive", `linear-completed-${month}.md`);
  return {
    idempotencyKey: `linear:completed-archive:${month}:${candidates.map((issue) => issue.identifier).join(",")}`,
    summary: `Archive ${candidates.length} completed Linear issues locally before Linear cleanup.`,
    candidates,
    writes: [
      {
        type: "write_archive_jsonl",
        target: jsonlPath,
        payload: candidates.map(toArchiveRecord),
      },
      {
        type: "write_archive_markdown",
        target: markdownPath,
        payload: renderArchiveMarkdown(candidates, generatedAt),
      },
    ],
    linearCleanup: {
      allowed: false,
      reason: "POKit never archives, deletes, or mutates Linear issues without explicit approval.",
      requiredSchemaCheck: {
        candidates: ["issueArchive", "issueDelete"],
        preferred: "issueArchive",
        command: "node --experimental-strip-types scripts/archive-guardrail.ts --check-linear-schema",
      },
    },
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--check-linear-schema")) {
    const check = await checkLinearIssueCleanupMutationSchema();
    console.log(renderLinearCleanupSchemaCheckMarkdown(check));
    return;
  }
  const context = await getWorkingCycleContext();
  const plan = buildArchivePlan({ issues: context.issues });
  console.log(renderArchivePlanMarkdown(plan));
}

function selectArchiveCandidates(issues: Issue[]): Issue[] {
  const completed = selectCompletedIssues(issues);
  return completed.slice(0, archiveCandidateCount(completed.length));
}

function archiveCandidateCount(completedCount: number): number {
  return Math.max(0, completedCount - COMPLETED_ISSUE_KEEP_COUNT);
}

function selectCompletedIssues(issues: Issue[]): Issue[] {
  return issues
    .filter((issue) => {
      const state = issue.state?.trim().toLowerCase();
      return state === "done" || state === "completed";
    })
    .sort(compareIssueIdentifier);
}

function toArchiveRecord(issue: Issue): Record<string, unknown> {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? "",
    url: issue.url ?? "",
    labels: issue.labels,
    state: issue.state ?? "",
    assignee: issue.assignee ?? "",
  };
}

function renderArchiveMarkdown(candidates: Issue[], generatedAt: Date): string {
  return [
    "# Linear Completed Issue Archive",
    "",
    `Generated at: ${generatedAt.toISOString()}`,
    "",
    ...candidates.map((issue) => `- ${issue.identifier} ${issue.title} (${issue.url ?? "no-url"})`),
    "",
  ].join("\n");
}

function renderArchivePlanMarkdown(plan: ArchivePlan): string {
  return [
    "# POKit Archive Plan",
    "",
    plan.summary,
    "",
    `Idempotency: ${plan.idempotencyKey}`,
    "",
    "Local writes:",
    ...plan.writes.map((write) => `- ${write.type}: ${write.target}`),
    "",
    `Linear cleanup: ${plan.linearCleanup.allowed ? "allowed" : "blocked"} · ${plan.linearCleanup.reason}`,
    `Linear cleanup schema check: required · preferred ${plan.linearCleanup.requiredSchemaCheck.preferred} · candidates ${plan.linearCleanup.requiredSchemaCheck.candidates.join(", ")}`,
    `Schema command: ${plan.linearCleanup.requiredSchemaCheck.command}`,
    "",
  ].join("\n");
}

function renderLinearCleanupSchemaCheckMarkdown(check: {
  candidates: string[];
  available: string[];
  selected: string | null;
  canArchive: boolean;
  reason: string;
}): string {
  return [
    "# Linear Cleanup Mutation Schema Check",
    "",
    `Candidates: ${check.candidates.join(", ")}`,
    `Available: ${check.available.join(", ") || "none"}`,
    `Selected: ${check.selected ?? "none"}`,
    `Can archive: ${check.canArchive ? "yes" : "no"}`,
    `Reason: ${check.reason}`,
    "",
  ].join("\n");
}

function compareIssueIdentifier(left: Issue, right: Issue): number {
  return issueNumber(left.identifier) - issueNumber(right.identifier);
}

function issueNumber(identifier: string): number {
  return Number(identifier.match(/\d+$/)?.[0] ?? Number.MAX_SAFE_INTEGER);
}

function formatArchiveMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
