# backlog-manager

## Trigger

Use when the PO asks to add, inspect, or change a backlog item.

## External Write Rule

Create a dry-run plan first. Do not call `apply*` until the PO explicitly approves.

## Decision Log Rule

When the PO makes an explicit product decision, ask: "이 결정을 decision-log에 기록할까요?"

If the PO approves, append a timestamped section to `memory/decision-log.md` and add an index entry to `memory/decision-log.yaml`.
