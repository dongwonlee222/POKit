import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getWorkingCycleContext, type Issue, type WorkingCycleContext } from "./linear.ts";

type ArtifactType = "prd" | "criteria";

export type GeneratedItem = {
  issue: Issue;
  artifactType: ArtifactType;
  path: string;
};

export type NeedsLabelItem = {
  issue: Issue;
  proposedLabel: "pokit:prd" | "pokit:criteria";
  reason: string;
};

export type NeedsClarificationItem = {
  issue: Issue;
  questions: string[];
};

export type ApprovalPlan = {
  idempotencyKey: string;
  summary: string;
  writes: Array<{
    type: "comment_issue";
    target: string;
    payload: unknown;
  }>;
};

export type SprintDryRunSummary = {
  generatedAt: string;
  context: WorkingCycleContext;
  generated: GeneratedItem[];
  needsLabel: NeedsLabelItem[];
  needsClarification: NeedsClarificationItem[];
  needsApproval: ApprovalPlan[];
  failed: Array<{ issue: Issue; reason: string }>;
  markdown: string;
};

type BuildInput = {
  generatedAt?: string;
  context: WorkingCycleContext;
};

const POKIT_LABELS = ["pokit:prd", "pokit:criteria"] as const;

export function buildSprintDryRunSummary(input: BuildInput): SprintDryRunSummary {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const generated: GeneratedItem[] = [];
  const needsLabel: NeedsLabelItem[] = [];
  const needsClarification: NeedsClarificationItem[] = [];
  const needsApproval: ApprovalPlan[] = [];
  const failed: Array<{ issue: Issue; reason: string }> = [];

  for (const issue of input.context.issues) {
    const routeLabel = issue.labels.find((label) => POKIT_LABELS.includes(label as typeof POKIT_LABELS[number]));
    if (!routeLabel) {
      const proposedLabel = proposeLabel(issue);
      const item: NeedsLabelItem = {
        issue,
        proposedLabel,
        reason: proposedLabel === "pokit:criteria"
          ? "기대 동작을 acceptance criteria로 먼저 좁힐 수 있음."
          : "문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.",
      };
      needsLabel.push(item);
      needsApproval.push({
        idempotencyKey: `linear:comment:${issue.identifier}:label-suggestion`,
        summary: `Suggest ${proposedLabel} for ${issue.identifier}`,
        writes: [
          {
            type: "comment_issue",
            target: issue.identifier,
            payload: {
              proposedLabel,
              reason: item.reason,
            },
          },
        ],
      });
      continue;
    }
    if (!hasEnoughContext(issue)) {
      needsClarification.push({
        issue,
        questions: [
          "이 issue의 사용자 문제 또는 기대 동작을 한 문장으로 정리해 주세요.",
          "이번 cycle에서 반드시 포함할 범위와 제외할 범위가 있나요?",
        ],
      });
      continue;
    }
    if (routeLabel === "pokit:prd") {
      generated.push({
        issue,
        artifactType: "prd",
        path: `artifacts/prds/${issue.identifier}.md`,
      });
      continue;
    }
    if (routeLabel === "pokit:criteria") {
      generated.push({
        issue,
        artifactType: "criteria",
        path: `artifacts/criteria/${issue.identifier}.md`,
      });
      continue;
    }
    failed.push({ issue, reason: `Unsupported POKit label: ${routeLabel}` });
  }

  const summary: SprintDryRunSummary = {
    generatedAt,
    context: input.context,
    generated,
    needsLabel,
    needsClarification,
    needsApproval,
    failed,
    markdown: "",
  };
  summary.markdown = renderRunSummary(summary);
  return summary;
}

export async function runSprintDryRun(): Promise<SprintDryRunSummary> {
  const context = await getWorkingCycleContext();
  return buildSprintDryRunSummary({ context });
}

export function writeSprintDryRunSummary(summary: SprintDryRunSummary): string {
  const cycleId = safePathSegment(summary.context.cycle.name || summary.context.cycle.id);
  const date = summary.generatedAt.slice(0, 10);
  const outputDir = join("artifacts", "sprints", cycleId);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${date}-run-summary.md`);
  writeFileSync(outputPath, summary.markdown, "utf8");
  return outputPath;
}

function hasEnoughContext(issue: Issue): boolean {
  return Boolean(issue.description?.trim());
}

function proposeLabel(issue: Issue): "pokit:prd" | "pokit:criteria" {
  const text = `${issue.title} ${issue.description ?? ""}`.toLowerCase();
  if (text.includes("policy") || text.includes("정책") || text.includes("problem") || text.includes("문제")) {
    return "pokit:prd";
  }
  return "pokit:criteria";
}

function renderRunSummary(summary: SprintDryRunSummary): string {
  const lines: string[] = [
    "---",
    `cycle_id: ${summary.context.cycle.id}`,
    `cycle_name: ${summary.context.cycle.name}`,
    `source: ${summary.context.source}`,
    `generated_at: ${summary.generatedAt}`,
    "status: draft",
    "---",
    "",
    `# Run Summary: ${summary.context.cycle.name}`,
    "",
    "## 1. AI가 하지 않은 것",
    "",
    "- Linear/GitHub 외부 write를 실행하지 않음.",
    "- 산출물 파일을 생성하거나 기존 파일을 덮어쓰지 않음.",
    "- 라벨/댓글/status 변경은 승인 대기 plan으로만 정리함.",
    "",
    "## 2. 생성 가능",
    "",
  ];

  if (summary.generated.length === 0) {
    lines.push("- Cycle issue가 없음");
  } else {
    for (const item of summary.generated) {
      lines.push(`- ${item.issue.identifier}: \`${item.path}\``);
    }
  }

  lines.push("", "## 3. 확인 필요", "");
  if (summary.needsClarification.length === 0) {
    lines.push("- 없음");
  } else {
    for (const item of summary.needsClarification) {
      lines.push(`${item.issue.identifier} ${item.issue.title}`);
      item.questions.forEach((question, index) => lines.push(`${index + 1}. ${question}`));
      lines.push("");
    }
  }

  lines.push("## 4. 라벨 필요", "");
  if (summary.needsLabel.length === 0) {
    lines.push("- 없음");
  } else {
    for (const item of summary.needsLabel) {
      lines.push(`- ${item.issue.identifier} ${item.issue.title}`);
      lines.push(`  - AI 제안: \`${item.proposedLabel}\``);
      lines.push(`  - 이유: ${item.reason}`);
    }
  }

  lines.push("", "## 5. 승인 대기", "");
  if (summary.needsApproval.length === 0) {
    lines.push("- 없음");
  } else {
    for (const plan of summary.needsApproval) {
      lines.push(`- ${plan.summary}`);
      lines.push(`  - idempotencyKey: \`${plan.idempotencyKey}\``);
      lines.push("  - writes:");
      for (const write of plan.writes) {
        lines.push(`    - type: \`${write.type}\``);
        lines.push(`      target: \`${write.target}\``);
      }
    }
  }

  lines.push("", "## 6. 실패", "");
  if (summary.failed.length === 0) {
    lines.push("- 없음");
  } else {
    for (const item of summary.failed) {
      lines.push(`- ${item.issue.identifier}: ${item.reason}`);
    }
  }

  lines.push("", "## 7. 다음 추천 행동", "");
  if (summary.needsLabel.length > 0) {
    lines.push(`"${summary.needsLabel[0].issue.identifier}는 ${summary.needsLabel[0].proposedLabel}로 진행하자"`);
  } else if (summary.needsClarification.length > 0) {
    lines.push(`"${summary.needsClarification[0].issue.identifier} 확인 필요 질문에 답할게"`);
  } else if (summary.generated.length > 0) {
    lines.push("\"생성 가능 항목부터 draft 만들어줘\"");
  } else {
    lines.push("\"이번 cycle에 처리할 issue를 추가하자\"");
  }

  return `${lines.join("\n")}\n`;
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "") || "working-cycle";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = await runSprintDryRun();
  const outputPath = writeSprintDryRunSummary(summary);
  console.log(`Wrote ${outputPath}`);
}
