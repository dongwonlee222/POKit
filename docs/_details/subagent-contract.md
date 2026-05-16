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
- 모델 선택: <Opus 4.7 | Sonnet 4.6 | Haiku 4.5> — 이유
- 병렬화: <단일 | 병렬 N개 서브에이전트> — 분할 기준 또는 단일 진행 이유
- 외부 write: <없음 | N건 요약>
```

기준:

- **모델 선택**은 본 문서의 Model Tier Policy를 따른다. 제품 판단·통합·완료 선언이 있으면 Opus. bounded 구현·테스트는 Sonnet. mechanical edit은 Haiku. 메인 에이전트는 매 작업의 판단 강도에 맞춰 모델을 골라 보여준다.
- **병렬화 가능 조건**은 Definition Pipeline 섹션에 정의된 그대로다: (1) size=`full`인 작업, (2) 독립 stage 2개 이상, (3) 산출 파일 비중복. 셋 다 충족하지 않으면 단일 진행을 기본으로 한다.
- **외부 write**는 dry-run + 승인 + idempotency key 계약을 따른다. 진입 판단 시점에서는 예상 건수만 보여주고, 실제 dry-run은 외부 write 직전에 다시 한 번 보여준다.

이 판단은 한 줄짜리가 아니다. 단순 작업도 "단일 / 외부 write 없음"임을 명시한다 — 침묵 진입을 막기 위한 게이트다.

## Model Tier Policy

Use stronger models where judgment matters, and cheaper models where the contract is already narrow.

- Main agent: use the strongest available model for product judgment, ambiguity resolution, final integration, test interpretation, and user-facing completion claims.
- `gpt-5.4`: use for bounded implementation that touches API shape, state classification, user-facing scripts, or non-trivial tests.
- `gpt-5.4-mini`: use for first-pass documentation edits, fixture updates, and narrow mechanical cleanup when the policy contract is already clear.
- Subagents must own disjoint files or responsibilities. The main agent remains accountable for integration, verification, and Linear/GitHub safety.
- Lower-tier models must not make final Done decisions, final safety claims, or policy changes without main-agent review.

The optimization goal is simple: spend expensive reasoning on choices and verification, not on repeatable edits.

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

Definition artifacts under `artifacts/profiles/{profile}/...` are local drafts and may be ignored. Release-facing evidence must point to a public-safe redacted path such as `examples/definition/{issue}/...`.

Features that depend on external content or providers must define provider/cost/limit, copyright/raw-content storage, privacy, rollback, and observability decisions before implementation.
