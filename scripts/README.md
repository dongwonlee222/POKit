# POKit Scripts

Scripts are thin helpers for external systems. All external writes must be split into `plan` and `apply`.

Day 2 scripts may be dry-run first. Never call `apply*` without explicit user approval.

External write hooks must satisfy `before_external_write` in `workflows/hooks.yaml`.

## Linear Read-Only Helpers

`scripts/linear.ts` reads `LINEAR_API_KEY` and `LINEAR_TEAM_ID` from the environment or local `.env`.

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
