import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalCwd = process.cwd();
let moduleLoadCount = 0;

async function loadLinearModule() {
  moduleLoadCount += 1;
  return import(`../scripts/linear.ts?cacheBust=${moduleLoadCount}`);
}

function resetProcessEnv() {
  process.env = { ...originalEnv };
}

test.afterEach(() => {
  resetProcessEnv();
  globalThis.fetch = originalFetch;
  process.chdir(originalCwd);
});

test("getCurrentCycle fails clearly when Linear env is missing", async () => {
  delete process.env.LINEAR_API_KEY;
  delete process.env.LINEAR_TEAM_ID;
  const tempDir = join(tmpdir(), `pokit-linear-empty-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  process.chdir(tempDir);
  const { getCurrentCycle } = await loadLinearModule();

  await assert.rejects(
    () => getCurrentCycle(),
    /Missing LINEAR_API_KEY/
  );
});

test("getCurrentCycle reads the active Linear cycle without mutating", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        team: {
          cycles: {
            nodes: [
              {
                id: "cycle-123",
                name: "Cycle 20",
                number: 20,
                startsAt: "2026-05-11",
                endsAt: "2026-05-17",
              },
            ],
          },
        },
      },
    }), { status: 200 });
  };
  const { getCurrentCycle } = await loadLinearModule();

  const cycle = await getCurrentCycle();

  assert.equal(requestBody.variables.teamId, "team-123");
  assert.match(requestBody.query, /query CurrentCycle/);
  assert.doesNotMatch(requestBody.query, /mutation/);
  assert.deepEqual(cycle, {
    id: "cycle-123",
    name: "Cycle 20",
    number: 20,
    startsAt: "2026-05-11",
    endsAt: "2026-05-17",
  });
});

test("getCurrentCycle auto-selects the only available Linear team", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  delete process.env.LINEAR_TEAM_ID;
  delete process.env.LINEAR_TEAM_KEY;
  const tempDir = join(tmpdir(), `pokit-linear-auto-team-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  process.chdir(tempDir);
  const requestBodies = [];
  globalThis.fetch = async (_url, init) => {
    const requestBody = JSON.parse(init.body);
    requestBodies.push(requestBody);
    if (requestBody.query.includes("query Teams")) {
      return new Response(JSON.stringify({
        data: {
          teams: {
            nodes: [{ id: "team-only", key: "ONE", name: "Only Team" }],
          },
        },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      data: {
        team: {
          cycles: {
            nodes: [{ id: "cycle-only", name: "Only Cycle" }],
          },
        },
      },
    }), { status: 200 });
  };
  const { getCurrentCycle } = await loadLinearModule();

  const cycle = await getCurrentCycle();

  assert.equal(requestBodies[1].variables.teamId, "team-only");
  assert.equal(cycle.id, "cycle-only");
});

test("getCurrentCycle resolves LINEAR_TEAM_KEY when team id is omitted", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_KEY = "EVM";
  delete process.env.LINEAR_TEAM_ID;
  const tempDir = join(tmpdir(), `pokit-linear-team-key-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  process.chdir(tempDir);
  const requestBodies = [];
  globalThis.fetch = async (_url, init) => {
    const requestBody = JSON.parse(init.body);
    requestBodies.push(requestBody);
    if (requestBody.query.includes("query Teams")) {
      return new Response(JSON.stringify({
        data: {
          teams: {
            nodes: [
              { id: "team-pok", key: "POK", name: "POKit" },
              { id: "team-evm", key: "EVM", name: "Evmodu" },
            ],
          },
        },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      data: {
        team: {
          cycles: {
            nodes: [{ id: "cycle-evm", name: "Cycle EVM" }],
          },
        },
      },
    }), { status: 200 });
  };
  const { getCurrentCycle } = await loadLinearModule();

  const cycle = await getCurrentCycle();

  assert.equal(requestBodies[1].variables.teamId, "team-evm");
  assert.equal(cycle.id, "cycle-evm");
});

test("getCurrentCycle explains team selection when multiple teams exist", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  delete process.env.LINEAR_TEAM_ID;
  delete process.env.LINEAR_TEAM_KEY;
  const tempDir = join(tmpdir(), `pokit-linear-many-teams-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  process.chdir(tempDir);
  globalThis.fetch = async () => new Response(JSON.stringify({
    data: {
      teams: {
        nodes: [
          { id: "team-1", key: "ONE", name: "One" },
          { id: "team-2", key: "TWO", name: "Two" },
        ],
      },
    },
  }), { status: 200 });
  const { getCurrentCycle } = await loadLinearModule();

  await assert.rejects(
    () => getCurrentCycle(),
    /Set LINEAR_TEAM_ID or LINEAR_TEAM_KEY.*One \(ONE, team-1\).*Two \(TWO, team-2\)/
  );
});

test("getCurrentCycle can read Linear env values from local .env", async () => {
  delete process.env.LINEAR_API_KEY;
  delete process.env.LINEAR_TEAM_ID;
  const tempDir = join(tmpdir(), `pokit-linear-test-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  await writeFile(join(tempDir, ".env"), "LINEAR_API_KEY=lin_api_from_file\nLINEAR_TEAM_ID=team-from-file\n");
  process.chdir(tempDir);
  let authorizationHeader;
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    authorizationHeader = init.headers.Authorization;
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        team: {
          cycles: {
            nodes: [
              {
                id: "cycle-from-file",
                name: "Cycle From File",
              },
            ],
          },
        },
      },
    }), { status: 200 });
  };
  const { getCurrentCycle } = await loadLinearModule();

  const cycle = await getCurrentCycle();

  assert.equal(authorizationHeader, "lin_api_from_file");
  assert.equal(requestBody.variables.teamId, "team-from-file");
  assert.equal(cycle.id, "cycle-from-file");
});

test("listTeams reads accessible Linear teams without requiring LINEAR_TEAM_ID", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  delete process.env.LINEAR_TEAM_ID;
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        teams: {
          nodes: [
            {
              id: "team-123",
              key: "POK",
              name: "POKit",
            },
            {
              id: "team-456",
              key: "PROD",
              name: "Product",
            },
          ],
        },
      },
    }), { status: 200 });
  };
  const { listTeams } = await loadLinearModule();

  const teams = await listTeams();

  assert.equal(requestBody.variables.first, 100);
  assert.match(requestBody.query, /query Teams/);
  assert.doesNotMatch(requestBody.query, /mutation/);
  assert.deepEqual(teams, [
    { id: "team-123", key: "POK", name: "POKit" },
    { id: "team-456", key: "PROD", name: "Product" },
  ]);
});

test("getWorkingContext returns active, upcoming, and backlog surfaces from one read", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  let fetchCalls = 0;
  globalThis.fetch = async (_url, init) => {
    fetchCalls += 1;
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        team: {
          activeCycles: {
            nodes: [
              {
                id: "cycle-active",
                name: "Active Cycle",
                number: 3,
                startsAt: "2026-05-11",
                endsAt: "2026-05-18",
              },
            ],
          },
          upcomingCycles: {
            nodes: [
              {
                id: "cycle-upcoming",
                name: "Upcoming Cycle",
                number: 4,
                startsAt: "2026-05-19",
                endsAt: "2026-05-25",
              },
            ],
          },
          issues: {
            nodes: [
              {
                id: "issue-active",
                identifier: "EVM-41",
                title: "Active issue",
                description: "Current work",
                url: "https://linear.app/example/issue/EVM-41",
                labels: { nodes: [{ name: "pokit:prd" }] },
                state: { name: "In Progress" },
                assignee: { name: "Dongwon" },
                cycle: { id: "cycle-active" },
              },
              {
                id: "issue-upcoming",
                identifier: "EVM-42",
                title: "Upcoming issue",
                description: "Next work",
                url: "https://linear.app/example/issue/EVM-42",
                labels: { nodes: [{ name: "pokit:criteria" }] },
                state: { name: "Todo" },
                assignee: null,
                cycle: { id: "cycle-upcoming" },
              },
              {
                id: "issue-backlog",
                identifier: "EVM-43",
                title: "Backlog issue",
                description: "Future work",
                url: "https://linear.app/example/issue/EVM-43",
                labels: { nodes: [] },
                state: { name: "Backlog" },
                assignee: null,
                cycle: null,
              },
            ],
          },
        },
      },
    }), { status: 200 });
  };
  const { getWorkingContext } = await loadLinearModule();

  const context = await getWorkingContext();

  assert.equal(fetchCalls, 1);
  assert.match(requestBody.query, /query WorkingContext/);
  assert.equal(context.activeCycle?.source, "linear_active");
  assert.equal(context.activeCycle?.cycle.id, "cycle-active");
  assert.deepEqual(context.activeCycle?.issues.map((issue) => issue.identifier), ["EVM-41"]);
  assert.equal(context.upcomingCycle?.source, "linear_upcoming");
  assert.equal(context.upcomingCycle?.cycle.id, "cycle-upcoming");
  assert.deepEqual(context.upcomingCycle?.issues.map((issue) => issue.identifier), ["EVM-42"]);
  assert.deepEqual(context.backlogIssues.map((issue) => issue.identifier), ["EVM-43"]);
  assert.equal(context.selected.source, "linear_active");
  assert.equal(context.selected.cycle.id, "cycle-active");
  assert.deepEqual(context.selected.issues.map((issue) => issue.identifier), ["EVM-41"]);
  assert.match(context.fetchedAt, /^20\d\d-\d\d-\d\dT/);
});

test("getWorkingCycleContext uses active cycle issues when an active cycle exists", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        team: {
          activeCycles: {
            nodes: [
              {
                id: "cycle-active",
                name: "Active Cycle",
                number: 3,
                startsAt: "2026-05-11",
                endsAt: "2026-05-18",
              },
            ],
          },
          upcomingCycles: { nodes: [] },
          issues: {
            nodes: [
              {
                id: "issue-active",
                identifier: "EVM-5",
                title: "Active cycle issue",
                labels: { nodes: [{ name: "pokit:prd" }] },
                state: { name: "Todo" },
                assignee: null,
                cycle: { id: "cycle-active" },
              },
            ],
          },
        },
      },
    }), { status: 200 });
  };
  const { getWorkingCycleContext } = await loadLinearModule();

  const context = await getWorkingCycleContext();

  assert.equal(context.source, "linear_active");
  assert.equal(context.cycle.id, "cycle-active");
  assert.equal(context.issues[0].identifier, "EVM-5");
  assert.match(requestBody.query, /query WorkingContext/);
});

test("getWorkingCycleContext falls back to upcoming cycle when active cycle is missing", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        team: {
          activeCycles: { nodes: [] },
          upcomingCycles: {
            nodes: [
              {
                id: "cycle-upcoming",
                name: null,
                number: 1,
                startsAt: "2026-05-18",
                endsAt: "2026-05-25",
              },
            ],
          },
          issues: {
            nodes: [],
          },
        },
      },
    }), { status: 200 });
  };
  const { getWorkingCycleContext } = await loadLinearModule();

  const context = await getWorkingCycleContext();

  assert.equal(context.source, "linear_upcoming");
  assert.equal(context.cycle.id, "cycle-upcoming");
  assert.equal(context.issues.length, 0);
  assert.match(requestBody.query, /query WorkingContext/);
});

test("getWorkingCycleContext falls back to team backlog when no cycles exist", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  globalThis.fetch = async () => new Response(JSON.stringify({
    data: {
      team: {
        activeCycles: { nodes: [] },
        upcomingCycles: { nodes: [] },
        issues: {
          nodes: [
            {
              id: "issue-backlog",
              identifier: "EVM-1",
              title: "Backlog issue",
              labels: { nodes: [] },
              state: { name: "Todo" },
              assignee: null,
              cycle: null,
            },
          ],
        },
      },
    },
  }), { status: 200 });
  const { getWorkingCycleContext } = await loadLinearModule();

  const context = await getWorkingCycleContext();

  assert.equal(context.source, "team_backlog");
  assert.equal(context.cycle.id, "team-backlog");
  assert.equal(context.issues[0].identifier, "EVM-1");
});

test("getWorkingContext caches repeat reads for 30 seconds and refreshes explicitly", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({
      data: {
        team: {
          activeCycles: {
            nodes: [
              {
                id: "cycle-active",
                name: "Active Cycle",
              },
            ],
          },
          upcomingCycles: { nodes: [] },
          issues: {
            nodes: [
              {
                id: "issue-active",
                identifier: "EVM-50",
                title: "Cached issue",
                labels: { nodes: [] },
                state: { name: "Todo" },
                assignee: null,
                cycle: { id: "cycle-active" },
              },
            ],
          },
        },
      },
    }), { status: 200 });
  };
  const { getWorkingContext } = await loadLinearModule();

  const first = await getWorkingContext();
  const second = await getWorkingContext();
  const refreshed = await getWorkingContext({ refresh: true });

  assert.equal(fetchCalls, 2);
  assert.equal(first, second);
  assert.notEqual(first, refreshed);
});

test("invalidateWorkingContextCache clears the session cache explicitly", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({
      data: {
        team: {
          activeCycles: { nodes: [] },
          upcomingCycles: { nodes: [] },
          issues: {
            nodes: [],
          },
        },
      },
    }), { status: 200 });
  };
  const { getWorkingContext, invalidateWorkingContextCache } = await loadLinearModule();

  await getWorkingContext();
  invalidateWorkingContextCache();
  await getWorkingContext();

  assert.equal(fetchCalls, 2);
});

test("listIssues reads cycle issues and normalizes labels", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        team: {
          issues: {
            nodes: [
              {
                id: "issue-123",
                identifier: "POKIT-18",
                title: "결제 실패 사유 안내",
                description: "고객이 다음 행동을 알 수 있게 한다.",
                url: "https://linear.app/example/issue/POKIT-18",
                labels: {
                  nodes: [
                    { name: "pokit:prd" },
                    { name: "customer" },
                  ],
                },
                state: { name: "Todo" },
                assignee: { name: "Minji" },
              },
            ],
          },
        },
      },
    }), { status: 200 });
  };
  const { listIssues } = await loadLinearModule();

  const issues = await listIssues("cycle-123");

  assert.equal(requestBody.variables.teamId, "team-123");
  assert.equal(requestBody.variables.cycleId, "cycle-123");
  assert.match(requestBody.query, /query CycleIssues/);
  assert.doesNotMatch(requestBody.query, /mutation/);
  assert.deepEqual(issues, [
    {
      id: "issue-123",
      identifier: "POKIT-18",
      title: "결제 실패 사유 안내",
      description: "고객이 다음 행동을 알 수 있게 한다.",
      url: "https://linear.app/example/issue/POKIT-18",
      labels: ["pokit:prd", "customer"],
      state: "Todo",
      assignee: "Minji",
    },
  ]);
});

test("applyCreateIssue refuses to write without explicit approval", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  const { applyCreateIssue, planCreateIssue } = await loadLinearModule();
  const plan = await planCreateIssue({ title: "Seed issue" });

  await assert.rejects(
    () => applyCreateIssue(plan),
    /explicit approval/
  );
});

test("applyCreateIssue creates an issue only with approval and idempotency key", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        issueCreate: {
          success: true,
          issue: {
            id: "issue-created",
            identifier: "EVM-20",
            title: "Seed issue",
            description: "Seed description",
            url: "https://linear.app/example/issue/EVM-20",
            labels: { nodes: [{ name: "pokit:criteria" }] },
            state: { name: "Todo" },
            assignee: null,
          },
        },
      },
    }), { status: 200 });
  };
  const { applyCreateIssue, planCreateIssue } = await loadLinearModule();
  const plan = await planCreateIssue({
    title: "Seed issue",
    description: "Seed description",
    labels: ["pokit:criteria"],
  });

  const issue = await applyCreateIssue(plan, { approved: true });

  assert.match(requestBody.query, /mutation CreateIssue/);
  assert.doesNotMatch(requestBody.query, /query /);
  assert.equal(requestBody.variables.input.teamId, "team-123");
  assert.equal(requestBody.variables.input.title, "Seed issue");
  assert.match(requestBody.variables.input.description, /Seed description/);
  assert.match(requestBody.variables.input.description, /POKit labels requested: pokit:criteria/);
  assert.match(requestBody.variables.input.description, /POKit idempotency key: linear:create_issue:Seed issue/);
  assert.deepEqual(requestBody.variables.input.labelIds, []);
  assert.equal(requestBody.variables.idempotencyKey, undefined);
  assert.equal(issue.identifier, "EVM-20");
});

test("applyAssignIssueToCycle refuses without explicit approval", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  const { applyAssignIssueToCycle, planAssignIssueToCycle } = await loadLinearModule();
  const plan = await planAssignIssueToCycle({
    issueId: "issue-123",
    issueIdentifier: "EVM-5",
    cycleId: "cycle-123",
  });

  await assert.rejects(
    () => applyAssignIssueToCycle(plan),
    /explicit approval/
  );
});

test("applyAssignIssueToCycle updates cycle only with approval and idempotency key", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        issueUpdate: {
          success: true,
          issue: {
            id: "issue-123",
            identifier: "EVM-5",
            title: "Seed issue",
            description: "Seed description",
            url: "https://linear.app/example/issue/EVM-5",
            labels: { nodes: [] },
            state: { name: "Todo" },
            assignee: null,
          },
        },
      },
    }), { status: 200 });
  };
  const { applyAssignIssueToCycle, planAssignIssueToCycle } = await loadLinearModule();
  const plan = await planAssignIssueToCycle({
    issueId: "issue-123",
    issueIdentifier: "EVM-5",
    cycleId: "cycle-123",
  });

  const issue = await applyAssignIssueToCycle(plan, { approved: true });

  assert.equal(plan.idempotencyKey, "linear:assign_cycle:EVM-5:cycle-123");
  assert.match(requestBody.query, /mutation UpdateIssue/);
  assert.equal(requestBody.variables.issueId, "issue-123");
  assert.equal(requestBody.variables.input.cycleId, "cycle-123");
  assert.equal(issue.identifier, "EVM-5");
});

test("planMissingLabels creates dry-run plan for labels not present in Linear", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  globalThis.fetch = async () => new Response(JSON.stringify({
    data: {
      team: {
        labels: {
          nodes: [
            { id: "label-prd", name: "pokit:prd" },
          ],
        },
      },
    },
  }), { status: 200 });
  const { planMissingLabels } = await loadLinearModule();

  const plan = await planMissingLabels(["pokit:prd", "pokit:criteria"]);

  assert.equal(plan.idempotencyKey, "linear:create_labels:pokit:criteria");
  assert.equal(plan.writes.length, 1);
  assert.deepEqual(plan.writes[0].payload, { name: "pokit:criteria" });
});

test("applyCreateLabel refuses without explicit approval", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  const { applyCreateLabel } = await loadLinearModule();
  const plan = {
    idempotencyKey: "linear:create_labels:pokit:criteria",
    summary: "Create missing POKit labels: pokit:criteria",
    writes: [
      {
        type: "create_label",
        target: "linear_workspace",
        payload: { name: "pokit:criteria" },
      },
    ],
  };

  await assert.rejects(
    () => applyCreateLabel(plan),
    /explicit approval/
  );
});

test("applyCreateLabel creates missing label with approval", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    if (requestBody.query.includes("query TeamLabels")) {
      return new Response(JSON.stringify({
        data: { team: { labels: { nodes: [] } } },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      data: {
        issueLabelCreate: {
          success: true,
          issueLabel: { id: "label-criteria", name: "pokit:criteria" },
        },
      },
    }), { status: 200 });
  };
  const { applyCreateLabel, planMissingLabels } = await loadLinearModule();
  const plan = await planMissingLabels(["pokit:criteria"]);

  const labels = await applyCreateLabel(plan, { approved: true });

  assert.match(requestBody.query, /mutation CreateIssueLabel/);
  assert.equal(requestBody.variables.input.teamId, "team-123");
  assert.equal(requestBody.variables.input.name, "pokit:criteria");
  assert.deepEqual(labels, [{ id: "label-criteria", name: "pokit:criteria" }]);
});

test("applyAssignLabelToIssue adds label id to issue with approval", async () => {
  process.env.LINEAR_API_KEY = "lin_api_test";
  process.env.LINEAR_TEAM_ID = "team-123";
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      data: {
        issueUpdate: {
          success: true,
          issue: {
            id: "issue-123",
            identifier: "EVM-5",
            title: "Seed issue",
            labels: { nodes: [{ name: "pokit:criteria" }] },
            state: { name: "Todo" },
            assignee: null,
          },
        },
      },
    }), { status: 200 });
  };
  const { applyAssignLabelToIssue, planAssignLabelToIssue } = await loadLinearModule();
  const plan = await planAssignLabelToIssue({
    issueId: "issue-123",
    issueIdentifier: "EVM-5",
    labelId: "label-criteria",
    labelName: "pokit:criteria",
  });

  const issue = await applyAssignLabelToIssue(plan, { approved: true });

  assert.equal(plan.idempotencyKey, "linear:assign_label:EVM-5:pokit:criteria");
  assert.match(requestBody.query, /mutation UpdateIssue/);
  assert.deepEqual(requestBody.variables.input.labelIds, ["label-criteria"]);
  assert.deepEqual(issue.labels, ["pokit:criteria"]);
});
