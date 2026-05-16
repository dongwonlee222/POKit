import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("PO Signal Watch documents source registry and workflow boundaries", async () => {
  const sourceRegistry = await readFile("docs/_details/source-registry.md", "utf8");
  const workflow = await readFile("docs/_details/signal-watch.md", "utf8");

  assert.match(sourceRegistry, /PO Signal Watch 외부 출처 목록/);
  assert.match(sourceRegistry, /경쟁 제품 변경 기록/);
  assert.match(sourceRegistry, /사용자 커뮤니티/);
  assert.match(sourceRegistry, /내부 Linear\/GitHub 활동/);
  assert.match(workflow, /Signal Summary/);
  assert.match(workflow, /Light Discovery/);
  assert.match(workflow, /Full Discovery Brief/);
  assert.match(workflow, /Backlog Candidate dry-run/);
  assert.match(workflow, /사용자 승인 없이 Linear issue를 만들면 안 된다/);
});

test("PO Signal Watch sample connects summary, discovery, and backlog dry-run", async () => {
  const discovery = await readFile("examples/signal-watch/discovery-brief-sample.md", "utf8");
  const backlogDryRun = await readFile("examples/signal-watch/backlog-candidate-dry-run.md", "utf8");

  assert.match(discovery, /Signal Summary/);
  assert.match(discovery, /Discovery Brief/);
  assert.match(discovery, /추천 Discovery 깊이: Light Discovery/);
  assert.match(discovery, /Backlog Candidate/);
  assert.match(backlogDryRun, /Backlog Candidate dry-run/);
  assert.match(backlogDryRun, /사용자 승인 전에는 Linear issue를 만들지 않는다/);
  assert.match(backlogDryRun, /idempotencyKey/);
  assert.match(backlogDryRun, /사용자 확인/);
});
