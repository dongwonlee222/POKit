---
linear_issue_id: POKIT-115
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: df29039ddd3fc56997f83bfcc16e40f7fb28c8a88c175df203dc947f0ae406ef
---

# Acceptance Criteria Draft: POKIT-109 · Lifecycle · Working Notes

## Scenario

## 목적

작업기억을 별도 top-level이 아니라 작업물 기억의 WIP 단계로 운영한다.

## 범위

* `artifacts/profiles/{profile}/working-notes/{issue}.md`
* 1 issue = 1 working note
* `status: wip | blocked | done | abandoned`
* Done 시 상단 summary 추가
* Cycle close 시 `_archive/`로 이동
* 장기기억 승격은 회고에서 수동 판단

## 관계

Parent: [POKIT-109](https://linear.app/example/issue/POKIT-109/pokit-memory-mvp)
Depends on: [POKIT-112](https://linear.app/example/issue/POKIT-112/pokit-109-schema-minimal-frontmatter-규칙)
Related: Cycle / Release Manifest Tracking, Unified Memory Index
Source: Opus working memory + traceability review

## Expected artifact

* working note template 또는 운영 규칙
* archive lifecycle 문서

## Done gate

* 작업 중 임시 상태와 확정 작업물이 섞이지 않는다.
* 완료 후 working note 처리 정책이 명확하다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-115
- Linear URL: https://linear.app/example/issue/POKIT-115/pokit-109-lifecycle-working-notes
- Labels: pokit:criteria, Improvement
