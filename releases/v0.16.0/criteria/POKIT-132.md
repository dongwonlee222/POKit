---
linear_issue_id: POKIT-132
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: a0de97d7b9344cfea4381225ab523f8b0280aae522f979dd010cd73db0e1f396
---

# Acceptance Criteria Draft: v0.7.0 · 최종 설계 동기화와 아키텍처 기록장

## Scenario

구현 완료 후 실제 구조가 최종 설계 문서에 반영되도록 final design 문서 위치와 architecture ledger를 정의한다.

## 배포 묶음

Target version: `v0.7.0`
Release bundle: 설계 지속성 / 의도 검정

## Expected artifacts

* `templates/final-design.md`
* `docs/ARCHITECTURE.md` 또는 `docs/architecture/README.md`
* `docs/architecture/ledger.md`
* `docs/OPERATING_MODEL.md` final design sync 계약

## Done gate

* Parent/큰 이슈마다 최종 설계 위치가 정해진다.
* memory 방식, flow, hook, message catalog, subagent 역할, artifact 위치 변경은 architecture ledger에 기록된다.
* 구현 완료 보고 전에 "설계 갱신 필요 여부"를 확인한다.
* public-safe 최종본과 private/local draft 경계가 분리된다.

## 관계

Parent: [POKIT-130](https://linear.app/example/issue/POKIT-130/설계-지속성-및-의도-검정-운영-체계)
Related: [POKIT-98](https://linear.app/example/issue/POKIT-98/문서pdf-산출물-source-of-truth-정책-정리), [POKIT-109](https://linear.app/example/issue/POKIT-109/pokit-memory-mvp), [POKIT-115](https://linear.app/example/issue/POKIT-115/pokit-109-lifecycle-working-notes), [POKIT-116](https://linear.app/example/issue/POKIT-116/pokit-109-tracking-cycle-release-manifest), [POKIT-117](https://linear.app/example/issue/POKIT-117/pokit-109-governance-collected-data-정책), [POKIT-118](https://linear.app/example/issue/POKIT-118/pokit-109-sweep-collected-data-점검-리포트), [POKIT-119](https://linear.app/example/issue/POKIT-119/pokit-109-seed-초기-memory-notes-작성)
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

- Linear issue: POKIT-132
- Linear URL: https://linear.app/example/issue/POKIT-132/v070-최종-설계-동기화와-아키텍처-기록장
- Labels: pokit:criteria, docs
