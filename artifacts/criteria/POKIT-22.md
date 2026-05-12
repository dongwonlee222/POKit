---
linear_issue_id: POKIT-22
cycle_id: 2026-W20
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: example-only
---

# Acceptance Criteria Draft: 세션 시작 State Brief

## Scenario

PO가 Codex 또는 Claude Code를 repo root에서 열면 POKit은 `memory/context-map.yaml`을 기준으로 최소 memory만 읽고 짧은 State Brief를 보여준다.

## Criteria

- Given `memory/context-map.yaml` has a `read_order`
- When a POKit session starts
- Then the agent reads only listed memory/artifact files before showing the State Brief

- Given `memory/current-cycle.yaml` has no active cycle id
- When a POKit session starts
- Then the State Brief says no active cycle is loaded

- Given the cycle state has not changed since the last session
- When a POKit session starts
- Then no Action Nudge is shown

- Given the cycle state changed or missing labels exist
- When a POKit session starts
- Then at most one Action Nudge is shown

## Edge Cases

- Weather lookup fails: omit weather silently.
- Last run summary is missing: show `없음` rather than creating a new summary.
- Context file is missing: mark State Brief as incomplete and ask for repair.

## Open Questions

- State Brief timestamp format should follow `ko-KR` or ISO?
- Should weather be disabled by default for public repo users?

## Source Context

- Fixture: `examples/day2-dry-run/linear-cycle-fixture.yaml`
- Issue: `POKIT-22`
- Label: `pokit:criteria`
