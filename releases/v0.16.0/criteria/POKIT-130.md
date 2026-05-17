---
linear_issue_id: POKIT-130
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 3b4590ba1b7e960675f960abcb14fa6a7f01464dd937404482cad8d3ae41c179
---

# Acceptance Criteria Draft: v0.7.0 · 설계 지속성 및 의도 검정 운영 체계

## Scenario

POKit의 설계, 구현, 검증, 배포, 다음 세션 context가 같은 의도를 유지하도록 설계 의도 검정과 최종 설계 동기화 흐름을 만든다. 구현 완료 후 설계가 낡지 않도록 아키텍처 기록장, 메시지 카탈로그, 훅 하네스, release gate를 연결한다.

## 배경

POKit이 커질수록 구현된 기능, hook, memory, message, subagent flow가 설계 문서와 어긋날 수 있다. 개발 완료 시점에 "처음 의도와 맞는가"만 확인하는 것이 아니라, 실제 구현 결과를 최종 설계에 다시 반영하는 순환 구조가 필요하다.

## 배포 묶음

Target version: `v0.7.0`
Release bundle: 설계 지속성 / 의도 검정

이 이슈는 주간 Linear Cycle을 새로 만드는 작업이 아니라, 다음 배포 버전에 함께 포함할 운영 체계 묶음을 정의한다.

## 완료 기준

* 개발 완료 후 최종 설계 갱신 여부를 확인하는 절차가 문서화된다.
* PRD/criteria/data contract/TDD plan/구현 diff/test/release note를 대조하는 audit 산출물이 정의된다.
* release preflight 또는 cycle close gate에서 design intent audit을 실행하거나 확인한다.
* memory, flow, hook, message, subagent 구조 변경은 architecture ledger에 남는다.
* 사용자 승인 없이는 Linear/GitHub write를 하지 않는다.

## 관계

Related: [POKIT-92](https://linear.app/example/issue/POKIT-92/pokit-반복-운영-흐름을-경량-스킬로-분리), [POKIT-98](https://linear.app/example/issue/POKIT-98/문서pdf-산출물-source-of-truth-정책-정리), [POKIT-109](https://linear.app/example/issue/POKIT-109/pokit-memory-mvp), [POKIT-124](https://linear.app/example/issue/POKIT-124/agentsmd-크기-제한-회귀-방지)
Source: artifacts/backlog/design-continuity-intent-audit-backlog-dry-run.md
Evidence: 2026-05-16 POKit context/design continuity discussion

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

- Linear issue: POKIT-130
- Linear URL: https://linear.app/example/issue/POKIT-130/v070-설계-지속성-및-의도-검정-운영-체계
- Labels: pokit:criteria, Improvement
