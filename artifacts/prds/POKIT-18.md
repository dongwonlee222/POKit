---
linear_issue_id: POKIT-18
cycle_id: 2026-W20
artifact_type: prd
status: draft
skill_used: prd-author
content_hash: example-only
---

# PRD Draft: 결제 실패 사유 안내

## Problem

고객이 결제 실패 후 실패 이유와 다음 행동을 알기 어렵다. 같은 결제 수단으로 재시도하거나 고객센터에 문의하기 전, 화면에서 이해 가능한 안내가 필요하다.

## Goal

- 고객이 결제 실패 이유를 짧은 문장으로 이해한다.
- 고객이 다음 행동을 선택할 수 있다.
- 내부 에러 코드나 정책상 비공개 정보는 노출하지 않는다.

## Non-Goals

- 결제 정책 자체를 변경하지 않는다.
- 모든 PG 에러 코드를 그대로 고객에게 노출하지 않는다.
- 고객센터 운영 정책을 자동 변경하지 않는다.

## User Scenario

결제 시도 후 실패한 고객은 실패 화면에서 원인 분류와 추천 행동을 확인한다. 카드 한도, 인증 실패, 일시적 오류처럼 고객이 조치할 수 있는 경우에는 재시도 방법을 보여주고, 내부 확인이 필요한 경우에는 문의 경로를 안내한다.

## Requirements

- 실패 사유는 고객용 문구로 변환되어야 한다.
- 내부 에러 코드는 화면에 직접 노출하지 않는다.
- 재시도 가능한 실패와 문의가 필요한 실패를 구분한다.
- 실패 화면은 다음 행동을 하나 이상 제공한다.

## Acceptance Notes

- `pokit:criteria` 산출물로 세부 Given/When/Then을 분리할 수 있다.
- 고객 노출 금지 문구는 PO 확인이 필요하다.

## Open Questions

1. 고객에게 노출 가능한 실패 사유 분류는 어디까지인가?
2. 문의가 필요한 실패의 기본 CTA는 무엇인가?

## Source Context

- Fixture: `examples/day2-dry-run/linear-cycle-fixture.yaml`
- Issue: `POKIT-18`
- Label: `pokit:prd`
