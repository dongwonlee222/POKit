# Subagent Contract — Main Context, Model Tier, Definition Pipeline

## Main Context / Subagent Call Contract

- 메인 에이전트는 최신 사용자 의도, 승인 경계, 최종 판단만 유지한다.
- 서브에이전트는 bounded input만 받는다: 담당 파일이나 책임, 기대 산출물, Done gate, 필요한 artifact link만 포함한다.
- 출력은 정해진 schema로만 반환한다. 기본 schema는 role, summary_ko, artifact_links, decisions_needed, external_write_request, message_catalog_ids다.
- 외부 write 판단은 메인 에이전트만 가능하다. 서브에이전트는 외부 write를 실행하거나 최종 승인 여부를 판단하지 않고, 필요한 경우 dry-run 후보만 반환한다.
- 대화형 문구는 message catalog id로 호출한다. 서브에이전트 출력도 사용자-facing 문구가 필요하면 `workflows/messages.yaml`의 id를 참조한다.
- context handoff는 resume-brief와 artifact link 중심으로 유지한다. 긴 원문 복사 금지, 링크와 짧은 근거 중심으로 전달한다.
- `scripts/subagent-payload-check.ts` validates subagent output before it is ingested into main context.
- `scripts/external-write/guard.ts` is the external write entrypoint guard. Apply helpers must identify `actor: "main_agent"` and must reject subagent actors.
- Release-bundle Linear issue writes require passing semantic preflight before apply. This moves target version, release bundle, and dry-run/write drift checks from review advice into a runtime guard.

Contract violations:

- A subagent output containing raw_context, full_text, or non-schema keys is invalid.
- A subagent external_write_request other than `none` or `dry_run_only` is invalid.
- A Linear apply call without `actor: "main_agent"` is invalid.
- A release-bundle issue apply without semantic preflight is invalid.

## Operator Pre-task Judgment

작업 진입 직전(Cycle Step 4 작업 Gate 시점) 메인 에이전트는 다음 3가지를 사용자에게 공개하고 승인을 받는다. 정책이 있어도 매 작업마다 명시적 판단이 보이지 않으면 운영에서 누락된다.

```text
[작업 진입 판단]
- Operator: <Claude Code | Codex CLI>
- 모델 선택: <runtime의 Strong/Mid/Light tier 중 하나> — 이유
- 병렬화: <단일 | 병렬 N개 서브에이전트> — 분할 기준 또는 단일 진행 이유
- 외부 write: <없음 | N건 요약>
- 정책 전제: <충족 | 미충족 — 선행 정책 정의 필요>
```

예시 (Claude operator):

```text
[작업 진입 판단]
- Operator: Claude Code
- 모델 선택: Sonnet 4.6 (Mid tier) — bounded 구현, 테스트 추가
- 병렬화: 단일 — 단일 파일 수정, 분할 이점 없음
- 외부 write: 없음
- 정책 전제: 충족 — Inline Fix 정책, 테스트 회귀 정책 모두 명시됨
```

## Policy Precondition Gate

위 판단의 **정책 전제** 라인은 다음 질문에 답한다.

> 이 작업의 결과가 가치 있으려면 어떤 정책/설계가 먼저 확정되어 있어야 하는가? 그것이 지금 정의되어 있는가?

미충족 사례:

- "거대 문서 분할" 작업 — context 동적 로딩 정책이 없으면 분할은 파편화로 끝남.
- "라벨 자동 매핑" — 라벨 ID 룩업 정책이 없으면 hardcode로 끝남.
- "데이터 마이그레이션" — 새 스키마 정책이 없으면 마이그레이션 방향이 정해지지 않음.

미충족이면 본 작업은 시작하지 않는다. 대신 **선행 정책 정의 작업**을 별도 이슈로 분리하거나, 본 작업의 스코프를 "정책 정의 + 매핑 표 작성"으로 재정의한다. 정책이 확정된 후에만 실제 구현 작업이 진입한다.

이 게이트는 단순 checkbox가 아니다. 메인 에이전트는 무엇이 전제 정책인지 한 줄로 명시하고, 그 정책이 어디에 정의되어 있는지(파일 경로 또는 issue 번호) 보여준다. "특별히 필요한 정책 없음 — 기존 정책으로 충족"도 명시한다 — 침묵 진입을 막기 위한 게이트다.

기준:

- **모델 선택**은 본 문서의 Model Tier Policy를 따른다. 제품 판단·통합·완료 선언이 있으면 Opus. bounded 구현·테스트는 Sonnet. mechanical edit은 Haiku. 메인 에이전트는 매 작업의 판단 강도에 맞춰 모델을 골라 보여준다.
- **병렬화 가능 조건**은 Definition Pipeline 섹션에 정의된 그대로다: (1) size=`full`인 작업, (2) 독립 stage 2개 이상, (3) 산출 파일 비중복. 셋 다 충족하지 않으면 단일 진행을 기본으로 한다.
- **외부 write**는 dry-run + 승인 + idempotency key 계약을 따른다. 진입 판단 시점에서는 예상 건수만 보여주고, 실제 dry-run은 외부 write 직전에 다시 한 번 보여준다.

이 판단은 한 줄짜리가 아니다. 단순 작업도 "단일 / 외부 write 없음"임을 명시한다 — 침묵 진입을 막기 위한 게이트다.

## Operator Definition

Operator는 현재 POKit 세션을 운영 중인 LLM runtime이다. Main agent와 동의어. 가능한 operator는 두 가지다.

- **Claude Code** — Anthropic Claude 모델군 (Opus / Sonnet / Haiku) 위에서 동작.
- **Codex CLI** — OpenAI 모델군 (GPT-5.5 / GPT-5.4 / GPT-5.4-mini 등) 위에서 동작.

Operator는 runtime이 제공하는 최상위 모델로 세션을 시작하고, 작업 성격에 따라 같은 lineage 내의 다른 tier로 전환할 수 있다. POKit 운영 계약(외부 write 승인, dry-run, idempotency key, 완료 선언, on_error 자동화)은 operator 종류와 무관하게 동일하게 적용된다.

## Model Tier Policy

Use stronger models where judgment matters, and cheaper models where the contract is already narrow.

| Tier | Claude | Codex (OpenAI) | 용도 |
|---|---|---|---|
| Strong | Opus 4.7 | GPT-5.5 / o-series | 제품 판단, 모호성 해소, 최종 통합, 테스트 해석, 완료 선언 |
| Mid    | Sonnet 4.6 | gpt-5.4 | bounded 구현, API 변경, 상태 분류, 사용자-facing 스크립트, non-trivial 테스트 |
| Light  | Haiku 4.5 | gpt-5.4-mini | 첫-pass 문서 편집, fixture 업데이트, 좁은 mechanical 정리 |

- Main agent(=operator)는 항상 자신이 운영 중인 runtime의 Strong tier에서 시작한다. 작업 분해 후 subtask가 명백히 Mid/Light 범위면 해당 tier로 전환한다.
- Subagents must own disjoint files or responsibilities. The main agent remains accountable for integration, verification, and Linear/GitHub safety.
- Lower-tier models must not make final Done decisions, final safety claims, or policy changes without main-agent review.

The optimization goal is simple: spend expensive reasoning on choices and verification, not on repeatable edits.

## Cross-Provider Subagent Policy

Operator는 같은 lineage 내에서 subagent를 호출하는 것을 기본으로 한다 (Claude operator → Claude subagent, Codex operator → Codex subagent).

Cross-provider subagent(Claude operator → Codex subagent, 또는 그 반대)는 다음 사유가 명시될 때만 허용한다.

- 한쪽 runtime만 가진 도구·MCP·전문 능력이 필요할 때 (예: Codex의 특정 sandbox 기능, Claude의 특정 MCP).
- 동일 모델군 내에서 충분한 tier가 없을 때 (예: Claude operator가 GPT-5.5의 검증을 명시적으로 받고 싶을 때).
- Cross-runtime diff 작업 등 두 runtime 결과를 비교하는 게 작업 자체 목적일 때.

Cross-provider 호출 시 main agent는 이유를 Operator Pre-task Judgment에 명시한다. 그 외에는 within-lineage가 기본이다.

## Definition Pipeline

POKit uses the Definition Pipeline when a raw idea needs to become a PRD, test plan, and Cycle-ready issue bundle.

The canonical machine-readable structure lives in `workflows/definition-pipeline.yaml`. Reusable subagent role templates live in `workflows/agent-roles.yaml`. Templates for generated user-facing artifacts live in `templates/definition-pipeline/`.

기계가 읽는 id와 파일명은 영어로 둔다. 사용자가 읽는 제목과 목차는 한국어로 쓴다. This keeps scripts stable while keeping PO-facing artifacts easy to read.

Default stages:

1. 아이디어 정리
2. 포킷 적합성 확인
3. 벤치마킹 정리
4. 제품 흐름 지도
5. PRD 초안
6. 데이터 계약
7. 완료 기준
8. TDD 계획
9. 하위 이슈 분해
10. Dogfood 계획

Size controls how much pipeline is required:

- `full`: new product or feature surface. Run all ten stages.
- `focused`: bounded change to an existing surface. Require 아이디어 정리, 제품 흐름 지도, PRD 초안, 완료 기준, and 하위 이슈 분해.
- `patch`: bug, copy, config, or narrowly scoped fix. Require 아이디어 정리 and 완료 기준.

The main agent proposes the size after 아이디어 정리, then continues with the minimum stage set for that size. This prevents small fixes from inheriting full-feature process weight.

Before implementation, the pipeline must satisfy the size-specific gate in `workflows/definition-pipeline.yaml`. Before Linear writes, it still follows the external write boundary: dry-run, user approval, and idempotency key.

For larger definition work, POKit may plan 병렬 서브에이전트 when all of these are true: size is `full`, at least two stages can run independently, and output files do not overlap. The main agent owns final judgment, artifact integration, user confirmation, and every external write boundary. Subagents only produce bounded drafts such as 벤치마킹 정리, PRD 초안, 데이터 계약, TDD 계획, 하위 이슈 분해, or Dogfood 계획.

Runtime note: some agent runtimes require the user to explicitly request or approve spawning actual subagents. That is an execution constraint of the runtime, not a POKit product rule. If the runtime does not permit subagents, the same planned work must run sequentially with the same artifacts and gates.

When an idea is decomposed for Linear, 하위 이슈 분해 must include a 병렬 실행 계획 and a Linear sub-issue dry-run. Each proposed sub-issue should name the responsible role, expected artifact, dependency, parallel eligibility, Done gate, public evidence path, external blocker, rollback plan, and idempotency key. The dry-run section in the artifact is the source for the user-facing Linear write preflight.

Definition artifacts under `artifacts/profiles/{profile}/...` are local drafts and may be ignored. Release-facing evidence must point to a public-safe redacted path such as `examples/definition-pipeline-sample/...`.

Features that depend on external content or providers must define provider/cost/limit, copyright/raw-content storage, privacy, rollback, and observability decisions before implementation.
