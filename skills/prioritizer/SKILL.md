---
name: prioritizer
description: Cycle 또는 백로그의 이슈를 ICE-lite로 우선순위 평가한다. "우선순위 정해줘", "뭐부터 할까" 요청 시 대화형으로 진입.
entry: conversational
labels: []
trigger_phrases:
  - "우선순위 정해줘"
  - "뭐부터 할까"
  - "ICE 평가해줘"
  - "어떤 이슈 먼저 할까"
---

# prioritizer

## Trigger

Use when a POKit cycle or backlog needs a lightweight priority recommendation before implementation.

## Purpose

Score candidate Linear issues with ICE-lite:

- Impact: user or workflow value if the issue is completed now.
- Confidence: clarity of scope, evidence, and acceptance notes.
- Ease: expected implementation cost and risk.

The output is a dry-run plan only. Do not change Linear priority/status, cycle assignment, labels, or issue state from this skill.

## Required Context

Read only the context needed for the current recommendation:

- `memory/resume-brief.md` for the latest compact handoff and next Cycle-level action.
- The latest run summary, when referenced by `memory/context-map.yaml` or the current brief.
- `memory/decision-log.md` and `memory/decision-log.yaml` for durable policy or priority decisions.
- Current cycle and backlog issue id, title, label, state, and acceptance notes.

## Output

Return a compact table with:

- issue id and title
- Impact, Confidence, Ease scores from 1 to 5
- total score
- one-line rationale
- risk or missing clarification, if any

Then recommend one bundle. A bundle should move the current Cycle forward, not isolate one issue unless the user explicitly selected that issue.

## Safety Boundaries

- Linear priority/status changes are never applied automatically.
- Suggested overrides or policy choices become decision-log candidates only.
- Include a maximum of 3 decision-log candidates.
- Ask for user approval before appending to `memory/decision-log.md`.
- If scope is unclear, mark the item `Needs Clarification` instead of guessing.

## Example

```text
EVM-35 prioritizer ICE-lite 시범 구현
Impact 4 · Confidence 4 · Ease 3 · Total 11
Rationale: consumes existing history/model-tiering context and improves next-cycle planning.
```
