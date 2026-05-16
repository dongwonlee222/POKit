---
linear_issue_id: POKIT-7
cycle_id: <example-cycle-id>
artifact_type: prd
status: draft
skill_used: prd-author
content_hash: c68f8a05c52b1abef08d2024679fab8dd2d43f8a489f7a917c08cc0e2275c1ec
---

# PRD Draft: PRD/criteria artifact draft 생성 runner 구현

## Problem

dry-run summary에서 생성 가능으로 분류된 issue에 대해 PRD 또는 acceptance criteria draft 파일을 생성한다.

Scope:

* pokit:prd -> artifacts/prds/\[issue-id\].md
* pokit:criteria -> artifacts/criteria/\[issue-id\].md
* content_hash frontmatter를 기록한다.
* 기존 파일 hash가 바뀌면 덮어쓰지 않고 Needs Approval로 표시한다.

## Goal

- TODO: 목표를 PO가 확인한다.

## Non-Goals

- TODO: 제외 범위를 PO가 확인한다.

## User Scenario

- TODO: 대표 사용자 시나리오를 작성한다.

## Requirements

- TODO: 구현 요구사항을 정리한다.

## Acceptance Notes

- TODO: 검증 관점 메모를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-7
- Linear URL: https://linear.app/example/issue/POKIT-7/prdcriteria-artifact-draft-생성-runner-구현
- Labels: pokit:prd
