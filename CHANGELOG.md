# Changelog

## Unreleased

No pending public release notes.

## v0.11.0 - 2026-05-16

### Added

- Linear 이슈 `priority` 필드 GraphQL 연동 (POKIT-152). 후보 이슈 정렬에 실제 Linear priority(1=Urgent ~ 4=Low) 반영.
- `scripts/cli/session-close.ts`에 `--next-action` 플래그 추가 — 대화 컨텍스트 기반 다음 행동을 명시적으로 전달 가능.
- `scripts/cli/session-start.ts` boot 시그니처에 `linear=api-key` 추가 — Linear 연결 방식(.env API key)을 매 세션 명시.

### Changed

- `selectNextCandidates()` 정렬 기준을 identifier 번호 → Linear priority로 변경 (POKIT-152). priority 없는 이슈(`0` 또는 미설정)는 후순위로.
- session-brief 후보 섹션 레이블 "🧺 다음 후보" → "Linear 우선순위 Top 3" 통일 (POKIT-153). `workflows/messages.yaml` 동기화.

### Fixed

- 없음.

## v0.10.0 - 2026-05-16

### Added

- `docs/architecture/15-folder-layout.md` 신규 — 14개 폴더 책임 정의 + 배포 표(Public/Internal) + 5가지 경계 결정 + 외부 사례 인용. 작업자 LLM이 매 세션 cold start에서 헷갈리지 않게 하기 위한 단일 출처.
- `AGENTS.md` Core Principle 섹션 신설 — "모든 구조 결정은 LLM 명확성을 최우선으로 한다".
- `docs/ROADMAP.md` North Star/현재 목표/Identity Fit Check Q8에 LLM 명확성 박제.
- `tests/folder-layout-contract.test.mjs` 신규 — 최상위 폴더가 §2 배포 표에 등록된 것만 허용, Internal 폴더는 `.gitignore` 동기화 검증.
- 신규 폴더: `memory/notes/`, `memory/manifests/`, `memory/problem-reviews/`, `artifacts/analyses/`, `artifacts/cross-runtime-diff/`, `dogfood/`, `docs/plans/`, `docs/history/`, `tests/fixtures/day2-dry-run/`.

### Changed

- 레거시 25개 폴더·파일 이동 (`git mv` history 보존):
  - `artifacts/backlog/*-problem-review.md` → `memory/problem-reviews/` (cross-run 학습 자료).
  - `artifacts/manifests/` → `memory/manifests/` (cross-run 추적).
  - `artifacts/pokit-deep-analysis-*.md` → `artifacts/analyses/`.
  - `workflows/cross-runtime-diff-{checklist,tests}.md` → `docs/_details/cross-runtime-diff.md` (2개를 1개로 통합).
  - `workflows/cross-runtime-diff-results/` → `artifacts/cross-runtime-diff/`.
  - `examples/dogfood/` → `dogfood/` (최상위 승격, 자체 작업 ≠ sample).
  - `examples/day2-dry-run/` → `tests/fixtures/day2-dry-run/` (test fixture).
  - `examples/definition/POKIT-89/` → `examples/definition-pipeline-sample/` (익명화).
  - `docs/{CYCLE_BRIEF_CLOSE_PLAN,GOAL_LOOP,IMPLEMENTATION_PLAN}.md` → `docs/plans/` (gitignore — 제작 plan은 사용자 노출 불필요).
  - `docs/{signal-watch-workflow,source-registry}.md` → `docs/_details/{signal-watch,source-registry}.md`.
  - `docs/DESIGN.md` (1149줄) → `docs/history/DESIGN.md` (gitignore — 전체가 design background/historical rationale 성격).
- `workflows/`는 이제 yaml 4개만 (선언적 정의 전용).
- `examples/`는 이제 3개만 (`backlog-intake/`, `definition-pipeline-sample/`, `signal-watch/` — 모두 sanitized).
- `scripts/internal/problem-error-review.ts`, `scripts/cli/session-brief.ts`: Problem Review 경로를 `memory/problem-reviews/`로.
- `scripts/ci/release-md-audit.ts`: DESIGN 검증 블록 제거 (untracked → audit 대상 아님).
- `tests/agents-md-size-regression.test.mjs`: AGENTS.md 라인 ceiling 40 → 45 (Core Principle 박제 ~4줄 사유).
- README.md, docs/VERSIONING.md, docs/OPERATING_MODEL.md: DESIGN.md Public 참조 제거.
- `.gitignore`: `docs/plans/`, `docs/history/`, `dogfood/`, `memory/manifests/`, `memory/problem-reviews/`, `.claude/` 추가. `artifacts/manifests/` whitelist 제거 (memory로 이동).

### Docs / Policy

- LLM 명확성을 POKit North Star/현재 목표/Identity Fit Check에 박제. 가벼움의 기준은 분량이 아니라 작업자 LLM이 헷갈리지 않는 구조다.
- Public/Internal 2-tier 분리 — 사용자가 `git clone` 시 보는 표면적은 9개 폴더 + 루트 파일만. memory/artifacts/dogfood/docs/plans/docs/history는 Internal.
- 5가지 경계 명확화: memory↔artifacts, workflows↔scripts, examples↔templates, artifacts/backlog↔memory, dogfood 위치.

### Verification

- 247/247 tests PASS (folder-layout-contract 4건 신규 포함).
- `workflows/` 가 yaml 4개만 남음 (정의/결과/문서 분리 완료).
- 최상위 폴더가 12개 → docs/architecture/15-folder-layout.md §2 배포 표와 일치.

## v0.9.0 - 2026-05-16

### Added

- `scripts/internal/dispatch.ts` 가 모든 verb의 on_error를 통합 처리 — Problem/Error Review 메모 자동 생성, 사용자 친화 ASCII 출력.
- Inline Fix 정책 명시 (`docs/_details/release-flow.md`) — 1~3 파일 / 외부 배포 없음 / 기존 설계 연결 누락 수준은 백로그/Hotfix 없이 즉시 수정.
- Operator Pre-task Judgment 게이트 정책 — 실행 전 분류·확인 단계 강제.

### Changed

- `scripts/cli/`로 `session-brief.ts` 와 `public-safety-scan.ts` 이동 (디렉토리 정합성, POKIT-145).
- Policy Precondition Gate 정책 추가 — Inline fix.
- Operator 정의와 Codex 운영 명시 — Inline fix.

### Fixed

- `korean-language-contract.test.mjs` ENOENT 해결 (POKIT-146) — 누락된 sprint artifact 처리.
- `session-start` 에러 처리 개선 — Inline fix.

### Docs / Policy

- `memory/resume-brief.md` gitignore 추가 — private session handoff 파일.
- Operator 역할과 Codex CLI 운영 흐름 명시.

### Verification

- 테스트 통과 (Cycle 11 close 시).

## v0.8.0 - 2026-05-16

### Added

- `bin/pokit` CLI wrapper with 11 verbs (`start`, `brief`, `run`, `close`, `retro`, `hotfix`, `audit`, `guard`, `progress`, `end`, `safety`) replaces direct `node --experimental-strip-types scripts/...` invocations in operating instructions.
- `package.json` with `bin` field and 12 npm scripts so `pokit start` / `npm run start` both work after `npm install -g` or local clone.
- `scripts/internal/dispatch.ts` with skill manifest loader (parseFrontmatter, loadSkillManifests, dispatchByLabels, dispatchByTriggerPhrase) and 14 dispatcher tests.
- `tests/agents-md-size-regression.test.mjs` guards AGENTS.md line count, full-command absence, and required detail-policy links.

### Changed

- `scripts/` reorganized from 30+ flat files into `scripts/cli/` (7 entry points), `scripts/internal/` (helpers, validators, render, lib, external-write), and `scripts/ci/` (8 release/CI scripts). 21 script imports and 36 test imports updated.
- `AGENTS.md` slimmed from 92 to 35 lines. Detail policy moved into `docs/_details/*.md`. Bootstrap, Korean-first principle, verb pointer, and link map kept inline.
- `docs/OPERATING_MODEL.md` slimmed from 727 to 174 lines (index + anchor stubs). Detail moved to 7 topic files in `docs/_details/`.
- All 8 `skills/*/SKILL.md` gained YAML frontmatter (`name`, `description`, `entry`, `labels`, `trigger_phrases`) for label-based dispatcher routing.

### Docs / Policy

- New `docs/_details/` directory with 8 topic files: `approval-flow.md`, `cycle-flow.md`, `release-flow.md`, `subagent-contract.md`, `memory-contract.md`, `completion-report.md`, `visualization.md`, `cli-internals.md`.
- `cli-internals.md` preserves the verb → `node --experimental-strip-types scripts/...` mapping as a debugging and CI escape hatch.
- `AGENTS.md` now indexes detail policies instead of embedding them, so main-agent context loads only what the current task needs.

### Verification

- 231 tests / 230 PASS / 1 pre-existing ENOENT in `korean-language-contract.test.mjs` (unrelated, sprint artifact missing).
- `pokit start` produces the same `pokit:boot ok cycle=... hooks=loaded` signature as the prior direct node invocation.
- `pokit safety` passes (no private POKit dogfood data leaked).
- Regression guards in `agents-md-size-regression.test.mjs` keep AGENTS.md under 40 lines, full-command-free, and linked to detail files.

## v0.7.1 - 2026-05-16

### Added

- Added release completion evidence rendering so GitHub push/tag completion can feed the POKit close flow.

### Fixed

- Documented and guarded the missing post-release step between GitHub push/tag and Cycle Completion Experience.
- Standardized the release completion evidence block that triggers the final celebration message.

### Docs / Policy

- Updated release/non-release flow and operating model docs to require release completion evidence before close celebration.

### Verification

- Release completion evidence tests passed.
- Release flow documentation tests passed.

## v0.7.0 - 2026-05-16

### Added

- Added architecture docs for glossary, document roles, backlog intake, cycle/version flow, release/non-release flow, versioning, visualization, conversation standards, backlog title/outline standards, and Linear structure standards.
- Added deterministic renderers for conversation visuals, backlog outlines, sub-issue task checklists, and POKit run identity.
- Added tests to lock user-facing copy, ASCII status blocks, Linear title/description structure, and POKit Circle identity.

### Changed

- Optimized session start output into a compact POKit Brief.
- Clarified Linear Weekly Cycle vs POKit Version Run vs Release Bundle boundaries.
- Standardized Korean-first backlog titles and separated machine variables into Linear descriptions.
- Kept Sub-issue child work as Task Checklist items instead of creating deeper Linear sub-sub-issues by default.

### Docs / Policy

- Documented context-dilution guards for orchestrator recovery, conversation copy, backlog structure, and Linear hierarchy.
- Documented when A/B choices, external write preflights, Problem/Error Review, and verification summaries appear.

### Verification

- Public safety scan passed.
- Release preflight passed after CHANGELOG update.
- Test suite passed: 194/194.

## v0.6.0 - 2026-05-15

### Added

- Added executable session bootstrap with `scripts/session-start.ts` and a `pokit:boot ok` signature.
- Added `on_error` Problem/Error Review runner and backlog memo writer.
- Added shared conversational ASCII renderer helpers for progress bars, status blocks, problem reviews, and approval requests.
- Added Memory MVP frontmatter validation and unified memory index helpers.

### Changed

- Centralized POKit progress visuals through the shared ASCII renderer.
- Updated session and cycle close reports to use `Daily Release Pending` for daily release cadence.
- Made daily release the default operating cadence while keeping Operating Cycle as a planning/review container.
- Strengthened Linear issue creation, relation metadata, hook, and bootstrap contracts.

### Docs / Policy

- Documented the Session Bootstrap Contract, Daily Release Contract, Memory MVP boundary, Problem/Error Review memo contract, and issue creation relation rules.
- Updated agent rules and script documentation so compact/resume flows rely on executable contracts instead of long context memory.

### Verification

- Release Markdown audit passed.
- Public safety scan passed.
- Test suite passed: 162/162.

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
