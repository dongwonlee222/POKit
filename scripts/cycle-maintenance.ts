import { planUpdateCycle, type Plan } from "./linear.ts";

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const completedAt = readArg(args, "--completed-at", new Date().toISOString());
  const cycle1Id = readArg(args, "--cycle-1-id", "b51858e6-ac13-477c-84d7-8ca290db6653");
  const cycle2Id = readArg(args, "--cycle-2-id", "169a76a8-2867-45f0-b380-3e35e504c9c7");
  const plans = await buildCycleMaintenancePlans({
    completedAt,
    cycles: [
      { cycleId: cycle1Id, cycleName: "Cycle 1", reason: "27/27 issues Done; stale Linear current cycle." },
      { cycleId: cycle2Id, cycleName: "Cycle 2", reason: "6/6 issues Done; deployment omission moved to Hotfix v0.1.0." },
    ],
  });
  console.log(renderCycleMaintenanceMarkdown(plans));
}
