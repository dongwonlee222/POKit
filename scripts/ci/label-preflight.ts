import { planMissingLabels, type Plan } from "../internal/linear.ts";

export const DAY2_REQUIRED_LABELS = ["pokit:prd", "pokit:criteria"] as const;

export async function buildLabelPreflightPlan(labels: readonly string[] = DAY2_REQUIRED_LABELS): Promise<Plan> {
  return planMissingLabels([...labels]);
}

export function renderLabelPreflightPlanMarkdown(plan: Plan): string {
  const lines = [
    "# POKit Label Preflight Plan",
    "",
    "No Linear labels were created. Review this dry-run plan before approving any external write.",
    "",
    `- idempotencyKey: \`${plan.idempotencyKey}\``,
    `- summary: ${plan.summary}`,
    "- writes:",
  ];

  if (plan.writes.length === 0) {
    lines.push("  - none");
  } else {
    for (const write of plan.writes) {
      lines.push(`  - type: \`${write.type}\``);
      lines.push(`    target: \`${write.target}\``);
      lines.push("    payload:");
      lines.push("    ```json");
      lines.push(JSON.stringify(write.payload, null, 2).split("\n").map((line) => `    ${line}`).join("\n"));
      lines.push("    ```");
    }
  }

  return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const plan = await buildLabelPreflightPlan();
  console.log(renderLabelPreflightPlanMarkdown(plan));
}
