---
name: backlog-manager
description: PO가 백로그 아이템을 추가·조회·변경할 때 사용한다. "백로그 추가해줘", "이슈 만들어줘" 등 자연어 요청으로 진입하며 dry-run plan 후 승인 대기.
entry: conversational
labels: []
trigger_phrases:
  - "백로그 추가해줘"
  - "이슈 만들어줘"
  - "백로그 변경"
  - "backlog 추가"
---

# backlog-manager

## Trigger

Use when the PO asks to add, inspect, or change a backlog item.

## LLM-first Rule

The user speaks in natural language. The LLM converts the request into a dry-run backlog plan, shows the proposed Linear issue/label/cycle changes, and waits for approval before any external write.

Node scripts are helper calls for the LLM, not the default user interface.

## External Write Rule

Create a dry-run plan first. Do not call `apply*` until the PO explicitly approves.

## Decision Log Rule

When the PO makes an explicit product decision, ask: "이 결정을 decision-log에 기록할까요?"

If the PO approves, append a timestamped section to `memory/decision-log.md` and add an index entry to `memory/decision-log.yaml`.
