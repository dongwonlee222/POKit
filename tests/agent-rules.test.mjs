import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AGENTS documents minimal human intervention approval matrix", async () => {
  const content = await readFile("AGENTS.md", "utf8");

  assert.match(content, /Human Intervention Matrix/);
  assert.match(content, /Local file edits/);
  assert.match(content, /No separate approval/);
  assert.match(content, /Linear issue Done/);
  assert.match(content, /Requires approval/);
  assert.match(content, /GitHub push\/tag\/release/);
  assert.match(content, /decision-log append/);
  assert.match(content, /ambiguous completion/);
  assert.match(content, /Humans approve external impact and product judgment/);
});

test("AGENTS and OPERATING_MODEL require Korean-first user-facing artifacts", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /사용자-facing 답변, 보고서, 로컬 artifact는 한국어를 기본으로 쓴다/);
  assert.match(operatingModel, /User-facing POKit output is Korean-first/);
  assert.match(operatingModel, /understandable without translating English prose/);
});

test("OPERATING_MODEL documents conversational ASCII visualization rules", async () => {
  const content = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(content, /Conversation Visualization Contract/);
  assert.match(content, /Mermaid is for durable docs/);
  assert.match(content, /ASCII is for live conversation and brief output/);
  assert.match(content, /Decision Flow/);
  assert.match(content, /Before\/After ASCII/);
});

test("external write boundaries require actionable dry-run next steps", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /When local work is complete and the next step is an external write/);
  assert.match(agents, /Show the external write dry-run immediately/);
  assert.match(agents, /Approval-pending responses must still be actionable/);
  assert.match(operatingModel, /must not simply stop/);
  assert.match(operatingModel, /print the external write dry-run/);
  assert.match(operatingModel, /A completion response that says an external write was skipped is incomplete/);
});
