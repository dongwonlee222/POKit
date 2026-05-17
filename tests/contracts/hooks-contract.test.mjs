import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("hooks enforce Korean-first artifacts and next-action completion reports", async () => {
  const content = await readFile("workflows/hooks.yaml", "utf8");

  assert.match(content, /before_user_facing_artifact:/);
  assert.match(content, /require_korean_first_user_copy/);
  assert.match(content, /allow_english_only_for_identifiers_and_product_terms/);
  assert.match(content, /after_completion_report:/);
  assert.match(content, /include_one_next_action/);
  assert.match(content, /reject_mechanical_next_action/);
});

test("on_error hook is backed by the Problem/Error Review runner contract", async () => {
  const content = await readFile("workflows/hooks.yaml", "utf8");

  assert.match(content, /on_error:/);
  assert.match(content, /enforcement:\s*script/);
  assert.match(content, /runner:\s*scripts\/(internal\/)?hooks-runner\.ts/);
  assert.match(content, /collect_error/);
  assert.match(content, /render_problem_error_review/);
  assert.match(content, /write_problem_review_memo/);
  assert.match(content, /suggest_backlog_follow_up/);
});
