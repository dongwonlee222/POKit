import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("PO Signal Watch documents source registry and workflow boundaries", async () => {
  const sourceRegistry = await readFile("docs/source-registry.md", "utf8");
  const workflow = await readFile("docs/signal-watch-workflow.md", "utf8");

  assert.match(sourceRegistry, /PO Signal Watch Source Registry/);
  assert.match(sourceRegistry, /competitor changelogs/);
  assert.match(sourceRegistry, /user communities/);
  assert.match(sourceRegistry, /internal Linear\/GitHub activity/);
  assert.match(workflow, /Signal Summary/);
  assert.match(workflow, /Light Discovery/);
  assert.match(workflow, /Full Discovery Brief/);
  assert.match(workflow, /Backlog Candidate dry-run/);
  assert.match(workflow, /must not create Linear issues without approval/);
});

test("PO Signal Watch sample connects summary, discovery, and backlog dry-run", async () => {
  const discovery = await readFile("examples/signal-watch/discovery-brief-sample.md", "utf8");
  const backlogDryRun = await readFile("examples/signal-watch/backlog-candidate-dry-run.md", "utf8");

  assert.match(discovery, /Signal Summary/);
  assert.match(discovery, /Discovery Brief/);
  assert.match(discovery, /Recommended discovery depth: Light Discovery/);
  assert.match(discovery, /Backlog Candidate/);
  assert.match(backlogDryRun, /Backlog Candidate dry-run/);
  assert.match(backlogDryRun, /No Linear issue will be created/);
  assert.match(backlogDryRun, /idempotencyKey/);
  assert.match(backlogDryRun, /사용자 확인/);
});
