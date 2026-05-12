# POKit Onboarding Checklist

Use this checklist to get from a fresh clone to the first POKit dry-run.

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

## 3. Find Linear Team

- [ ] List accessible Linear teams:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(async (m) => console.log(await m.listTeams()))"
```

- [ ] Copy the intended team id into `.env`:

```bash
LINEAR_TEAM_ID=...
```

## 4. Label Preflight

- [ ] Run the Day 2 label preflight:

```bash
node --experimental-strip-types scripts/label-preflight.ts
```

- [ ] Confirm the output says no labels were created.
- [ ] If the output includes `writes`, review the dry-run plan before approving any label creation.

## 5. First Read-only Sprint Dry-run

- [ ] Run the sprint runner without artifact writes:

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

- [ ] Run artifact generation:

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
- [ ] In a private fork, decide as a team whether `memory/` and `artifacts/` should be committed.

## 9. Ready For Daily Use

- [ ] Linear team id is set.
- [ ] Label preflight is clean or approved.
- [ ] First Run Summary was generated.
- [ ] At least one PRD or criteria draft was generated.
- [ ] The user understands that external writes require dry-run review and explicit approval.

## First-run Smoke Test

Run these commands in order after `.env` is ready.

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
- `LINEAR_TEAM_ID` exists in `.env`.
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
