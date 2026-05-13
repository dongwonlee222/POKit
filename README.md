# POKit

POKit의 첫 번째 약속은 신뢰다.

## POKit Philosophy

POKit는 승인 관리 도구가 아니라, 가벼운 Linear 중심 자동화 도구다.

- 사용자 승인 횟수는 가능한 한 줄인다.
- 작업은 Linear backlog와 cycle 흐름을 기준으로 묶는다.
- 외부 write는 intent-level 승인으로 한 번에 처리하되, 파괴적이거나 외부에 보이는 변경은 다시 확인한다.

POKit is a GitHub-distributed AI scrum workspace for PO/PM work. It is not a separate CLI, SaaS, or chat UI. Clone or fork this repo, fill `.env`, open Codex CLI or Claude Code in the repo root, and work in natural language.

Start with [docs/ONBOARDING.md](docs/ONBOARDING.md) when setting up a new workspace.

## Docs Map

- [docs/ONBOARDING.md](docs/ONBOARDING.md): setup and first-run procedure.
- [docs/OPERATING_MODEL.md](docs/OPERATING_MODEL.md): source of truth for policies, approvals, cycle rules, and doc ownership.
- [workflows/hooks.yaml](workflows/hooks.yaml): source of truth for workflow hook names.
- [docs/DESIGN.md](docs/DESIGN.md): design background; defer to the files above when details drift.

## Who This Is For

Use POKit when you want a lightweight AI workspace that sits on top of your Linear backlog:

- PO/PMs who want PRD, acceptance criteria, run summary, and retro drafts from Linear issues.
- Small teams that already use Linear cycles and GitHub.
- People who prefer telling Codex or Claude what to do in natural language instead of operating a separate CLI product.

POKit is a repo template. Your team owns the fork, `.env`, generated artifacts, and Linear workspace.

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

5. If your Linear workspace has no active cycle issues yet, create one safe sample issue from [docs/ONBOARDING.md](docs/ONBOARDING.md#example-linear-issues), add `pokit:prd` or `pokit:criteria`, and put it in the current cycle.

6. Follow the brief's Cycle-level execution sentence, for example:

```text
Cycle 3 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘
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
💬 실행: “Cycle 3 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘”
⚡ 빠른 명령
1. “1번 자세히 보여줘”
2. “Cycle 3 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘”
3. “cycle 자세히 보여줘”
4. “backlog 자세히 보여줘”
5. “승인 대기 자세히 보여줘”
```

Linear writes are never applied silently; any label, issue, comment, cycle, or status write must be shown as a dry-run plan and explicitly approved first.

Approval is by purpose, not by tiny mechanical step. For example, if you approve "put EVM-32 through EVM-34 into Cycle 2 and prepare the run", POKit may apply the directly required cycle assignment and label sync under that same approved plan. Destructive actions, Done transitions, releases, GitHub pushes, decision-log confirmation, and cycle-close confirmation still need their own explicit approval.

## How To Use POKit Day To Day

1. Put candidate work into Linear.
2. Label each issue with one POKit routing label:

```text
pokit:prd
pokit:criteria
```

3. Open Codex or Claude in the repo root and say:

```text
POKit 시작해줘
```

4. Run the current Cycle as a bundle, or ask for detail before running:

```text
1번 자세히 보여줘
backlog 자세히 보여줘
Cycle 3 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘
```

5. Review generated local artifacts before sharing or committing them.
6. Approve Linear/GitHub writes only after reading the dry-run plan and idempotency key.
7. At the end of a cycle, run or ask for a retro/close summary before planning the next cycle.

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

Generated artifacts are local by default and should stay out of public GitHub repos. The public POKit template keeps reusable, sanitized samples under `examples/`. See [docs/OPERATING_MODEL.md](docs/OPERATING_MODEL.md#artifact-policy) for the canonical artifact policy.

If an API key appears in chat, logs, screenshots, or commits, rotate it before continuing. See `SECURITY.md`.

## Core Contract

POKit은 cycle 안에서 산출물과 승인 계획을 만든다. Linear/GitHub 같은 외부 시스템의 상태는 사용자의 명시적 승인 없이는 절대 바꾸지 않는다. Detailed policy lives in [docs/OPERATING_MODEL.md](docs/OPERATING_MODEL.md).

- All AI-generated artifacts are drafts with source context and rationale.
- Run Summary lists generated, needs-label, needs-clarification, needs-approval, and failed items separately, with "what AI did not do" shown first.
- State Brief renders every session and is read-only.
- Action Nudge appears at most once per session and only when cycle state changed.
- Do not commit real work context from `artifacts/`, `.modu-harness/`, `.env`, or generated run summaries. Publish only sanitized examples under `examples/`.
- Cycle completion should feel explicit: when a cycle is operationally complete, POKit should show one short celebration message with emoji, completion count, Run Summary, Retro, and the next execution sentence.

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

1. Active Linear cycle with open work.
2. Upcoming Linear cycle with open work.
3. Completed cycle only as a close summary surface.
4. Team backlog when no cycle work exists.

This keeps first-time personal workspaces usable before a formal cycle starts.

See `docs/OPERATING_MODEL.md` for the working agreement between Linear, daily POKit runs, session task lists, and GitHub commits.

## Day 2 Dry Run

Use `examples/day2-dry-run/linear-cycle-fixture.yaml` to inspect the walking skeleton without calling Linear or GitHub.

Example outputs:

- `examples/dogfood/prds/POKIT-18.md`
- `examples/dogfood/criteria/POKIT-22.md`
- `examples/dogfood/sprints/2026-W20-dry-run-simulation.md`
