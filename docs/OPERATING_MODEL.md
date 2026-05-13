# POKit Operating Model

POKit uses Linear as the official backlog and the current Codex/Claude session plan as the live work board.

## Current Phase

POKit Day 2 walking skeleton is complete. The project is now in dogfood validation: real Linear reads and approved writes are allowed only when represented by tracked Linear tasks and explicit approval.

Still out of scope:

- A/B test implementation
- persona test implementation
- PDF export
- automatic cron
- standalone CLI product

Current-session work should start from Linear tasks, then use the session task list only as a temporary progress tracker.

## Cycle-first Execution Guard

POKit thinks in Backlog and executes in Cycle.

Backlog-only work may define scope, inspect files, gather evidence, and create dry-run plans. Durable implementation starts only after the work is attached to a Linear cycle or an explicitly approved cycle bundle.

Before code, docs, tests, or canonical memory files are changed, run or emulate:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --issue EVM-42 --cycle-id 169a76a8-2867-45f0-b380-3e35e504c9c7 --cycle-name "Cycle 2"
```

The guard intentionally does not ask for more user approvals. It only blocks implementation when traceability is missing.

## Product Philosophy and Decision Rules

POKit is built to keep scrum automation lightweight. The product should feel like a helpful operator around Linear, not like a gatekeeper that asks for permission on every small step.

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

## Distribution Model

POKit is distributed as a GitHub repository, not as a hosted service or standalone CLI.

- Public upstream: reusable docs, scripts, skills, tests, and examples.
- Team/private workspace: local `.env`, team memory, generated artifacts, and workspace-specific operating notes. Keep these out of public GitHub pushes by default.
- Linear workspace: official backlog, cycle placement, status, priority, and discussion history.

New users should fork or clone the repo, create a local `.env`, connect Linear, and operate through Codex or Claude in the repo root.

## Roles

- Linear issue: official task, priority, discussion, and weekly cycle placement.
- POKit daily run: read-only AI check that routes issues, drafts artifacts, and writes a local Run Summary.
- Session task list: temporary progress tracker for the current AI work session.
- GitHub commit: durable implementation history.

## Weekly Rhythm

1. Put work into a weekly Linear cycle.
2. Run POKit daily with `node --experimental-strip-types scripts/sprint-runner.ts`.
3. Review the Run Summary.
4. Approve or reject any proposed Linear write plan.
5. Commit code/docs changes to GitHub.
6. At cycle end, summarize completed work and open risks before closing the cycle.

## Completed Issue Archive Guardrail

Linear Free workspaces have a 250 issue limit, so POKit uses a 200 completed issue soft limit to avoid surprise blockers.

When the current cycle/context has 200 or more completed issues:

1. POKit Brief shows an archive nudge.
2. `scripts/archive-guardrail.ts` prints a dry-run contract for local archive files.
3. The archive contract preserves old completed issues in `artifacts/archive/linear-completed-YYYY-MM.jsonl` and `.md`.
4. Linear cleanup stays blocked until the user explicitly approves a separate cleanup plan.

POKit keeps the newest 150 completed issues visible by default and proposes older completed issues as archive candidates. This preserves useful recent context while keeping the Linear issue count below the Free plan ceiling.

## Write Safety

POKit must not change Linear or GitHub silently.

Every external write needs:

1. A dry-run plan.
2. A visible `idempotencyKey`.
3. Explicit user approval.
4. An apply helper that refuses unsafe or incomplete plans.

Approval should happen at the user's intent level. If the user approves a clear goal such as "move these three issues into Cycle 2 and prepare the run", POKit may perform the directly required mechanical writes such as cycle assignment and label synchronization under that same approved plan.

Separate explicit approval is still required for:

- marking issues Done;
- deleting, archiving, or closing records;
- GitHub push, release, or tag creation;
- decision-log confirmation;
- changelog confirmation;
- cycle close confirmation.

## Artifact Policy

The public POKit repository should not keep user-specific generated artifacts in `artifacts/`.

- `artifacts/` is the local workspace for generated PRDs, criteria, manifests, and run summaries.
- `examples/` is the public workspace for reusable fixtures and dogfood samples.
- Public commits should exclude credentials, customer data, private project details, local memory, generated artifacts, and live workspace outputs.
- Private/team forks should also treat `memory/`, `artifacts/`, and `.modu-harness/` as sensitive by default. Commit them only after explicit team policy and content review.

If a generated artifact is useful as documentation, move or rewrite it as a sanitized example under `examples/` before committing it to a public upstream repo.

## Cycle Completion Ritual

A Linear cycle is a time box, but POKit can treat it as operationally complete as soon as the selected work is done.

When Todo is 0, In Progress is 0, approval pending is 0, and clarification is 0, the cycle close flow should show a one-time celebration message with:

- an emoji celebration line;
- completed count;
- Run Summary link;
- Retro link;
- the next execution sentence.

The same cycle completion message should not repeat unless the cycle state changes.

## Completion Report Format

When POKit finishes a work item, it should close with a short report instead of leaving the user to infer the next step.

Use this order:

1. ✅ 완료한 것
2. ⏳ 아직 안 한 것 / 승인 대기
3. 🧪 검증 결과
4. 👉 다음에 사용자가 할 말 한 줄

For unfinished or approval-pending work, include enough task content to act without looking elsewhere:

- issue ID
- title
- current status
- why it is pending
- next action

The final line should be an executable sentence the user can say next, such as `EVM-42(Cycle-first guard hook) Done 처리하고 커밋해줘`.

Use emoji as section markers only. They should make status easier to scan, not make the report decorative.

## Next Backlog

Use `scripts/backlog-seed-plan.ts` to print a dry-run plan for the initial POKit Linear backlog. Review the plan before creating any Linear issues.
