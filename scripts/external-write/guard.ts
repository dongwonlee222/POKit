import type { Plan } from "../linear.ts";

export type ExternalWriteActor = "main_agent" | "subagent";

export type ExternalWriteApplyOptions = {
  approved?: boolean;
  actor?: ExternalWriteActor;
  semanticPreflight?: {
    ok: boolean;
    errors: string[];
  };
};

export function assertExternalWriteAllowed(plan: Plan, options: ExternalWriteApplyOptions = {}): void {
  if (!options.approved) {
    throw new Error("Refusing external write without explicit approval.");
  }
  if (options.actor !== "main_agent") {
    throw new Error("Refusing external write unless actor is the main agent.");
  }
  if (!plan.idempotencyKey) {
    throw new Error("Refusing external write without idempotency key.");
  }
  if (requiresSemanticPreflight(plan) && !options.semanticPreflight?.ok) {
    const detail = options.semanticPreflight?.errors.length ? `: ${options.semanticPreflight.errors.join("; ")}` : "";
    throw new Error(`Refusing release-bundle Linear write without passing semantic preflight${detail}.`);
  }
}

export function requiresSemanticPreflight(plan: Plan): boolean {
  return plan.writes.some((write) => {
    if (write.type !== "create_issue" && write.type !== "update_issue") {
      return false;
    }
    if (!isRecord(write.payload)) {
      return false;
    }
    const title = typeof write.payload.title === "string" ? write.payload.title : "";
    const description = typeof write.payload.description === "string" ? write.payload.description : "";
    return /^v\d+\.\d+\.\d+\b/.test(title) || /Target version:|Release bundle:/i.test(description);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
