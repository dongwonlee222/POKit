# POKit Release Checklist

## v0.4.0 Release Clean Check

Checked on 2026-05-14.

- [x] `git status --short --branch` checked.
- [x] Working tree checked: only release document updates remain before the final preflight commit.
- [x] Local `main` is ahead of `origin/main` by 8 Cycle 5 commits before release publication.
- [x] `.env` is not tracked.
- [x] `pokit.local.config.yaml` is not tracked.
- [x] Generated local artifacts under `artifacts/prds/*.md`, `artifacts/criteria/*.md`, `artifacts/sprints/**/retro.md`, and `artifacts/sprints/**/*-run-summary.md` are not tracked.
- [x] Secret pattern scan found no committed Linear API key, GitHub token, Supabase password, or private key.
- [x] Public safety scan passed: no private Linear workspace slug, private cycle ID, or live tracked memory state.
- [x] Release Markdown audit passed for `v0.4.0`.
- [x] Release preflight gate passed for `v0.4.0`.
- [x] POKit Brief checked: Cycle 5 shows Todo 0, In Progress 0, Done 5.
- [x] Cycle 5 release scope checked: Identity Fit / Discovery / Done Gate policy, PO Signal Watch docs, brief progress visualization, Korean-first artifact hooks, completion contract updates.
- [x] Test suite passed: 106/106.

## Release Gate

- [x] Target version chosen according to `docs/VERSIONING.md`: `v0.4.0`.
- [x] `VERSION` file check complete: no `VERSION` file is present.
- [x] Git tag target matches the approved target version: `v0.4.0`.
- [x] `CHANGELOG.md` has matching version-section entries for the release scope.
- [ ] User approved `v0.4.0` GitHub push in the final deploy request.
- [ ] User approved `v0.4.0` tag creation in the final deploy request.
- [ ] User approved GitHub release creation in the final deploy request.
- [x] Hotfix metadata check complete: not applicable for normal `v0.4.0` release.
- [x] Linear/GitHub writes remain dry-run or explicitly approved.
