---
linear_issue_id: POKIT-125
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 7062ead3e53a410f00f168c1f2e38f50c88f7f91363987def47d3ae592ead8c7
---

# Acceptance Criteria Draft: Focus Run label/relation sync preflight

## Scenario

Cycle 구성 시 Focus Run label, issue label assignment, saved view 안내, Linear relation sync를 한 번에 dry-run으로 출력한다.

## 배경

Operating Cycle 1에서 문서상 약속한 `1.1`, `1.2` Focus Run 묶음이 실제 Linear label/issue assignment로 반영되지 않았다. Parent/child 관계는 일부 설정됐지만 related/blocks 관계도 일부 비어 있다.

## 범위

* 현재 Cycle에 Focus Run label이 없으면 `Focus Run 미설정` 경고를 표시한다.
* `1.1`, `1.2` 같은 Focus Run label 생성/배정 계획을 dry-run으로 출력한다.
* parent/child는 있으나 related/blocks가 비어 있는 issue를 `관계 확인 필요`로 표시한다.
* saved view는 자동 생성이 어렵다면 사용자용 설정 안내를 출력한다.
* Linear write는 dry-run, approval, idempotency key 뒤에만 실행한다.

## Expected artifact

* `scripts/focus-run-sync-preflight.ts`
* `tests/focus-run-sync-preflight.test.mjs`
* `scripts/README.md` 사용 예시

## Done gate

* Operating Cycle 1 같은 새 Cycle에서 `1.1`, `1.2` Focus Run 묶음 계획이 자동으로 제안된다.
* Focus Run label/relation 적용 전후가 dry-run으로 비교된다.
* 기존 issue 상태, Cycle 배정, Done 상태를 임의로 바꾸지 않는다.

## 관계

Parent: none
Depends on: none
Related: [POKIT-91](https://linear.app/example/issue/POKIT-91/pokit-단계별-진행도-프로그레스-바를-모든-cycle-응답에-표시), [POKIT-109](https://linear.app/example/issue/POKIT-109/pokit-memory-mvp), [POKIT-120](https://linear.app/example/issue/POKIT-120/cycle-완료-직후-축하-메시지-1회-강제)
Source: artifacts/backlog/focus-run-and-relation-sync-missing-problem-review.md
Evidence: artifacts/backlog/focus-run-error-hook-visualization-backlog-dry-run.md

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-125
- Linear URL: https://linear.app/example/issue/POKIT-125/focus-run-labelrelation-sync-preflight
- Labels: pokit:criteria, Improvement
