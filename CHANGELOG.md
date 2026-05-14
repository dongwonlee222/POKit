# Changelog

## Unreleased

No pending public release notes.

## v0.3.0 - 2026-05-14

### Changed

- Moved personal/company Linear profile routing out of shared `pokit.config.yaml` and into ignored `pokit.local.config.yaml`.
- Made selected `POKIT_PROFILE` routing override stale global `LINEAR_TEAM_ID` / `LINEAR_TEAM_KEY` values.
- Updated working-context selection so completed Linear cycles are not reused as the active work surface.
- Aligned POKit roadmap cycles with Linear cycles while keeping hotfix work in a separate version/release flow.
- Replaced long dry-run execution sentences with compact `A/B` confirmation choices.

### Docs / Policy

- Updated README, onboarding, operating model, and roadmap guidance for local profile routing and cycle/Linear alignment.
- Documented Cycle 4 as `Context Boundary & Brief Trust`.
- Defined Cycle completion as version release completion, not just main-branch push.

### Verification

- Public safety scan passed.
- Test suite passed: 87/87.

## v0.2.2 Hotfix - 2026-05-14

This hotfix aligns the built-in Evmodu profile with the actual Linear team key created during product-cycle separation.

### Fixed

- Changed the default `evmodu` profile Linear team key from `EVM` to `EVMODU`.

### Docs / Policy

- Updated README and onboarding examples so Evmodu profile setup points at `EVMODU`.
- Kept multi-profile documented as optional for users who run multiple product cycles.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Profile and Linear routing tests passed.

## v0.2.1 Hotfix - 2026-05-14

This hotfix adds optional multi-profile routing so one POKit workspace can safely serve multiple product cycles without changing the default single-team setup.

### Fixed

- Added `POKIT_PROFILE` support for profile-specific Linear team selection.
- Routed generated run summaries, PRDs, criteria, retros, cycle close drafts, archive plans, and resume briefs through profile-specific `memory` and `artifacts` paths.
- Kept the default behavior unchanged for single-team users who do not set `POKIT_PROFILE`.

### Docs / Policy

- Documented multi-profile as an optional feature, not a requirement for existing users.
- Clarified that single-team users do not need extra Linear teams.
- Added profile examples for POKit and Evmodu product-cycle separation.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 83/83.

## v0.2.0 - 2026-05-13

### Added

- Added Cycle close draft generation with changelog candidates and completion celebration support.
- Added prioritizer and history-maintainer skills.
- Added release Markdown audit gate before public release.

### Changed

- Improved completion reports so they show the next practical user decision, execution preflight, and expected benefit.
- Clarified human approval boundaries so users approve external impact and product judgment, not mechanical substeps.

### Docs / Policy

- Documented release-centered Markdown versioning in `docs/VERSIONING.md`.
- Added document role markers for operating policy and design reference docs.
- Updated release checklist target to `v0.2.0`.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 80/80.

## v0.1.1 Hotfix - 2026-05-13

This hotfix removes private dogfood Linear state from the public template and adds a release safety gate.

### Fixed

- Replaced live `memory/resume-brief.md` state with a public-safe starter placeholder.
- Sanitized dogfood examples so public samples no longer contain private Linear workspace URLs or cycle IDs.
- Removed private Linear cycle IDs and concrete dogfood defaults from script examples.
- Changed Hotfix and Cycle maintenance helpers so public CLI defaults no longer embed a private workspace's cycle data.
- Added `scripts/public-safety-scan.ts` and test coverage to block private Linear workspace slugs, private cycle IDs, and live tracked memory state before public release.
- Documented the public release safety scan in README, AGENTS, script docs, and the operating model.

### Verification

- Public safety scan passed.
- Test suite passed: 67/67.

## v0.1.0 - 2026-05-13

POKit v0.1.0 is the Day 2/3 dogfood release.

### Included

- GitHub-distributed repo-native AI workspace for PO/PM work.
- LLM-first quickstart for Codex and Claude natural-language use.
- POKit Brief / next-cycle nudge dashboard.
- Goal-loop guidance for Claude Code `/goal` and Codex skill-based operation.
- Linear read helpers for teams, working cycle context, cycle issues, and labels.
- Optional Linear team selection with automatic single-team detection and `LINEAR_TEAM_KEY` support.
- Dry-run first Linear write helpers with idempotency keys and explicit approval guards.
- Sprint runner that routes `pokit:prd` and `pokit:criteria` issues.
- Run Summary with `AI가 하지 않은 것` first.
- Local PRD and acceptance criteria draft generation with `content_hash` frontmatter.
- Completed/canceled Linear issue skipping.
- Working-context selection that skips completed upcoming cycles when a later cycle has open Todo work.
- Completed-cycle immutability guard: new Todo work moves to the next cycle unless the user explicitly reopens the completed cycle.
- Cycle-first completion reports and compact resume brief generation.
- Cycle-level next-action wording so users are not asked to approve mechanical substeps.
- Brief output now shows one Cycle-level execution sentence and no numbered quick-command prompts.
- Release/Hotfix Cycle policy and guard metadata for deployment omissions and urgent redeploys.
- Hotfix Cycle creation helper and issue move dry-run for deployment omission tracking.
- Cycle maintenance helper for Linear cycle completion dry-runs when POKit operational completion drifts from Linear date state.
- Label preflight dry-run helper.
- Cycle retro draft helper.
- Onboarding checklist, README quickstart, first-run smoke test, skill guidance, and example Linear issues.
- Security guidance for `.env`, API key rotation, and generated artifacts.
- Public repo artifact policy: dogfood examples live under `examples/`, local generated outputs stay under `artifacts/`.

### Out Of Scope

- A/B test implementation.
- Persona test implementation.
- PDF export.
- Automatic cron.
- Standalone CLI product or global installer.
- Silent Linear/GitHub writes.
- Automatic GitHub push, tag, or release publication.

### Release Gate

- Clean check recorded in `docs/RELEASE_CHECKLIST.md`.
- Test suite passed: 64/64.
- GitHub tag/release publication is tracked by the repository tag and GitHub release record.
- Tag/release creation requires explicit user approval before the public write.
