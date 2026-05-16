# POKit Scripts

Scripts are thin helpers for external systems. All external writes must be split into `plan` and `apply`.

Day 2 scripts may be dry-run first. Never call `apply*` without explicit user approval.

External write hooks must satisfy `before_external_write` in `workflows/hooks.yaml`.

## Linear Read-Only Helpers

`scripts/linear.ts` reads `LINEAR_API_KEY` and optional `POKIT_PROFILE`, `LINEAR_TEAM_ID`, or `LINEAR_TEAM_KEY` from the environment or local `.env`.

If one Linear team is available, POKit selects it automatically. If multiple teams are available, set `POKIT_PROFILE`, `LINEAR_TEAM_ID`, or `LINEAR_TEAM_KEY`.

Profiles are optional. Shared examples may live in `pokit.config.yaml`, but real personal or company routing should live in ignored `pokit.local.config.yaml`. Local profiles override shared profiles with the same name. Single-team users do not need extra Linear teams.

If you do not know your team id yet, list accessible teams first:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => console.log(await m.listTeams()))"
```

Quick read-only smoke test:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => { const cycle = await m.getCurrentCycle(); const issues = await m.listIssues(cycle.id); console.log({ cycle, issueCount: issues.length }); })"
```

버전 스프린트 context smoke test:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => console.log(JSON.stringify(await m.getWorkingCycleContext(), null, 2)))"
```

`getWorkingCycleContext()` uses the active cycle first, then the next upcoming cycle, then the team backlog.

Write a local Run Summary dry-run:

```bash
node --experimental-strip-types scripts/sprint-runner.ts
```

Print the initial Linear backlog seed plan:

```bash
node --experimental-strip-types scripts/backlog-seed-plan.ts
```

This command only calls GraphQL queries. It does not call any `apply*` write helper.

Print the Day 2 POKit label preflight plan:

```bash
node --experimental-strip-types scripts/label-preflight.ts
```

This command checks required labels and prints a dry-run `create_label` plan. It does not create labels.

Write a local cycle retro draft:

```bash
node --experimental-strip-types scripts/retro-summary.ts
```

This command reads Linear cycle state and local artifacts, then writes `artifacts/sprints/[cycle]/retro.md`. It does not write to Linear or GitHub.

Write a local cycle close draft:

```bash
node --experimental-strip-types scripts/cycle-close.ts
```

This command reads Linear cycle state and local artifacts, then writes `artifacts/sprints/[cycle]/cycle-close.md`. It separates completed work, carry-over candidates, approval pending items, changelog candidates, and decision-log candidates. It does not write to Linear or GitHub.

Print the session bootstrap brief with the `pokit:boot ok` signature:

```bash
node --experimental-strip-types scripts/session-start.ts
```

Use this for `POKit 시작해줘`, after context compaction, and after any handoff before continuing POKit work.

Print the compact session brief only when the bootstrap contract has already passed:

```bash
node --experimental-strip-types scripts/cli/session-brief.ts
```

This command reads Linear cycle state and local run artifacts, then prints the next-cycle nudge dashboard. It does not write to Linear or GitHub.

Print detail views for quick follow-up commands:

```bash
node --experimental-strip-types scripts/cli/session-brief.ts --detail cycle
node --experimental-strip-types scripts/cli/session-brief.ts --detail backlog
node --experimental-strip-types scripts/cli/session-brief.ts --detail approvals
node --experimental-strip-types scripts/cli/session-brief.ts --candidate 1
```

Use these when the user asks for "cycle 자세히", "backlog 자세히", or a numbered candidate detail before approving the next run.

Print the POKit completion report:

```bash
node --experimental-strip-types scripts/session-close.ts
```

This command prints the Cycle-first completion report format. To refresh the compact next-session handoff with hash protection:

```bash
node --experimental-strip-types scripts/session-close.ts --write-resume-brief
```

Check cycle-first implementation readiness:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --issue POKIT-42 --cycle-id <cycle-id> --cycle-name "Cycle N"
```

This command is local. It blocks durable implementation when no Linear cycle or approved cycle bundle context is present. Planning and dry-run work may still proceed with:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --mode planning
```

Check cycle assignment safety before moving work into a cycle:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation cycle_assignment --issue POKIT-35 --cycle-id <target-cycle-id> --cycle-name "Cycle N"
```

If the target cycle is already complete, the guard blocks by default:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation cycle_assignment --issue POKIT-35 --cycle-id <cycle-id> --cycle-name "Cycle N" --target-cycle-complete
```

Check Hotfix release metadata before public deploy work:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation external_release --release-kind hotfix --issue POKIT-44 --cycle-id <hotfix-cycle-id> --cycle-name "Hotfix vX.Y.Z" --source-cycle "Cycle N" --target-version vX.Y.Z --resume-cycle "Cycle N+1"
```

Print the Hotfix Cycle creation and issue move dry-run:

```bash
node --experimental-strip-types scripts/hotfix-cycle-plan.ts --name "Hotfix vX.Y.Z" --source-cycle "Cycle N" --target-version vX.Y.Z --resume-cycle "Cycle N+1" --issue POKIT-44 --issue-id <linear-issue-id>
```

Print the Cycle maintenance completion dry-run:

```bash
node --experimental-strip-types scripts/cycle-maintenance.ts --previous-cycle-id <cycle-id> --completed-cycle-id <cycle-id> --completed-at 2026-05-13T15:00:00.000Z
```

Run the public safety scan before pushing or tagging a public release:

```bash
node --experimental-strip-types scripts/cli/public-safety-scan.ts
```

Run the release Markdown role audit before pushing, tagging, or creating a release:

```bash
node --experimental-strip-types scripts/release-md-audit.ts --target-version=v0.2.0
```

Run the release preflight gate before pushing, tagging, or creating a release:

```bash
node --experimental-strip-types scripts/release-preflight.ts --target-version=v0.4.0 --cycle-name "Cycle 5"
```

This command reads `workflows/hooks.yaml` `before_public_release` gates, runs the executable checks, and prints an ASCII gate map. Ignored artifact evidence references are warnings in the current phase.

Show the hook enforcement map:

```bash
node --experimental-strip-types scripts/hook-map.ts
node --experimental-strip-types scripts/cli/session-brief.ts --detail hooks
node --experimental-strip-types scripts/cli/session-brief.ts --detail flow
```

Render an `on_error` Problem/Error Review and optionally write the local backlog memo:

```bash
node --experimental-strip-types scripts/hooks-runner.ts on_error --title "Hook detail missing" --problem "hooks detail request fell back silently" --cause "detail argument contract was incomplete" --prevention "Add runner and contract tests" --write-artifact --slug hook-detail-missing
```

Conversation ASCII visuals are centralized in `scripts/render/ascii.ts`. Use `renderProgressBar`, `renderStatusBlock`, `renderPreflightStatusBlock`, `renderDecisionChoiceBlock`, `renderProblemReview`, and `renderApprovalRequest` instead of hand-building bars or A/B confirmation copy in feature scripts.

Backlog memo and Linear issue title/outline rendering is centralized in `scripts/backlog-outline.ts`. Use it for Korean-first status titles and fixed Linear description headings instead of hand-building backlog dry-run markdown.

POKit Circle / 버전 스프린트 identity rendering is centralized in `scripts/pokit-run-identity.ts`. Track runs by `pokitRunId`, `linearCycleId`, `cycleBundleId`, and `targetVersion` or `runId`; do not rely on the title as the stable identifier.

Print the completed issue archive dry-run contract:

```bash
node --experimental-strip-types scripts/archive-guardrail.ts
```

This command reads Linear cycle state and proposes local `artifacts/archive/` writes when completed issues pass the 200 soft limit. It does not archive, delete, or mutate Linear issues.

Before any approved Linear cleanup/archive execution, narrow the supported mutation through Linear schema introspection:

```bash
node --experimental-strip-types scripts/archive-guardrail.ts --check-linear-schema
```

Prefer `issueArchive`. If neither `issueArchive` nor the approved fallback appears in the schema check, stop and report a Problem/Error Review before any cleanup write.
