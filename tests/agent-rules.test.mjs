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
  assert.match(content, /Long Session Nudge/);
  assert.match(content, /💡 새 세션 추천/);
  assert.match(content, /\[████████░░\] 권장/);
  assert.match(content, /현재 사용: 대화\/상태 누적 많음/);
  assert.match(content, /not an exact token meter/);
  assert.match(content, /Do not use `🚨` or `⚠️` for a normal long-session nudge/);
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

test("completion reports require a flow adherence check", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /Before reporting procedure\/Cycle completion/);
  assert.match(agents, /documented flow name/);
  assert.match(agents, /required artifacts, naming\/title conventions/);
  assert.match(operatingModel, /Before any completion claim, run a flow adherence check/);
  assert.match(operatingModel, /required artifacts were produced with the expected names and titles/);
  assert.match(operatingModel, /skipped steps or deviations/);
});

test("remaining-work answers require Cycle close and release-state checks", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /When the user asks what remains\/next/);
  assert.match(agents, /check current Cycle task state and close\/release state/);
  assert.match(agents, /Do not recommend Backlog or next-Cycle work/);
  assert.match(operatingModel, /must inspect the Cycle close\/release state, not only the brief task counts/);
  assert.match(operatingModel, /Cycle Release Pending/);
  assert.match(operatingModel, /Do not move to Backlog grooming or next-Cycle bundling/);
});

test("confirmed errors require local Problem/Error Review backlog memos", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /When a confirmed error\/blocker occurs/);
  assert.match(agents, /write a Korean Problem\/Error Review memo under `artifacts\/backlog\/`/);
  assert.match(agents, /docs\/OPERATING_MODEL\.md#problemerror-review-memo-contract/);
  assert.match(operatingModel, /Problem\/Error Review Memo Contract/);
  assert.match(operatingModel, /artifacts\/backlog\/\[short-kebab-problem\]-problem-review\.md/);
  assert.match(operatingModel, /무엇이 문제인가\?/);
  assert.match(operatingModel, /언제 \/ 누구로 인하여 \/ 왜 발생했나\?/);
  assert.match(operatingModel, /근본 해결 방법 제안/);
  assert.match(operatingModel, /The local memo is mandatory even when Linear tracking will follow/);
});

test("AGENTS requires executable session bootstrap after compaction or handoff", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /POKit session start contract/);
  assert.match(agents, /scripts\/session-start\.ts/);
  assert.match(agents, /context compaction/);
  assert.match(agents, /pokit:boot ok/);
  assert.match(operatingModel, /Session Bootstrap Contract/);
  assert.match(operatingModel, /after context compaction/);
  assert.match(operatingModel, /not depend on long instruction memory/);
});

test("OPERATING_MODEL documents Memory MVP boundary, frontmatter, index, and Linear relation contract", async () => {
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");
  const workflow = await readFile("workflows/definition-pipeline.yaml", "utf8");
  const gitignore = await readFile(".gitignore", "utf8");

  assert.match(operatingModel, /POKit Memory MVP Contract/);
  assert.match(operatingModel, /Private Memory Boundary/);
  assert.match(operatingModel, /memory\/notes\/\*\.md/);
  assert.match(operatingModel, /generated `memory\/index\.yaml`/);
  assert.match(operatingModel, /collected\/`/);
  assert.match(operatingModel, /Minimal Frontmatter Schema/);
  assert.match(operatingModel, /id: mem-/);
  assert.match(operatingModel, /scope: private/);
  assert.match(operatingModel, /Linear Issue Creation Contract/);
  assert.match(operatingModel, /Depends on/);
  assert.match(operatingModel, /Related/);
  assert.match(operatingModel, /Source/);
  assert.match(operatingModel, /Evidence/);
  assert.match(workflow, /linear_issue_creation_contract:/);
  assert.match(workflow, /idempotency_key/);
  assert.match(workflow, /relation_metadata/);
  assert.match(gitignore, /memory\/notes\//);
  assert.match(gitignore, /memory\/index\.yaml/);
  assert.match(gitignore, /collected\//);
});

test("Cycle progress and one-time celebration contracts are documented", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(operatingModel, /Cycle Step Progress Contract/);
  assert.match(operatingModel, /\[████░░░░░░\] 4\/10/);
  assert.match(operatingModel, /▶ 승인 필요/);
  assert.match(operatingModel, /release 전용 progress bar/);
  assert.match(operatingModel, /One-Time Cycle Celebration Contract/);
  assert.match(operatingModel, /stateKey/);
  assert.match(operatingModel, /must not repeat unless the cycle state changes/);
  assert.match(agents, /Cycle 완료 직후 축하 메시지는 release gate 완료 후 1회만 표시한다/);
});

test("daily release is the default cadence while Operating Cycle stays a planning container", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /Daily release is default/);
  assert.match(agents, /Weekly\/Operating Cycle is only a planning\/review container/);
  assert.match(operatingModel, /Daily Release Contract/);
  assert.match(operatingModel, /default release cadence is daily/);
  assert.match(operatingModel, /Daily Release Deferred/);
  assert.match(operatingModel, /Do not hold completed daily work until the end of the week by default/);
});
