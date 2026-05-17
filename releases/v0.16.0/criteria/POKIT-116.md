---
linear_issue_id: POKIT-116
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 27a789490ecdc602a759603b3a5c94a7518f6ae97ae34eb49e596314ad0cdfb9
---

# Acceptance Criteria Draft: POKIT-109 · Tracking · Cycle / Release Manifest

## Scenario

## 목적

각 artifact frontmatter에 cycle/release/done/deploy를 박지 않고, manifest와 Linear에서 추적성을 derive한다.

## 범위

* `artifacts/profiles/{profile}/cycles/{cycle}.yaml`
* `artifacts/profiles/{profile}/releases/{version}.yaml`
* artifact frontmatter에는 `linear_issue`만 둔다
* cycle/release/done/deploy 정보는 manifest와 Linear에서 join
* 과거 artifact metadata는 retrofit하지 않고 당시 기록으로 보존

## 관계

Parent: [POKIT-109](https://linear.app/example/issue/POKIT-109/pokit-memory-mvp)
Depends on: [POKIT-112](https://linear.app/example/issue/POKIT-112/pokit-109-schema-minimal-frontmatter-규칙)
Related: Working Notes Lifecycle, Unified Memory Index
Source: Opus working memory + traceability review

## Expected artifact

* cycle snapshot manifest schema
* release manifest schema

## Done gate

* 특정 issue가 어느 cycle/release에 포함됐는지 manifest로 추적 가능하다.
* artifact frontmatter에 volatile release/cycle 상태를 중복 저장하지 않는다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-116
- Linear URL: https://linear.app/example/issue/POKIT-116/pokit-109-tracking-cycle-release-manifest
- Labels: pokit:criteria, Improvement
