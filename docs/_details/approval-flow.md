# Approval Flow — External Write Boundaries and Write Safety

## Write Safety

POKit must not change Linear or GitHub silently.

Every external write needs:

1. A dry-run plan.
2. A visible `idempotencyKey`.
3. Explicit user approval.
4. An apply helper that refuses unsafe or incomplete plans.

Approval should happen at the user's intent level. If the user approves a clear goal such as "prepare the next Cycle bundle and run it", POKit may perform the directly required cycle assignment and label synchronization under that same approved plan, as long as the target cycle is not operationally complete.

When the approved intent is to complete a specific Cycle task, POKit treats local edits, verification, commit, and Linear Done transition as one coherent task-completion flow. The user should not have to separately approve "commit this task" or "mark this task Done" after already asking to complete the Cycle task.

Separate explicit approval is still required for:

- deleting, archiving, or closing records;
- GitHub push, release, or tag creation;
- decision-log confirmation;
- changelog confirmation;
- cycle close confirmation.

If the task scope is ambiguous, stop and clarify the task boundary instead of splitting the work into mechanical approval prompts.

When local work reaches an external write boundary, POKit must not simply stop with "not pushed", "not marked Done", or "approval required". The pause itself must be useful: print the external write dry-run, show the recommended next action, include the idempotency key and non-changes, and make clear what POKit will execute after approval.

## Approval Intent Rules

When the product has to choose between competing behaviors, use this order:

1. Reduce approval noise.
2. Let Linear backlog and cycle structure drive the work.
3. Keep the experience easy to understand, easy to resume, and easy to keep local.

Approval is intent-level, not mechanical-step-level. If the user approves a clear goal, POKit may carry out the local drafting, routing, summaries, and other necessary mechanical work that directly follows from that goal.

Ask again only when the next action is destructive, externally visible, security-sensitive, ambiguous, or would change an already-approved product decision.

This means:

- local drafts and summaries stay inside the approved intent;
- inferred routing and bookkeeping can proceed without repeated prompts;
- external writes, public comments, policy changes, and deletions get their own approval boundary;
- when approval scope and safety conflict, prefer preserving write safety without fragmenting the user into many tiny confirmations.

The practical test is simple: if a step is only there to execute the approved goal, it belongs inside the intent. If the step changes outside state in a way the user would care about independently, it needs a separate ask.

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

## External Write Pause Rule

When local work is complete and the next step is an external write, Show the external write dry-run immediately, recommend one next action, and wait for approval. Approval-pending responses must still be actionable: include proposed write target, local evidence, non-changes, idempotency key, recommended action, and immediate next step after approval.

## Error and Blocker Handling

When a confirmed error/blocker occurs, write a Korean Problem/Error Review memo under `memory/problem-reviews/` before closing it. See `docs/OPERATING_MODEL.md#problemerror-review-memo-contract`.

## Default Session Close Behavior

```yaml
session_close:
  write_resume_brief: auto
  write_local_summary: auto
  linear_updates: approval_required
  github_updates: approval_required
```
