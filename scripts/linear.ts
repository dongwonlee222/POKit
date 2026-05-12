import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
  description?: string;
  url?: string;
  labels: string[];
  state?: string;
  assignee?: string;
};

export type Cycle = {
  id: string;
  name: string;
  number?: number;
  startsAt?: string;
  endsAt?: string;
};

const LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql";
let dotEnvLoaded = false;

type LinearGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function readRequiredEnv(name: "LINEAR_API_KEY" | "LINEAR_TEAM_ID"): string {
  loadDotEnvOnce();
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env or export it before calling Linear read helpers.`);
  }
  return value;
}

function loadDotEnvOnce(): void {
  if (dotEnvLoaded) {
    return;
  }
  dotEnvLoaded = true;
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }
  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

async function linearGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const apiKey = readRequiredEnv("LINEAR_API_KEY");
  const response = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json() as LinearGraphqlResponse<T>;
  if (!response.ok) {
    throw new Error(`Linear API request failed with HTTP ${response.status}.`);
  }
  if (payload.errors?.length) {
    throw new Error(`Linear API error: ${payload.errors.map((error) => error.message).join("; ")}`);
  }
  if (!payload.data) {
    throw new Error("Linear API returned no data.");
  }
  return payload.data;
}

export async function getCurrentCycle(): Promise<Cycle> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = readRequiredEnv("LINEAR_TEAM_ID");
  const data = await linearGraphql<{
    team: {
      cycles: {
        nodes: Array<{
          id: string;
          name: string;
          number?: number;
          startsAt?: string;
          endsAt?: string;
        }>;
      };
    } | null;
  }>(`
    query CurrentCycle($teamId: String!) {
      team(id: $teamId) {
        cycles(first: 1, filter: { isActive: { eq: true } }) {
          nodes {
            id
            name
            number
            startsAt
            endsAt
          }
        }
      }
    }
  `, { teamId });
  const cycle = data.team?.cycles.nodes[0];
  if (!cycle) {
    throw new Error(`No active Linear cycle found for team ${teamId}.`);
  }
  return cycle;
}

export async function listIssues(cycleId: string): Promise<Issue[]> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = readRequiredEnv("LINEAR_TEAM_ID");
  const data = await linearGraphql<{
    team: {
      issues: {
        nodes: Array<{
          id: string;
          identifier: string;
          title: string;
          description?: string;
          url?: string;
          labels: { nodes: Array<{ name: string }> };
          state?: { name: string };
          assignee?: { name: string } | null;
        }>;
      };
    } | null;
  }>(`
    query CycleIssues($teamId: String!, $cycleId: ID!) {
      team(id: $teamId) {
        issues(first: 100, filter: { cycle: { id: { eq: $cycleId } } }) {
          nodes {
            id
            identifier
            title
            description
            url
            labels {
              nodes {
                name
              }
            }
            state {
              name
            }
            assignee {
              name
            }
          }
        }
      }
    }
  `, { teamId, cycleId });
  return data.team?.issues.nodes.map((issue) => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    url: issue.url,
    labels: issue.labels.nodes.map((label) => label.name),
    state: issue.state?.name,
    assignee: issue.assignee?.name,
  })) ?? [];
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
