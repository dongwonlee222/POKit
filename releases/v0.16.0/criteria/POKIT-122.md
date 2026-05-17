---
linear_issue_id: POKIT-122
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 4a50e34ccfea3c5880c7702ca6b4efa7194936a32b106f733a6c41d7ba0509b7
---

# Acceptance Criteria Draft: Problem Review 메모 → Backlog 후보 자동 감지

## Scenario

로컬 `artifacts/backlog/*problem-review.md` 메모 중 아직 Linear Backlog로 등록되지 않은 개선 후보를 자동으로 감지하고 dry-run으로 보여준다.

## 배경

Problem/Error Review 메모가 쌓이면 재발 방지 후보가 로컬에만 남고 Linear Backlog 추적에서 빠질 수 있다.

## 범위

* `artifacts/backlog/*problem-review.md`를 스캔한다.
* 이미 연결된 `*-linear-dry-run.md` 또는 Linear issue 근거가 있는 항목은 중복 후보에서 제외한다.
* 신규 후보는 title, evidence path, 추천 label, idempotency key, 예상 artifact, Done gate를 포함해 dry-run으로 출력한다.
* 외부 Linear 생성은 별도 승인 후에만 실행한다.

## Expected artifact

* `scripts/problem-review-backlog-detector.ts` 또는 기존 backlog preflight script 확장
* 테스트 fixture와 문서 규칙 테스트

## Done gate

* Problem/Error Review 메모 1개 이상이 Linear 후보로 자동 분류된다.
* 이미 처리된 메모는 중복 생성 후보에서 제외된다.
* 출력은 한국어 dry-run과 idempotency key를 포함한다.

## 관계

Parent: none
Depends on: Problem/Error Review Memo Contract
Related: [POKIT-121](https://linear.app/example/issue/POKIT-121/problemerror-review-응답-표준화)
Source: artifacts/backlog 내 Problem/Error Review 메모들
Evidence: session brief backlog detail의 Problem/Error Review 메모 목록

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-122
- Linear URL: https://linear.app/example/issue/POKIT-122/problem-review-메모-backlog-후보-자동-감지
- Labels: pokit:criteria, Improvement
