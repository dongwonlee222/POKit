# POKit Onboarding Checklist

Use this checklist to get from a fresh clone to the first POKit run. The normal workflow is LLM-first: the user speaks in Codex or Claude, and the LLM uses scripts only as helpers.

POKit is meant to be forked. The public upstream repo contains reusable docs, scripts, skills, and examples. Your fork or private workspace contains your `.env`, Linear context, memory, and generated artifacts.

## 0. Start With The LLM

- [ ] Open Codex CLI or Claude Code in the repository root.
- [ ] Say:

```text
POKit 시작해줘
```

- [ ] Or, for a longer run, say:

```text
POKit 시작해줘. Brief의 다음 후보를 기준으로 Cycle bundle을 만들고, 완료 조건까지 진행해줘.
```

- [ ] Confirm the response includes:
  - current cycle status;
  - numbered next cycle candidates with issue IDs and titles;
  - one recommended bundle;
  - an execution sentence you can approve or edit.
- [ ] Use the single Cycle-level command when you want POKit to proceed:

```text
Cycle N 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘
```

- [ ] Ask for detail only when the definition is unclear:

```text
cycle 자세히 보여줘
backlog 자세히 보여줘
승인 대기 자세히 보여줘
```

- [ ] Let the LLM run helper scripts only when it needs data, verification, or local artifact generation.
- [ ] Approve work by purpose. For example, "put these issues into the next cycle and prepare the run" can include the necessary cycle assignment and label sync. Done transitions, releases, GitHub pushes, decision-log confirmation, and cycle close confirmation still need separate approval.

Manual Node commands below are smoke tests and fallback checks. The normal workflow is natural language first.

For multi-step work, read `docs/GOAL_LOOP.md`.

- Claude Code users can use `/goal` with a verifiable completion condition.
- Codex users can ask POKit to follow the same goal loop through Brief, task list, skills, scripts, tests, and Linear Done updates.

## What The LLM Checks Internally

When you say `POKit 시작해줘`, the LLM should:

- [ ] read `AGENTS.md`, `docs/GOAL_LOOP.md`, and relevant POKit skills;
- [ ] show the compact POKit Brief;
- [ ] inspect Linear cycle state through helper scripts when needed;
- [ ] identify next cycle candidates and one recommended bundle;
- [ ] map brief numbers back to Linear issue IDs before making any write plan;
- [ ] show any approval-needed external write plan before applying it;
- [ ] keep Node commands behind the scenes unless you are troubleshooting.

## 1. Clone Or Fork

- [ ] Clone or fork the POKit repository.
- [ ] Open the repository root in Codex CLI or Claude Code.
- [ ] Confirm Node.js can run TypeScript with strip types:

```bash
node --experimental-strip-types --version
```

## 2. Local Env

- [ ] Copy `.env.example` to `.env`.
- [ ] Add a Linear personal API key:

```bash
LINEAR_API_KEY=lin_api_...
```

- [ ] Keep `.env` local. Never commit it.
- [ ] If the API key appears in chat, logs, screenshots, commits, or shared docs, rotate it before continuing.
- [ ] Read `SECURITY.md` before using a shared or public repo.
- [ ] Do not paste API keys into prompts. If that happens, rotate the key.

## 3. Find Linear Team

- [ ] Skip this section if your Linear API key can access only one team.
- [ ] If POKit says multiple teams are available, list accessible Linear teams:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => console.log(await m.listTeams()))"
```

- [ ] Copy either the intended profile, team id, or team key into `.env`. For a single Linear team, skip `POKIT_PROFILE` and use the default setup:

```bash
POKIT_PROFILE=pokit
# or
POKIT_PROFILE=evmodu
# or
LINEAR_TEAM_ID=...
# or
LINEAR_TEAM_KEY=EVM
```

Use profiles only when one Linear account runs multiple product cycles with POKit. Profile storage stays under `memory/profiles/[name]` and `artifacts/profiles/[name]` so resume briefs and generated artifacts do not mix.

## 4. Label Preflight

- [ ] Ask the LLM to check labels:

```text
Linear label preflight 해줘
```

- [ ] Or run the helper manually:

```bash
node --experimental-strip-types scripts/label-preflight.ts
```

- [ ] Confirm the output says no labels were created.
- [ ] If the output includes `writes`, review the dry-run plan before approving any label creation.

## 5. First Read-only Sprint Dry-run

- [ ] Ask POKit for a read-only run:

```text
이번 cycle dry-run summary 만들어줘
```

- [ ] Or run the helper manually:

```bash
node --experimental-strip-types scripts/sprint-runner.ts
```

- [ ] Confirm a Run Summary was written under `artifacts/sprints/`.
- [ ] Confirm the first section is `AI가 하지 않은 것`.
- [ ] Confirm no Linear or GitHub write happened.

## 6. First Artifact Draft

- [ ] Add or choose a Linear issue in the active cycle.
- [ ] Add one supported label:

```text
pokit:prd
pokit:criteria
```

- [ ] Ask POKit to draft artifacts:

```text
생성 가능 항목부터 draft 만들어줘
```

- [ ] Or run the helper manually:

```bash
node --experimental-strip-types scripts/sprint-runner.ts --write-artifacts
```

- [ ] Check generated files:

```text
artifacts/prds/[issue-id].md
artifacts/criteria/[issue-id].md
```

- [ ] Confirm each generated artifact has `content_hash` frontmatter.
- [ ] Review generated content before committing it anywhere.

## 7. First Cycle Close

When all selected cycle issues are complete, ask:

```text
이번 cycle 종료 summary 만들어줘
```

Expected behavior:

- POKit separates completed, carried-over, pending approval, and clarification items.
- POKit does not mark Linear issues Done without approval.
- POKit shows Run Summary and Retro links.
- If the cycle is operationally complete, POKit shows one celebration message with emoji and the next execution sentence.

## 8. What To Commit

Public upstream repos should commit:

- docs, scripts, skills, tests, examples;
- sanitized templates and reusable sample artifacts.

Keep these local by default, even in private/team forks:

- `memory/`;
- `artifacts/`;
- `.modu-harness/state/current.json`;
- team-specific operating notes.

Only commit local memory or artifacts after explicit team policy and content review. If something should be public documentation, rewrite it as a sanitized example under `examples/`.

Never commit:

- `.env`;
- API keys or tokens;
- customer data;
- private contracts or submitted originals;
- generated artifacts that contain sensitive project context.

## Example Linear Issues

Use safe sample data for the first run. Put one or both examples into your active Linear cycle.

### PRD Example

Title:

```text
결제 실패 사유 안내 개선
```

Description:

```text
고객이 결제 실패 후 다음 행동을 알기 어렵다.

이번 cycle에서는 실패 화면에 고객용 실패 사유와 다음 행동 CTA를 보여주는 요구사항을 정리한다.

Include:
- 실패 사유를 고객용 문장으로 표시
- 재시도 가능한 경우와 문의가 필요한 경우를 구분
- 내부 에러 코드는 노출하지 않음

Exclude:
- 결제 정책 자체 변경
- PG 연동 로직 변경
```

Label:

```text
pokit:prd
```

Expected output:

```text
artifacts/prds/[issue-id].md
```

### Acceptance Criteria Example

Title:

```text
세션 시작 State Brief 표시
```

Description:

```text
PO가 Codex 또는 Claude Code를 repo root에서 열면 현재 cycle 상태를 짧게 확인할 수 있어야 한다.

Expected behavior:
- 현재 cycle 이름을 보여준다.
- cycle issue 수를 보여준다.
- 마지막 Run Summary 경로를 보여준다.
- 상태 변화가 있을 때만 Action Nudge를 최대 1개 보여준다.
```

Label:

```text
pokit:criteria
```

Expected output:

```text
artifacts/criteria/[issue-id].md
```

### Unlabeled Issue Behavior

If an issue has no `pokit:*` label, POKit does not fail silently. The sprint runner proposes a label in the Run Summary and leaves the item under `라벨 필요` with a dry-run approval plan.

## 7. Retro Draft

- [ ] Generate a local cycle retro draft:

```bash
node --experimental-strip-types scripts/retro-summary.ts
```

- [ ] Check the output:

```text
artifacts/sprints/[cycle]/retro.md
```

- [ ] Confirm `external_writes: none` is present.

## 8. Artifact Policy

- [ ] Keep public examples under `examples/`.
- [ ] Keep local generated outputs under `artifacts/`.
- [ ] Do not commit private customer data, credentials, contracts, or sensitive project details.
- [ ] Keep `memory/`, `artifacts/`, and `.modu-harness/` local by default. Commit them only after explicit team policy and content review.

## 9. Ready For Daily Use

- [ ] Linear team id is set.
- [ ] Label preflight is clean or approved.
- [ ] First Run Summary was generated.
- [ ] At least one PRD or criteria draft was generated.
- [ ] The user understands that external writes require dry-run review and explicit approval.

## First-run Smoke Test

These commands are optional smoke tests after `.env` is ready. Use them when the LLM reports setup trouble or when you want to verify the local environment manually.

### 1. Label Preflight

```bash
node --experimental-strip-types scripts/label-preflight.ts
```

Expected:

- Prints `POKit Label Preflight Plan`.
- Prints an `idempotencyKey`.
- Does not create labels.
- If `writes` is not `none`, stop and review the dry-run plan before approving any label creation.

Check when it fails:

- `LINEAR_API_KEY` exists in `.env`.
- `LINEAR_TEAM_ID` or `LINEAR_TEAM_KEY` exists in `.env` when the API key can access multiple teams.
- The API key can access the selected Linear workspace.

### 2. Read-only Sprint Dry-run

```bash
node --experimental-strip-types scripts/sprint-runner.ts
```

Expected:

- Writes `artifacts/sprints/[cycle]/[date]-run-summary.md`.
- The first section is `AI가 하지 않은 것`.
- Does not write to Linear or GitHub.

Check when it fails:

- The Linear team has an active cycle, upcoming cycle, or backlog issues.
- The selected team id matches the workspace you expect.

### 3. Artifact Draft Generation

```bash
node --experimental-strip-types scripts/sprint-runner.ts --write-artifacts
```

Expected:

- Writes local PRD or criteria drafts for issues labeled `pokit:prd` or `pokit:criteria`.
- Writes artifact paths under `Artifact Write Result` in the Run Summary.
- Does not write to GitHub.
- Does not write to Linear unless a separate dry-run plan is explicitly approved.

Check when it generates nothing:

- At least one active cycle issue has `pokit:prd` or `pokit:criteria`.
- The issue has enough description for a draft.
- Completed or canceled Linear issues are skipped.

### 4. Retro Draft

```bash
node --experimental-strip-types scripts/retro-summary.ts
```

Expected:

- Writes `artifacts/sprints/[cycle]/retro.md`.
- Includes `external_writes: none`.
- Summarizes completed issues, unfinished issues, generated artifacts, and decision-log candidates.

Check when it looks empty:

- Run `scripts/sprint-runner.ts --write-artifacts` first.
- Confirm generated artifacts exist under `artifacts/prds/` or `artifacts/criteria/`.

### Write Safety Summary

- Read-only/no external write: `label-preflight`, `sprint-runner`, `retro-summary`.
- Local file write only: `sprint-runner --write-artifacts`, `retro-summary`.
- External Linear/GitHub write: only allowed through a dry-run plan plus explicit user approval.
