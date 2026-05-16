import { planUpdateCycle, type Plan } from "../internal/linear.ts";

export type CycleMaintenanceTarget = {
  cycleId: string;
  cycleName: string;
  reason: string;
};

export type CycleMaintenanceInput = {
  completedAt: string;
  cycles: CycleMaintenanceTarget[];
};

export async function buildCycleMaintenancePlans(input: CycleMaintenanceInput): Promise<Plan[]> {
  return Promise.all(input.cycles.map((cycle) => planUpdateCycle({
    cycleId: cycle.cycleId,
    cycleName: cycle.cycleName,
    completedAt: input.completedAt,
    description: [
      "POKit operational completion.",
      "",
      `cycleName: ${cycle.cycleName}`,
      `completedAt: ${input.completedAt}`,
      `reason: ${cycle.reason}`,
    ].join("\n"),
  })));
}

export function renderCycleMaintenanceMarkdown(plans: Plan[]): string {
  const lines = [
    "# POKit Cycle Maintenance Dry-run",
    "",
    "No Linear cycles were changed. Review this plan before approving any external write.",
    "",
    "This aligns Linear cycle status with POKit's operational completion state.",
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

function requireArg(args: string[], flag: string): string {
  const value = readArg(args, flag);
  if (!value) {
    throw new Error(`Missing required ${flag}`);
  }
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const completedAt = readArg(args, "--completed-at", new Date().toISOString());
  const previousCycleId = requireArg(args, "--previous-cycle-id");
  const completedCycleId = requireArg(args, "--completed-cycle-id");
  const previousCycleName = readArg(args, "--previous-cycle-name", "Previous Cycle");
  const completedCycleName = readArg(args, "--completed-cycle-name", "Completed Cycle");
  const previousReason = readArg(args, "--previous-reason", "Operationally complete; stale Linear current cycle.");
  const completedReason = readArg(args, "--completed-reason", "Operationally complete after approved release gate.");
  const plans = await buildCycleMaintenancePlans({
    completedAt,
    cycles: [
      { cycleId: previousCycleId, cycleName: previousCycleName, reason: previousReason },
      { cycleId: completedCycleId, cycleName: completedCycleName, reason: completedReason },
    ],
  });
  console.log(renderCycleMaintenanceMarkdown(plans));
}
