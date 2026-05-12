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

type CreateIssuePayload = IssueInput;

export type ApplyOptions = {
  approved?: boolean;
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

export type Team = {
  id: string;
  key: string;
  name: string;
};

export type WorkingCycleContext = {
  source: "linear_active" | "linear_upcoming" | "team_backlog";
  cycle: Cycle;
  issues: Issue[];
};

const LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql";
let dotEnvLoaded = false;

type LinearGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type LinearIssueNode = {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  url?: string;
  labels: { nodes: Array<{ name: string }> };
  state?: { name: string };
  assignee?: { name: string } | null;
};

type LinearCycleNode = {
  id: string;
  name?: string | null;
  number?: number;
  startsAt?: string;
  endsAt?: string;
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
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json() as LinearGraphqlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(`Linear API error: ${payload.errors.map((error) => error.message).join("; ")}`);
  }
  if (!response.ok) {
    throw new Error(`Linear API request failed with HTTP ${response.status}.`);
  }
  if (!payload.data) {
    throw new Error("Linear API returned no data.");
  }
  return payload.data;
}

function normalizeCycle(cycle: LinearCycleNode): Cycle {
  return {
    id: cycle.id,
    name: cycle.name ?? `Cycle ${cycle.number ?? cycle.id}`,
    number: cycle.number,
    startsAt: cycle.startsAt,
    endsAt: cycle.endsAt,
  };
}

function normalizeIssue(issue: LinearIssueNode): Issue {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    url: issue.url,
    labels: issue.labels.nodes.map((label) => label.name),
    state: issue.state?.name,
    assignee: issue.assignee?.name,
  };
}

export async function getCurrentCycle(): Promise<Cycle> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = readRequiredEnv("LINEAR_TEAM_ID");
  const data = await linearGraphql<{
    team: {
      cycles: {
        nodes: LinearCycleNode[];
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
  return normalizeCycle(cycle);
}

export async function listTeams(): Promise<Team[]> {
  readRequiredEnv("LINEAR_API_KEY");
  const data = await linearGraphql<{
    teams: {
      nodes: Team[];
    };
  }>(`
    query Teams($first: Int!) {
      teams(first: $first) {
        nodes {
          id
          key
          name
        }
      }
    }
  `, { first: 100 });
  return data.teams.nodes.map((team) => ({
    id: team.id,
    key: team.key,
    name: team.name,
  }));
}

export async function listIssues(cycleId: string): Promise<Issue[]> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = readRequiredEnv("LINEAR_TEAM_ID");
  const data = await linearGraphql<{
    team: {
      issues: {
        nodes: LinearIssueNode[];
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
  return data.team?.issues.nodes.map(normalizeIssue) ?? [];
}

export async function getWorkingCycleContext(): Promise<WorkingCycleContext> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = readRequiredEnv("LINEAR_TEAM_ID");
  const data = await linearGraphql<{
    team: {
      activeCycles: { nodes: LinearCycleNode[] };
      upcomingCycles: { nodes: LinearCycleNode[] };
      issues: { nodes: LinearIssueNode[] };
    } | null;
  }>(`
    query WorkingCycleCandidates($teamId: String!) {
      team(id: $teamId) {
        activeCycles: cycles(first: 1, filter: { isActive: { eq: true } }) {
          nodes {
            id
            name
            number
            startsAt
            endsAt
          }
        }
        upcomingCycles: cycles(first: 1, filter: { isActive: { eq: false } }) {
          nodes {
            id
            name
            number
            startsAt
            endsAt
          }
        }
        issues(first: 100) {
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
  `, { teamId });
  const activeCycle = data.team?.activeCycles.nodes[0];
  if (activeCycle) {
    return {
      source: "linear_active",
      cycle: normalizeCycle(activeCycle),
      issues: await listIssues(activeCycle.id),
    };
  }
  const upcomingCycle = data.team?.upcomingCycles.nodes[0];
  if (upcomingCycle) {
    return {
      source: "linear_upcoming",
      cycle: normalizeCycle(upcomingCycle),
      issues: await listIssues(upcomingCycle.id),
    };
  }
  return {
    source: "team_backlog",
    cycle: {
      id: "team-backlog",
      name: "Team Backlog",
    },
    issues: data.team?.issues.nodes.map(normalizeIssue) ?? [],
  };
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

export async function applyCreateIssue(plan: Plan, options: ApplyOptions = {}): Promise<Issue> {
  if (!options.approved) {
    throw new Error("Refusing external write without explicit approval.");
  }
  if (!plan.idempotencyKey) {
    throw new Error("Refusing external write without idempotency key.");
  }
  if (plan.writes.length !== 1 || plan.writes[0].type !== "create_issue") {
    throw new Error("Refusing create issue apply for unsupported plan shape.");
  }
  const teamId = readRequiredEnv("LINEAR_TEAM_ID");
  const payload = plan.writes[0].payload as CreateIssuePayload;
  if (!payload.title) {
    throw new Error("Refusing create issue apply without title.");
  }
  const description = [
    payload.description,
    payload.labels?.length ? `\n\nPOKit labels requested: ${payload.labels.join(", ")}` : "",
    `\n\nPOKit idempotency key: ${plan.idempotencyKey}`,
  ].filter(Boolean).join("");
  const data = await linearGraphql<{
    issueCreate: {
      success: boolean;
      issue: LinearIssueNode;
    };
  }>(`
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
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
  `, {
    input: {
      teamId,
      title: payload.title,
      description,
      cycleId: payload.cycleId,
      labelIds: [],
    },
  });
  if (!data.issueCreate.success) {
    throw new Error("Linear issueCreate returned success=false.");
  }
  return normalizeIssue(data.issueCreate.issue);
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
