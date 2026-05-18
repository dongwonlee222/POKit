/**
 * hook-linear-bypass.test.mjs
 * POKIT-187 — WF10 Linear write hook 우회 차단 TDD Red 단계
 *
 * Red 단계 목표:
 *   - curl: 이미 차단 → PASS
 *   - urllib·fetch·axios·gh·wget·httpx: 현재 hook 미지원 → FAIL (정상)
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_PATH = resolve(__dirname, "../../scripts/hooks/block-linear-api.sh");

function runHook(command) {
  const result = spawnSync(HOOK_PATH, [], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }),
    encoding: "utf8",
  });
  return { exitCode: result.status, stderr: result.stderr };
}

// ── 차단 케이스 (7개) ────────────────────────────────────────────────────────

test("차단: curl https://api.linear.app/graphql", () => {
  const { exitCode } = runHook(
    "curl https://api.linear.app/graphql -d '{}'"
  );
  assert.equal(exitCode, 2, "curl은 exit 2로 차단되어야 함");
});

test("차단: python3 urllib api.linear.app", () => {
  const { exitCode } = runHook(
    "python3 -c \"import urllib.request; urllib.request.urlopen('https://api.linear.app/graphql', data=b'{}')\"",
  );
  assert.equal(exitCode, 2, "python3 urllib은 exit 2로 차단되어야 함");
});

test("차단: node fetch api.linear.app", () => {
  const { exitCode } = runHook(
    "node -e \"fetch('https://api.linear.app/graphql', { method: 'POST', body: '{}' })\"",
  );
  assert.equal(exitCode, 2, "node fetch은 exit 2로 차단되어야 함");
});

test("차단: node axios api.linear.app", () => {
  const { exitCode } = runHook(
    "node -e \"const axios = require('axios'); axios.post('https://api.linear.app/graphql', {})\"",
  );
  assert.equal(exitCode, 2, "axios는 exit 2로 차단되어야 함");
});

test("차단: gh api graphql mutation linear", () => {
  const { exitCode } = runHook(
    "gh api graphql --hostname api.linear.app -X POST -f query='mutation { issueCreate(input: { teamId: \"abc\" }) { issue { id } } }'",
  );
  assert.equal(exitCode, 2, "gh api graphql linear mutation은 exit 2로 차단되어야 함");
});

test("차단: wget api.linear.app", () => {
  const { exitCode } = runHook(
    "wget --post-data='{\"query\":\"mutation{issueCreate}\"}' https://api.linear.app/graphql",
  );
  assert.equal(exitCode, 2, "wget은 exit 2로 차단되어야 함");
});

test("차단: python3 httpx api.linear.app", () => {
  const { exitCode } = runHook(
    "python3 -c \"import httpx; httpx.post('https://api.linear.app/graphql', json={})\"",
  );
  assert.equal(exitCode, 2, "python3 httpx는 exit 2로 차단되어야 함");
});

// ── 통과 케이스 (화이트리스트 / escape) ─────────────────────────────────────

test("통과: node scripts/internal/linear.ts createIssue", () => {
  const { exitCode } = runHook(
    "node scripts/internal/linear.ts createIssue --title 'test'",
  );
  assert.equal(exitCode, 0, "정상 경로(scripts/internal/linear.ts)는 통과해야 함");
});

test("통과: tsx scripts/internal/linear.ts updateIssue", () => {
  const { exitCode } = runHook(
    "tsx scripts/internal/linear.ts updateIssue POKIT-187 --state done",
  );
  assert.equal(exitCode, 0, "tsx 정상 경로도 통과해야 함");
});

test("통과: curl --allow-raw-linear (escape hatch)", () => {
  const { exitCode } = runHook(
    "curl --allow-raw-linear https://api.linear.app/graphql -d '{}'",
  );
  assert.equal(exitCode, 0, "--allow-raw-linear escape hatch는 통과해야 함");
});

test("통과: curl https://github.com/api/v3 (타 도메인)", () => {
  const { exitCode } = runHook("curl https://github.com/api/v3");
  assert.equal(exitCode, 0, "api.linear.app 없는 curl은 통과해야 함");
});

test("통과: echo 'linear regression study' (false positive 회피)", () => {
  const { exitCode } = runHook("echo 'linear regression study'");
  assert.equal(exitCode, 0, "linear 문자열 단순 echo는 통과해야 함");
});

test("차단: prepend bypass — echo whitelist string + curl should be BLOCKED", () => {
  const { exitCode } = runHook(
    'echo "scripts/internal/linear.ts" && curl -d "{}" https://api.linear.app/graphql',
  );
  assert.equal(exitCode, 2, "prepend 우회 시도는 exit 2로 차단되어야 함");
});

// ── WF12: CLI 호출 hook 회귀 테스트 ─────────────────────────────────────────

test("통과: node --experimental-strip-types scripts/internal/linear.ts update (api.linear.app 없음)", () => {
  // CLI 명령에 api.linear.app 문자열이 없으므로 hook 통과해야 함
  const { exitCode } = runHook(
    "node --experimental-strip-types scripts/internal/linear.ts update POKIT-189 --state Done --description-append-file /tmp/x.md",
  );
  assert.equal(exitCode, 0, "CLI update 명령에 api.linear.app 없음 — hook 통과해야 함");
});

test("차단: CLI + suffix chain curl api.linear.app", () => {
  // CLI 명령 뒤에 && curl api.linear.app 붙이면 api.linear.app 포함으로 차단
  const { exitCode } = runHook(
    "node --experimental-strip-types scripts/internal/linear.ts update POKIT-189 --state Done && curl https://api.linear.app/graphql -d '{}'",
  );
  assert.equal(exitCode, 2, "suffix-chain curl api.linear.app는 exit 2로 차단되어야 함");
});
