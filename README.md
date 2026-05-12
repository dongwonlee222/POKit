# POKit

POKit의 첫 번째 약속은 신뢰다.

POKit is a GitHub-distributed AI scrum workspace for PO/PM work. It is not a separate CLI, SaaS, or chat UI. Clone or fork this repo, fill `.env`, open Codex CLI or Claude Code in the repo root, and work in natural language.

Start with [docs/ONBOARDING.md](docs/ONBOARDING.md) when setting up a new workspace.

## 5 Minute Quickstart

1. Clone or fork this repo, then open the repo root in Codex CLI or Claude Code.
2. Create a local `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Add Linear credentials to `.env`:

```bash
LINEAR_API_KEY=lin_api_...
LINEAR_TEAM_ID=...
```

If you do not know the team id yet:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => console.log(await m.listTeams()))"
```

4. Check required labels with a dry-run:

```bash
node --experimental-strip-types scripts/label-preflight.ts
```

5. Run the first read-only sprint dry-run:

```bash
node --experimental-strip-types scripts/sprint-runner.ts
```

6. Generate local draft artifacts when the Run Summary looks right:

```bash
node --experimental-strip-types scripts/sprint-runner.ts --write-artifacts
```

Expected local outputs:

- `artifacts/sprints/[cycle]/[date]-run-summary.md`
- `artifacts/prds/[issue-id].md`
- `artifacts/criteria/[issue-id].md`

These commands do not write to GitHub. Linear writes are never applied silently; any label, issue, comment, cycle, or status write must be shown as a dry-run plan and explicitly approved first.

## LLM-first Use

After setup, use natural language in Codex or Claude:

```text
POKit 시작해줘
```

POKit should respond with a compact brief:

```text
📌 현재: Todo 3 · 진행 1 · 완료 1
🧺 다음 후보: EVM-20, EVM-21, EVM-25
💬 실행: “다음 cycle에 EVM-20, EVM-21, EVM-25 담고 POKit 돌려줘”
```

Node commands are helper checks. The primary workflow is: user asks in natural language, the LLM reads skills/docs, then uses scripts only when needed.

Generated artifacts are local by default. The public POKit template keeps reusable samples under `examples/`; team/private forks may choose to commit their own `artifacts/` after reviewing sensitive content.

If an API key appears in chat, logs, screenshots, or commits, rotate it before continuing. See `SECURITY.md`.

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

POKit uses `LINEAR_API_KEY` and `LINEAR_TEAM_ID` to:

- read teams, cycles, issues, and labels;
- generate local PRD/criteria drafts from the current cycle;
- prepare dry-run write plans for issue, label, cycle, or comment updates;
- apply approved Linear writes only after explicit user approval.

Without a Linear API key, users can still read the repo docs, skills, templates, and examples, but POKit cannot automatically inspect or update their Linear workspace.

POKit chooses the working context in this order:

1. Active Linear cycle.
2. Upcoming Linear cycle when no cycle is active.
3. Team backlog when no cycles exist.

This keeps first-time personal workspaces usable before a formal cycle starts.

See `docs/OPERATING_MODEL.md` for the working agreement between Linear, daily POKit runs, session task lists, and GitHub commits.

## Day 2 Dry Run

Use `examples/day2-dry-run/linear-cycle-fixture.yaml` to inspect the walking skeleton without calling Linear or GitHub.

Example outputs:

- `examples/dogfood/prds/POKIT-18.md`
- `examples/dogfood/criteria/POKIT-22.md`
- `examples/dogfood/sprints/2026-W20-dry-run-simulation.md`
