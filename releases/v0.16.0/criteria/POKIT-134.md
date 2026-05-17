---
linear_issue_id: POKIT-134
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: db99b724faabfcc8cf48902b653cc339d8bc82d7f6131f7812cc6f3f10d28fbd
---

# Acceptance Criteria Draft: v0.7.0 · 구현 후 설계 동기화 체크리스트

## Scenario

구현이 끝난 뒤 설계, memory, flow, hook, message, subagent 역할, artifact 위치가 바뀌었는지 확인하는 completion checklist를 만든다.

## 배포 묶음

Target version: `v0.7.0`
Release bundle: 설계 지속성 / 의도 검정

## Expected artifacts

* `templates/post-implementation-design-sync.md`
* `scripts/post-implementation-design-sync.ts`
* `tests/post-implementation-design-sync.test.mjs`
* `docs/OPERATING_MODEL.md` completion report contract 보강

## Done gate

* completion report 전에 설계 갱신 필요 여부를 확인한다.
* 변경이 없으면 "설계 변경 없음"을 증거와 함께 남긴다.
* 변경이 있으면 final design 또는 architecture ledger 갱신 후보를 표시한다.
* 외부 write가 필요한 변경은 dry-run, approval, idempotency key로 멈춘다.

## 관계

Parent: [POKIT-130](https://linear.app/example/issue/POKIT-130/설계-지속성-및-의도-검정-운영-체계)
Related: [POKIT-92](https://linear.app/example/issue/POKIT-92/pokit-반복-운영-흐름을-경량-스킬로-분리), [POKIT-98](https://linear.app/example/issue/POKIT-98/문서pdf-산출물-source-of-truth-정책-정리), [POKIT-124](https://linear.app/example/issue/POKIT-124/agentsmd-크기-제한-회귀-방지)
Source: artifacts/backlog/design-continuity-intent-audit-backlog-dry-run.md

## Idempotency

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-134
- Linear URL: https://linear.app/example/issue/POKIT-134/v070-구현-후-설계-동기화-체크리스트
- Labels: pokit:criteria, Improvement
