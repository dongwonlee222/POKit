import { applyCreateIssue, planCreateIssue, type Issue, type Plan } from "./linear.ts";
import { type LinearBacklogDescriptionInput } from "./backlog-outline.ts";

type SeedIssue = {
  title: string;
  description: LinearBacklogDescriptionInput;
  labels: string[];
};

const SEED_ISSUES: SeedIssue[] = [
  {
    title: "POKit dry-run runner 품질 확인",
    description: {
      purpose: "실제 Linear cycle issue를 읽어 dry-run runner가 생성 가능, 라벨 필요, 확인 필요, 승인 대기를 올바르게 분류하는지 확인한다.",
      userVisibleChange: "dry-run 실행 시 분류 결과가 Run Summary에 정확히 표시된다.",
      doneCondition: "실제 Linear write 없이 빈 cycle과 라벨 없는 issue 케이스를 모두 분류 검증한다.",
      scope: "dry-run runner 분류 로직 검증",
      outOfScope: "실제 Linear write 실행",
      evidence: ["POKit backlog seed — 초기 품질 확인 항목"],
      release: { kind: "none" },
      linearVariables: {
        state: "Backlog",
        labels: ["pokit:criteria"],
        source: "linear",
        idempotencyKey: "seed:dry-run-runner-quality-check",
      },
      asIs: "dry-run runner 분류 정확도 미검증 상태",
      toBe: "Run Summary의 첫 섹션이 AI가 하지 않은 것이고, 분류가 정확함",
      successVerification: "빈 cycle + 라벨 없는 issue 케이스 모두 PASS, Linear write 0건",
    },
    labels: ["pokit:criteria"],
  },
  {
    title: "API key rotate와 보안 가이드 작성",
    description: {
      purpose: "채팅이나 로그에 노출된 Linear API key를 rotate하도록 안내하고, .env와 artifacts 보관 규칙을 문서화한다.",
      userVisibleChange: "README 또는 SECURITY 문서에서 API key rotate 절차와 .env 커밋 금지 규칙을 확인할 수 있다.",
      doneCondition: "보안 가이드 문서가 작성되고 .env 커밋 금지 규칙이 명시된다.",
      scope: "API key rotate 가이드 + .env 보관 규칙 문서화",
      outOfScope: "실제 key rotate 실행, CI 설정 변경",
      evidence: ["POKit backlog seed — 보안 위생 항목"],
      release: { kind: "none" },
      linearVariables: {
        state: "Backlog",
        labels: ["pokit:criteria"],
        source: "linear",
        idempotencyKey: "seed:api-key-rotate-security-guide",
      },
      asIs: "API key 보관 및 rotate 절차 미문서화",
      toBe: "README/SECURITY에 rotate 절차와 .env 커밋 금지 규칙 명시",
      successVerification: "문서에서 rotate 절차 확인 가능, .env 커밋 금지 명시 확인",
    },
    labels: ["pokit:criteria"],
  },
  {
    title: "PRD/criteria artifact draft 생성 runner 구현",
    description: {
      purpose: "dry-run summary에서 생성 가능으로 분류된 issue에 대해 PRD 또는 acceptance criteria draft 파일을 생성한다.",
      userVisibleChange: "pokit:prd → artifacts/prds/[issue-id].md, pokit:criteria → artifacts/criteria/[issue-id].md 파일이 자동 생성된다.",
      doneCondition: "content_hash frontmatter 기록, 기존 파일 hash 변경 시 Needs Approval 표시",
      scope: "artifact draft 생성 runner (pokit:prd, pokit:criteria 라벨 기준)",
      outOfScope: "Linear/GitHub write, 파일 자동 커밋",
      evidence: ["POKit backlog seed — artifact 자동화 항목"],
      release: { kind: "none" },
      linearVariables: {
        state: "Backlog",
        labels: ["pokit:prd"],
        source: "linear",
        idempotencyKey: "seed:prd-criteria-artifact-runner",
      },
      asIs: "draft 파일 수동 생성",
      toBe: "생성 가능 이슈에 대해 draft 파일 자동 생성",
      successVerification: "artifacts/ 하위에 올바른 파일 생성, content_hash 기록, 중복 실행 시 hash 충돌 감지",
    },
    labels: ["pokit:prd"],
  },
  {
    title: "Linear label preflight dry-run plan 구현",
    description: {
      purpose: "POKit 필수 라벨(pokit:prd, pokit:criteria 등)이 Linear workspace/team에 있는지 확인하고, 누락된 라벨 생성 계획을 dry-run으로 보여준다.",
      userVisibleChange: "preflight 실행 시 누락 라벨 목록과 생성 계획(dry-run)을 콘솔에 출력한다.",
      doneCondition: "라벨 생성은 승인 전까지 실행하지 않고, plan에 idempotencyKey와 writes[]가 포함된다.",
      scope: "라벨 존재 여부 확인 + 누락 라벨 생성 plan 생성",
      outOfScope: "라벨 자동 생성 (--apply-approved 없이)",
      evidence: ["POKit backlog seed — preflight 자동화 항목"],
      release: { kind: "none" },
      linearVariables: {
        state: "Backlog",
        labels: ["pokit:criteria"],
        source: "linear",
        idempotencyKey: "seed:label-preflight-dry-run",
      },
      asIs: "라벨 존재 여부 수동 확인",
      toBe: "preflight 스크립트가 누락 라벨 생성 plan을 dry-run으로 출력",
      successVerification: "plan.writes[] 포함, idempotencyKey 포함, 승인 없이 write 0건",
    },
    labels: ["pokit:criteria"],
  },
  {
    title: "Cycle 종료 회고 summary 초안 생성",
    description: {
      purpose: "주간 Linear cycle 종료 시 생성된 artifacts, 남은 질문, 미완료 issue, decision-log 후보를 회고 초안으로 정리한다.",
      userVisibleChange: "cycle 종료 후 artifacts/sprints/[cycle]/retro.md 파일이 생성된다.",
      doneCondition: "Linear/GitHub write 없이 로컬 draft만 생성한다.",
      scope: "회고 summary 초안 생성 (retro.md)",
      outOfScope: "Linear write, GitHub PR 생성",
      evidence: ["POKit backlog seed — cycle 회고 자동화 항목"],
      release: { kind: "none" },
      linearVariables: {
        state: "Backlog",
        labels: ["pokit:prd"],
        source: "linear",
        idempotencyKey: "seed:cycle-retro-summary-draft",
      },
      asIs: "회고 초안 수동 작성",
      toBe: "cycle 종료 시 회고 초안 파일 자동 생성",
      successVerification: "artifacts/sprints/[cycle]/retro.md 생성, Linear/GitHub write 0건",
    },
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
    created.push(await applyCreateIssue(plan, { approved: true, actor: "main_agent" }));
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
