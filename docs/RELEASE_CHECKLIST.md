# POKit Release Checklist

## v0.1.0 Candidate Clean Check

Checked on 2026-05-12.

- [x] `git status --short --branch` checked.
- [x] Only known local untracked design/workbench files remain outside release scope:
  - `.modu-harness/`
  - `POKit-Day1-Design.zip`
  - `POKit-Day1-Design/`
- [x] `.env` is not tracked.
- [x] Generated local artifacts under `artifacts/prds/*.md`, `artifacts/criteria/*.md`, `artifacts/sprints/**/retro.md`, and `artifacts/sprints/**/*-run-summary.md` are not tracked.
- [x] Secret pattern scan found no committed Linear API key, GitHub token, Supabase password, or private key.
- [x] Test suite passed: 27/27.

## Release Gate

- [ ] User approves `v0.1.0` tag creation.
- [ ] User approves GitHub release creation, if needed.
- [ ] Linear/GitHub writes remain dry-run or explicitly approved.
