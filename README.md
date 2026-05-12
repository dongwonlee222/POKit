# POKit

POKit의 첫 번째 약속은 신뢰다.

POKit is a GitHub-distributed AI scrum workspace for PO/PM work. It is not a separate CLI, SaaS, or chat UI. Clone or fork this repo, fill `.env`, open Codex CLI or Claude Code in the repo root, and work in natural language.

## First Run

1. Clone or fork this repo.
2. Create a local `.env` from `.env.example`.
3. Add a Linear personal API key:

```bash
LINEAR_API_KEY=lin_api_...
```

4. Find your Linear team id:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => console.log(await m.listTeams()))"
```

5. Add the selected team id to `.env`:

```bash
LINEAR_TEAM_ID=...
```

6. Run a read-only daily sprint dry-run:

```bash
node --experimental-strip-types scripts/sprint-runner.ts
```

The dry-run writes a Run Summary under `artifacts/sprints/`. It does not write to Linear or GitHub.

## Core Contract

POKit은 cycle 안에서 산출물과 승인 계획을 만든다. Linear/GitHub 같은 외부 시스템의 상태는 사용자의 명시적 승인 없이는 절대 바꾸지 않는다.

- All AI-generated artifacts are drafts with source context and rationale.
- Run Summary lists generated, needs-label, needs-clarification, needs-approval, and failed items separately, with "what AI did not do" shown first.
- State Brief renders every session and is read-only.
- Action Nudge appears at most once per session and only when cycle state changed.
- Fork users who want to commit personal memory/artifacts should review `.gitignore` first.

## Linear Workflow

Use Linear as the source of truth and POKit as the daily AI run layer.

- Linear Cycle: weekly sprint container, usually starting every Monday.
- POKit Run: daily read-only check that routes issues, drafts artifacts, and writes a Run Summary.
- Linear writes: always represented as a dry-run approval plan first.

POKit chooses the working context in this order:

1. Active Linear cycle.
2. Upcoming Linear cycle when no cycle is active.
3. Team backlog when no cycles exist.

This keeps first-time personal workspaces usable before a formal cycle starts.

See `docs/OPERATING_MODEL.md` for the working agreement between Linear, daily POKit runs, session task lists, and GitHub commits.

## Day 2 Dry Run

Use `examples/day2-dry-run/linear-cycle-fixture.yaml` to inspect the walking skeleton without calling Linear or GitHub.

Expected outputs:

- `artifacts/prds/POKIT-18.md`
- `artifacts/criteria/POKIT-22.md`
- `artifacts/sprints/2026-W20-dry-run-simulation.md`
