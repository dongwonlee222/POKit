import { assertExternalWriteAllowed, type ExternalWriteApplyOptions } from "./external-write/guard.ts";
import { getActiveProfile, loadDotEnvOnce } from "./profile.ts";
import {
  type LinearBacklogDescriptionInput,
  renderLinearBacklogDescription,
} from "./backlog-outline.ts";

export type Plan = {
  idempotencyKey: string;
  summary: string;
  writes: Array<{
    type: "create_issue" | "create_label" | "comment_issue" | "update_issue" | "create_cycle" | "update_cycle";
    target: string;
    payload: unknown;
  }>;
};

export type IssueInput = {
  title: string;
  description?: LinearBacklogDescriptionInput;
  labels?: string[];
  cycleId?: string;
};

type CreateIssuePayload = IssueInput;
export type CycleInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  description?: string;
  teamId?: string;
};
export type CycleUpdateInput = {
  cycleId: string;
  cycleName?: string;
  completedAt?: string;
  startsAt?: string;
  endsAt?: string;
  name?: string;
  description?: string;
};
export type HotfixCycleInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  sourceCycle: string;
  targetVersion: string;
  resumeCycle: string;
  releaseScope: string;
};
type CreateCyclePayload = CycleInput;
type AssignIssueToCyclePayload = {
  issueId: string;
  issueIdentifier: string;
  cycleId: string;
};
type CreateLabelPayload = {
  name: string;
};
type AssignLabelToIssuePayload = {
  issueId: string;
  issueIdentifier: string;
  labelId: string;
  labelName: string;
};

const LINEAR_CYCLE_DESCRIPTION_MAX_LENGTH = 255;

export type ApplyOptions = ExternalWriteApplyOptions;

export type Issue = {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  url?: string;
  dueDate?: string | null;
  labels: string[];
  state?: string;
  assignee?: string;
  priority?: number;
  parent?: {
    id: string;
    identifier?: string;
  };
};

export type Cycle = {
  id: string;
  name: string;
  number?: number;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  completedAt?: string;
};

export type Team = {
  id: string;
  key: string;
  name: string;
};

export type LinearLabel = {
  id: string;
  name: string;
};

export type LinearCleanupMutationSchemaCheck = {
  candidates: string[];
  available: string[];
  selected: string | null;
  canArchive: boolean;
  reason: string;
};

export type WorkingCycleContext = {
  source: "linear_active" | "linear_upcoming" | "team_backlog";
  cycle: Cycle;
  issues: Issue[];
};

export type CycleWorkSurface = {
  source: "linear_active" | "linear_upcoming";
  cycle: Cycle;
  issues: Issue[];
};

export type WorkingContext = {
  activeCycle?: CycleWorkSurface;
  upcomingCycle?: CycleWorkSurface;
  backlogIssues: Issue[];
  selected: WorkingCycleContext;
  fetchedAt: string;
};

export type WorkingContextReadOptions = {
  refresh?: boolean;
};

const LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql";
const WORKING_CONTEXT_CACHE_TTL_MS = 30_000;
let workingContextCache:
  | {
      teamId: string;
      expiresAt: number;
      value: WorkingContext;
    }
  | undefined;
let workingContextInFlight:
  | {
      teamId: string;
      request: Promise<WorkingContext>;
    }
  | undefined;

type LinearGraphqlResponse<T> = {
  data?: T;
  errors?: LinearGraphqlError[];
};

type LinearGraphqlError = {
  message: string;
  extensions?: {
    userPresentableMessage?: string;
    validationErrors?: LinearValidationError[];
  };
};

type LinearValidationError = {
  property?: string;
  value?: unknown;
  constraints?: Record<string, string>;
};

type LinearSchemaField = {
  name: string;
};

type LinearIssueNode = {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  url?: string;
  dueDate?: string | null;
  priority?: number;
  sortOrder?: number;
  labels: { nodes: Array<{ name: string }> };
  state?: { name: string };
  assignee?: { name: string } | null;
  cycle?: LinearCycleNode | null;
  parent?: {
    id: string;
    identifier?: string;
  } | null;
};

type LinearCycleNode = {
  id: string;
  name?: string | null;
  number?: number;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  completedAt?: string;
};

function readRequiredEnv(name: "LINEAR_API_KEY"): string {
  loadDotEnvOnce();
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env or export it before calling Linear read helpers.`);
  }
  return value;
}

async function resolveTeamId(): Promise<string> {
  loadDotEnvOnce();
  const profile = getActiveProfile();
  if (profile.linearTeamId) {
    return profile.linearTeamId;
  }
  const teams = await listTeams();
  if (profile.linearTeamKey) {
    const team = teams.find((candidate) => candidate.key.toLowerCase() === profile.linearTeamKey?.toLowerCase());
    if (team) {
      return team.id;
    }
    throw new Error(`No Linear team matched ${formatTeamSelection(profile)}. Available teams: ${formatTeamOptions(teams)}.`);
  }
  if (teams.length === 1) {
    return teams[0].id;
  }
  throw new Error(`LINEAR_TEAM_ID is optional only when one team is available. Set LINEAR_TEAM_ID, LINEAR_TEAM_KEY, or POKIT_PROFILE. Available teams: ${formatTeamOptions(teams)}.`);
}

function formatTeamOptions(teams: Team[]): string {
  return teams.map((team) => `${team.name} (${team.key}, ${team.id})`).join("; ") || "none";
}

function formatTeamSelection(profile: ReturnType<typeof getActiveProfile>): string {
  return profile.configured
    ? `POKIT_PROFILE=${profile.name} linear_team_key=${profile.linearTeamKey}`
    : `LINEAR_TEAM_KEY=${profile.linearTeamKey}`;
}

function normalizeState(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
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
    throw new Error(`Linear API error: ${payload.errors.map(formatLinearGraphqlError).join("; ")}`);
  }
  if (!response.ok) {
    throw new Error(`Linear API request failed with HTTP ${response.status}.`);
  }
  if (!payload.data) {
    throw new Error("Linear API returned no data.");
  }
  return payload.data;
}

function formatLinearGraphqlError(error: LinearGraphqlError): string {
  const details = [
    error.message,
    error.extensions?.userPresentableMessage,
    ...(error.extensions?.validationErrors ?? []).map(formatLinearValidationError),
  ].filter(Boolean);
  return details.join(" | ");
}

function formatLinearValidationError(error: LinearValidationError): string {
  const parts = [
    error.property ? `field: ${error.property}` : null,
    error.constraints ? formatConstraints(error.constraints) : null,
    error.value !== undefined ? `value: ${summarizeLinearValue(error.value)}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function formatConstraints(constraints: Record<string, string>): string {
  return Object.entries(constraints)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

function summarizeLinearValue(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) {
    return String(value);
  }
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function normalizeCycle(cycle: LinearCycleNode): Cycle {
  const normalized: Cycle = {
    id: cycle.id,
    name: cycle.name ?? `Cycle ${cycle.number ?? cycle.id}`,
    number: cycle.number,
    startsAt: cycle.startsAt,
    endsAt: cycle.endsAt,
  };
  if (cycle.description !== undefined && cycle.description !== null) {
    normalized.description = cycle.description;
  }
  if (cycle.completedAt !== undefined) {
    normalized.completedAt = cycle.completedAt;
  }
  return normalized;
}

function normalizeIssue(issue: LinearIssueNode): Issue {
  const normalized: Issue = {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    url: issue.url,
    labels: issue.labels.nodes.map((label) => label.name),
    state: issue.state?.name,
    assignee: issue.assignee?.name,
  };
  if (issue.priority !== undefined) {
    normalized.priority = issue.priority;
  }
  if (issue.dueDate !== undefined && issue.dueDate !== null) {
    normalized.dueDate = issue.dueDate;
  }
  if (issue.parent) {
    normalized.parent = {
      id: issue.parent.id,
      identifier: issue.parent.identifier,
    };
  }
  return normalized;
}

function selectIssuesForCycle(issues: LinearIssueNode[], cycleId: string | undefined): Issue[] {
  if (!cycleId) {
    return [];
  }
  return issues
    .filter((issue) => issue.cycle?.id === cycleId)
    .map(normalizeIssue);
}

function selectBacklogIssues(issues: LinearIssueNode[], options: { onlyBacklogState: boolean }): Issue[] {
  return issues
    .filter((issue) => !issue.cycle?.id)
    .filter((issue) => !options.onlyBacklogState || normalizeState(issue.state?.name) === "backlog")
    .map(normalizeIssue);
}

function buildCycleWorkSurface(
  source: CycleWorkSurface["source"],
  cycle: LinearCycleNode | undefined,
  issues: Issue[],
): CycleWorkSurface | undefined {
  if (!cycle || isCompletedCycle(cycle)) {
    return undefined;
  }
  return {
    source,
    cycle: normalizeCycle(cycle),
    issues,
  };
}

function selectUpcomingCycleNode(
  upcomingCycles: LinearCycleNode[],
  issues: LinearIssueNode[],
  activeCycleId: string | undefined,
): LinearCycleNode | undefined {
  const issueCycles = new Map<string, LinearCycleNode>();
  for (const issue of issues) {
    const cycle = issue.cycle;
    if (!cycle?.id || cycle.id === activeCycleId || isTerminalIssueState(issue.state?.name)) {
      continue;
    }
    issueCycles.set(cycle.id, cycle);
  }
  const candidates = uniqueCycles([...upcomingCycles, ...issueCycles.values()])
    .filter((cycle) => cycle.id !== activeCycleId)
    .filter((cycle) => !isCompletedCycle(cycle))
    .sort(compareCycles);
  return candidates.find((cycle) => selectOpenIssuesForCycle(issues, cycle.id).length > 0)
    ?? candidates.find((cycle) => selectIssuesForCycle(issues, cycle.id).length > 0)
    ?? candidates[0];
}

function uniqueCycles(cycles: LinearCycleNode[]): LinearCycleNode[] {
  const seen = new Set<string>();
  const unique: LinearCycleNode[] = [];
  for (const cycle of cycles) {
    if (seen.has(cycle.id)) {
      continue;
    }
    seen.add(cycle.id);
    unique.push(cycle);
  }
  return unique;
}

function compareCycles(left: LinearCycleNode, right: LinearCycleNode): number {
  const leftTime = cycleSortTime(left);
  const rightTime = cycleSortTime(right);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return (left.number ?? Number.MAX_SAFE_INTEGER) - (right.number ?? Number.MAX_SAFE_INTEGER);
}

function cycleSortTime(cycle: LinearCycleNode): number {
  if (!cycle.startsAt) {
    return Number.MAX_SAFE_INTEGER;
  }
  const time = new Date(cycle.startsAt).getTime();
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function isTerminalIssueState(state: string | undefined): boolean {
  const normalized = normalizeState(state);
  return normalized === "done" || normalized === "completed" || normalized === "canceled" || normalized === "cancelled" || normalized === "duplicate";
}

function isCompletedCycle(cycle: LinearCycleNode): boolean {
  return Boolean(cycle.completedAt);
}

function selectOpenIssuesForCycle(issues: LinearIssueNode[], cycleId: string | undefined): Issue[] {
  if (!cycleId) {
    return [];
  }
  return issues
    .filter((issue) => issue.cycle?.id === cycleId)
    .filter((issue) => !isTerminalIssueState(issue.state?.name))
    .map(normalizeIssue);
}

function selectWorkingCycleContext(context: Omit<WorkingContext, "selected" | "fetchedAt">): WorkingCycleContext {
  if (context.activeCycle) {
    return context.activeCycle;
  }
  if (context.upcomingCycle) {
    return context.upcomingCycle;
  }
  return {
    source: "team_backlog",
    cycle: {
      id: "team-backlog",
      name: "Team Backlog",
    },
    issues: context.backlogIssues,
  };
}

export function invalidateWorkingContextCache(): void {
  workingContextCache = undefined;
  workingContextInFlight = undefined;
}

async function fetchWorkingContext(teamId: string): Promise<WorkingContext> {
  const data = await linearGraphql<{
    team: {
      activeCycles: { nodes: LinearCycleNode[] };
      upcomingCycles: { nodes: LinearCycleNode[] };
      issues: { nodes: LinearIssueNode[] };
    } | null;
  }>(`
    query WorkingContext($teamId: String!) {
      team(id: $teamId) {
        activeCycles: cycles(first: 1, filter: { isActive: { eq: true } }) {
          nodes {
            id
            name
            number
            description
            startsAt
            endsAt
            completedAt
          }
        }
        upcomingCycles: cycles(first: 5, filter: { isActive: { eq: false } }) {
          nodes {
            id
            name
            number
            description
            startsAt
            endsAt
            completedAt
          }
        }
        issues(first: 100) {
          nodes {
            id
            identifier
            title
            description
            url
            dueDate
            priority
            sortOrder
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
            parent {
              id
              identifier
            }
            cycle {
              id
              name
              number
              description
              startsAt
              endsAt
              completedAt
            }
          }
        }
      }
    }
  `, { teamId });
  const issues = data.team?.issues.nodes ?? [];
  const activeCycleNode = data.team?.activeCycles.nodes[0];
  const upcomingCycleNode = selectUpcomingCycleNode(data.team?.upcomingCycles.nodes ?? [], issues, activeCycleNode?.id);
  const activeCycle = buildCycleWorkSurface(
    "linear_active",
    activeCycleNode,
    selectIssuesForCycle(issues, activeCycleNode?.id),
  );
  const upcomingCycle = buildCycleWorkSurface(
    "linear_upcoming",
    upcomingCycleNode,
    selectIssuesForCycle(issues, upcomingCycleNode?.id),
  );
  const backlogIssues = selectBacklogIssues(issues, { onlyBacklogState: Boolean(activeCycleNode || upcomingCycleNode) });
  const baseContext = {
    activeCycle,
    upcomingCycle,
    backlogIssues,
  };

  return {
    ...baseContext,
    selected: selectWorkingCycleContext(baseContext),
    fetchedAt: new Date().toISOString(),
  };
}

export async function getWorkingContext(options: WorkingContextReadOptions = {}): Promise<WorkingContext> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = await resolveTeamId();
  const now = Date.now();
  if (!options.refresh && workingContextCache?.teamId === teamId && workingContextCache.expiresAt > now) {
    return workingContextCache.value;
  }
  if (!options.refresh && workingContextInFlight?.teamId === teamId) {
    return workingContextInFlight.request;
  }
  const request = fetchWorkingContext(teamId)
    .then((context) => {
      workingContextCache = {
        teamId,
        expiresAt: Date.now() + WORKING_CONTEXT_CACHE_TTL_MS,
        value: context,
      };
      return context;
    })
    .finally(() => {
      if (workingContextInFlight?.request === request) {
        workingContextInFlight = undefined;
      }
    });
  workingContextInFlight = {
    teamId,
    request,
  };
  return request;
}

export async function getCurrentCycle(): Promise<Cycle> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = await resolveTeamId();
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

export async function checkLinearIssueCleanupMutationSchema(
  candidates: string[] = ["issueArchive", "issueDelete"],
): Promise<LinearCleanupMutationSchemaCheck> {
  const data = await linearGraphql<{
    __schema: {
      mutationType?: {
        fields: LinearSchemaField[];
      } | null;
    };
  }>(`
    query LinearMutationSchemaForCleanup {
      __schema {
        mutationType {
          fields {
            name
          }
        }
      }
    }
  `, {});
  const fieldNames = new Set(data.__schema.mutationType?.fields.map((field) => field.name) ?? []);
  const available = candidates.filter((candidate) => fieldNames.has(candidate));
  const selected = available.includes("issueArchive")
    ? "issueArchive"
    : available[0] ?? null;
  return {
    candidates,
    available,
    selected,
    canArchive: selected === "issueArchive",
    reason: selected
      ? `Linear mutation schema exposes ${selected}.`
      : `Linear mutation schema did not expose cleanup candidates: ${candidates.join(", ")}.`,
  };
}

export async function listIssues(cycleId: string): Promise<Issue[]> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = await resolveTeamId();
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
            dueDate
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
            parent {
              id
              identifier
            }
          }
        }
      }
    }
  `, { teamId, cycleId });
  return data.team?.issues.nodes.map(normalizeIssue) ?? [];
}

export async function listLabels(): Promise<LinearLabel[]> {
  readRequiredEnv("LINEAR_API_KEY");
  const teamId = await resolveTeamId();
  const data = await linearGraphql<{
    team: {
      labels: {
        nodes: LinearLabel[];
      };
    } | null;
  }>(`
    query TeamLabels($teamId: String!) {
      team(id: $teamId) {
        labels(first: 100) {
          nodes {
            id
            name
          }
        }
      }
    }
  `, { teamId });
  return data.team?.labels.nodes.map((label) => ({
    id: label.id,
    name: label.name,
  })) ?? [];
}

export async function getWorkingCycleContext(options: WorkingContextReadOptions = {}): Promise<WorkingCycleContext> {
  const context = await getWorkingContext(options);
  return context.selected;
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
  assertExternalWriteAllowed(plan, options);
  if (plan.writes.length !== 1 || plan.writes[0].type !== "create_issue") {
    throw new Error("Refusing create issue apply for unsupported plan shape.");
  }
  const teamId = await resolveTeamId();
  const payload = plan.writes[0].payload as CreateIssuePayload;
  if (!payload.title) {
    throw new Error("Refusing create issue apply without title.");
  }
  const renderedBody = payload.description
    ? renderLinearBacklogDescription(payload.description)
    : "";
  const description = [
    renderedBody,
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
          dueDate
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

export async function planAssignIssueToCycle(input: AssignIssueToCyclePayload): Promise<Plan> {
  return {
    idempotencyKey: `linear:assign_cycle:${input.issueIdentifier}:${input.cycleId}`,
    summary: `Assign ${input.issueIdentifier} to cycle ${input.cycleId}`,
    writes: [
      {
        type: "update_issue",
        target: input.issueIdentifier,
        payload: input,
      },
    ],
  };
}

export async function applyAssignIssueToCycle(plan: Plan, options: ApplyOptions = {}): Promise<Issue> {
  assertExternalWriteAllowed(plan, options);
  if (plan.writes.length !== 1 || plan.writes[0].type !== "update_issue") {
    throw new Error("Refusing cycle assignment apply for unsupported plan shape.");
  }
  const payload = plan.writes[0].payload as AssignIssueToCyclePayload;
  if (!payload.issueId || !payload.cycleId) {
    throw new Error("Refusing cycle assignment apply without issueId and cycleId.");
  }
  const data = await linearGraphql<{
    issueUpdate: {
      success: boolean;
      issue: LinearIssueNode;
    };
  }>(`
    mutation UpdateIssue($issueId: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $issueId, input: $input) {
        success
        issue {
          id
          identifier
          title
          description
          url
          dueDate
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
    issueId: payload.issueId,
    input: {
      cycleId: payload.cycleId,
    },
  });
  if (!data.issueUpdate.success) {
    throw new Error("Linear issueUpdate returned success=false.");
  }
  return normalizeIssue(data.issueUpdate.issue);
}

export async function planCreateCycle(input: CycleInput): Promise<Plan> {
  return {
    idempotencyKey: `linear:create_cycle:${input.name}`,
    summary: `Create Linear cycle: ${input.name}`,
    writes: [
      {
        type: "create_cycle",
        target: "linear_team",
        payload: input,
      },
    ],
  };
}

export async function planCreateHotfixCycle(input: HotfixCycleInput): Promise<Plan> {
  const idempotencyKey = `linear:create_cycle:${input.name}:${input.targetVersion}`;
  return {
    idempotencyKey,
    summary: `Create Linear hotfix cycle: ${input.name}`,
    writes: [
      {
        type: "create_cycle",
        target: "linear_team",
        payload: {
          name: input.name,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          description: buildHotfixCycleDescription(input),
        },
      },
    ],
  };
}

export async function applyCreateCycle(plan: Plan, options: ApplyOptions = {}): Promise<Cycle> {
  assertExternalWriteAllowed(plan, options);
  if (plan.writes.length !== 1 || plan.writes[0].type !== "create_cycle") {
    throw new Error("Refusing create cycle apply for unsupported plan shape.");
  }
  const teamId = await resolveTeamId();
  const payload = plan.writes[0].payload as CreateCyclePayload;
  if (!payload.name || !payload.startsAt || !payload.endsAt) {
    throw new Error("Refusing create cycle apply without name, startsAt, and endsAt.");
  }
  const description = buildCycleDescription(payload.description, plan.idempotencyKey);
  const data = await linearGraphql<{
    cycleCreate: {
      success: boolean;
      cycle: LinearCycleNode;
    };
  }>(`
    mutation CreateCycle($input: CycleCreateInput!) {
      cycleCreate(input: $input) {
        success
        cycle {
          id
          name
          number
          startsAt
          endsAt
        }
      }
    }
  `, {
    input: {
      teamId: payload.teamId ?? teamId,
      name: payload.name,
      description,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    },
  });
  if (!data.cycleCreate.success) {
    throw new Error("Linear cycleCreate returned success=false.");
  }
  return normalizeCycle(data.cycleCreate.cycle);
}

function buildHotfixCycleDescription(input: HotfixCycleInput): string {
  const lines = [
    "POKit Hotfix Cycle",
    `sourceCycle: ${input.sourceCycle}`,
    `targetVersion: ${input.targetVersion}`,
    `resumeCycle: ${input.resumeCycle}`,
    "releaseKind: hotfix",
    `releaseScope: ${input.releaseScope}`,
  ];
  return lines.join("\n");
}

function buildCycleDescription(description: string | undefined, idempotencyKey: string): string {
  const full = [
    description,
    `\n\nPOKit idempotency key: ${idempotencyKey}`,
  ].filter(Boolean).join("");
  if (full.length <= LINEAR_CYCLE_DESCRIPTION_MAX_LENGTH) {
    return full;
  }
  return compactCycleDescription(description, idempotencyKey);
}

function compactCycleDescription(description: string | undefined, idempotencyKey: string): string {
  const targetVersion = description?.match(/^targetVersion:\s*(.+)$/m)?.[1];
  const releaseKind = description?.match(/^releaseKind:\s*(.+)$/m)?.[1];
  const sourceCycle = description?.match(/^sourceCycle:\s*(.+)$/m)?.[1];
  const resumeCycle = description?.match(/^resumeCycle:\s*(.+)$/m)?.[1];
  const lines = [
    firstDescriptionLine(description),
    sourceCycle ? `sourceCycle: ${sourceCycle}` : null,
    targetVersion ? `targetVersion: ${targetVersion}` : null,
    resumeCycle ? `resumeCycle: ${resumeCycle}` : null,
    releaseKind ? `releaseKind: ${releaseKind}` : null,
    `idempotency: ${idempotencyKey}`,
  ].filter(Boolean) as string[];
  return fitLinesToLength(lines, LINEAR_CYCLE_DESCRIPTION_MAX_LENGTH);
}

function firstDescriptionLine(description: string | undefined): string {
  return description?.split(/\r?\n/).find((line) => line.trim())?.trim() ?? "POKit Cycle";
}

function fitLinesToLength(lines: string[], maxLength: number): string {
  let result = lines.join("\n");
  if (result.length <= maxLength) {
    return result;
  }
  const required = lines.at(-1) ?? "";
  const remaining = maxLength - required.length - 1;
  if (remaining <= 0) {
    return required.slice(0, maxLength);
  }
  const head = lines.slice(0, -1).join("\n").slice(0, remaining);
  result = `${head}\n${required}`;
  return result.length <= maxLength ? result : result.slice(0, maxLength);
}

export async function planUpdateCycle(input: CycleUpdateInput): Promise<Plan> {
  const action = input.completedAt ? "complete" : "update";
  const idempotencyKey = `linear:update_cycle:${input.cycleId}:${action}`;
  const payload = input.description === undefined
    ? input
    : {
        ...input,
        description: buildCycleDescription(input.description, idempotencyKey),
      };
  return {
    idempotencyKey,
    summary: `${input.completedAt ? "Complete" : "Update"} Linear cycle: ${input.cycleName ?? input.cycleId}`,
    writes: [
      {
        type: "update_cycle",
        target: input.cycleId,
        payload,
      },
    ],
  };
}

export async function applyUpdateCycle(plan: Plan, options: ApplyOptions = {}): Promise<Cycle> {
  assertExternalWriteAllowed(plan, options);
  if (plan.writes.length !== 1 || plan.writes[0].type !== "update_cycle") {
    throw new Error("Refusing update cycle apply for unsupported plan shape.");
  }
  const payload = plan.writes[0].payload as CycleUpdateInput;
  if (!payload.cycleId) {
    throw new Error("Refusing update cycle apply without cycleId.");
  }
  const input = Object.fromEntries(Object.entries({
    completedAt: payload.completedAt,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    name: payload.name,
    description: payload.description,
  }).filter(([, value]) => value !== undefined));
  const data = await linearGraphql<{
    cycleUpdate: {
      success: boolean;
      cycle: LinearCycleNode;
    };
  }>(`
    mutation UpdateCycle($cycleId: String!, $input: CycleUpdateInput!) {
      cycleUpdate(id: $cycleId, input: $input) {
        success
        cycle {
          id
          name
          number
          startsAt
          endsAt
          completedAt
        }
      }
    }
  `, {
    cycleId: payload.cycleId,
    input,
  });
  if (!data.cycleUpdate.success) {
    throw new Error("Linear cycleUpdate returned success=false.");
  }
  return normalizeCycle(data.cycleUpdate.cycle);
}

export async function planMissingLabels(labels: string[]): Promise<Plan> {
  const existingLabels = new Set((await listLabels()).map((label) => label.name));
  const missingLabels = labels.filter((label) => !existingLabels.has(label)).sort();
  return {
    idempotencyKey: `linear:create_labels:${missingLabels.join(",")}`,
    summary: `Create missing POKit labels: ${missingLabels.join(", ") || "none"}`,
    writes: missingLabels.map((label) => ({
      type: "create_label",
      target: "linear_workspace",
      payload: { name: label },
    })),
  };
}

export async function applyCreateLabel(plan: Plan, options: ApplyOptions = {}): Promise<LinearLabel[]> {
  assertExternalWriteAllowed(plan, options);
  if (!plan.writes.every((write) => write.type === "create_label")) {
    throw new Error("Refusing label create apply for unsupported plan shape.");
  }
  const teamId = await resolveTeamId();
  const labels: LinearLabel[] = [];
  for (const write of plan.writes) {
    const payload = write.payload as CreateLabelPayload;
    if (!payload.name) {
      throw new Error("Refusing label create apply without name.");
    }
    const data = await linearGraphql<{
      issueLabelCreate: {
        success: boolean;
        issueLabel: LinearLabel;
      };
    }>(`
      mutation CreateIssueLabel($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) {
          success
          issueLabel {
            id
            name
          }
        }
      }
    `, {
      input: {
        teamId,
        name: payload.name,
      },
    });
    if (!data.issueLabelCreate.success) {
      throw new Error("Linear issueLabelCreate returned success=false.");
    }
    labels.push(data.issueLabelCreate.issueLabel);
  }
  return labels;
}

export async function planAssignLabelToIssue(input: AssignLabelToIssuePayload): Promise<Plan> {
  return {
    idempotencyKey: `linear:assign_label:${input.issueIdentifier}:${input.labelName}`,
    summary: `Assign ${input.labelName} to ${input.issueIdentifier}`,
    writes: [
      {
        type: "update_issue",
        target: input.issueIdentifier,
        payload: input,
      },
    ],
  };
}

export async function applyAssignLabelToIssue(plan: Plan, options: ApplyOptions = {}): Promise<Issue> {
  assertExternalWriteAllowed(plan, options);
  if (plan.writes.length !== 1 || plan.writes[0].type !== "update_issue") {
    throw new Error("Refusing label assignment apply for unsupported plan shape.");
  }
  const payload = plan.writes[0].payload as AssignLabelToIssuePayload;
  if (!payload.issueId || !payload.labelId) {
    throw new Error("Refusing label assignment apply without issueId and labelId.");
  }
  const data = await linearGraphql<{
    issueUpdate: {
      success: boolean;
      issue: LinearIssueNode;
    };
  }>(`
    mutation UpdateIssue($issueId: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $issueId, input: $input) {
        success
        issue {
          id
          identifier
          title
          description
          url
          dueDate
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
    issueId: payload.issueId,
    input: {
      labelIds: [payload.labelId],
    },
  });
  if (!data.issueUpdate.success) {
    throw new Error("Linear issueUpdate returned success=false.");
  }
  return normalizeIssue(data.issueUpdate.issue);
}
