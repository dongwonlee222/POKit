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
