import { existsSync, readFileSync } from "node:fs";

export type CycleGuardMode = "implementation" | "planning";

export type CycleGuardInput = {
  mode?: CycleGuardMode;
  operation?: "implementation" | "cycle_assignment";
  issueIdentifier?: string;
  cycleId?: string;
  cycleName?: string;
  approvedBundlePath?: string;
  targetCycleComplete?: boolean;
  reopenCompletedCycle?: boolean;
};

export type CycleGuardResult = {
  allowed: boolean;
  message: string;
};

type ApprovedBundle = {
  approved?: boolean;
  cycle?: {
    id?: string;
    name?: string;
  };
  issues?: string[];
};

export function evaluateCycleGuard(input: CycleGuardInput): CycleGuardResult {
  const mode = input.mode ?? "implementation";
  if (mode === "planning") {
    return {
      allowed: true,
      message: "Planning and dry-run work may proceed without cycle context.",
    };
  }

  if (input.operation === "cycle_assignment" && input.targetCycleComplete) {
    if (input.reopenCompletedCycle) {
      return {
        allowed: true,
        message: `Cycle-first guard passed by explicit completed-cycle reopen for ${input.issueIdentifier ?? "new work"} in ${input.cycleName ?? input.cycleId ?? "target cycle"}.`,
      };
    }
    return {
      allowed: false,
      message: [
        "Completed cycle is immutable.",
        "Move new work to the next cycle instead of adding Todo to a completed cycle.",
        "Allowed exception: explicitly reopen the completed cycle, then rerun with --reopen-completed-cycle.",
      ].join(" "),
    };
  }

  const bundle = input.approvedBundlePath ? readApprovedBundle(input.approvedBundlePath) : null;
  if (bundle?.approved && (bundle.cycle?.id || bundle.cycle?.name)) {
    return {
      allowed: true,
      message: `Cycle-first guard passed by approved cycle bundle (${formatCycle(bundle.cycle)}).`,
    };
  }

  if (input.issueIdentifier && input.cycleId) {
    return {
      allowed: true,
      message: `Cycle-first guard passed for ${input.issueIdentifier} in ${input.cycleName ?? input.cycleId}.`,
    };
  }

  return {
    allowed: false,
    message: [
      "Cycle-first guard blocked implementation.",
      "Attach the work to a Linear cycle or provide an approved cycle bundle before changing durable project files.",
      "Allowed without cycle context: read-only analysis, planning, and dry-run artifacts.",
      "Repair: create or assign a Linear issue to the target cycle, then rerun with --issue EVM-123 --cycle-id <cycle-id>.",
    ].join(" "),
  };
}

function readApprovedBundle(path: string): ApprovedBundle | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ApprovedBundle;
  } catch {
    return null;
  }
}

function formatCycle(cycle: ApprovedBundle["cycle"]): string {
  return cycle?.name ?? cycle?.id ?? "unknown cycle";
}

function readCliInput(args: string[], env: NodeJS.ProcessEnv): CycleGuardInput {
  return {
    mode: readFlag(args, "--mode") as CycleGuardMode | undefined,
    operation: readFlag(args, "--operation") as CycleGuardInput["operation"] | undefined,
    issueIdentifier: readFlag(args, "--issue") ?? env.POKIT_ISSUE,
    cycleId: readFlag(args, "--cycle-id") ?? env.POKIT_CYCLE_ID,
    cycleName: readFlag(args, "--cycle-name") ?? env.POKIT_CYCLE_NAME,
    approvedBundlePath: readFlag(args, "--approved-bundle") ?? env.POKIT_APPROVED_BUNDLE,
    targetCycleComplete: readBooleanFlag(args, "--target-cycle-complete") || env.POKIT_TARGET_CYCLE_COMPLETE === "1",
    reopenCompletedCycle: readBooleanFlag(args, "--reopen-completed-cycle") || env.POKIT_REOPEN_COMPLETED_CYCLE === "1",
  };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function readBooleanFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function main(): Promise<void> {
  const result = evaluateCycleGuard(readCliInput(process.argv.slice(2), process.env));
  console.log(result.message);
  if (!result.allowed) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
