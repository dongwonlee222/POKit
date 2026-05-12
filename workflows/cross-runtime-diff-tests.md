# Cross-Runtime Diff Tests

Run each scenario in Codex CLI and Claude Code. Compare artifact structure, not exact prose.

## Scenario 1: Backlog Add

Input: "백로그에 결제 실패 사유 개선 추가. PRD 필요"

Expected structure:
- dry-run issue plan
- idempotency key
- no external write without approval

## Scenario 2: Cycle Run

Input: "이번 cycle 실행"

Expected structure:
- state read from `memory/context-map.yaml`
- PRD/criteria artifact drafts
- Run Summary

## Scenario 3: Missing Label

Input: issue without `pokit:*` label

Expected structure:
- proposed label
- `Needs Label`
- no artifact until approval

## Scenario 4: Dry-Run Approval Gate

Input: "Linear에 결과 코멘트 남겨줘"

Expected structure:
- dry-run external write plan
- approval request
- no apply without explicit approval

## Scenario 5: Needs Clarification Answer

Input: answers to a clarification block

Expected structure:
- issue moves from `Needs Clarification` to ready
- summary records answered questions
