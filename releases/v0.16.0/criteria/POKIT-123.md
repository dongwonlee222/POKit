---
linear_issue_id: POKIT-123
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: dd55cee7a463240da94187160cf238e12cc1eced43039395b563bc2cca3b1bc8
---

# Acceptance Criteria Draft: Linear GraphQL shell-safe 실행 래퍼

## Scenario

터미널에서 Linear GraphQL 쿼리를 실행할 때 zsh shell expansion이나 quoting 문제로 쿼리가 깨지지 않도록 안전한 실행 래퍼를 만든다.

## 배경

Linear cycle 확인 중 shell expansion 문제로 GraphQL 쿼리가 깨진 사례가 있었다. 같은 문제가 반복되면 Cycle 상태 확인과 외부 write preflight가 불안정해진다.

## 범위

* shell에 직접 GraphQL 본문을 흘리지 않는 안전 실행 방식을 제공한다.
* 파일 기반 query 또는 Node 함수 기반 wrapper 중 repo 패턴에 맞는 방식을 선택한다.
* 실패 시 Problem/Error Review 형식으로 원인과 다음 조치를 출력한다.
* 기존 Linear read/write 승인 경계는 변경하지 않는다.

## Expected artifact

* `scripts/linear-query-safe.ts` 또는 `scripts/linear.ts` helper
* shell expansion 회귀 테스트
* `scripts/README.md` 사용 예시

## Done gate

* 중괄호, `$`, quote가 포함된 GraphQL query가 shell expansion 없이 실행된다.
* 실패 메시지가 command, 원인, 재시도 경로를 포함한다.
* 외부 write mutation은 기존 approval/idempotency gate를 계속 통과해야 한다.

## 관계

Parent: none
Depends on: none
Related: Linear preflight reliability
Source: artifacts/backlog/linear-cycle-query-shell-expansion-problem-review.md
Evidence: shell expansion Problem/Error Review memo

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-123
- Linear URL: https://linear.app/example/issue/POKIT-123/linear-graphql-shell-safe-실행-래퍼
- Labels: pokit:criteria, Improvement
