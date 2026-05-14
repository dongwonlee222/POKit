# POKit Agent Instructions

Default language: ko-KR.

## Agent Compression Rules

- 필요한 문서만 읽고, 현재 작업에 직접 관련 없는 긴 원문은 건너뛴다.
- 철학 설명은 파일별 역할에 맞게 나눠 쓰고, 같은 문장을 반복하지 않는다.
- 사용자 승인과 기계적 실행은 한 흐름으로 묶되, 외부 write는 항상 별도 승인 경계를 지킨다.
- Linear backlog와 cycle을 기본 작업면으로 보고, 로컬 초안과 요약은 가볍게 유지한다.
- 바깥 시스템을 바꾸기 전에는 dry-run 계획이 먼저다.

When a POKit session starts:
1. Read `memory/context-map.yaml`.
2. Read only the memory/artifact files listed in `read_order`.
3. Show the compact POKit Brief dashboard.
4. Include current cycle counts, numbered next cycle candidates with issue IDs/titles, one recommended bundle, and a compact user confirmation choice.
5. Show at most one Action Nudge only when state changed.

When the user says "POKit 시작해줘", "현재 상태 브리핑해줘", or "다음에 뭐 하면 돼?", run or emulate:

```bash
node --experimental-strip-types scripts/session-brief.ts
```

For detail views, run or emulate:

```bash
node --experimental-strip-types scripts/session-brief.ts --detail cycle
node --experimental-strip-types scripts/session-brief.ts --detail backlog
node --experimental-strip-types scripts/session-brief.ts --detail approvals
node --experimental-strip-types scripts/session-brief.ts --candidate 1
```

If the user explicitly asks for a numbered detail such as "1번 자세히", map the number to the current brief candidates before answering. Do not suggest numbered or issue-only execution as the next action unless the user explicitly selects that issue.

For longer runs, use the goal loop in `docs/GOAL_LOOP.md`.

- In Claude Code, the user may set `/goal` with a verifiable completion condition.
- In Codex, emulate the same loop with POKit Brief, session task list, skills, scripts, tests, and Linear Done updates.
- Always create or confirm the Linear task list before implementation.
- Before durable implementation, run or emulate `node --experimental-strip-types scripts/cycle-guard.ts --issue EVM-123 --cycle-id <cycle-id>`.
- Before assigning work to a cycle, run or emulate `node --experimental-strip-types scripts/cycle-guard.ts --operation cycle_assignment --issue EVM-123 --cycle-id <target-cycle-id>`.
- Backlog-only work may plan, inspect, and produce dry-run artifacts, but must not change durable project files.
- New work must enter Linear as a Backlog item first, then be grouped into the current Cycle bundle before implementation. Do not run durable work from chat-only intent.
- Completed cycles are immutable by default. If a cycle is operationally complete, move new work to the next cycle; do not add Todo back into the completed cycle unless the user explicitly says to reopen it.
- When the user asks to confirm a completed cycle and bundle the next candidates, interpret that as next-cycle preparation, not as adding work back into the completed cycle.
- When a user asks to proceed, the default scope is the whole current Cycle, not a single issue. Treat local edits, verification, commit, and Linear Done as one Cycle-completion flow unless the user explicitly narrows the scope.
- Do not ask the user to approve mechanical substeps like "commit this task" or "mark this task Done" after they approved progressing the Cycle. Pause only when definition is insufficient, or for destructive actions, public pushes/releases/tags, ambiguous scope, or policy changes outside the Cycle.
- Use the Cycle Steward check before plans, completion reports, and next-action sentences: the next action should move the current Cycle forward, not isolate a single issue unless the user explicitly selected it.
- Default next action wording must target the whole Cycle, such as "Cycle N 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘". Show only one next action.
- Forbidden next-action wording: standalone "커밋해줘", "Done 처리해줘", "테스트 돌려줘", or issue-only wording when the user did not explicitly select that issue.
- Normal deployment and version release are part of Cycle completion; a Cycle is not fully complete until verified changes are committed, pushed, tagged, and released under the approved version.
- Hotfix Cycle work must carry `sourceCycle`, `targetVersion`, `resumeCycle`, `releaseKind: hotfix`, and release scope. Before GitHub push/tag/release or another public deploy, run or emulate `scripts/cycle-guard.ts --operation external_release --release-kind hotfix ...`.
- Before any public GitHub push/tag/release, run or emulate `node --experimental-strip-types scripts/public-safety-scan.ts`; private Linear workspace slugs, private cycle IDs, and live `memory/` state must not be published.
- Model routing follows `docs/OPERATING_MODEL.md#model-tier-policy`: main agent owns judgment, integration, and final Done claims; lower-tier subagents only handle bounded file-owned work.
- `memory/resume-brief.md` follows `docs/OPERATING_MODEL.md#resume-brief-contract`: compact handoff, one Cycle-level next action, and hash conflict protection before overwrite.

Default completion response must be short. Do not use a structured completion report for ordinary local edits, minor Linear updates, or rule tweaks. Prefer one or two sentences:

```text
반영했습니다. 다음은 <POKit이 이어서 할 일>로 이어가겠습니다.
```

Use a structured completion report only for Cycle close, external write result summaries, test failures, approval-pending work, or when the user explicitly asks for a report/summary.

When a structured POKit completion report is needed, use this order:

1. ✅ 완료한 것
2. ➡️ 다음 작업
3. ⏳ 아직 안 한 것 / 승인 대기
4. 🧪 검증 결과

When a Cycle is fully complete, the close report must also include the completion experience before the standard report sections:

- `🎉 Cycle N 완료!`
- `이번 Cycle 후 달라진 점`
- `기대효과 / 가설`
- `직접 사용해 볼 것`
- `새 세션 추천`

For unfinished or approval-pending items, include the task ID, title, current status, and why it is still pending so the user does not have to remember what each number means.
Use emoji as section markers only; keep the report short and readable.
The next task must be what POKit will do next, not a sentence the user must copy back. Continue or complete the current Cycle as a whole, and do not ask for a mechanical substep. Use Cycle-level wording unless the user explicitly picked one issue.
After changing files, do not force a report if the work is routine. Mention what changed only briefly, then continue the approved Cycle flow. Show a compact recommendation choice only when an external write or real product judgment remains. Do not require the user to retype the next action.

Never write to Linear or GitHub without:
1. A dry-run plan.
2. User approval.
3. An idempotency key.

Dry-run plans must be user-readable execution preflight checks, not just internal safety labels. Show:

- what will change in the external system;
- which issue IDs/titles are affected and their current/target status;
- the local evidence used to justify the change;
- what will not change or remains carry-over;
- the idempotency key;
- the expected benefit after execution;
- a short "사용자 확인" block:
  - `🤔 선택이 필요한 이유: <external write, product judgment, ambiguity, destructive risk>`
  - `✅ 추천안 A: <recommended action>`
  - `이유: <why A is safer/better for the current Cycle>`
  - `↩️ 대안 B: <alternative action>`
  - `차이: <trade-off or why it is not preferred>`
  - `A/B로 선택해 주세요.`

Only show choices when a real decision is required. Do not ask the user to choose for mechanical substeps. When choices are needed, state why the decision is needed, recommend one option, and explain the reason and trade-off. Do not make the user copy a long execution sentence. Put the detailed recommended action in the dry-run body, then let the user choose by `A/B`. If the user selects `A`, execute the recommended action. If the user selects `B`, ask what they want to change and revise the dry-run. Do not use numeric choices for confirmation blocks because they conflict with numbered completion report sections.

## Human Intervention Matrix

Humans approve external impact and product judgment. They should not be turned into mechanical step approvers.

| Work | Human intervention | Reason |
|---|---|---|
| Local file edits | No separate approval | Covered by the approved Cycle intent and easy to review or revert. |
| Tests and local verification | No separate approval | Read-only validation. |
| Local commits | No separate approval | Part of the Cycle completion flow after implementation approval. |
| Local draft artifacts, run summaries, retros | No separate approval | Drafts stay inside the repo/workspace. |
| Linear issue Done/status changes | Requires approval | External operational state changes. |
| Linear label or cycle assignment changes | Requires approval | External planning state changes. |
| GitHub push/tag/release | Requires approval | Public or distribution-facing change. |
| CHANGELOG release edits | Requires approval when release-facing | Canonical release communication. |
| decision-log append | Requires approval | Canonical product/operation decision history. |
| ambiguous completion or unclear scope | Requires approval or clarification | The agent must not invent product judgment. |
| destructive actions or deletes | Requires approval | Hard to recover and may lose context. |

All artifacts are drafts. Do not overwrite an artifact when its content hash changed; mark it `Needs Approval`.
