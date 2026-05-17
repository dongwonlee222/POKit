---
linear_issue_id: POKIT-131
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 3e0d37addc2fcabab7122f99bf0c9fd934e4bdc48b795bb8256cc49d8bcf76db
---

# Acceptance Criteria Draft: v0.7.0 · 설계 의도 검정 게이트

## Scenario

PRD, 완료 기준, data contract, TDD plan, 구현 diff, 테스트 결과, release note를 대조해 의도 일치 여부를 `pass / gap / changed / skipped / needs approval`로 판정하는 gate를 만든다.

## 배포 묶음

Target version: `v0.7.0`
Release bundle: 설계 지속성 / 의도 검정

## Expected artifacts

* `scripts/design-intent-audit.ts`
* `tests/design-intent-audit.test.mjs`
* `templates/design-intent-audit.md`
* `docs/OPERATING_MODEL.md` gate 설명

## Done gate

* audit 입력으로 issue id, definition artifact path, test evidence, release evidence를 받는다.
* 누락된 최종 설계 또는 완료 기준이 있으면 `gap`으로 표시한다.
* 구현이 원래 의도와 달라졌지만 승인 기록이 없으면 `needs approval`로 표시한다.
* cycle close 또는 release preflight에서 audit 결과를 참조할 수 있다.

## 관계

Parent: [POKIT-130](https://linear.app/example/issue/POKIT-130/설계-지속성-및-의도-검정-운영-체계)
Related: [POKIT-92](https://linear.app/example/issue/POKIT-92/pokit-반복-운영-흐름을-경량-스킬로-분리), [POKIT-98](https://linear.app/example/issue/POKIT-98/문서pdf-산출물-source-of-truth-정책-정리)
Source: artifacts/backlog/design-continuity-intent-audit-backlog-dry-run.md

## Idempotency

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-131
- Linear URL: https://linear.app/example/issue/POKIT-131/v070-설계-의도-검정-게이트
- Labels: pokit:criteria, Improvement
