# POKit Operating Model

Canonical policy source for approvals, cycle execution, release gates, artifact handling, and documentation ownership.

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

## Documentation Source Of Truth

Keep Markdown light by assigning each document one job:

- `README.md`: short product promise, quickstart, and links to canonical docs.
- `docs/ONBOARDING.md`: step-by-step setup and first-run procedure.
- `docs/OPERATING_MODEL.md`: canonical policy source for approvals, cycle execution, completion, artifact handling, and documentation ownership.
- `docs/ROADMAP.md`: roadmap compass for goals, initiatives, candidate cycles, and Linear sync policy before work is promoted into Linear.
- `workflows/hooks.yaml`: canonical workflow hook list.
- `docs/DESIGN.md`: design background and historical rationale. If it conflicts with `OPERATING_MODEL.md` or `workflows/hooks.yaml`, the newer canonical files win.
- `examples/`: sanitized reusable samples.
- `artifacts/`: local generated workspace output, not canonical documentation.

Do not duplicate full policy text across README, ONBOARDING, and DESIGN. Link to the canonical section instead.

## Cycle-first Execution Guard

POKit thinks in Backlog and executes in Cycle.

Backlog-only work may define scope, inspect files, gather evidence, and create dry-run plans. Durable implementation starts only after the work is attached to a Linear cycle or an explicitly approved cycle bundle.

Before code, docs, tests, or canonical memory files are changed, run or emulate:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --issue POKIT-42 --cycle-id <cycle-id> --cycle-name "Cycle N"
```

The guard intentionally does not ask for more user approvals. It only blocks implementation when traceability is missing.

Completed cycles are immutable by default. Once a cycle is operationally complete, new Todo work must move to the next Linear cycle, not back into the completed cycle. The only exception is an explicit user command to reopen that completed cycle.

Before assigning issues to a cycle, run or emulate:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation cycle_assignment --issue POKIT-35 --cycle-id <target-cycle-id> --cycle-name "Cycle N"
```

If the target cycle is complete, include `--target-cycle-complete`; the guard must block unless the user explicitly said to reopen the completed cycle and `--reopen-completed-cycle` is present.

## Product Philosophy and Decision Rules

POKit is built to keep scrum automation lightweight. The product should feel like a helpful operator around Linear, not like a gatekeeper that asks for permission on every small step.

POKit is not a complex management system. It is a lightweight workspace where people and LLMs run scrum together.

The automation boundary is intentional:

- AI should keep moving local work forward.
- Local handoff, summaries, artifacts, and resume briefs may be written automatically when they follow the approved intent.
- Externally visible state changes stay under user control.
- Linear/GitHub writes, Done transitions, public comments, releases, and destructive actions require explicit approval.

This trade-off can leave local handoff and Linear state briefly out of sync, and it means a final sync step may require approval. POKit accepts that cost because hidden Linear/GitHub changes would damage trust more than a small approval boundary.

Default session close behavior:

```yaml
session_close:
  write_resume_brief: auto
  write_local_summary: auto
  linear_updates: approval_required
  github_updates: approval_required
```

Backlog items should pass the POKit identity fit check:

1. Does it help people and LLMs run scrum together?
2. Does it help the user understand faster or decide with less friction?
3. Does it fit the backlog -> cycle -> execution -> retro flow?
4. Can it stay lightweight on top of Linear and the GitHub repo?
5. Does it avoid becoming a new heavy management tool?
6. Are external state changes still controlled by execution preflight and approval?
7. Does it automate local context while preserving approval boundaries for external state?

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

## Cycle Steward Persona

POKit uses a lightweight Cycle Steward persona when producing plans, completion reports, and next-action sentences.

The Cycle Steward checks:

- Is the next action Cycle-first?
- Did POKit accidentally split one Cycle task into mechanical approvals?
- Is POKit asking the user to approve too many small steps?
- Are remaining Todo items grouped into a sensible bundle?
- Does the final next-action sentence move the Cycle forward?

The Cycle Steward prefers:

- Cycle outcome over issue-only action.
- Bundle over isolated task.
- Intent-level approval over mechanical approval.
- Simple wording over process-heavy explanation.

The default execution unit is the whole current Cycle. Individual issue wording is allowed only when the user explicitly selects an issue or numbered candidate.

All new durable work must follow the same funnel:

1. Capture the idea as a Linear Backlog item.
2. Group it into the current open or next Cycle bundle.
3. Run implementation only after the Cycle guard passes.
4. Complete the Cycle flow through verification, commit, and Linear Done.

Chat-only intent may produce analysis or a dry-run plan, but not durable project changes.

When the user says "Cycle N 완료 상태를 확인하고 다음 후보를 묶어줘", interpret "다음 후보" as Cycle N+1 preparation. Do not add new work back into Cycle N unless the user explicitly says to reopen Cycle N.

If definition is insufficient, stop and ask for the missing scope, policy, or acceptance criteria before implementing. Do not ask for mechanical substeps when the Cycle definition is already clear.

Completion reports must show one next action only. The one action should move the whole current Cycle forward.

Forbidden next-action patterns:

- `커밋해줘`
- `Done 처리해줘`
- `테스트 돌려줘`
- `POKIT-43만 진행해줘` unless the user explicitly selected `POKIT-43`
- any instruction that turns the user into a mechanical approval manager

## Release And Hotfix Cycles

Deployment means an action that lets external users receive a new project state. A local commit is not deployment. GitHub push can be deployment when users update from the public repository. GitHub tags, GitHub releases, package publishes, and public documentation deploys are deployment.

Do not create separate release tasks for normal planned work. If deployment is part of a Cycle's completion condition, finish the deployment inside that same Cycle or make an explicit deployment deferral before marking the Cycle complete. If deployment is not part of the Cycle's completion condition, the Cycle may finish after implementation, verification, commit, and Linear Done.

Hotfix Cycles are only for urgent correction after a Cycle was completed or should have been deployed. Use a Hotfix Cycle for:

- bugs or documentation errors found after deployment;
- urgent leftover work that must be fixed and redeployed before the normal Cycle continues;
- deployment omissions, where deployment should have happened before the Cycle was closed.

Hotfix work must be tracked in Linear and must include:

- `sourceCycle`: the completed or deployable Cycle being corrected;
- `targetVersion`: the patch or release candidate version, such as `v0.1.1` or `v0.1.0-rc.1`;
- `resumeCycle`: the normal Cycle to return to after the Hotfix;
- `releaseKind`: `hotfix`;
- the release scope, such as GitHub push, tag, release, package publish, or docs deploy.

Hotfix is not a bucket for planned Cycle work. It is a short, versioned interruption for urgent correction or deployment omission. After the Hotfix is verified and either deployed or explicitly deferred, POKit returns to `resumeCycle`.

Before GitHub push, tag, release, package publish, or public docs deploy, run or emulate the release guard:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation external_release --release-kind hotfix --issue POKIT-44 --cycle-id <hotfix-cycle-id> --cycle-name "Hotfix vX.Y.Z" --source-cycle "Cycle N" --target-version vX.Y.Z --resume-cycle "Cycle N+1"
```

To prepare Linear tracking for a deployment omission, print the Hotfix Cycle dry-run first:

```bash
node --experimental-strip-types scripts/hotfix-cycle-plan.ts --name "Hotfix vX.Y.Z" --source-cycle "Cycle N" --target-version vX.Y.Z --resume-cycle "Cycle N+1" --issue POKIT-44 --issue-id <linear-issue-id>
```

The dry-run creates no Linear records. Apply the resulting `cycleCreate` plan only after user approval, then move the issue to the created Hotfix Cycle.

## Model Tier Policy

Use stronger models where judgment matters, and cheaper models where the contract is already narrow.

- Main agent: use the strongest available model for product judgment, ambiguity resolution, final integration, test interpretation, and user-facing completion claims.
- `gpt-5.4`: use for bounded implementation that touches API shape, state classification, user-facing scripts, or non-trivial tests.
- `gpt-5.4-mini`: use for first-pass documentation edits, fixture updates, and narrow mechanical cleanup when the policy contract is already clear.
- Subagents must own disjoint files or responsibilities. The main agent remains accountable for integration, verification, and Linear/GitHub safety.
- Lower-tier models must not make final Done decisions, final safety claims, or policy changes without main-agent review.

The optimization goal is simple: spend expensive reasoning on choices and verification, not on repeatable edits.

## Resume Brief Contract

`memory/resume-brief.md` is the compact handoff for the next POKit session. It should stay small enough to read before any other memory file.

Required sections:

1. `## 어디서 멈췄나`
2. `## 다음에 무엇을 하나`
3. `## 차단된 것`
4. `## 참조`

Rules:

- Keep it near 1-2KB.
- Use one Cycle-level next action, not a mechanical substep.
- Mention pending issue IDs only as context inside the Cycle bundle.
- Link to commands or canonical docs instead of copying long policy text.
- Refuse stale overwrites when the file content hash changed; mark the write as `Needs Approval`.

## Distribution Model

POKit is distributed as a GitHub repository, not as a hosted service or standalone CLI.

- Public upstream: reusable docs, scripts, skills, tests, and examples.
- Team/private workspace: local `.env`, team memory, generated artifacts, and workspace-specific operating notes. Keep these out of public GitHub pushes by default.
- Linear workspace: official backlog, cycle placement, status, priority, and discussion history.

New users should fork or clone the repo, create a local `.env`, connect Linear, and operate through Codex or Claude in the repo root.

## Public Release Safety

Before pushing, tagging, or publishing a public release, run:

```bash
node --experimental-strip-types scripts/public-safety-scan.ts
```

The public repository must not contain private Linear workspace slugs, private Linear cycle IDs, or live `memory/` state. Public examples should use placeholder identifiers such as `POKIT-123`, `<cycle-id>`, `Cycle N`, and `Hotfix vX.Y.Z`.

Tracked `memory/` files are starter placeholders only. Real resume briefs, current-cycle pointers, decision logs, generated artifacts, and local run summaries belong in a team's private fork or local workspace, not in the public upstream release.

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

Approval should happen at the user's intent level. If the user approves a clear goal such as "prepare the next Cycle bundle and run it", POKit may perform the directly required cycle assignment and label synchronization under that same approved plan, as long as the target cycle is not operationally complete.

When the approved intent is to complete a specific Cycle task, POKit treats local edits, verification, commit, and Linear Done transition as one coherent task-completion flow. The user should not have to separately approve "commit this task" or "mark this task Done" after already asking to complete the Cycle task.

Separate explicit approval is still required for:

- deleting, archiving, or closing records;
- GitHub push, release, or tag creation;
- decision-log confirmation;
- changelog confirmation;
- cycle close confirmation.

If the task scope is ambiguous, stop and clarify the task boundary instead of splitting the work into mechanical approval prompts.

## Artifact Policy

The public POKit repository should not keep user-specific generated artifacts in `artifacts/`.

- `artifacts/` is the local workspace for generated PRDs, criteria, manifests, and run summaries.
- `examples/` is the public workspace for reusable fixtures and dogfood samples.
- `POKit-Day1-Design/` and `POKit-Day1-Design.zip` are local design exports, not canonical docs.
- Public commits should exclude credentials, customer data, private project details, local memory, generated artifacts, and live workspace outputs.
- Private/team forks should also treat `memory/`, `artifacts/`, and `.modu-harness/` as sensitive by default. Commit them only after explicit team policy and content review.

If a generated artifact is useful as documentation, move or rewrite it as a sanitized example under `examples/` before committing it to a public upstream repo.

## Cycle Completion Ritual

A Linear cycle is a time box, but POKit can treat it as operationally complete as soon as the selected work is done.

Operationally complete means every issue in the selected work surface is either Done or has an explicit carry-over note. Compute this from sprint dry-run categories, not only raw status counts. Cancelled or custom-status issues without a carry-over note block completion and must appear in the close summary.

When the selected work surface is operationally complete, the cycle close flow should show a one-time celebration message with:

- an emoji celebration line;
- completed count;
- Run Summary link;
- Retro link;
- a compact user confirmation choice for the recommended next action.

The same cycle completion message should not repeat unless the cycle state changes. Do not ask the user to copy a long execution sentence. When an external write is proposed, end the dry-run with:

```text
사용자 확인

1. ✅ 추천대로 실행
2. ✏️ 직접 입력하기

번호로 선택해 주세요.
```

POKit operational completion and Linear date-based cycle state can drift. When a Cycle is operationally complete but still appears as Linear current or upcoming, print a cycle maintenance dry-run before applying any Linear cycle update:

```bash
node --experimental-strip-types scripts/cycle-maintenance.ts --completed-at 2026-05-13T15:00:00.000Z
```

The dry-run may propose `cycleUpdate` plans with `completedAt` and an explanatory description. Apply those plans only after user approval because they change Linear cycle state.

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

The final line should be an executable sentence the user can say next, such as `Cycle N 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘`.

Use emoji as section markers only. They should make status easier to scan, not make the report decorative.

The final line must point at the next Cycle outcome, not a mechanical substep. If the user did not explicitly select one issue, prefer `Cycle N 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘`. Use issue-specific wording only when the user selected that issue or numbered candidate.

## Next Backlog

Use `scripts/backlog-seed-plan.ts` to print a dry-run plan for the initial POKit Linear backlog. Review the plan before creating any Linear issues.
