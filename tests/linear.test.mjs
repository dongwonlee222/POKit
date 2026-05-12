import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalCwd = process.cwd();

async function loadLinearModule() {
  return import(`../scripts/linear.ts?cacheBust=${Date.now()}`);
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

  assert.equal(authorizationHeader, "Bearer lin_api_from_file");
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
