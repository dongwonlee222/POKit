---
linear_issue_id: POKIT-95
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 39f2445b7b68cbd398a8385a6d3d45d706635b56e4eb0e956dea33b14425c6e4
---

# Acceptance Criteria Draft: Backlog Intake 대화 모드와 예외 조건 정의

## Scenario

## 목적

Backlog Idea Card intake에서 정리, 토론, 어드바이스, 소크라테스식 질문 모드와 등록 전 stop condition을 구분해 사용자가 덜 헷갈리게 한다.

## 사용자 결과

사용자는 아이디어가 흐릿할 때는 질문을 받고, 방향이 잡힌 경우에는 바로 카드화되며, 위험하거나 애매한 경우에는 등록 전에 멈춘다.

## 대략 범위

* 정리 모드: raw idea를 Backlog Idea Card로 정리
* 토론 모드: 방향이 불명확할 때 장단점과 trade-off 정리
* 어드바이스 모드: 추천안 1개와 대안 1-2개 제시
* 소크라테스 모드: 한 번에 한 질문으로 목적, 사용자 결과, 하지 않을 것, 외부 위험을 좁힘
* stop condition 정의: 목적 불명확, 사용자 결과 없음, 범위 과대, 중복 가능성, 비용/법적/개인정보 위험, 외부 write 포함, 여러 제품 판단 혼합
* 카드 품질 gate 정의: PRD/Data Contract/TDD/Sub-issue로 커지지 않게 제한

## 하지 않을 것

* 모든 아이디어에 긴 질문 플로우를 강제하지 않는다.
* Linear 등록 전 깊은 PRD 작업을 시작하지 않는다.
* 위험 신호가 있는데 자동으로 Linear에 등록하지 않는다.

## Rough 성공 기준

* Intake flow가 대화 모드와 stop condition을 명확히 구분한다.
* POKit은 필요한 경우 한 번에 한 질문만 던진다.
* stop condition에 걸리면 Local JSON 저장/Linear 등록 대신 방향 확인으로 돌아간다.
* Backlog Idea Card가 PRD 수준으로 커지지 않도록 금지 목차가 있다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-95
- Linear URL: https://linear.app/example/issue/POKIT-95/backlog-intake-대화-모드와-예외-조건-정의
- Labels: pokit:criteria, Improvement
