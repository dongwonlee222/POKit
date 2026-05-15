# POKit Agent Instructions

Default language: ko-KR.

## Agent Compression Rules

- 필요한 문서만 읽고, 현재 작업에 직접 관련 없는 긴 원문은 건너뛴다.
- 철학 설명은 파일별 역할에 맞게 나눠 쓰고, 같은 문장을 반복하지 않는다.
- 사용자 승인과 기계적 실행은 한 흐름으로 묶되, 외부 write는 항상 별도 승인 경계를 지킨다.
- Linear backlog와 cycle을 기본 작업면으로 보고, 로컬 초안과 요약은 가볍게 유지한다.
- 바깥 시스템을 바꾸기 전에는 dry-run 계획이 먼저다.
- 사용자-facing 답변, 보고서, 로컬 artifact는 한국어를 기본으로 쓴다. API 이름, 파일명, 코드 식별자, 고유 product 용어만 영어를 허용한다.

POKit session start contract:

- First run `node --experimental-strip-types scripts/session-start.ts`.
- Do this again after any session resume, context compaction, or handoff before continuing POKit work.
- The output must include `pokit:boot ok`. If the boot signature is missing, stop and report the bootstrap failure before doing any other POKit task.

For "POKit 시작해줘", "현재 상태 브리핑해줘", or "다음에 뭐 하면 돼?", run/emulate:

```bash
node --experimental-strip-types scripts/session-start.ts
```

For detail views, run or emulate:

```bash
node --experimental-strip-types scripts/session-brief.ts --detail cycle
node --experimental-strip-types scripts/session-brief.ts --detail backlog
node --experimental-strip-types scripts/session-brief.ts --detail approvals
node --experimental-strip-types scripts/session-brief.ts --candidate 1
```

For numbered detail like "1번 자세히", map it to current brief candidates. Do not suggest issue-only execution unless explicitly selected.

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
- When the user asks what remains/next, check current Cycle task state and close/release state. Do not recommend Backlog or next-Cycle work while `Cycle Release Pending`.
- Before reporting procedure/Cycle completion, confirm documented flow name, required artifacts, naming/title conventions, verification, and skipped steps.
- Default next action wording must target the whole Cycle, e.g. "Cycle N 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘". Show only one next action.
- Forbidden next-action wording: standalone "커밋해줘", "Done 처리해줘", "테스트 돌려줘", or issue-only wording when the user did not explicitly select that issue.
- When local work is complete and the next step is an external write, do not end with only "not done" or "approval required". Show the external write dry-run immediately, recommend one next action, and wait for approval.
- When a confirmed error/blocker occurs, write a Korean Problem/Error Review memo under `artifacts/backlog/` before closing it. See `docs/OPERATING_MODEL.md#problemerror-review-memo-contract`.
- Daily release is default. A day is not complete until verified changes are committed and public release is completed or explicitly deferred. Weekly/Operating Cycle is only a planning/review container.
- Hotfix Cycle work must carry `sourceCycle`, `targetVersion`, `resumeCycle`, `releaseKind: hotfix`, and release scope. Before GitHub push/tag/release or another public deploy, run or emulate `scripts/cycle-guard.ts --operation external_release --release-kind hotfix ...`.
- Before any public GitHub push/tag/release, run or emulate `node --experimental-strip-types scripts/public-safety-scan.ts`; private Linear workspace slugs, private cycle IDs, and live `memory/` state must not be published.
- Model routing follows `docs/OPERATING_MODEL.md#model-tier-policy`: main agent owns judgment, integration, and final Done claims; lower-tier subagents only handle bounded file-owned work.
- `memory/resume-brief.md` follows `docs/OPERATING_MODEL.md#resume-brief-contract`: compact handoff, one Cycle-level next action, and hash conflict protection before overwrite.

Default completion response must be short; use structured reports only for Cycle close, external write results, failures, approval-pending work, or explicit report requests. Details live in `docs/OPERATING_MODEL.md#completion-report-contract`.

When a Cycle is fully complete, the close report must include this completion experience before standard sections:

- `🎉 Cycle N 완료!`
- `이번 Cycle 후 달라진 점`
- `기대효과 / 가설`
- `직접 사용해 볼 것`
- `새 세션 추천`

Cycle 완료 직후 축하 메시지는 release gate 완료 후 1회만 표시한다. 같은 `stateKey`는 반복하지 않는다.

For unfinished or approval-pending items, include issue ID/title/status/reason. The next task is what POKit will do next, not a sentence for the user to copy back.

Never write to Linear or GitHub without:
1. A dry-run plan.
2. User approval.
3. An idempotency key.

Dry-run plans must be user-readable execution preflight checks, not internal labels. Include affected IDs, evidence, non-changes, idempotency key, benefit, and the emoji recommendation block from `docs/OPERATING_MODEL.md#external-write-confirmation-contract`. Show choices only for real decisions, never mechanical substeps.

Approval-pending responses must still be actionable. If POKit pauses at an external write boundary, the response must include the proposed write target, current local evidence, non-changes, idempotency key, recommended action, and what POKit will do immediately after approval.

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
