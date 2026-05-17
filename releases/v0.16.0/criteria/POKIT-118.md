---
linear_issue_id: POKIT-118
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: dc90c3df1959520a633863b68633fa5f7cc3b83867b7628edc5104ecac040baa
---

# Acceptance Criteria Draft: POKIT-109 · Sweep · Collected Data 점검 리포트

## Scenario

## 목적

수집 데이터의 retention/redaction 위험을 자동 삭제 없이 리포트한다.

## 범위

* retention_until 지난 raw 리포트
* sidecar 없는 raw 파일 리포트
* contains_pii: true + redaction_status: raw 상태가 오래된 항목 리포트
* 자동 삭제는 하지 않음

## 관계

Parent: [POKIT-109](https://linear.app/example/issue/POKIT-109/pokit-memory-mvp)
Depends on: [POKIT-117](https://linear.app/example/issue/POKIT-117/pokit-109-governance-collected-data-정책)
Related: Unified Memory Index, Private Memory Boundary
Source: Opus collected data review

## Expected artifact

* `scripts/collected-sweep.ts`
* sample report

## Done gate

* collected data 정리 후보를 사람이 검토할 수 있게 출력한다.
* 자동 삭제나 외부 write를 하지 않는다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-118
- Linear URL: https://linear.app/example/issue/POKIT-118/pokit-109-sweep-collected-data-점검-리포트
- Labels: pokit:criteria, Improvement
