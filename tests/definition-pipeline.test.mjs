import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("definition pipeline defines machine ids with Korean user-facing headings", async () => {
  const content = await readFile("workflows/definition-pipeline.yaml", "utf8");

  assert.match(content, /name: definition_pipeline/);
  assert.match(content, /id: ideation_brief/);
  assert.match(content, /title: 아이디어 정리/);
  assert.match(content, /id: identity_fit_check/);
  assert.match(content, /title: 포킷 적합성 확인/);
  assert.match(content, /id: benchmarking_brief/);
  assert.match(content, /title: 벤치마킹 정리/);
  assert.match(content, /id: product_flow_map/);
  assert.match(content, /title: 제품 흐름 지도/);
  assert.match(content, /id: prd_draft/);
  assert.match(content, /title: PRD 초안/);
  assert.match(content, /id: data_contract/);
  assert.match(content, /title: 데이터 계약/);
  assert.match(content, /id: acceptance_criteria/);
  assert.match(content, /title: 완료 기준/);
  assert.match(content, /id: tdd_plan/);
  assert.match(content, /title: TDD 계획/);
  assert.match(content, /id: sub_issue_breakdown/);
  assert.match(content, /title: 하위 이슈 분해/);
  assert.match(content, /id: dogfood_plan/);
  assert.match(content, /title: Dogfood 계획/);
});

test("definition pipeline declares implementation and external write gates", async () => {
  const content = await readFile("workflows/definition-pipeline.yaml", "utf8");

  assert.match(content, /before_implementation:/);
  assert.match(content, /prd_draft/);
  assert.match(content, /acceptance_criteria/);
  assert.match(content, /tdd_plan/);
  assert.match(content, /sub_issue_breakdown/);
  assert.match(content, /before_linear_write:/);
  assert.match(content, /dry_run/);
  assert.match(content, /user_approval/);
  assert.match(content, /idempotency_key/);
});

test("definition pipeline supports full, focused, and patch sizes", async () => {
  const content = await readFile("workflows/definition-pipeline.yaml", "utf8");

  assert.match(content, /sizes:/);
  assert.match(content, /full:/);
  assert.match(content, /focused:/);
  assert.match(content, /patch:/);
  assert.match(content, /minimum_stages:/);
  assert.match(content, /required_before_implementation:/);
  assert.match(content, /ideation_brief/);
  assert.match(content, /acceptance_criteria/);
});

test("definition pipeline assigns parallel subagent roles under main agent ownership", async () => {
  const content = await readFile("workflows/definition-pipeline.yaml", "utf8");

  assert.match(content, /roles:/);
  assert.match(content, /main_agent:/);
  assert.match(content, /final_judgment/);
  assert.match(content, /user_confirmation/);
  assert.match(content, /external_write_boundary/);
  assert.match(content, /benchmark_agent:/);
  assert.match(content, /benchmarking_brief/);
  assert.match(content, /prd_agent:/);
  assert.match(content, /prd_draft/);
  assert.match(content, /data_contract_agent:/);
  assert.match(content, /data_contract/);
  assert.match(content, /tdd_agent:/);
  assert.match(content, /tdd_plan/);
  assert.match(content, /breakdown_agent:/);
  assert.match(content, /sub_issue_breakdown/);
});

test("agent role templates define reusable subagent prompts and Linear dry-run constraints", async () => {
  const content = await readFile("workflows/agent-roles.yaml", "utf8");

  assert.match(content, /name: agent_roles/);
  assert.match(content, /benchmark_agent:/);
  assert.match(content, /title: 벤치마킹 에이전트/);
  assert.match(content, /prompt_template:/);
  assert.match(content, /no_external_write/);
  assert.match(content, /linear_sub_issue_dry_run_only/);
  assert.match(content, /prd_agent:/);
  assert.match(content, /data_contract_agent:/);
  assert.match(content, /tdd_agent:/);
  assert.match(content, /breakdown_agent:/);
  assert.match(content, /main_agent:/);
});

test("definition pipeline role keys are backed by agent role templates", async () => {
  const workflow = await readFile("workflows/definition-pipeline.yaml", "utf8");
  const agentRoles = await readFile("workflows/agent-roles.yaml", "utf8");

  const workflowRolesBlock = workflow.match(/\nroles:\n([\s\S]*?)\nstages:/)?.[1] ?? "";
  const roleKeys = [...workflowRolesBlock.matchAll(/^  ([a-z_]+):/gm)].map((match) => match[1]);

  assert.deepEqual(roleKeys, [
    "main_agent",
    "benchmark_agent",
    "prd_agent",
    "data_contract_agent",
    "tdd_agent",
    "breakdown_agent",
  ]);

  for (const roleKey of roleKeys) {
    assert.match(agentRoles, new RegExp(`^  ${roleKey}:`, "m"));
  }
});

test("sub-issue breakdown includes a Linear-oriented parallel execution plan", async () => {
  const workflow = await readFile("workflows/definition-pipeline.yaml", "utf8");
  const template = await readFile("templates/definition-pipeline/sub-issue-breakdown.md", "utf8");

  assert.match(workflow, /병렬 실행 계획/);
  assert.match(workflow, /parallel_execution_plan/);
  assert.match(workflow, /linear_sub_issue_plan/);
  assert.match(workflow, /public_evidence_path/);
  assert.match(workflow, /blocked_by_external/);
  assert.match(workflow, /rollback_plan/);
  assert.match(template, /## 병렬 실행 계획/);
  assert.match(template, /## Linear sub-issue dry-run/);
  assert.match(template, /## 공개 증거 경로/);
  assert.match(template, /## 외부 의존성과 rollback/);
});

test("definition pipeline templates use Korean headings", async () => {
  const template = await readFile("templates/definition-pipeline/ideation-brief.md", "utf8");

  assert.match(template, /# 아이디어 정리/);
  assert.match(template, /## 한 줄 아이디어/);
  assert.match(template, /## 사용자와 상황/);
  assert.match(template, /## 해결하려는 문제/);
  assert.match(template, /## 기대 변화/);
  assert.match(template, /## 아직 모르는 것/);
  assert.match(template, /## 다음 판단/);
});

test("operating model references the definition pipeline contract", async () => {
  const content = await readFile("docs/OPERATING_MODEL.md", "utf8");

  assert.match(content, /Definition Pipeline/);
  assert.match(content, /기계가 읽는 id와 파일명은 영어/);
  assert.match(content, /사용자가 읽는 제목과 목차는 한국어/);
  assert.match(content, /병렬 서브에이전트/);
  assert.match(content, /Runtime note/);
  assert.match(content, /execution constraint of the runtime, not a POKit product rule/);
  assert.match(content, /same planned work must run sequentially/);
  assert.match(content, /main agent/);
  assert.match(content, /workflows\/agent-roles.yaml/);
  assert.match(content, /Linear sub-issue/);
});

test("PRD and data contract templates include provider cost and copyright gates", async () => {
  const prd = await readFile("templates/definition-pipeline/prd-draft.md", "utf8");
  const dataContract = await readFile("templates/definition-pipeline/data-contract.md", "utf8");

  assert.match(prd, /## 외부 의존성 \/ 비용 \/ 한도/);
  assert.match(prd, /## Rollback \/ 비활성화 계획/);
  assert.match(dataContract, /## 저작권 \/ 원문 저장 범위/);
  assert.match(dataContract, /## 개인정보와 민감정보/);
});
