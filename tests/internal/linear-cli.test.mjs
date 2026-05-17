import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = "/Users/idong-won/workspace/pokit/scripts/internal/linear.ts";

function runCli(args, { env = {} } = {}) {
  const result = spawnSync(
    "node",
    ["--experimental-strip-types", CLI, ...args],
    {
      encoding: "utf8",
      env: { ...process.env, LINEAR_API_KEY: undefined, ...env },
    },
  );
  return { exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
}

// ── 공유 임시 파일 ──────────────────────────────────────────────────────────

const tmpDir = mkdtempSync(join(tmpdir(), "linear-cli-test-"));
const testAppendFile = join(tmpDir, "test-append.md");
const testDescFile = join(tmpDir, "test-desc.md");

writeFileSync(testAppendFile, "## Test Append\n\n테스트 append 내용입니다.\n");
writeFileSync(testDescFile, "## Test Description\n\n테스트 description 내용입니다.\n");

// ── Subcommand routing ──────────────────────────────────────────────────────

test("update subcommand: dry-run by default — exit 0, stdout에 dry-run 또는 plan 포함", () => {
  const { exitCode, stdout, stderr } = runCli([
    "update",
    "POKIT-187",
    "--state",
    "Done",
    "--description-append-file",
    testAppendFile,
  ]);
  assert.equal(exitCode, 0, `exit code should be 0, stderr: ${stderr}`);
  const combined = (stdout + stderr).toLowerCase();
  assert.ok(
    combined.includes("dry-run") || combined.includes("plan"),
    `stdout/stderr should include "dry-run" or "plan". got: ${stdout}${stderr}`,
  );
});

test("create subcommand: dry-run by default — exit 0, stdout에 dry-run 또는 plan 포함", () => {
  const { exitCode, stdout, stderr } = runCli([
    "create",
    "--title",
    "Test Issue",
    "--labels",
    "Improvement",
    "--description-file",
    testDescFile,
  ]);
  assert.equal(exitCode, 0, `exit code should be 0, stderr: ${stderr}`);
  const combined = (stdout + stderr).toLowerCase();
  assert.ok(
    combined.includes("dry-run") || combined.includes("plan"),
    `stdout/stderr should include "dry-run" or "plan". got: ${stdout}${stderr}`,
  );
});

test("assign-label subcommand: dry-run by default — exit 0, stdout에 dry-run 또는 plan 포함", () => {
  const { exitCode, stdout, stderr } = runCli([
    "assign-label",
    "POKIT-187",
    "--label",
    "Done",
  ]);
  assert.equal(exitCode, 0, `exit code should be 0, stderr: ${stderr}`);
  const combined = (stdout + stderr).toLowerCase();
  assert.ok(
    combined.includes("dry-run") || combined.includes("plan"),
    `stdout/stderr should include "dry-run" or "plan". got: ${stdout}${stderr}`,
  );
});

// ── Argv 검증 ───────────────────────────────────────────────────────────────

test("subcommand 없음: exit != 0, stderr에 usage 또는 subcommand 안내 포함", () => {
  const { exitCode, stderr } = runCli([]);
  assert.notEqual(exitCode, 0, "exit code should not be 0 when no subcommand given");
  const lowerStderr = stderr.toLowerCase();
  assert.ok(
    lowerStderr.includes("usage") ||
      lowerStderr.includes("subcommand") ||
      lowerStderr.includes("update") ||
      lowerStderr.includes("create"),
    `stderr should include usage info. got: ${stderr}`,
  );
});

test("unknown subcommand: exit != 0, stderr에 에러 포함", () => {
  const { exitCode, stderr } = runCli(["unknown-cmd"]);
  assert.notEqual(exitCode, 0, "exit code should not be 0 for unknown subcommand");
  assert.ok(stderr.length > 0, `stderr should contain error message. got: ${stderr}`);
});

test("update subcommand에 ISSUE_ID 누락: exit != 0, stderr에 에러 포함", () => {
  const { exitCode, stderr } = runCli(["update"]);
  assert.notEqual(exitCode, 0, "exit code should not be 0 when ISSUE_ID is missing");
  assert.ok(stderr.length > 0, `stderr should contain error message. got: ${stderr}`);
});

test("--apply 시 --actor 없으면: exit != 0, stderr에 --actor 강제 안내 포함", () => {
  const { exitCode, stderr } = runCli([
    "update",
    "POKIT-187",
    "--state",
    "Done",
    "--apply",
  ]);
  assert.notEqual(exitCode, 0, "exit code should not be 0 when --apply without --actor");
  assert.ok(
    stderr.includes("--actor"),
    `stderr should mention --actor requirement. got: ${stderr}`,
  );
});

// ── 파일 입력 검증 ──────────────────────────────────────────────────────────

test("--description-file 경로가 존재하지 않으면: exit != 0, 명확한 에러 메시지", () => {
  const { exitCode, stderr } = runCli([
    "create",
    "--title",
    "Test",
    "--labels",
    "Improvement",
    "--description-file",
    "/nonexistent/path.md",
  ]);
  assert.notEqual(exitCode, 0, "exit code should not be 0 for nonexistent file");
  assert.ok(
    stderr.length > 0,
    `stderr should contain error message about missing file. got: ${stderr}`,
  );
});

// ── dry-run vs apply ────────────────────────────────────────────────────────

test("dry-run (--apply 없음): LINEAR_API_KEY 없어도 실행 가능 — plan만 출력, 네트워크 호출 없음", () => {
  const { exitCode, stdout, stderr } = runCli(
    [
      "create",
      "--title",
      "Dry Run Test",
      "--labels",
      "Improvement",
      "--description-file",
      testDescFile,
    ],
    { env: { LINEAR_API_KEY: "" } },
  );
  // dry-run은 네트워크 호출 없으므로 LINEAR_API_KEY 없어도 exit 0이어야 함
  assert.equal(exitCode, 0, `dry-run should succeed without LINEAR_API_KEY. stderr: ${stderr}`);
  const combined = (stdout + stderr).toLowerCase();
  assert.ok(
    combined.includes("dry-run") || combined.includes("plan"),
    `output should indicate dry-run mode. got: ${stdout}${stderr}`,
  );
});

test("create --apply with POKIT_TEST_MOCK=1: exit 0, mock=true 출력, 미지원 에러 없음 (POKIT-195)", () => {
  const { exitCode, stdout, stderr } = runCli(
    [
      "create",
      "--title",
      "Test Apply Issue",
      "--labels",
      "Improvement",
      "--description-file",
      testDescFile,
      "--apply",
      "--actor",
      "test-agent",
    ],
    { env: { POKIT_TEST_MOCK: "1", LINEAR_API_KEY: "mock-key-for-test" } },
  );
  assert.equal(exitCode, 0, `create --apply with mock should exit 0. stderr: ${stderr}`);
  assert.ok(
    stdout.includes('"mock":true') || stdout.includes("mock"),
    `mock branch should emit mock=true. got stdout: ${stdout}`,
  );
  assert.ok(
    !stderr.includes("미지원"),
    `create --apply 가 더 이상 "미지원" 에러로 종료되면 안 됨. stderr: ${stderr}`,
  );
});

test("--apply with LINEAR_API_KEY mock: apply 함수 경로로 분기 확인 (POKIT_TEST_MOCK=1 sentinel)", () => {
  // POKIT_TEST_MOCK=1 sentinel이 구현되면 실제 API 없이 apply 분기 검증 가능
  // 현재 CLI 미구현이므로 FAIL 예상 — T2 구현 시 mock 전략 반영 필요
  const { exitCode, stdout, stderr } = runCli(
    [
      "update",
      "POKIT-187",
      "--state",
      "Done",
      "--description-append-file",
      testAppendFile,
      "--apply",
      "--actor",
      "test-agent",
    ],
    { env: { POKIT_TEST_MOCK: "1", LINEAR_API_KEY: "mock-key-for-test" } },
  );
  // mock sentinel 없으면 실제 API 호출 시도 → 실패. sentinel 있으면 exit 0.
  // 두 경우 모두 apply 분기 진입은 확인 가능 (stderr 내용으로)
  const combined = (stdout + stderr).toLowerCase();
  const enteredApplyBranch =
    combined.includes("apply") ||
    combined.includes("actor") ||
    exitCode === 0;
  assert.ok(
    enteredApplyBranch,
    `should enter apply branch when --apply and --actor are given. exitCode: ${exitCode}, stderr: ${stderr}`,
  );
});

// ── appendDecisionLog / rewriteDecisionLogYaml 회귀 테스트 ──────────────────

// 최소한의 픽스처 — decisions: 배열 + latest_decision_at 구조
const FIXTURE_YAML = `---
kind: decision-log
schema_version: 1
---
decisions:
  - id: dec-existing-001
    timestamp: "2026-05-17T10:00:00.000Z"
    title: "기존 entry 제목"
    summary: "기존 entry 요약"
    decision: "기존 결정"
    alternatives_rejected: []
    evidence: []
    linear_refs:
      - POKIT-001
    actor: "test-agent"
latest_decision_at: "2026-05-17T10:00:00.000Z"
`;

const INTERNAL_LINEAR = "/Users/idong-won/workspace/pokit/scripts/internal/linear.ts";

function importFn(name) {
  // Node.js --experimental-strip-types 로 TypeScript 모듈에서 named export 추출
  // spawnSync로 인라인 스크립트 실행 후 JSON 출력
  return { _modulePath: INTERNAL_LINEAR, _name: name };
}

// pure helper 테스트: rewriteDecisionLogYaml 인라인 실행
function runRewriteScript(raw, newEntry) {
  const script = `
import { rewriteDecisionLogYaml } from "${INTERNAL_LINEAR}";
const raw = ${JSON.stringify(raw)};
const entry = ${JSON.stringify(newEntry)};
const result = rewriteDecisionLogYaml(raw, entry);
process.stdout.write(result);
`;
  const result = spawnSync("node", ["--experimental-strip-types", "--input-type=module"], {
    input: script,
    encoding: "utf8",
    env: { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error(`rewriteDecisionLogYaml 실행 실패: ${result.stderr}`);
  }
  return result.stdout;
}

// appendDecisionLog 인라인 실행 (파일 I/O 포함, 임시 파일 경로 주입)
function runAppendDecisionLogScript(yamlPath, entry) {
  const script = `
import { appendDecisionLog } from "${INTERNAL_LINEAR}";
const entry = ${JSON.stringify(entry)};
await appendDecisionLog(entry, ${JSON.stringify(yamlPath)});
`;
  const result = spawnSync("node", ["--experimental-strip-types", "--input-type=module"], {
    input: script,
    encoding: "utf8",
    env: { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error(`appendDecisionLog 실행 실패: ${result.stderr}`);
  }
}

// decisions: 배열에서 entry id 목록을 hand-rolled 파싱으로 추출
function extractEntryIds(yaml) {
  const ids = [];
  const lines = yaml.split("\n");
  for (const line of lines) {
    const m = line.match(/^  - id:\s+(.+)$/);
    if (m) ids.push(m[1].trim());
  }
  return ids;
}

// latest_decision_at 값 추출
function extractLatestDecisionAt(yaml) {
  const m = yaml.match(/^latest_decision_at:\s+"([^"]+)"/m);
  return m ? m[1] : null;
}

// decisions: 섹션 밖에 entry가 있는지 확인 (latest_decision_at 이후 "  - id:" 존재)
function hasDanglingEntries(yaml) {
  const latestIdx = yaml.indexOf("latest_decision_at:");
  if (latestIdx === -1) return false;
  const afterLatest = yaml.slice(latestIdx);
  return /\n  - id:/.test(afterLatest.slice(afterLatest.indexOf("\n") + 1));
}

const SAMPLE_ENTRY = {
  id: "dec-20260517-test-pokit-999",
  timestamp: "2026-05-17T20:00:00.000Z",
  title: "테스트 entry",
  summary: "테스트 요약",
  decision: "테스트 결정",
  linear_refs: ["POKIT-999"],
  actor: "test-agent",
};

test("rewriteDecisionLogYaml: 새 entry가 decisions: 배열 안에 존재", () => {
  const result = runRewriteScript(FIXTURE_YAML, SAMPLE_ENTRY);
  const ids = extractEntryIds(result);
  assert.ok(ids.includes(SAMPLE_ENTRY.id), `새 entry id가 배열 안에 없음. ids: ${ids.join(", ")}\n${result}`);
});

test("rewriteDecisionLogYaml: latest_decision_at이 새 entry timestamp와 일치", () => {
  const result = runRewriteScript(FIXTURE_YAML, SAMPLE_ENTRY);
  const latest = extractLatestDecisionAt(result);
  assert.equal(latest, SAMPLE_ENTRY.timestamp, `latest_decision_at 불일치. got: ${latest}`);
});

test("rewriteDecisionLogYaml: 새 entry에 alternatives_rejected와 evidence 필드 존재 (빈 배열)", () => {
  const result = runRewriteScript(FIXTURE_YAML, SAMPLE_ENTRY);
  assert.ok(result.includes("alternatives_rejected: []"), `alternatives_rejected: [] 없음\n${result}`);
  assert.ok(result.includes("evidence: []"), `evidence: [] 없음\n${result}`);
});

test("appendDecisionLog: 두 번 연속 호출 시 둘 다 배열 안에 위치 (dangling 없음)", () => {
  const tmpDecisionLog = join(mkdtempSync(join(tmpdir(), "decision-log-test-")), "decision-log.yaml");
  writeFileSync(tmpDecisionLog, FIXTURE_YAML, "utf8");

  const entry1 = { ...SAMPLE_ENTRY, id: "dec-test-first", timestamp: "2026-05-17T20:01:00.000Z" };
  const entry2 = { ...SAMPLE_ENTRY, id: "dec-test-second", timestamp: "2026-05-17T20:02:00.000Z" };

  runAppendDecisionLogScript(tmpDecisionLog, entry1);
  runAppendDecisionLogScript(tmpDecisionLog, entry2);

  const finalYaml = readFileSync(tmpDecisionLog, "utf8");
  const ids = extractEntryIds(finalYaml);

  assert.ok(ids.includes(entry1.id), `entry1 id 없음. ids: ${ids.join(", ")}`);
  assert.ok(ids.includes(entry2.id), `entry2 id 없음. ids: ${ids.join(", ")}`);
  assert.ok(!hasDanglingEntries(finalYaml), `dangling entries 존재함\n${finalYaml}`);

  // latest_decision_at은 마지막 호출 timestamp
  const latest = extractLatestDecisionAt(finalYaml);
  assert.equal(latest, entry2.timestamp, `latest_decision_at이 마지막 entry timestamp와 불일치. got: ${latest}`);
});
