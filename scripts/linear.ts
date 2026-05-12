export type Plan = {
  idempotencyKey: string;
  summary: string;
  writes: Array<{
    type: "create_issue" | "create_label" | "comment_issue" | "update_issue";
    target: string;
    payload: unknown;
  }>;
};

export type IssueInput = {
  title: string;
  description?: string;
  labels?: string[];
  cycleId?: string;
};

export type Issue = {
  id: string;
  identifier: string;
  title: string;
  labels: string[];
};

export type Cycle = {
  id: string;
  name: string;
};

export async function getCurrentCycle(): Promise<Cycle> {
  throw new Error("Linear API implementation is not wired yet.");
}

export async function listIssues(cycleId: string): Promise<Issue[]> {
  void cycleId;
  throw new Error("Linear API implementation is not wired yet.");
}

export async function planCreateIssue(input: IssueInput): Promise<Plan> {
  return {
    idempotencyKey: `linear:create_issue:${input.title}`,
    summary: `Create Linear issue: ${input.title}`,
    writes: [
      {
        type: "create_issue",
        target: input.cycleId ?? "backlog",
        payload: input,
      },
    ],
  };
}

export async function applyCreateIssue(plan: Plan): Promise<Issue> {
  void plan;
  throw new Error("Refusing external write until Linear apply is implemented with approval checks.");
}

export async function planMissingLabels(labels: string[]): Promise<Plan> {
  return {
    idempotencyKey: `linear:create_labels:${labels.sort().join(",")}`,
    summary: `Create missing POKit labels: ${labels.join(", ")}`,
    writes: labels.map((label) => ({
      type: "create_label",
      target: "linear_workspace",
      payload: { name: label },
    })),
  };
}
