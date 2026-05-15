# Changelog

## Unreleased

No pending public release notes.

## v0.5.0 - 2026-05-15

### Added

- Added Focus Run checklist grouping to the session brief so Linear labels can surface compact execution bundles.

### Docs / Policy

- Documented Focus Run checklist behavior and Cycle-level operating guidance for the v0.5.0 release scope.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 138/138.

## v0.4.4 - 2026-05-15

### Fixed

- Use Linear cycle `number` as the canonical Cycle label in session brief and close next-action wording.
- Warn when a Linear cycle name contains a different `Cycle N` than the canonical Linear cycle number.
- Surface Linear API validation details, including user-presentable messages, fields, constraints, and summarized values.
- Compact Linear cycle descriptions before writes to prevent known `description` max length API failures.

### Docs / Policy

- Documented the v0.4.4 hotfix scope in release notes before public release.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 135/135.

## v0.4.3 - 2026-05-15

### Fixed

- Recognize release completion evidence in `cycle-close` and `session-close` when Linear cycle `completedAt` is unavailable.
- Preserve Linear cycle descriptions in working context so release evidence can be evaluated locally.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 129/129.

## v0.4.2 - 2026-05-15

### Docs / Policy

- Added Backlog Intake and Linear Create Preflight MVP examples for Cycle 7 preparation.
- Clarified that Opus/private review notes are not part of the public intake flow.
- Clarified that parallel subagent planning is a POKit workflow capability while runtime spawn approval is a runtime constraint.
- Required flow adherence checks before completion claims.
- Required remaining-work answers to check Cycle close and release state before recommending Backlog or next-Cycle work.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 127/127.

## v0.4.1 - 2026-05-15

### Fixed

- Improved stale `POKIT_PROFILE` errors so users see available profiles and a concrete local config fix.

### Docs / Policy

- Added Definition Pipeline governance with `full`, `focused`, and `patch` size levels.
- Added reusable subagent role contracts and Korean user-facing definition templates.
- Added public-safe PO Daily News Signal definition examples under `examples/definition/POKIT-89/`.
- Required actionable external write dry-runs so approval-pending responses include the next executable plan.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 118/118.

## v0.4.0 - 2026-05-14

### Added

- Added PO Signal Watch workflow docs and source registry guidance for turning external product signals into backlog candidate dry-runs.
- Added Signal Watch examples for discovery briefs and backlog candidate dry-runs.
- Added POKit Brief parent progress bars and hierarchical sub-issue detail views.
- Added release preflight and hook map scripts so `before_public_release` gates are executable and visible.
- Added POKit flow and hook detail views to the session brief.

### Changed

- Refined Cycle 5 operating gates for Identity Fit, Discovery depth, external write confirmation, and completion reporting.
- Fixed Cycle close and session close behavior so all-Done issues are reported as release pending until the approved release gate completes.
- Updated session brief fallback behavior so empty upcoming cycles can surface backlog candidates more clearly.
- Added Linear parent issue metadata to issue reads so parent and sub-issue progress can be shown together.
- Extended `workflows/hooks.yaml` with enforcement metadata for release gates.

### Docs / Policy

- Documented Korean-first user-facing replies, reports, and local artifacts.
- Moved detailed completion and external write confirmation contracts into `docs/OPERATING_MODEL.md`.
- Reduced duplicated rule text in `AGENTS.md` by linking to the canonical operating model.
- Documented compact ASCII visualization patterns for live POKit conversations.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 106/106.

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
