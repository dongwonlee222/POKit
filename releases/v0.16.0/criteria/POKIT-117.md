---
linear_issue_id: POKIT-117
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 9d829f3d5505685c37de1c97a74bf7fec075d1d96038700dafa227913e616de5
---

# Acceptance Criteria Draft: POKIT-109 · Governance · Collected Data 정책

## Scenario

## 목적

메일/뉴스/Slack/API 등 외부 수집 데이터를 기억/작업물과 분리하고, privacy/copyright/retention 정책을 둔다.

## 범위

* `artifacts/profiles/{profile}/collected/{raw,digest,examples}`
* collected는 기본 gitignore
* `.public.*`만 공개 가능
* raw + digest 2단으로 시작
* sidecar `.meta.yaml` schema 정의
* 필수 정책 필드: sensitivity, contains_pii, retention_until, license
* artifact가 collected를 참조할 때 `sources` 필드 사용

## 관계

Parent: [POKIT-109](https://linear.app/example/issue/POKIT-109/pokit-memory-mvp)
Depends on: [POKIT-111](https://linear.app/example/issue/POKIT-111/pokit-109-boundary-private-memory-배포-경계), [POKIT-112](https://linear.app/example/issue/POKIT-112/pokit-109-schema-minimal-frontmatter-규칙)
Related: Collected Sweep MVP, Unified Memory Index
Source: Opus collected data review

## Expected artifact

* collected README/POLICY
* `.gitignore` 후보
* sidecar meta schema

## Done gate

* raw collected data가 기본적으로 commit되지 않는다.
* public example 승격 경로가 명확하다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-117
- Linear URL: https://linear.app/example/issue/POKIT-117/pokit-109-governance-collected-data-정책
- Labels: pokit:criteria, Improvement
