# POKit Release Checklist

## v0.1.1 Hotfix Clean Check

Checked on 2026-05-13.

- [x] `git status --short --branch` checked.
- [x] Only known local untracked design/workbench files remain outside release scope:
  - `.modu-harness/`
  - `POKit-Day1-Design.zip`
  - `POKit-Day1-Design/`
- [x] `.env` is not tracked.
- [x] Generated local artifacts under `artifacts/prds/*.md`, `artifacts/criteria/*.md`, `artifacts/sprints/**/retro.md`, and `artifacts/sprints/**/*-run-summary.md` are not tracked.
- [x] Secret pattern scan found no committed Linear API key, GitHub token, Supabase password, or private key.
- [x] Public safety scan passed: no private Linear workspace slug, private cycle ID, or live tracked memory state.
- [x] Live `memory/resume-brief.md` replaced with a public-safe starter placeholder.
- [x] Dogfood examples sanitized to placeholder Linear URLs and cycle IDs.
- [x] Script examples and helper defaults no longer embed private cycle IDs.
- [x] LLM-first README and onboarding flow checked.
- [x] Cycle-first next-action wording checked.
- [x] Brief user scenario checked: no numbered quick-command prompts remain in the default brief.
- [x] Completed-cycle immutability guard checked.
- [x] Release/Hotfix policy checked: normal deployment stays in the Cycle completion condition; deployment omission or urgent redeploy uses a versioned Hotfix Cycle with source/resume Cycle metadata.
- [x] Hotfix Cycle dry-run checked for placeholder deployment omission tracking.
- [x] Cycle maintenance dry-run checked for placeholder Linear completion drift.
- [x] Test suite passed: 67/67.

## Release Gate

- [ ] Target version chosen according to `docs/VERSIONING.md`.
- [ ] `VERSION` file, if present, matches the target tag.
- [ ] Git tag matches the approved target version.
- [ ] `CHANGELOG.md` has matching `Unreleased` or version-section entries for the release scope.
- [ ] User approved `v0.1.1` tag creation in the final deploy request.
- [ ] User approved GitHub release creation in the final deploy request.
- [x] Hotfix metadata recorded before deploy: `sourceCycle`, `targetVersion`, `resumeCycle`, and release scope.
- [x] Linear/GitHub writes remain dry-run or explicitly approved.
