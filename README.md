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

3. Add a Linear API key to `.env`:

```bash
LINEAR_API_KEY=lin_api_...
```

4. In Codex or Claude, say:

```text
POKit 시작해줘
```

5. Follow the brief's execution sentence, for example:

```text
1번, 2번, 3번 다음 cycle에 담고 POKit 돌려줘
```

Expected local outputs after a run:

- `artifacts/sprints/[cycle]/[date]-run-summary.md`
- `artifacts/prds/[issue-id].md`
- `artifacts/criteria/[issue-id].md`

POKit should start with a compact brief:

```text
📌 현재: Todo 3 · 진행 1 · 완료 1
🧺 다음 후보
1. EVM-20 LLM-first Quickstart · Todo · pokit:criteria
2. EVM-21 Team optional · Todo · pokit:criteria
3. EVM-25 Session brief · Todo · pokit:criteria
💬 실행: “1번, 2번, 3번 다음 cycle에 담고 POKit 돌려줘”
⚡ 빠른 명령
1. “1번 자세히 보여줘”
2. “1, 2, 3번 다음 cycle에 담고 돌려줘”
3. “cycle 자세히 보여줘”
4. “backlog 자세히 보여줘”
5. “승인 대기 자세히 보여줘”
```

Linear writes are never applied silently; any label, issue, comment, cycle, or status write must be shown as a dry-run plan and explicitly approved first.

## Helper Commands

Node commands are helper checks. The primary workflow is: user asks in natural language, the LLM reads skills/docs, then uses scripts only when needed.

```bash
node --experimental-strip-types scripts/session-brief.ts
node --experimental-strip-types scripts/session-brief.ts --candidate 1
node --experimental-strip-types scripts/session-brief.ts --detail cycle
node --experimental-strip-types scripts/session-brief.ts --detail backlog
node --experimental-strip-types scripts/session-brief.ts --detail approvals
node --experimental-strip-types scripts/label-preflight.ts
node --experimental-strip-types scripts/sprint-runner.ts
node --experimental-strip-types scripts/sprint-runner.ts --write-artifacts
node --experimental-strip-types scripts/retro-summary.ts
```

For longer work, use the POKit goal loop:

- Claude Code: set `/goal` with a clear completion condition.
- Codex: ask POKit to use the Brief, task list, skills, tests, and Linear Done updates as the goal loop.

See [docs/GOAL_LOOP.md](docs/GOAL_LOOP.md).

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

POKit uses `LINEAR_API_KEY` and optional `LINEAR_TEAM_ID` or `LINEAR_TEAM_KEY` to:

- read teams, cycles, issues, and labels;
- generate local PRD/criteria drafts from the current cycle;
- prepare dry-run write plans for issue, label, cycle, or comment updates;
- apply approved Linear writes only after explicit user approval.

### Completed Issue Archive Guardrail

Linear Free workspaces have a 250 issue limit. POKit treats 200 completed issues as the soft limit:

- below 200 completed issues: no archive nudge;
- at 200 or more completed issues: the session Brief shows an archive recommendation;
- archive candidates are written to local `artifacts/archive/linear-completed-YYYY-MM.jsonl` and `.md` plans first;
- POKit never archives, deletes, or mutates Linear issues without explicit approval.

To inspect the local archive dry-run contract:

```bash
node --experimental-strip-types scripts/archive-guardrail.ts
```

If the API key can access exactly one Linear team, POKit selects it automatically. If multiple teams are available, POKit asks for `LINEAR_TEAM_ID` or `LINEAR_TEAM_KEY`.

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
