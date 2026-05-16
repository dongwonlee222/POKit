# Completion Report Contract and External Write Confirmation

## Completion Report Contract

When POKit finishes a work item, it should close with a short report instead of leaving the user to infer the next step.

Default completion response must be short. Use one or two sentences for ordinary local edits, rule updates, and minor Linear maintenance. Do not make the user read a report after every step.

Use structured completion reports only for Cycle close, external write result summaries, test failures, approval-pending work, or when the user explicitly asks for a report/summary.

Before any completion claim, run a flow adherence check. Identify the relevant documented flow, confirm required artifacts were produced with the expected names and titles, confirm verification ran, and state any skipped steps or deviations. For short completion responses this can be one compact sentence; for structured reports include it under 검증 결과.

When structured reporting is needed, use this order so the next step stays visible:

1. ✅ 완료한 것
2. ➡️ 다음 작업
3. ⏳ 아직 안 한 것 / 승인 대기
4. 🧪 검증 결과

For unfinished or approval-pending work, include enough task content to act without looking elsewhere:

- issue ID
- title
- current status
- why it is pending
- next task

The final line should describe what POKit will do next, not a sentence the user needs to copy back.

Use emoji as section markers only. They should make status easier to scan, not make the report decorative.

The final line must point at the next Cycle outcome, not a mechanical substep. If the next step is already covered by the approved Cycle intent, continue without asking. Ask only when the next step needs external write approval, destructive action approval, product judgment, or scope clarification. Use issue-specific wording only when the user selected that issue or numbered candidate.

## External Write Confirmation Contract

The same cycle completion message should not repeat unless the cycle state changes. Do not ask the user to copy a long execution sentence. When an external write or real product judgment choice is proposed, end the dry-run with an emoji-scannable recommendation block. Only show choices when a real decision is required; do not turn mechanical substeps into approvals.

External write dry-runs are mandatory at approval boundaries. A completion response that says an external write was skipped is incomplete unless it also includes the executable dry-run or points to the already-rendered dry-run from the same turn.

Before the choice block, render the external write preflight progress with `scripts/render/ascii.ts#renderPreflightStatusBlock`. A/B choice wording should come from `renderDecisionChoiceBlock` or match it exactly. This keeps emoji, ASCII bars, and approval language stable after session resume or context compaction.

```text
사용자 확인

🤔 선택이 필요한 이유: <external write, product judgment, ambiguity, destructive risk>

✅ 추천안 A: <recommended action>
이유: <why A is safer/better for the current Cycle>

↩️ 대안 B: <alternative action>
차이: <trade-off or why it is not preferred>

A/B로 선택해 주세요.
```

If the user selects A, execute the recommended action. If the user selects B, ask what to change and revise the dry-run. Do not show choices when the next step is already covered by the approved Cycle intent.

POKit operational completion and Linear date-based cycle state can drift. When a Cycle is operationally complete but still appears as Linear current or upcoming, print a cycle maintenance dry-run before applying any Linear cycle update:

```bash
node --experimental-strip-types scripts/cycle-maintenance.ts --completed-at 2026-05-13T15:00:00.000Z
```

The dry-run may propose `cycleUpdate` plans with `completedAt` and an explanatory description. Apply those plans only after user approval because they change Linear cycle state.

## Flow Adherence Check

Before reporting procedure/Cycle completion, confirm documented flow name, required artifacts, naming/title conventions, verification, and skipped steps. For short completion responses this can be one compact sentence; for structured reports include it under 검증 결과.
