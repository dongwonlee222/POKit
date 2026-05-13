import { planAssignIssueToCycle, planCreateHotfixCycle, type Plan } from "./linear.ts";

export type HotfixCyclePlanInput = {
  hotfixCycleName: string;
  startsAt: string;
  endsAt: string;
  sourceCycle: string;
  targetVersion: string;
  resumeCycle: string;
  releaseScope: string;
  issueId: string;
  issueIdentifier: string;
  createdCycleId?: string;
};

export async function buildHotfixCyclePlans(input: HotfixCyclePlanInput): Promise<Plan[]> {
  const createCyclePlan = await planCreateHotfixCycle({
    name: input.hotfixCycleName,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    sourceCycle: input.sourceCycle,
    targetVersion: input.targetVersion,
    resumeCycle: input.resumeCycle,
    releaseScope: input.releaseScope,
  });
  const targetCycleId = input.createdCycleId ?? "<created-hotfix-cycle-id>";
  const moveIssuePlan = await planAssignIssueToCycle({
    issueId: input.issueId,
    issueIdentifier: input.issueIdentifier,
    cycleId: targetCycleId,
  });
  return [createCyclePlan, moveIssuePlan];
}

export function renderHotfixCyclePlanMarkdown(plans: Plan[]): string {
  const lines = [
    "# POKit Hotfix Cycle Dry-run",
    "",
    "No Linear cycles or issues were changed. Review this plan before approving any external write.",
    "",
    "GitHub push/tag/release still requires a separate final approval after this Linear tracking plan is applied.",
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

function readArg(args: string[], flag: string, fallback?: string): string {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback ?? "";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const plans = await buildHotfixCyclePlans({
    hotfixCycleName: readArg(args, "--name", "Hotfix v0.1.0"),
    startsAt: readArg(args, "--starts-at", new Date().toISOString()),
    endsAt: readArg(args, "--ends-at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
    sourceCycle: readArg(args, "--source-cycle", "Cycle 2"),
    targetVersion: readArg(args, "--target-version", "v0.1.0"),
    resumeCycle: readArg(args, "--resume-cycle", "Cycle 3"),
    releaseScope: readArg(args, "--release-scope", "GitHub push/tag/release"),
    issueId: readArg(args, "--issue-id", "EVM-44"),
    issueIdentifier: readArg(args, "--issue", "EVM-44"),
    createdCycleId: readArg(args, "--created-cycle-id") || undefined,
  });
  console.log(renderHotfixCyclePlanMarkdown(plans));
}
