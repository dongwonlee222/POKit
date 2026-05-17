---
linear_issue_id: POKIT-96
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: b3001e475ec664c2f3e6a8b678ec7698223c1b7b550017ec79bdeedb37313e22
---

# Acceptance Criteria Draft: Backlog Idea 가설·측정·토큰 추적 필드 추가

## Scenario

## 목적

PO 관점에서 Backlog Idea가 단순 요구사항이 아니라 가설, 성공 신호, 측정 계획, 토큰 비용을 가진 판단 카드가 되게 한다.

## 사용자 결과

사용자는 이 아이디어가 왜 가치 있는지, 나중에 맞았는지 어떻게 볼지, 구체화에 어느 정도 토큰/조사 비용이 들지 미리 알 수 있다.

## 대략 범위

* Backlog Idea JSON에 `hypothesis`, `success_signal`, `measurement_plan`, `token_budget` 필드 추가
* Linear issue description에도 가설/성공 신호/측정 계획/토큰 예산 섹션 포함
* intake/refinement/execution token cost를 구분하는 기준 정의
* external research, subagent, PDF/DOCX generation 같은 token-expensive action 표시
* Run Summary 또는 Cycle Close에서 측정 결과를 기록하는 방식 정의

## 하지 않을 것

* 정확한 API 과금 단가 계산기를 만들지 않는다.
* Backlog 등록 전에 실제 측정 결과를 채우려고 하지 않는다.
* PO 판단을 자동 확정하지 않는다.

## Rough 성공 기준

* 새 Backlog Idea Card에는 rough hypothesis가 들어간다.
* Linear 이슈에도 success signal과 measurement plan이 보인다.
* Cycle close에서 측정 결과와 토큰 비용 회고를 남길 수 있다.
* 토큰 예산 초과가 예상되면 POKit이 scope 축소나 Cycle 구체화 이관을 제안한다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-96
- Linear URL: https://linear.app/example/issue/POKIT-96/backlog-idea-가설측정토큰-추적-필드-추가
- Labels: pokit:criteria, Improvement
