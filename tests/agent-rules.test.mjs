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

test("OPERATING_MODEL documents conversational ASCII visualization rules", async () => {
  const content = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(content, /Conversation Visualization Contract/);
  assert.match(content, /Mermaid is for durable docs/);
  assert.match(content, /ASCII is for live conversation and brief output/);
  assert.match(content, /Decision Flow/);
  assert.match(content, /Before\/After ASCII/);
});
