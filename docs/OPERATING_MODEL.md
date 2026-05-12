# POKit Operating Model

POKit uses Linear as the official backlog and the current Codex/Claude session plan as the live work board.

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

## Write Safety

POKit must not change Linear or GitHub silently.

Every external write needs:

1. A dry-run plan.
2. A visible `idempotencyKey`.
3. Explicit user approval.
4. An apply helper that refuses unsafe or incomplete plans.

## Next Backlog

Use `scripts/backlog-seed-plan.ts` to print a dry-run plan for the initial POKit Linear backlog. Review the plan before creating any Linear issues.
