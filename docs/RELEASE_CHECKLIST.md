# POKit Release Checklist

## v0.1.0 Candidate Clean Check

Checked on 2026-05-13.

- [x] `git status --short --branch` checked.
- [x] Only known local untracked design/workbench files remain outside release scope:
  - `.modu-harness/`
  - `POKit-Day1-Design.zip`
  - `POKit-Day1-Design/`
- [x] `.env` is not tracked.
- [x] Generated local artifacts under `artifacts/prds/*.md`, `artifacts/criteria/*.md`, `artifacts/sprints/**/retro.md`, and `artifacts/sprints/**/*-run-summary.md` are not tracked.
- [x] Secret pattern scan found no committed Linear API key, GitHub token, Supabase password, or private key.
- [x] LLM-first README and onboarding flow checked.
- [x] Cycle-first next-action wording checked.
- [x] Brief user scenario checked: no numbered quick-command prompts remain in the default brief.
- [x] Completed-cycle immutability guard checked.
- [x] Test suite passed: 54/54.

## Release Gate

- [ ] User approves `v0.1.0` tag creation.
- [ ] User approves GitHub release creation, if needed.
- [ ] Linear/GitHub writes remain dry-run or explicitly approved.
