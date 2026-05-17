import { assertExternalWriteAllowed, type ExternalWriteApplyOptions } from "./external-write/guard.ts";
import { getActiveProfile, loadDotEnvOnce } from "./profile.ts";
import {
  type LinearBacklogDescriptionInput,
  renderLinearBacklogDescription,
} from "./backlog-outline.ts";
import { renderDryRunPlan } from "./dry-run-format.ts";
import { parseArgs } from "node:util";
import { readFile, writeFile, realpath, stat } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";

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
  /**
   * Pre-rendered markdown description (CLI 경유 시 사용).
   * description (구조)와 동시 지정 금지 — rawDescription 우선.
   */
  rawDescription?: string;
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
  /** POKIT-200: 라벨 누적(add) vs 덮어쓰기(replace). 기본 'add' = 기존 라벨 보존. */
  mode?: "add" | "replace";
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
  if (payload.description && payload.rawDescription) {
    throw new Error(
      "Refusing create issue apply: description (structured) and rawDescription cannot both be set.",
    );
  }
  const renderedBody = payload.rawDescription
    ?? (payload.description ? renderLinearBacklogDescription(payload.description) : "");
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

// ── General Issue Update ─────────────────────────────────────────────────────

export type IssueUpdateInput = {
  issueIdentifier: string; // e.g. POKIT-170
  descriptionAppend?: string; // Markdown section to append to existing description
  descriptionFull?: string; // Replace description entirely (POKIT-211 insert-at-top용)
  stateName?: string; // Target workflow state name e.g. "Cancelled"
  labels?: string[]; // Label names to set
};

/**
 * Compose a new description by appending a section to the existing one.
 * Pure helper — no network calls, easy to unit-test.
 */
export function composeAppendedDescription(existing: string, append: string): string {
  const base = existing.trimEnd();
  return base ? `${base}\n\n${append}` : append;
}

export async function planUpdateIssue(input: IssueUpdateInput): Promise<Plan> {
  const dateScope = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  // Derive a short scope hash from the change fields for idempotency uniqueness
  const scopeParts: string[] = [];
  if (input.descriptionAppend !== undefined) scopeParts.push("desc");
  if (input.stateName !== undefined) scopeParts.push(`state-${input.stateName}`);
  if (input.labels !== undefined) scopeParts.push(`labels-${input.labels.join("-")}`);
  const scopeHash = scopeParts.join("_") || "generic";

  return {
    idempotencyKey: `linear:update_issue:${input.issueIdentifier}:${dateScope}:${scopeHash}`,
    summary: `Update Linear issue ${input.issueIdentifier}`,
    writes: [
      {
        type: "update_issue",
        target: input.issueIdentifier,
        payload: input,
      },
    ],
  };
}

type LinearIssueQueryResult = {
  issueQuery: {
    nodes: Array<{
      id: string;
      identifier: string;
      title: string;
      description: string | null;
      state: { id: string; name: string };
    }>;
  };
};

export async function fetchIssueByIdentifier(
  _teamId: string,
  issueIdentifier: string,
): Promise<{ id: string; identifier: string; title: string; description: string; stateId: string; stateName: string }> {
  // Linear API는 issue(id: "POKIT-170")처럼 identifier를 id로 받음.
  const data = await linearGraphql<{
    issue: {
      id: string;
      identifier: string;
      title: string;
      description: string | null;
      state: { id: string; name: string };
    } | null;
  }>(`
    query GetIssueByIdentifier($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
        description
        state {
          id
          name
        }
      }
    }
  `, { id: issueIdentifier });
  if (!data.issue) {
    throw new Error(`Issue ${issueIdentifier} not found in Linear.`);
  }
  return {
    id: data.issue.id,
    identifier: data.issue.identifier,
    title: data.issue.title,
    description: data.issue.description ?? "",
    stateId: data.issue.state.id,
    stateName: data.issue.state.name,
  };
}

async function resolveWorkflowStateId(teamId: string, stateName: string): Promise<string> {
  const data = await linearGraphql<{
    workflowStates: { nodes: Array<{ id: string; name: string }> };
  }>(`
    query GetWorkflowStates($teamId: ID!) {
      workflowStates(filter: { team: { id: { eq: $teamId } } }) {
        nodes {
          id
          name
        }
      }
    }
  `, { teamId });
  const match = data.workflowStates.nodes.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase(),
  );
  if (!match) {
    const available = data.workflowStates.nodes.map((s) => s.name).join(", ");
    throw new Error(`Workflow state "${stateName}" not found. Available: ${available}`);
  }
  return match.id;
}

export async function applyUpdateIssue(plan: Plan, options: ApplyOptions = {}): Promise<Issue> {
  assertExternalWriteAllowed(plan, options);
  if (plan.writes.length !== 1 || plan.writes[0].type !== "update_issue") {
    throw new Error("Refusing update issue apply for unsupported plan shape.");
  }
  const payload = plan.writes[0].payload as IssueUpdateInput;
  if (!payload.issueIdentifier) {
    throw new Error("Refusing update issue apply without issueIdentifier.");
  }
  if (
    payload.descriptionAppend === undefined &&
    payload.descriptionFull === undefined &&
    payload.stateName === undefined &&
    payload.labels === undefined
  ) {
    throw new Error("Refusing update issue apply: no fields to update (descriptionAppend, descriptionFull, stateName, or labels required).");
  }
  if (payload.descriptionAppend !== undefined && payload.descriptionFull !== undefined) {
    throw new Error("Refusing update issue apply: descriptionAppend and descriptionFull cannot both be set.");
  }

  const teamId = await resolveTeamId();
  const existing = await fetchIssueByIdentifier(teamId, payload.issueIdentifier);

  const updateInput: Record<string, unknown> = {};

  if (payload.descriptionAppend !== undefined) {
    updateInput.description = composeAppendedDescription(existing.description, payload.descriptionAppend);
  }
  if (payload.descriptionFull !== undefined) {
    updateInput.description = payload.descriptionFull;
  }
  if (payload.stateName !== undefined) {
    updateInput.stateId = await resolveWorkflowStateId(teamId, payload.stateName);
  }
  // labels: not currently implemented — extend here when needed
  if (payload.labels !== undefined) {
    throw new Error("labels update not yet implemented in applyUpdateIssue. Use planAssignLabelToIssue instead.");
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
    issueId: existing.id,
    input: updateInput,
  });
  if (!data.issueUpdate.success) {
    throw new Error("Linear issueUpdate returned success=false.");
  }
  return normalizeIssue(data.issueUpdate.issue);
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

  // POKIT-200: 기본 'add' 모드 — 기존 라벨 보존 + 신규 union
  const mode = payload.mode ?? "add";
  let labelIds: string[];
  if (mode === "replace") {
    labelIds = [payload.labelId];
  } else {
    const existingIds = await fetchIssueLabelIds(payload.issueId);
    labelIds = existingIds.includes(payload.labelId)
      ? existingIds
      : [...existingIds, payload.labelId];
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
      labelIds,
    },
  });
  if (!data.issueUpdate.success) {
    throw new Error("Linear issueUpdate returned success=false.");
  }
  return normalizeIssue(data.issueUpdate.issue);
}

async function fetchIssueLabelIds(issueId: string): Promise<string[]> {
  const data = await linearGraphql<{
    issue: { labels: { nodes: Array<{ id: string }> } } | null;
  }>(
    `
      query IssueLabels($id: String!) {
        issue(id: $id) {
          labels {
            nodes {
              id
            }
          }
        }
      }
    `,
    { id: issueId },
  );
  return data.issue?.labels.nodes.map((n) => n.id) ?? [];
}

// ── CLI entry ──────────────────────────────────────────────────────────────────

const MAX_DESCRIPTION_FILE_BYTES = 512 * 1024;

async function readDescriptionFile(path: string): Promise<string> {
  const abs = resolvePath(path);
  let realPath: string;
  try {
    realPath = await realpath(abs);
  } catch {
    throw new Error(`파일이 없습니다: ${path}`);
  }
  const info = await stat(realPath);
  if (info.size > MAX_DESCRIPTION_FILE_BYTES) {
    throw new Error(
      `파일 크기 초과 (512 KB 한도): ${path} (${(info.size / 1024).toFixed(1)} KB)`,
    );
  }
  return await readFile(realPath, "utf8");
}

function printUsage(): void {
  console.error(`사용법: node --experimental-strip-types scripts/internal/linear.ts <subcommand> [옵션]

서브명령:
  update <ISSUE_ID>       이슈 상태·description 업데이트
  create                  새 이슈 생성 (raw, 4섹션 없음)
  assign-label <ISSUE_ID> 이슈에 라벨 할당

공통 옵션:
  --apply                 실제 Linear write 실행 (기본: dry-run)
  --actor <NAME>          --apply 시 필수. 작업 수행 에이전트 이름
  --format <json|pretty>  dry-run 출력 형식. json(기본) 또는 pretty(3섹션 형식)
  --help, -h              이 도움말 출력

subcommand별 옵션:
  update:
    --state <NAME>                       워크플로우 상태 이름 (예: Done)
    --description-append-file <PATH>     이슈 description에 append할 파일

  create:
    --title <T>                          이슈 제목 (필수)
    --labels <CSV>                       쉼표 구분 라벨명 (예: Improvement,Bug)
    --description-file <PATH>            description 파일 (raw markdown)

  assign-label:
    --label <NAME>                       할당할 라벨명 (필수)

dry-run(기본): plan을 JSON으로 stdout에 출력. --apply 없으면 Linear API 호출 없음.
--format pretty: JSON 대신 3섹션 dry-run plan 형식으로 출력.
`);
}

function validateActor(actor: string | undefined, isApply: boolean): string {
  if (!isApply) return "";
  if (!actor || actor.trim().length === 0) {
    const err = new Error("--actor 가 비어 있습니다. --apply 시 actor 필수입니다.");
    (err as any).exitCode = 2;
    throw err;
  }
  return actor.trim();
}

export type DecisionLogEntry = {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  decision: string;
  linear_refs: string[];
  actor: string;
};

/**
 * Pure helper — renders a DecisionLogEntry as YAML block (2-space indent, array item style).
 * No I/O. Testable in isolation.
 */
export function renderDecisionLogEntry(entry: DecisionLogEntry): string {
  function escapeYaml(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ").replace(/\r/g, "");
  }
  const refsLines = entry.linear_refs.map((ref) => `      - ${ref}`).join("\n");
  return [
    `  - id: ${entry.id}`,
    `    timestamp: "${entry.timestamp}"`,
    `    title: "${escapeYaml(entry.title)}"`,
    `    summary: "${escapeYaml(entry.summary)}"`,
    `    decision: "${escapeYaml(entry.decision)}"`,
    `    alternatives_rejected: []`,
    `    evidence: []`,
    `    linear_refs:`,
    refsLines,
    `    actor: "${escapeYaml(entry.actor)}"`,
  ].join("\n");
}

/**
 * Pure helper — inserts a new entry at the top of the decisions: array
 * and updates latest_decision_at. No I/O.
 *
 * Strategy (line-based, no full YAML parse):
 * 1. Find the `decisions:` line — everything between it and `latest_decision_at:` is the decisions array.
 * 2. Find the `latest_decision_at:` line — used as the section end marker.
 * 3. Prepend the new entry into the decisions block.
 * 4. Update latest_decision_at value.
 */
export function rewriteDecisionLogYaml(raw: string, newEntry: DecisionLogEntry): string {
  const lines = raw.split("\n");

  // Find decisions: and latest_decision_at: line indices
  let decisionsLineIdx = -1;
  let latestLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^decisions:\s*$/.test(lines[i])) {
      decisionsLineIdx = i;
    }
    if (/^latest_decision_at:/.test(lines[i])) {
      latestLineIdx = i;
      break; // first occurrence (there should be only one)
    }
  }

  if (decisionsLineIdx === -1 || latestLineIdx === -1) {
    throw new Error(
      "decision-log.yaml 구조 이상: decisions: 또는 latest_decision_at: 라인을 찾을 수 없음.",
    );
  }

  // Lines before decisions:
  const beforeDecisions = lines.slice(0, decisionsLineIdx + 1); // includes "decisions:"
  // Lines of the decisions array body (between decisions: and latest_decision_at:)
  const decisionBodyLines = lines.slice(decisionsLineIdx + 1, latestLineIdx);
  // Lines after latest_decision_at: (may include dangling entries from old appendFile bug)
  const afterLatest = lines.slice(latestLineIdx + 1);

  // Build new entry block
  const newEntryBlock = renderDecisionLogEntry(newEntry);
  // New latest_decision_at line
  const latestLine = `latest_decision_at: "${newEntry.timestamp}"`;

  // Strip any trailing blank lines from decisionBodyLines before re-joining
  const bodyTrimmed = decisionBodyLines.join("\n").trimEnd();

  // Assemble: header + new entry + blank line + existing body + blank line before latest + latest
  // (the blank line between entries is conventional but not strictly required)
  const newContent = [
    beforeDecisions.join("\n"),
    newEntryBlock,
    "",
    bodyTrimmed,
    latestLine,
  ].join("\n");

  // afterLatest is dropped — any dangling content after latest_decision_at is discarded.
  // (The data migration in Step 2 moves them into the array before this function runs.)

  // Ensure single trailing newline
  return newContent.trimEnd() + "\n";
}

export async function appendDecisionLog(
  entry: DecisionLogEntry,
  yamlPath?: string,
  mdPath?: string,
): Promise<void> {
  const baseDir = new URL(".", import.meta.url).pathname;
  const logPath = yamlPath ?? resolvePath(baseDir, "../../memory/decision-log.yaml");
  const markdownPath = mdPath ?? resolvePath(baseDir, "../../memory/decision-log.md");

  const raw = await readFile(logPath, "utf8");
  const updated = rewriteDecisionLogYaml(raw, entry);
  await writeFile(logPath, updated, "utf8");

  // POKIT-196: md 동시 갱신 (yaml + md 일관성)
  try {
    const mdRaw = await readFile(markdownPath, "utf8");
    const mdUpdated = appendDecisionLogMarkdown(mdRaw, entry);
    await writeFile(markdownPath, mdUpdated, "utf8");
  } catch (err) {
    // md 부재 시 무시 (yaml은 이미 기록됨, md는 호환성 채널)
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

/**
 * decision-log.md 본문 끝에 새 entry section을 append.
 * yaml entry 와 1:1 매핑되도록 ID·timestamp·refs를 포함한다.
 */
export function appendDecisionLogMarkdown(raw: string, entry: DecisionLogEntry): string {
  const refs = entry.linear_refs.length > 0
    ? entry.linear_refs.map((r) => `\`${r}\``).join(", ")
    : "(none)";
  const section = [
    "",
    `## ${entry.timestamp} — ${entry.title}`,
    "",
    `- **id**: \`${entry.id}\``,
    `- **actor**: ${entry.actor}`,
    `- **refs**: ${refs}`,
    "",
    `**요약**: ${entry.summary}`,
    "",
    `**결정**: ${entry.decision}`,
    "",
  ].join("\n");
  return raw.trimEnd() + "\n" + section;
}

async function cmdUpdate(args: string[]): Promise<void> {
  const issueId = args[0];
  if (!issueId || issueId.startsWith("--")) {
    const err = new Error("ISSUE_ID 가 필요합니다. 예: update POKIT-187 --state Done");
    (err as any).exitCode = 2;
    throw err;
  }

  const { values } = parseArgs({
    args: args.slice(1),
    options: {
      state: { type: "string" },
      "description-append-file": { type: "string" },
      apply: { type: "boolean", default: false },
      actor: { type: "string" },
      format: { type: "string", default: "json" },
    },
    strict: false,
  });

  const isApply = !!values["apply"];
  const actorName = validateActor(values["actor"] as string | undefined, isApply);
  const outputFormat = values["format"] as string;

  const input: IssueUpdateInput = { issueIdentifier: issueId };
  if (values["state"]) {
    input.stateName = values["state"] as string;
  }
  if (values["description-append-file"]) {
    input.descriptionAppend = await readDescriptionFile(
      values["description-append-file"] as string,
    );
  }

  const plan = await planUpdateIssue(input);

  if (!isApply) {
    if (outputFormat === "pretty") {
      const hasDescAppend = !!input.descriptionAppend;
      const bodyLines: string[] = [];
      if (input.stateName) bodyLines.push(`- 상태 변경: → ${input.stateName}`);
      if (hasDescAppend) bodyLines.push(`- description append: ${input.descriptionAppend!.split("\n").length}줄`);
      const body = bodyLines.length > 0 ? bodyLines.join("\n") : "(변경 항목 없음)";
      const rollback = hasDescAppend ? "manual" as const : "auto" as const;
      const rollbackGuide = hasDescAppend ? "Linear UI 수동 편집" : undefined;
      console.log(renderDryRunPlan(
        { kind: "update-issue", identifier: issueId },
        { body },
        {
          idempotencyKey: plan.idempotencyKey,
          expectedImpact: "Linear API 1건 (issue update)",
          rollback,
          rollbackGuide,
        },
      ));
    } else {
      console.log(JSON.stringify({ "dry-run": true, plan }, null, 2));
    }
    return;
  }

  // apply 분기
  if (process.env["POKIT_TEST_MOCK"] === "1") {
    console.log(
      JSON.stringify({
        mock: true,
        action: "apply",
        actor: actorName,
        plan,
      }),
    );
    return;
  }

  const result = await applyUpdateIssue(plan, { approved: true, actor: actorName });

  const now = new Date().toISOString();
  try {
    await appendDecisionLog({
      id: `dec-${now.slice(0, 10).replace(/-/g, "")}-cli-update-${issueId.toLowerCase()}`,
      timestamp: now,
      title: `CLI update ${issueId}`,
      summary: `CLI apply: update ${issueId} ${input.stateName ? `state→${input.stateName}` : ""} ${input.descriptionAppend ? "description append" : ""}`.trim(),
      decision: `applyUpdateIssue 성공. actor: ${actorName}`,
      linear_refs: [issueId],
      actor: actorName,
    });
  } catch (logErr) {
    console.error(`⚠️ decision-log append 실패: ${(logErr as Error).message}`);
    const exitErr = new Error("decision-log append 실패");
    (exitErr as any).exitCode = 4;
    throw exitErr;
  }

  console.log(JSON.stringify({ success: true, issue: result }));
}

async function cmdCreate(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      title: { type: "string" },
      labels: { type: "string" },
      "description-file": { type: "string" },
      apply: { type: "boolean", default: false },
      actor: { type: "string" },
      format: { type: "string", default: "json" },
    },
    strict: false,
  });

  if (!values["description-file"]) {
    const err = new Error(
      "--description-file 이 필요합니다. 예: create --title '...' --labels Improvement --description-file /tmp/desc.md",
    );
    (err as any).exitCode = 2;
    throw err;
  }

  const rawDescription = await readDescriptionFile(values["description-file"] as string);
  const title = (values["title"] as string | undefined) ?? "(제목 없음)";
  const labelsList = values["labels"]
    ? (values["labels"] as string).split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  const isApply = !!values["apply"];
  const actorName = validateActor(values["actor"] as string | undefined, isApply);
  const outputFormat = values["format"] as string;

  // planCreateIssue 경유 — rawDescription은 IssueInput의 선택 필드
  const plan = await planCreateIssue({
    title,
    labels: labelsList,
    rawDescription,
  });

  if (!isApply) {
    console.warn(
      "CLI create는 raw 이슈만 생성합니다. 4섹션 description은 update --description-append-file로 추가하세요.",
    );
    if (outputFormat === "pretty") {
      const bodyLines = [
        `- 제목: ${title}`,
        labelsList.length > 0 ? `- 라벨: ${labelsList.join(", ")}` : null,
        `- description: ${rawDescription.split("\n").length}줄`,
      ].filter(Boolean) as string[];
      console.log(renderDryRunPlan(
        { kind: "create-issue", identifier: "backlog" },
        { body: bodyLines.join("\n") },
        {
          idempotencyKey: plan.idempotencyKey,
          expectedImpact: "Linear API 1건 (issue create)",
          rollback: "manual",
          rollbackGuide: "Linear UI 수동 삭제",
        },
      ));
    } else {
      console.log(JSON.stringify({ "dry-run": true, plan }, null, 2));
    }
    return;
  }

  // apply 분기
  if (process.env["POKIT_TEST_MOCK"] === "1") {
    console.log(
      JSON.stringify({
        mock: true,
        action: "apply",
        actor: actorName,
        plan,
      }),
    );
    return;
  }

  const issue = await applyCreateIssue(plan, { approved: true, actor: actorName });
  if (outputFormat === "pretty") {
    console.log(`Linear 이슈 생성: ${issue.identifier} ${issue.title}`);
    console.log(`URL: ${issue.url ?? "(none)"}`);
  } else {
    console.log(JSON.stringify({ success: true, issue }));
  }
}

async function cmdAssignLabel(args: string[]): Promise<void> {
  const issueId = args[0];
  if (!issueId || issueId.startsWith("--")) {
    const err = new Error(
      "ISSUE_ID 가 필요합니다. 예: assign-label POKIT-187 --label Improvement",
    );
    (err as any).exitCode = 2;
    throw err;
  }

  const { values } = parseArgs({
    args: args.slice(1),
    options: {
      label: { type: "string" },
      mode: { type: "string", default: "add" },
      apply: { type: "boolean", default: false },
      actor: { type: "string" },
      format: { type: "string", default: "json" },
    },
    strict: false,
  });

  if (!values["label"]) {
    const err = new Error("--label 이 필요합니다. 예: assign-label POKIT-187 --label Improvement");
    (err as any).exitCode = 2;
    throw err;
  }

  const labelName = values["label"] as string;
  const modeRaw = (values["mode"] as string) ?? "add";
  if (modeRaw !== "add" && modeRaw !== "replace") {
    const err = new Error("--mode 는 add 또는 replace 만 허용됩니다.");
    (err as any).exitCode = 2;
    throw err;
  }
  const mode = modeRaw as "add" | "replace";
  const isApply = !!values["apply"];
  const actorName = validateActor(values["actor"] as string | undefined, isApply);
  const outputFormat = values["format"] as string;

  // dry-run: labelId 없이 plan 구성 (listLabels는 API 호출이므로 dry-run에서 생략)
  const plan: Plan = {
    idempotencyKey: `linear:assign_label:${issueId}:${labelName}:${mode}`,
    summary: `Assign ${labelName} to ${issueId} (mode=${mode})`,
    writes: [
      {
        type: "update_issue",
        target: issueId,
        payload: { issueIdentifier: issueId, labelName, mode },
      },
    ],
  };

  if (!isApply) {
    if (outputFormat === "pretty") {
      console.log(renderDryRunPlan(
        { kind: "update-issue", identifier: issueId },
        { body: `- 라벨 할당: ${labelName} (mode=${mode})` },
        {
          idempotencyKey: plan.idempotencyKey,
          expectedImpact: mode === "replace"
            ? "Linear API 1건 (label replace — 기존 라벨 덮어쓰기)"
            : "Linear API 1건 (label add — 기존 라벨 보존)",
          rollback: "auto",
        },
      ));
    } else {
      console.log(JSON.stringify({ "dry-run": true, plan }, null, 2));
    }
    return;
  }

  // apply 분기: labelName → labelId resolve
  if (process.env["POKIT_TEST_MOCK"] === "1") {
    console.log(
      JSON.stringify({
        mock: true,
        action: "apply",
        actor: actorName,
        plan,
      }),
    );
    return;
  }

  const labels = await listLabels();
  const found = labels.find(
    (l) => l.name.toLowerCase() === labelName.toLowerCase(),
  );
  if (!found) {
    const available = labels.map((l) => l.name).join(", ");
    const err = new Error(
      `라벨을 찾을 수 없습니다: "${labelName}". 사용 가능: ${available}`,
    );
    (err as any).exitCode = 3;
    throw err;
  }

  // POKIT-200: 기존 버그 동반 수정 — issueId는 issue identifier(POKIT-XXX),
  //            labelId는 label UUID. 이전 코드는 둘 다 found.id (label UUID) 였음.
  const applyPlan = await planAssignLabelToIssue({
    issueId: issueId,
    issueIdentifier: issueId,
    labelId: found.id,
    labelName: found.name,
    mode,
  });

  const result = await applyAssignLabelToIssue(applyPlan, {
    approved: true,
    actor: actorName,
  });

  const now = new Date().toISOString();
  try {
    await appendDecisionLog({
      id: `dec-${now.slice(0, 10).replace(/-/g, "")}-cli-assign-label-${issueId.toLowerCase()}`,
      timestamp: now,
      title: `CLI assign-label ${issueId} ${labelName}`,
      summary: `CLI apply: assign label "${labelName}" to ${issueId}. actor: ${actorName}`,
      decision: `applyAssignLabelToIssue 성공`,
      linear_refs: [issueId],
      actor: actorName,
    });
  } catch (logErr) {
    console.error(`⚠️ decision-log append 실패: ${(logErr as Error).message}`);
    const exitErr = new Error("decision-log append 실패");
    (exitErr as any).exitCode = 4;
    throw exitErr;
  }

  console.log(JSON.stringify({ success: true, issue: result }));
}

async function cliMain(): Promise<void> {
  const argv = process.argv.slice(2);
  const sub = argv[0];

  if (!sub || sub === "--help" || sub === "-h") {
    printUsage();
    process.exit(2);
  }

  try {
    switch (sub) {
      case "create":
        await cmdCreate(argv.slice(1));
        break;
      case "update":
        await cmdUpdate(argv.slice(1));
        break;
      case "assign-label":
        await cmdAssignLabel(argv.slice(1));
        break;
      default:
        console.error(
          `알 수 없는 서브명령: ${sub}. 사용 가능: create, update, assign-label`,
        );
        process.exit(2);
    }
  } catch (err) {
    console.error(`❌ ${(err as Error).message}`);
    process.exit((err as any).exitCode ?? 3);
  }
}

// ESM 진입점 체크
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cliMain().catch((err) => {
    console.error(err);
    process.exit(3);
  });
}
