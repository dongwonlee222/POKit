# POKit Scripts

Scripts are thin helpers for external systems. All external writes must be split into `plan` and `apply`.

Day 2 scripts may be dry-run first. Never call `apply*` without explicit user approval.

External write hooks must satisfy `before_external_write` in `workflows/hooks.yaml`.

## Linear Read-Only Helpers

`scripts/linear.ts` reads `LINEAR_API_KEY` and optional `LINEAR_TEAM_ID` or `LINEAR_TEAM_KEY` from the environment or local `.env`.

If one Linear team is available, POKit selects it automatically. If multiple teams are available, set `LINEAR_TEAM_ID` or `LINEAR_TEAM_KEY`.

If you do not know your team id yet, list accessible teams first:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => console.log(await m.listTeams()))"
```

Quick read-only smoke test:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => { const cycle = await m.getCurrentCycle(); const issues = await m.listIssues(cycle.id); console.log({ cycle, issueCount: issues.length }); })"
```

Daily run context smoke test:

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

Print the compact session start brief:

```bash
node --experimental-strip-types scripts/session-brief.ts
```

This command reads Linear cycle state and local run artifacts, then prints the next-cycle nudge dashboard. It does not write to Linear or GitHub.

Print detail views for quick follow-up commands:

```bash
node --experimental-strip-types scripts/session-brief.ts --detail cycle
node --experimental-strip-types scripts/session-brief.ts --detail backlog
node --experimental-strip-types scripts/session-brief.ts --detail approvals
node --experimental-strip-types scripts/session-brief.ts --candidate 1
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
node --experimental-strip-types scripts/cycle-guard.ts --issue EVM-42 --cycle-id 169a76a8-2867-45f0-b380-3e35e504c9c7 --cycle-name "Cycle 2"
```

This command is local. It blocks durable implementation when no Linear cycle or approved cycle bundle context is present. Planning and dry-run work may still proceed with:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --mode planning
```

Check cycle assignment safety before moving work into a cycle:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation cycle_assignment --issue EVM-35 --cycle-id <target-cycle-id> --cycle-name "Cycle 3"
```

If the target cycle is already complete, the guard blocks by default:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation cycle_assignment --issue EVM-35 --cycle-id <cycle-id> --cycle-name "Cycle 2" --target-cycle-complete
```

Check Hotfix release metadata before public deploy work:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation external_release --release-kind hotfix --issue EVM-44 --cycle-id <hotfix-cycle-id> --cycle-name "Hotfix v0.1.0" --source-cycle "Cycle 2" --target-version v0.1.0 --resume-cycle "Cycle 3"
```

Print the completed issue archive dry-run contract:

```bash
node --experimental-strip-types scripts/archive-guardrail.ts
```

This command reads Linear cycle state and proposes local `artifacts/archive/` writes when completed issues pass the 200 soft limit. It does not archive, delete, or mutate Linear issues.
