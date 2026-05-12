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

This command only calls GraphQL queries. It does not call any `apply*` write helper.
