---
linear_issue_id: POKIT-141
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-141-criteria-2026-05-16
---

# Acceptance Criteria Draft — POKIT-141: OPERATING_MODEL 분할 docs/_details/

## Scenario

v0.8.0에서 `docs/OPERATING_MODEL.md` (727줄)를 인덱스 파일(30-50줄)로 슬림화하고, 주제별 정책 세부 내용을 `docs/_details/` 하위 7개 파일로 분할한다. 기존 외부 참조(앵커 링크 포함)가 깨지지 않고, 기존 테스트 213 PASS가 유지되거나 늘어난다.

## Criteria

### AC-1: docs/_details/ 디렉토리 및 7개 파일 생성

- Given: `docs/OPERATING_MODEL.md` 727줄 원본
- When: `ls docs/_details/` 실행
- Then: 다음 7개 파일이 모두 존재함:
  - `approval-flow.md`
  - `memory-contract.md`
  - `release-flow.md`
  - `cycle-flow.md`
  - `subagent-contract.md`
  - `completion-report.md`
  - `visualization.md`

### AC-2: docs/OPERATING_MODEL.md 인덱스화

- Given: 분할 완료 상태
- When: `wc -l docs/OPERATING_MODEL.md` 실행
- Then: 라인 수가 ≤ 80줄 (목표 30-50줄, 앵커 스텁 포함 허용)
- And: `canonical policy source` 문자열 포함 (release-md-audit 규칙)
- And: 7개 detail 파일로의 링크 포함
- And: 기존 H2 섹션 헤더가 앵커 타겟으로 보존됨 (AGENTS.md 불변 제약)

### AC-3: 앵커 링크 보존

- Given: AGENTS.md (수정 금지)가 다음 앵커를 참조함:
  - `docs/OPERATING_MODEL.md#problemerror-review-memo-contract`
  - `docs/OPERATING_MODEL.md#model-tier-policy`
  - `docs/OPERATING_MODEL.md#resume-brief-contract`
  - `docs/OPERATING_MODEL.md#external-write-confirmation-contract`
- When: 해당 앵커 URL로 접근
- Then: OPERATING_MODEL.md 내 해당 H2 섹션 헤더가 존재하여 앵커가 유효함

### AC-4: detail 파일 내용 완결성

- Given: 각 detail 파일
- When: 파일 내용 검사
- Then:
  - `approval-flow.md`: Write Safety, dry-run, idempotency key, external write boundary 섹션 포함
  - `memory-contract.md`: POKit Memory MVP Contract, Resume Brief Contract, frontmatter schema 포함
  - `release-flow.md`: Version Run Release Contract, Release And Hotfix Cycles, Public Release Safety 포함
  - `cycle-flow.md`: Cycle Steward, Weekly Cycle And Focus Runs, Cycle Step Progress, One-Time Celebration, Cycle Completion Ritual, Cycle-first Execution Guard 포함
  - `subagent-contract.md`: Main Context/Subagent Call Contract, Model Tier Policy, Definition Pipeline 포함
  - `completion-report.md`: Completion Report Contract, External Write Confirmation Contract 포함
  - `visualization.md`: Conversation Visualization Contract, ASCII rules 포함

### AC-5: 테스트 회귀 없음

- Given: 전체 테스트 스위트 실행
- When: `node --experimental-strip-types --test tests/*.test.mjs`
- Then: 기존 213 PASS 유지 또는 증가
- And: 사전 ENOENT 1건(korean-language-contract) 외 새로운 실패 없음
- And: OPERATING_MODEL 참조 테스트들이 docs/_details/*.md를 검사하도록 갱신됨

### AC-6: 외부 참조 갱신 (해당 시)

- Given: README.md, docs/architecture/, docs/VERSIONING.md 등에서 OPERATING_MODEL.md 참조
- When: 앵커 기반 링크 검사
- Then: OPERATING_MODEL.md H2 스텁이 유지되어 앵커 참조 유효
- Or: 해당 파일들이 새 docs/_details/ 경로로 갱신됨

### AC-7: AGENTS.md 불변

- Given: AGENTS.md 파일
- When: 분할 전후 비교
- Then: AGENTS.md 내용 변경 없음

## Edge Cases

- `definition-pipeline.test.mjs`와 `cycle3-docs.test.mjs`도 OPERATING_MODEL.md를 참조하므로, 해당 테스트들도 상세 파일 검사로 갱신됨
- `release-md-audit.ts`는 OPERATING_MODEL.md에서 `canonical policy source` 문자열만 검사하므로, 인덱스 파일에 해당 문자열 유지
- `scripts/ci/release-md-audit.ts`와 `scripts/cli/session-close.ts`는 수정 금지 (스크립트 제약)

## Source Context

- PRD: `artifacts/prds/POKIT-92.md` Requirements R4
- 원본: `docs/OPERATING_MODEL.md` 727줄
- 테스트: `tests/agent-rules.test.mjs`, `tests/definition-pipeline.test.mjs`, `tests/cycle3-docs.test.mjs`
