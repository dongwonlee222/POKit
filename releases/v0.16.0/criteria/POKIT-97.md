---
linear_issue_id: POKIT-97
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: ec93f15d0ce52ee4d0510f8b17d1e14aabc0209c9c654a3bde222e2b578b42cf
---

# Acceptance Criteria Draft: Backlog 우선순위 점수와 난이도 시각화

## Scenario

## 목적

Backlog 후보와 다음 Cycle 후보에서 우선순위, 난이도, 점수 근거가 보이게 해 '우선순위대로'가 실제 판단 가능한 화면이 되게 한다.

## 사용자 결과

사용자는 후보 목록에서 왜 이 순서인지, 어떤 이슈가 영향도가 높고 쉬운지, 어떤 이슈가 보류인지 한눈에 이해한다.

## 대략 범위

* Backlog Idea JSON에 priority model 필드 추가: ICE-lite, impact, confidence, ease, total, bucket
* difficulty 필드 추가: S/M/L 또는 estimate 연동
* Linear issue description에 priority reason과 difficulty 표시
* session-brief backlog detail과 candidate detail에 ICE-lite, difficulty, confidence 표시
* Linear native priority 변경은 사용자 승인 전 자동 실행하지 않는 규칙 유지
* 우선순위 시각화 예: 🔥 P0, ⭐ P1, 🌱 P2, 💤 P3

## 하지 않을 것

* black-box priority 자동 결정을 만들지 않는다.
* Linear priority 필드를 사용자 승인 없이 변경하지 않는다.
* 점수를 유일한 Cycle 결정 기준으로 삼지 않는다.

## Rough 성공 기준

* Backlog detail에서 각 후보의 priority score와 난이도가 보인다.
* POKit은 추천 순서의 이유를 짧게 표시한다.
* 사용자가 override하면 override 이유를 남길 수 있다.
* 점수 없는 이슈는 '점수 없음'으로 표시되어 보강 필요 상태가 드러난다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-97
- Linear URL: https://linear.app/example/issue/POKIT-97/backlog-우선순위-점수와-난이도-시각화
- Labels: pokit:criteria, Improvement
