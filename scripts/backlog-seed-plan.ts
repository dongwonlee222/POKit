import { applyCreateIssue, planCreateIssue, type Issue, type Plan } from "./linear.ts";

type SeedIssue = {
  title: string;
  description: string;
  labels: string[];
};

const SEED_ISSUES: SeedIssue[] = [
  {
    title: "POKit dry-run runner 품질 확인",
    description: [
      "실제 Linear cycle issue를 읽어 dry-run runner가 생성 가능, 라벨 필요, 확인 필요, 승인 대기를 올바르게 분류하는지 확인한다.",
      "",
      "Acceptance notes:",
      "- 실제 Linear write는 하지 않는다.",
      "- Run Summary의 첫 섹션은 AI가 하지 않은 것이어야 한다.",
      "- 빈 cycle과 라벨 없는 issue 케이스를 모두 확인한다.",
    ].join("\n"),
    labels: ["pokit:criteria"],
  },
  {
    title: "API key rotate와 보안 가이드 작성",
    description: [
      "채팅이나 로그에 노출된 Linear API key를 rotate하도록 안내하고, .env와 artifacts 보관 규칙을 문서화한다.",
      "",
      "Acceptance notes:",
      "- README 또는 SECURITY 문서에서 API key rotate를 설명한다.",
      "- .env는 커밋하지 않는다는 점을 명확히 한다.",
    ].join("\n"),
    labels: ["pokit:criteria"],
  },
  {
    title: "PRD/criteria artifact draft 생성 runner 구현",
    description: [
      "dry-run summary에서 생성 가능으로 분류된 issue에 대해 PRD 또는 acceptance criteria draft 파일을 생성한다.",
      "",
      "Scope:",
      "- pokit:prd -> artifacts/prds/[issue-id].md",
      "- pokit:criteria -> artifacts/criteria/[issue-id].md",
      "- content_hash frontmatter를 기록한다.",
      "- 기존 파일 hash가 바뀌면 덮어쓰지 않고 Needs Approval로 표시한다.",
    ].join("\n"),
    labels: ["pokit:prd"],
  },
  {
    title: "Linear label preflight dry-run plan 구현",
    description: [
      "POKit 필수 라벨(pokit:prd, pokit:criteria 등)이 Linear workspace/team에 있는지 확인하고, 누락된 라벨 생성 계획을 dry-run으로 보여준다.",
      "",
      "Acceptance notes:",
      "- 라벨 생성은 승인 전까지 실행하지 않는다.",
      "- plan에는 idempotencyKey와 writes[]가 포함된다.",
    ].join("\n"),
    labels: ["pokit:criteria"],
  },
  {
    title: "Cycle 종료 회고 summary 초안 생성",
    description: [
      "주간 Linear cycle 종료 시 생성된 artifacts, 남은 질문, 미완료 issue, decision-log 후보를 회고 초안으로 정리한다.",
      "",
      "Acceptance notes:",
      "- output: artifacts/sprints/[cycle]/retro.md",
      "- Linear/GitHub write 없이 로컬 draft만 생성한다.",
    ].join("\n"),
    labels: ["pokit:prd"],
  },
];

export async function buildBacklogSeedPlans(): Promise<Plan[]> {
  return Promise.all(SEED_ISSUES.map((issue) => planCreateIssue(issue)));
}

export function renderBacklogSeedPlanMarkdown(plans: Plan[]): string {
  const lines = [
    "# POKit Backlog Seed Plan",
    "",
    "No Linear issues were created. Review this dry-run plan before approving any external write.",
    "",
  ];

  plans.forEach((plan, index) => {
    const write = plan.writes[0];
    lines.push(`## ${index + 1}. ${plan.summary}`);
    lines.push("");
    lines.push(`- idempotencyKey: \`${plan.idempotencyKey}\``);
    lines.push(`- write type: \`${write.type}\``);
    lines.push(`- target: \`${write.target}\``);
    lines.push("- payload:");
    lines.push("```json");
    lines.push(JSON.stringify(write.payload, null, 2));
    lines.push("```");
    lines.push("");
  });

  return lines.join("\n");
}

export async function applyBacklogSeedPlans(options: { approved?: boolean } = {}): Promise<Issue[]> {
  if (!options.approved) {
    throw new Error("Refusing to create Linear seed issues without --apply-approved.");
  }
  const plans = await buildBacklogSeedPlans();
  const created: Issue[] = [];
  for (const plan of plans) {
    created.push(await applyCreateIssue(plan, { approved: true }));
  }
  return created;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--apply-approved")) {
    const created = await applyBacklogSeedPlans({ approved: true });
    console.log(JSON.stringify(created.map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
    })), null, 2));
  } else {
    const plans = await buildBacklogSeedPlans();
    console.log(renderBacklogSeedPlanMarkdown(plans));
  }
}
