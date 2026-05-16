import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("document roles keep AGENTS focused on main-agent orchestration", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const documentRoles = await readFile("docs/architecture/01-document-roles.md", "utf8");
  const visualIncident = await readFile("docs/architecture/11-visualization-and-incident-response.md", "utf8");

  assert.match(agents, /Main Agent Orchestration Contract/);
  assert.match(agents, /orchestrates POKit work; it does not replace hooks, templates, scripts, or subagent contracts/);
  assert.match(documentRoles, /AGENTS\.md/);
  assert.match(documentRoles, /main-agent orchestration/);
  assert.match(documentRoles, /workflows\/agent-roles\.yaml/);
  assert.match(documentRoles, /workflows\/hooks\.yaml/);
  assert.match(documentRoles, /templates\/definition-pipeline\//);
  assert.match(documentRoles, /LLM은 필요한 판단 구간에서만 개입한다/);
  assert.match(documentRoles, /docs\/architecture\/11-visualization-and-incident-response\.md/);
  assert.match(visualIncident, /Stage Visualization/);
  assert.match(visualIncident, /Incident Response/);
  assert.match(visualIncident, /scripts\/cycle-progress\.ts/);
  assert.match(visualIncident, /scripts\/problem-error-review\.ts/);
  assert.match(visualIncident, /workflows\/hooks\.yaml/);
  assert.match(visualIncident, /on_error/);
});

test("AGENTS documents minimal human intervention approval matrix", async () => {
  // v0.8.0: human intervention matrix moved to docs/_details/approval-flow.md.
  const content = await readFile("docs/_details/approval-flow.md", "utf8");

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
  // v0.8.0: detail content moved to docs/_details/visualization.md
  const content = await readFile("docs/_details/visualization.md", "utf8");

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
  // v0.8.0: AGENTS.md slimmed; all external write boundary phrases live in docs/_details/.
  const approvalFlow = await readFile("docs/_details/approval-flow.md", "utf8");
  const completionReport = await readFile("docs/_details/completion-report.md", "utf8");

  assert.match(approvalFlow, /When local work is complete and the next step is an external write/);
  assert.match(approvalFlow, /Show the external write dry-run immediately/);
  assert.match(approvalFlow, /Approval-pending responses must still be actionable/);
  assert.match(approvalFlow, /must not simply stop/);
  assert.match(approvalFlow, /print the external write dry-run/);
  assert.match(completionReport, /A completion response that says an external write was skipped is incomplete/);
});

test("completion reports require a flow adherence check", async () => {
  // v0.8.0: all completion flow phrases live in docs/_details/completion-report.md
  const completionReport = await readFile("docs/_details/completion-report.md", "utf8");

  assert.match(completionReport, /Before reporting procedure\/Cycle completion/);
  assert.match(completionReport, /documented flow name/);
  assert.match(completionReport, /required artifacts, naming\/title conventions/);
  assert.match(completionReport, /Before any completion claim, run a flow adherence check/);
  assert.match(completionReport, /required artifacts were produced with the expected names and titles/);
  assert.match(completionReport, /skipped steps or deviations/);
});

test("remaining-work answers require Cycle close and release-state checks", async () => {
  // v0.8.0: all cycle release state phrases live in docs/_details/cycle-flow.md
  const cycleFlow = await readFile("docs/_details/cycle-flow.md", "utf8");

  assert.match(cycleFlow, /When the user asks what remains\/next/);
  assert.match(cycleFlow, /check current Cycle task state and close\/release state/);
  assert.match(cycleFlow, /Do not recommend Backlog or next-Cycle work/);
  assert.match(cycleFlow, /must inspect the Cycle close\/release state, not only the brief task counts/);
  assert.match(cycleFlow, /Cycle Release Pending/);
  assert.match(cycleFlow, /Do not move to Backlog grooming or next-Cycle bundling/);
});

test("confirmed errors require local Problem/Error Review backlog memos", async () => {
  // v0.8.0: error/blocker phrases live in docs/_details/approval-flow.md.
  // Memo contract body still anchored in docs/OPERATING_MODEL.md stub for backref compat.
  const approvalFlow = await readFile("docs/_details/approval-flow.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(approvalFlow, /When a confirmed error\/blocker occurs/);
  assert.match(approvalFlow, /write a Korean Problem\/Error Review memo under `memory\/problem-reviews\/`/);
  assert.match(approvalFlow, /docs\/OPERATING_MODEL\.md#problemerror-review-memo-contract/);
  assert.match(operatingModel, /Problem\/Error Review Memo Contract/);
  assert.match(operatingModel, /memory\/problem-reviews\/\[short-kebab-problem\]-problem-review\.md/);
  assert.match(operatingModel, /무엇이 문제인가\?/);
  assert.match(operatingModel, /언제 \/ 누구로 인하여 \/ 왜 발생했나\?/);
  assert.match(operatingModel, /근본 해결 방법 제안/);
  assert.match(operatingModel, /The local memo is mandatory even when Linear tracking will follow/);
});

test("AGENTS requires executable session bootstrap after compaction or handoff", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const operatingModel = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(agents, /POKit session start contract/);
  // v0.8.0: bootstrap reference shifted from raw node command to `pokit start` verb.
  // The test accepts either form so the bootstrap contract stays enforceable
  // before and after CLI wrapper migration completes.
  assert.match(agents, /pokit start|scripts\/(cli\/)?session-start\.ts/);
  assert.match(agents, /context compaction/);
  assert.match(agents, /pokit:boot ok/);
  assert.match(operatingModel, /Session Bootstrap Contract/);
  assert.match(operatingModel, /after context compaction/);
  assert.match(operatingModel, /not depend on long instruction memory/);
});

test("OPERATING_MODEL documents Memory MVP boundary, frontmatter, index, and Linear relation contract", async () => {
  // v0.8.0: memory detail moved to docs/_details/memory-contract.md
  const memoryContract = await readFile("docs/_details/memory-contract.md", "utf8");
  const workflow = await readFile("workflows/definition-pipeline.yaml", "utf8");
  const gitignore = await readFile(".gitignore", "utf8");

  assert.match(memoryContract, /POKit Memory MVP Contract/);
  assert.match(memoryContract, /Private Memory Boundary/);
  assert.match(memoryContract, /memory\/notes\/\*\.md/);
  assert.match(memoryContract, /generated `memory\/index\.yaml`/);
  assert.match(memoryContract, /collected\/`/);
  assert.match(memoryContract, /Minimal Frontmatter Schema/);
  assert.match(memoryContract, /id: mem-/);
  assert.match(memoryContract, /scope: private/);
  assert.match(memoryContract, /Linear Issue Creation Contract/);
  assert.match(memoryContract, /Depends on/);
  assert.match(memoryContract, /Related/);
  assert.match(memoryContract, /Source/);
  assert.match(memoryContract, /Evidence/);
  assert.match(workflow, /linear_issue_creation_contract:/);
  assert.match(workflow, /idempotency_key/);
  assert.match(workflow, /relation_metadata/);
  assert.match(gitignore, /memory\/notes\//);
  assert.match(gitignore, /memory\/index\.yaml/);
  assert.match(gitignore, /collected\//);
});

test("OPERATING_MODEL documents executable resume-brief validation", async () => {
  // v0.8.0: resume brief detail moved to docs/_details/memory-contract.md
  const memoryContract = await readFile("docs/_details/memory-contract.md", "utf8");

  assert.match(memoryContract, /Resume Brief Contract/);
  assert.match(memoryContract, /scripts\/resume-brief-validator\.ts/);
  assert.match(memoryContract, /command-only handoff is not enough/);
  assert.match(memoryContract, /raw context/);
});

test("Cycle progress and one-time celebration contracts are documented", async () => {
  // v0.8.0: all cycle progress + celebration phrases live in docs/_details/cycle-flow.md
  const cycleFlow = await readFile("docs/_details/cycle-flow.md", "utf8");

  assert.match(cycleFlow, /Cycle Step Progress Contract/);
  assert.match(cycleFlow, /\[████░░░░░░\] 4\/10/);
  assert.match(cycleFlow, /▶ 승인 필요/);
  assert.match(cycleFlow, /release 전용 progress bar/);
  assert.match(cycleFlow, /One-Time Cycle Celebration Contract/);
  assert.match(cycleFlow, /stateKey/);
  assert.match(cycleFlow, /must not repeat unless the cycle state changes/);
  assert.match(cycleFlow, /Cycle 완료 직후 축하 메시지는 release gate 완료 후 1회만 표시한다/);
});

test("버전 스프린트 release is the default unit while 위클리 서클 stays a tracking container", async () => {
  // v0.8.0: all release flow phrases live in docs/_details/release-flow.md
  const releaseFlow = await readFile("docs/_details/release-flow.md", "utf8");

  assert.match(releaseFlow, /버전 스프린트 release is default/);
  assert.match(releaseFlow, /위클리 서클 is only a weekly tracking\/review container/);
  assert.match(releaseFlow, /버전 스프린트 Release Contract/);
  assert.match(releaseFlow, /default release unit is the 버전 스프린트/);
  assert.match(releaseFlow, /버전 스프린트 Release Deferred/);
  assert.match(releaseFlow, /Do not hold completed release-ready work until the end of the week by default/);
});
