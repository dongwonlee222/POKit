# Changelog

## v0.17.6 - 2026-05-18

### Added

- Codex local plugin one-command installer. `./bin/install-codex-plugin` now registers the POKit local marketplace, links the local plugin cache, and enables `pokit@pokit-local` in `~/.codex/config.toml`. Regression: `tests/integration/codex-plugin-install.test.mjs`.
- Codex installable plugin root. `.agents/plugins/marketplace.json` and `plugins/pokit/.codex-plugin/plugin.json` expose POKit as a repo-local plugin, with `plugins/pokit/skills` pointing to the canonical `skills/` directory.
- Package script `npm run install:codex-plugin` for users who prefer npm script entrypoints.

### Docs

- README and onboarding now document the general-user Codex install path: clone, `npm install`, `./bin/install-codex-plugin`, restart Codex/new thread, then `$pokit-start`.
- Session output contract clarifies that Codex plugin loading is installed through the local installer and that `$pokit-start` remains the deterministic invocation.

### Tests

- Local skill contract now verifies marketplace wiring, plugin manifest skill exposure, and plugin root shape.
- Folder layout contract now recognizes `.agents/` and `plugins/` as public install-support folders.

## v0.17.5 - 2026-05-18

### Fixed

- POKIT-214 — profile별 `memory_dir` 기반 session bootstrap. `memory/context-map.yaml`은 `memory/resume-brief.md` 같은 canonical path를 유지하고, `pokit start`/시작 브리프는 active profile의 `memory_dir` 아래 `resume-brief.md`를 우선 해석한다. Regression: `tests/integration/session-start.test.mjs`.
- POKIT-214 — `backlog-promote` frontmatter parser가 `depends_on: []`, `absorbs: []` 같은 inline empty array를 배열로 파싱하도록 수정. Linear 승격 중 `fm.depends_on.join is not a function` 오류 방지. Regression: `tests/internal/backlog-promote.test.mjs`.
- POKIT-215 — 회귀 테스트의 개인 절대경로 의존을 제거했다. Linear hook/CLI 테스트가 repo-relative 경로를 사용하고, `POKIT_PROFILE`이 설정된 로컬 환경에서도 임시 fixture가 독립적으로 통과한다.

### Added

- POKIT-215 — Codex plugin manifest 추가. `.codex-plugin/plugin.json`을 도입하고 `.claude-plugin/plugin.json`과 함께 `package.json` version sync contract를 둔다.
- POKIT-215 — `scripts/hooks/block-linear-api.sh`를 public repo script로 추가해 `.claude/` 로컬 훅과 테스트가 같은 차단 로직을 공유할 수 있게 했다.
- POKIT-215 — local skill trigger contract 강화. `AGENTS.md`에 repo-local `skills/*/SKILL.md` trigger 우선 규칙을 추가하고, `pokit-start`/`pokit-end`에 `POKit ...` trigger 문구를 보강했다.
- POKIT-215 — skill dispatcher trigger routing을 더 긴 phrase 우선으로 변경해 `Linear 백로그 등록`이 generic `backlog-memo`보다 `linear-issue-manager`로 라우팅되게 했다.
- POKIT-215 — local skill contract tests 추가. plugin manifest/version sync, 핵심 스킬 출력 계약, trigger matrix, 13개 skill manifest 목록을 검증한다.

### Docs

- POKIT-215 — `backlog-memo`의 존재하지 않는 `linear-backlog-manager` 참조를 `linear-issue-manager`로 정정.
- POKIT-215 — `linear-issue-manager` 문서에서 `plan*`은 dry-run 생성, `apply*`는 승인 후 Linear write 경계임을 명확히 했다.
- POKIT-215 — `docs/_details/session-output-contract.md`, `docs/ONBOARDING.md`, `docs/architecture/15-folder-layout.md`에 Codex/Claude plugin manifest 경로를 반영했다.

## v0.17.4 - 2026-05-18

### Added

- POKIT-211 — 백로그 lifecycle 관리. `./bin/pokit plan <ver>` planning gate CLI 신규 (verb 19→20). 직전 release manifest unresolved에서 carry-over 자동 감지 (owner=POKIT-XXX 필터) + Linear Team Backlog fresh 통합 표 + `--apply --issues` 비대화형 모드. 선택 항목 description 상단(`## AS-IS` 또는 다른 `##` 헤더 직전)에 `## 버전 v<X.Y.Z>` 라인 insert (carry-over는 `(carry-over from v<X.Y.Z-1>)` 표기). `pokit start` 출력에 `🎯 다음 target version: vX.Y.Z (N건: carry-over X / fresh Y)` 라인.
- POKIT-211 — `scripts/internal/version-line.ts` 신규 (`insertVersionLine`/`readVersionLine` — `## AS-IS` 외 다른 `##` 헤더 경계 인식, 하단 자유 형식 carry-over 노트 보존).
- POKIT-211 — `scripts/internal/workflow-state.ts` `markCycleStart(rootDir, targetVersion, now?)` 추가 (target_version set + state=active + last_release_version 보존).
- POKIT-211 — `scripts/internal/linear.ts` `IssueUpdateInput.descriptionFull?` 추가 (replace 모드, insert-at-top 지원) + `fetchIssueByIdentifier` export.
- POKIT-212 — 외부 콘텐츠 장기기억 ingest + retrieval 통합 (web/github/youtube) backlog 등록. v0.17.5 후속 명시 할당.

### Notes

- v0.17.4 dogfood 7건: POKIT-159(carry-over) + POKIT-206/207/209/210/211/212 description에 `## 버전 v0.17.4` 라인 박힘.
- POKIT-211 자기-사용 검증 — `./bin/pokit plan 0.17.4 --apply` 로 v0.17.4 자체 배치 완료.
- 본 cycle = POKIT-211 단독 release. POKIT-206/207/209/210 + POKIT-212/159 = v0.17.5 carry-over.

## v0.17.3 - 2026-05-18

### Added

- POKIT-203 — release artifact migration + INDEX.md 자동 생성. `scripts/internal/release-artifacts-migrate.ts` (artifacts + backlog-raw → releases/v<X>/). release.ts [4.7/8] [4.8/8] 신규.
- POKIT-205 — flow-state T1-T4. `workflow-state.yaml` 5↔10 매핑 + advance API + `./bin/pokit advance <step> [--issue ID]` + `.claude/hooks/flow-gate.sh` (PreToolUse Edit|Write 차단, build 미진입 시 exit 2). renderFlowProgress (5단계 선형 ASCII). escape hatch: `POKIT_FLOW_BYPASS=1`.
- POKIT-182 — `memory/workflow-state.yaml` cycle 상태 단일 source. `scripts/internal/workflow-state.ts` (`markSessionStart`/`markSessionClose`/`markReleaseStart`/`markReleaseComplete`).
- POKIT-159 — 장기기억 retrieval v1 stub. `docs/architecture/16-retrieval.md` (소스 4개 / API shape / 분할 a/b/c). `scripts/internal/retrieval.ts` decision-log 어댑터 (단순 keyword count score). **159b/c (어댑터 3개 + start 통합) 은 v0.17.4 carry-over** (POKIT-211 설계 후 명시 할당).

### Fixed

- POKIT-208 — `scripts/cli/release.ts` 마지막에 `markReleaseComplete(rootDir, version)` wire-in. v0.17.2 release 후 `workflow-state.yaml.last_release_version: null` 잔존 버그 정정. dry-run skip. regression: `tests/regression/v0.17.3-mark-release-complete.test.mjs` (2 케이스).
- POKIT-204 — `backlog-promote` 기본 필터에 `promoted/dropped` 자동 제외 추가.
- POKIT-192 — backfill 후속: `routed_to` 항목 제외 + prev manifest walk-back 검색. v0.17.2 manifest unresolved parser 확장.

### Notes

- v0.17.2 unresolved 1건(POKIT-159 159b/c) → v0.17.4 carry-over.
- 신규 메타 백로그 5건 → v0.17.4 carry-over: POKIT-206 / POKIT-207 / POKIT-209 / POKIT-210 / POKIT-211.
- 세션 발굴: `pokit start` 후 작업 중 발견된 메타 이슈 묶음(workflow-state 자동 갱신 누락, resume-brief stale, active-rules hook 단계 추적 누락, "박제" 어휘 잔존, immutable 검색 컨벤션, lifecycle 관리).

## v0.17.2 - 2026-05-18

### Added

- POKIT-199 — C4 Phase 2 마이그레이션 완료. `artifacts/{prds,criteria,sprints}/` 39 파일을 `releases/v0.16.0/` 로 이관 (Linear workspace slug sanitize 동반). `artifacts/` 는 cycle 진행 중 scratch 영역으로 유지. `docs/architecture/15-folder-layout.md` 갱신.
- POKIT-192 — release dispatcher [4.5/8] manifest backfill. `scripts/internal/manifest-backfill.ts` 신규 — `collectCycleIssues`, `carryForwardUnresolved`, `snapshotWiringActual`, `escalateUnresolved`. `runManifestBackfill` (pure) + `backfillForRelease` (IO) + `findPreviousReleaseManifest`. release.ts [4.5/8] 단계 신규 (manifest 존재 + apply 모드 시 자동). `ReleaseUnresolved` 스키마 확장 (`cycle_count?`, `carried_from?`, `escalated_at?`, `routed_to?`, `absorbed_by?`).
- POKIT-182 — `memory/workflow-state.yaml` cycle 상태 단일 source. `scripts/internal/workflow-state.ts` — `WorkflowState` 타입 + `loadWorkflowState`/`saveWorkflowState` + `markSessionStart`/`markSessionClose`/`markReleaseStart`/`markReleaseComplete`. session-start/close 자동 갱신 wire-in.
- POKIT-159 — 장기기억 retrieval v1 stub + 설계 PRD. `docs/architecture/16-retrieval.md` (소스 4개 / API shape / 분할 a/b/c / 비-목표). `scripts/internal/retrieval.ts` — `retrieveContext` API + decision-log 어댑터 (단순 keyword count score).

### Notes

- 159b/c: backlog-raw / session / release 어댑터 추가 + pokit start 통합 (후속 cycle).
- 192 후속: manifest-backfill 실 사용 시 fetchIssues hook 추가 (Linear cycle issues 자동 fetch).

## v0.17.1 - 2026-05-18

### Added

- POKIT-198 (bl-011) — `backlog-promote` 스킬 + `pokit backlog-promote` CLI: memory/backlog-raw/*.md 메모를 Linear에 배치 승격. 자연어 진입 (Trigger Guard "Linear" 단어) → 파라미터 추출 (target/status/id) → dry-run → 사용자 승인 → apply → memo frontmatter 자동 갱신 + decision-log append. 사용자·LLM·sub-agent·hook 공통 진입점.
- POKIT-194 (bl-002) — session-scope raw 백로그 + pokit start/end 출력 보강. `memory/backlog-raw/` 디렉토리 + 4섹션 양식 + per-item .md. `backlog-raw-collector.ts` 함수 (loadBacklogRawSummaries / filterPendingRaw / filterCreatedOn / renderPendingRawLines / renderTodayRawLines). pokit start: 📝 raw 백로그 (정리/승격 대기) N건 / pokit end: 📝 이번 세션이 만든 raw 백로그.
- POKIT-195 (bl-004) — `linear.ts` CLI `create --apply` 지원. `IssueInput.rawDescription` 추가, applyCreateIssue 분기 처리, "미지원" throw 제거. dry-run → write 일관 흐름 확보, batch 등록 가능 상태.
- POKIT-196 (bl-005) — `decision-log.md ↔ decision-log.yaml` 자동 동기화. `appendDecisionLog(entry, yamlPath?, mdPath?)` md 옵션 추가, `appendDecisionLogMarkdown(raw, entry)` 헬퍼 신설. yaml + md 1:1 매핑 보장.
- POKIT-200 (bl-008) — `assign-label` 누적 보존 (add/replace 모드). 기본 'add' = 기존 라벨 + 신규 union. `fetchIssueLabelIds` 헬퍼. CLI `--mode` 옵션. 동반 버그 수정: applyPlan.issueId 가 label UUID 였던 것을 issue identifier 로 정정.
- POKIT-201 (bl-009) — `block-linear-api.sh` 화이트리스트 강화. node 옵션 플래그(`--experimental-strip-types` 등) 매칭. self-test 21/21 PASS. (.claude/ gitignored, 로컬 적용)
- POKIT-202 (bl-010) — 테스트 디렉토리 표준. `tests/_setup/` 공통 helper (mkTempDir/writeFixture/runLinearCli/runPokitVerb/writeBacklogMemo/readUtf8) + `tests/regression/v<ver>-<bug>.test.mjs` 명명 + `tests/README.md` 표준 문서.

### Refactored

- POKIT-193 (bl-001) — "박제" 어휘 맥락별 치환. release manifest 박제 / 결정 박제 / unresolved carry-forward 박제 → "기록". dry-run 박제 + 승인 → dry-run 미리보기 + 승인. 사용자 안내 맥락의 "진입" → "진행", "재발화" → "재언급". 16건 치환, 9 파일 (CHANGELOG, CLAUDE, AGENTS·없음, docs/_details/approval-flow, docs/architecture/13, scripts/cli/release, scripts/internal/{next-action-wizard,release-manifest}, skills/linear-issue-manager, .claude/hooks/show-active-rules — gitignored).
- POKIT-197 (bl-006) — dogfood historical 참조 정리. docs/OPERATING_MODEL: "dogfood validation" → "self-use validation". docs/PRD: "1주 dogfood" × 4 → "1주 자체 사용". README: dogfood/ 경로 예시 → artifacts/ 경로 (dead link 정정). docs/architecture/15-folder-layout 의 historical 명시 부분 유지.

### Backlog Infrastructure

- `memory/backlog-raw/` 디렉토리 신설: 11 raw 메모 + README.md 양식 (4섹션 의무: AS-IS/TO-BE/성공 검증/담당 에이전트). 모든 메모 status=promoted 완료.
- `releases/v0.16.0/manifest.yaml` unresolved 13건에 `absorbed_by` / `routed_to` 매핑 추가. 다음 pokit start 출력에서 라우팅 추적 가능.

### Notes

- POKIT-199 (C4 Phase 2 + M6) — coreу 모듈 영향 (sprint-runner/cycle-close 경로 하드코딩) → v0.17.3 또는 v0.18 단독 cycle 이월. Linear description 에 분할 권장 (a/b/c) 박힘.
- POKIT-192 (release dispatcher [4.5/8] manifest backfill) — bl-002 collectUnresolved 재활용 + dispatcher 변경 + 신규 함수 4개 → v0.17.3 또는 v0.18 단독 cycle 이월. Linear description 에 분할 권장 박힘.
- Linear 신규 11건 발급 (POKIT-193~POKIT-202) + POKIT-192 description append.

## v0.16.0 - 2026-05-17

### Added

- POKIT-187 (WF10) — `block-linear-api.sh` hook: 엔드포인트 단일 앵커 `api\.linear\.app` + 명령어 시작 화이트리스트 + suffix-chain 차단. urllib/fetch/axios/gh/wget/httpx 6 클라이언트 우회 차단. 회귀 테스트 13/13 PASS.
- POKIT-189 (WF12) — `scripts/internal/linear.ts` CLI 진입점: subcommand 3종(create/update/assign-label) + `--format json|pretty` + `--actor` 강제 + 파일 입력 검증(512KB + realpath). node --experimental-strip-types로 tsx 의존 제거.
- POKIT-181 (C4 Phase 1) — `scripts/internal/artifact-frontmatter.ts` 산출물 frontmatter 표준 모듈: 10 kinds(decision-log/manifest/brief/memo/prd/criteria/linear-desc/retro/analysis/workflow-state) + parseFrontmatter/renderFrontmatter/validateKind/scanArtifacts/migrateFile. 20건 마이그레이션 + warn-only contract test 26/26 PASS. (Phase 2 전수 마이그레이션은 별도)
- POKIT-178 (A2) — `buildReleaseManifest` wiring intended 자동 추출: `extractIntendedWiring(prdContent, changelogSection)` 백틱 식별자 + 마커 기반. v0.15.3 fixture 2건 추출 검증.
- POKIT-185 (C8) — `scripts/internal/dry-run-format.ts` 헬퍼 + `renderDryRunPlan(target, change, approval)` 3섹션 표준(대상/변경/승인). linear.ts CLI `--format pretty` 옵션.
- POKIT-186 (C9) — `backlog-memo` 스킬에 `## 시각화` 섹션 강제 + 시각화 가이드(Before/After, 80자, 이모지 마커). renderLocalBacklogMemo에 visualization 필드 추가.
- POKIT-191 (WF11) — tests/ 카테고리 분리(contracts/15 + hooks/3 + internal/20 + integration/22) + `_dispatcher.test.mjs` + package.json scripts 4종 신규(test:contracts/hooks/internal/integration). 433 tests PASS.

### Fixed

- POKIT-179 (A4) — `parseChangelogSection` 헤더 라인 `## v0.15.3 - 2026-05-17`의 후미 `- 2026-05-17`이 첫 bullet으로 오인되던 false positive 제거.
- POKIT-190 (WF13) — linear.ts CLI `appendDecisionLog` 버그: `fs.appendFile`이 `latest_decision_at` 라인 뒤에 entry를 박아 `decisions:` 배열 밖에 위치하던 dangling 문제. hand-rolled YAML 파싱 + writeFile 전체 재작성으로 해소. 기존 dangling 2건 자동 흡수 정리. 회귀 14/14 PASS.
- POKIT-175 (B1) — `dogfood/` 디렉토리 전체 제거(9 파일) + `docs/architecture/15-folder-layout.md` 갱신(폴더 수 14→13) + `.gitignore`/`role-map.yaml`/`OPERATING_MODEL.md` 동기화.

### Theme

POKit Workflow Productization — 명령 중심에서 스킬 중심으로, 산출물 표준화, 폴더 통합. 워크플로우 핵심(hook/CLI/frontmatter foundation) 안정화.

### Notes

- v0.16.0 1차 병렬 그룹 10건 완료. 2차/3차/4차(C3·C5·C6·C7·P1·A1·A3) 후속 cycle.
- linear.ts CLI dogfood로 본 release의 모든 Linear update 1줄 명령 처리.
- artifact-frontmatter Phase 2(전수 마이그레이션 + warn→block 전환): C5/C7이 frontmatter 소비 시작 시점 도달 후 진행.

## v0.15.3 - 2026-05-17

### Fixed

- `scripts/cli/session-brief.ts` `buildUnresolvedCard` — 옛 경로 `memory/releases/v<X>.yaml` 하드코딩을 `releaseManifestPath()` 헬퍼 경유로 교체. POKIT-175(M6) 마이그레이션 직후 unresolved 카드 미렌더 버그 해소. (commit 408090e)

### Added

- 회귀 가드 (POKIT-173 회귀 방지) — 동일 클래스의 미래 버그 차단 (commit 07ed02c):
  - `tests/session-brief.test.mjs` — `buildSessionBrief` start variant의 unresolved 카드 렌더 회귀 테스트 1건 신설.
  - `docs/architecture/15-folder-layout.md` — `releases/` 항목 옆 가드 문구. "release manifest 경로는 `releaseManifestPath()` 헬퍼 경유 필수, 하드코딩 금지" + 회귀 테스트 참조.

### Notes

- semver PATCH 자리(hotfix) 활용 운영 방침 첫 적용 — 작은 fix도 release manifest에 기록해 추적 채널 단일화 (Unreleased 섹션 신설 회피).
- `./bin/pokit release 0.15.3` dispatcher [4/8]가 manifest를 **자동 생성** — POKIT-171(M2) buildReleaseManifest dogfood 검증.

## v0.15.2 - 2026-05-17

### Added

- POKIT-171 (M2) — `./bin/pokit release [4/8]` manifest 미존재 시 자동 생성:
  - `scripts/internal/release-manifest.ts` `buildReleaseManifest(version, opts)` 신규 + `parseChangelogSection(rootDir, version)` 헬퍼.
  - `scripts/cli/release.ts` [4/8] 분기 — 미존재 시 `writeReleaseManifest` 자동 호출 (issues/changelog/artifacts 빈 배열로 시작).
- POKIT-173 (M4) — 미결 인계 메커니즘:
  - `ReleaseManifest` 타입에 `unresolved?: Array<{id, note, owner}>` 필드 추가. render/parse round-trip 지원.
  - `scripts/cli/session-brief.ts` start variant — "🪧 이전 릴리스 미결 N건" 카드 자동 렌더 (직전 manifest unresolved 참조).
- POKIT-176 (M7) — wiring 실측 probe:
  - `scripts/internal/wiring-probe.ts` 신규 — `countProductionHits(id, rootDir)` + `scanWiring(intended, opts)`.
  - 단위 테스트 3건 추가.
- POKIT-177 (M10) — `linear-issue-manager` SKILL 신설 (구 `linear-backlog-manager` 리네임):
  - `scripts/internal/linear.ts` `planUpdateIssue` / `applyUpdateIssue` / `composeAppendedDescription` / `fetchIssueByIdentifier` / `resolveWorkflowStateId` 추가.
  - SKILL 본문에 Routing 분기(`POKIT-\d+` 매칭 → Update / 미포함 → Create) + Step 3-update 절차.
  - `tests/linear-update.test.mjs` 신규 (9건).

### Changed

- POKIT-172 (M3) — `release.ts [6/8]` retro-check `--dry-run` 고정 해제. dry-run plan → `[y/N]` 프롬프트 → `--apply` 재실행 흐름. TTY 없음 시 자동 skip + WARN.
- POKIT-174 (M5) — 백로그 라우팅 강화:
  - `skills/backlog-memo/SKILL.md` trigger_phrases 확장 ("백로그 등록/추가/만들어/올려" 등 6건).
  - `skills/linear-issue-manager/SKILL.md` Trigger Guard 섹션 — 발화에 `Linear` 단어 없으면 즉시 거부.
  - `CLAUDE.md` "백로그 라우팅 규약" 섹션 추가.
- POKIT-175 (M6) — `releases/v<버전>/manifest.yaml` 단일 폴더 묶음:
  - `memory/releases/v*.yaml` → `releases/v*/manifest.yaml` 이동 (4건).
  - `memory/releases/SCHEMA.md` → `releases/SCHEMA.md`.
  - `releaseManifestPath()` 헬퍼 경로 갱신. `retro-check` evidence 경로도 동기.
  - `memory/releases/` 폐기. `artifacts/{prds,criteria,sprints}/` 마이그레이션은 후속 백로그.
- `.claude/hooks/block-linear-curl.sh` 메시지 `linear-backlog-manager` → `linear-issue-manager` 갱신.
- `.claude/settings.local.json` permissions 영구 허용 목록 정비 (mkdir/mv/rm/git mv/node/./bin/pokit/gh 등).

### Notes

- M8 (POKIT-170 보류 처리) / M9 (POKIT-159 link append) 는 M10 SKILL 첫 사용 케이스로 본 릴리스 내 처리. `releases/v0.15.2/manifest.yaml` `unresolved:` 기록 확인.

## v0.15.1 - 2026-05-17

### Added

- POKIT-167 — Linear write 단일 진입점 + release manifest 기반 + 8단계 release dispatcher:
  - `scripts/internal/backlog-outline.ts` `renderLinearBacklogDescription` — 4섹션(AS-IS/TO-BE/성공 검증/담당 에이전트) 추가, 타입 확장.
  - `scripts/internal/release-manifest.ts` 신규 — `memory/releases/v<VERSION>.yaml` schema + parse/render/write 모듈 (`memory/releases/SCHEMA.md` 동봉).
  - `scripts/internal/retro-check.ts` + `scripts/cli/retro-check.ts` — 이전 버전 wiring 갭 3분류(structural/partial/bitrot) + `pokit:gap` 라벨 디스패치.
  - `scripts/internal/next-action-wizard.ts` + `scripts/cli/next-action.ts` — target version·issues·의도 기록 입력 wizard, `memory/next-action.yaml` 저장. `session-brief.ts`가 이 파일을 우선 참조.
  - `scripts/cli/release.ts` — `./bin/pokit release <version>` 8단계 dispatcher (버전검증 → safety scan → tag/push → manifest 생성 → cycle close → retro-check → next-action wizard → resume-brief 기록).
  - `.claude/hooks/block-linear-curl.sh` — Linear GraphQL 직접 호출 PreToolUse 차단 + `--allow-raw-linear` escape hatch.
  - `skills/backlog-memo/SKILL.md` 신규 (로컬 dry-run 진입점), `skills/backlog-manager` → `skills/linear-backlog-manager` 리네임 + 4섹션 강제·raw curl 금지 명시.
  - `memory/releases/v0.13.0.yaml`, `v0.14.0.yaml`, `v0.15.0.yaml` 백필 3건 — v0.14.0에 structural gap 3건 기록.
  - `scripts/internal/planCreateIssue`가 `LinearBacklogDescriptionInput` 강제 + `backlog-seed-plan.ts` 5건 마이그레이션.

### Changed

- `bin/pokit` + `scripts/internal/verb-dispatch.ts` — `retro-check`, `next-action`, `release` verb 등록 (총 16 verbs).
- `skills/backlog-router/SKILL.md` — 2단계 라우팅 분기(backlog-memo / linear-backlog-manager) 추가.
- 문서 동기: `docs/PRD.md`, `docs/plans/IMPLEMENTATION_PLAN.md`, `docs/history/DESIGN.md`에서 backlog-manager → linear-backlog-manager 갱신.

## v0.15.0 - 2026-05-17

### Added

- session-brief 라벨 명확화 + 다음 스프린트 target version 노출 [POKIT-163]:
  - `scripts/cli/session-brief.ts` — `스프린트(배포 버전)` → `마지막 스프린트 배포 버전` 라벨 변경.
  - 신규 라인 `다음 스프린트 target version: <value>` 추가 (active cycle manifest `targetVersion` 참조, 없으면 `(미정)`).
  - `scripts/internal/manifest-lookup.ts` `getActiveCycleTargetVersion()` 함수 추가.
  - `tests/session-brief.test.mjs`, `tests/session-start.test.mjs` 케이스 갱신.
- 정보 탐색 자동 위임 — research-gate [POKIT-165]:
  - `docs/_details/subagent-contract.md` `## research-gate` 섹션 신규 — 읽기 전용 탐색은 Haiku/Explore 위임, 메인은 schema-only 응답.
  - `skills/plan-gate/SKILL.md` `--mode research|build` 옵션 추가.
  - `scripts/internal/intent-classifier.ts` 신규 — `classifyIntent()` 키워드 기반 분류.
  - `tests/research-gate.test.mjs` 신규 (7 케이스).
- Collected Data Sweep 리포트 [POKIT-118]:
  - `scripts/cli/collected-sweep.ts` 신규 — `artifacts/profiles/*/collected/raw/` 스캔. retention_until 지남·sidecar 없음·PII raw 30일 이상 리포트만 출력. 자동 삭제 절대 없음.
  - `--json` 플래그 지원.
  - `scripts/internal/verb-dispatch.ts` `sweep` verb 등록.
  - `tests/collected-sweep.test.mjs` 신규 (10 케이스).

### Changed

- 워크플로 변화 없음. 모든 변경은 호환 유지 (라벨 텍스트 변경은 사용자-facing 출력만).

## v0.14.0 - 2026-05-17

### Added

- Working Notes Lifecycle — Memory MVP [POKIT-115]:
  - `scripts/internal/working-notes-validator.ts` 신규 — issue/status/updated_at 필수 필드 + status enum (wip|blocked|done|abandoned) 검증.
  - `templates/working-notes/_template.md` 신규 — 작업 노트 템플릿.
  - `docs/_details/working-notes-lifecycle.md` 신규 — 경로 규칙, status 정의, 아카이브 정책.
  - `scripts/cli/cycle-close.ts` `archiveDoneWorkingNotes()` 추가 — Cycle close 시 done 노트 아카이브.
  - `tests/working-notes-archive.test.mjs` 신규 — 10개 테스트.
- Cycle 릴리스 Manifest 추적 [POKIT-116]:
  - `scripts/internal/manifest-lookup.ts` 신규 — cycle/release manifest 조회 유틸리티.
  - `artifacts/profiles/_template/cycles/`, `artifacts/profiles/_template/releases/` 템플릿 추가.
  - `docs/_details/cycle-manifest-schema.md`, `docs/_details/release-manifest-schema.md` 신규.
  - `scripts/cli/session-start.ts`, `scripts/cli/session-close.ts` manifest 통합.
  - `tests/manifest-lookup.test.mjs` 신규.
- Collected Data Governance [POKIT-117]:
  - `artifacts/profiles/_template/collected/` 디렉토리 구조 신규 — raw/digest/examples 하위.
  - `.gitignore` 업데이트 — collected 데이터 거버넌스 규칙 적용.

## v0.13.0 - 2026-05-17

### Fixed

- Top 3 정렬 결함 수정 (`session-brief.ts`) [POKIT-156]:
  - `[배포대상]`·`[정의필요]` prefix 이슈가 일반 priority=3 이슈보다 앞에 정렬되도록 `issueTier()` 도입.
  - 동일 parent를 가진 sub-issue는 Top 3 안에서 1건만 노출되도록 `selectNextCandidates()` dedup 로직 추가.
  - `buildRecommendation`의 `candidateNumbers` / Top 3 list는 이미 `selectNextCandidates` 단일 소스 사용 중 (분기 없음 확인).

### Added

- `tests/select-next-candidates.test.mjs` 신규 — 3룰 unit test 6개 [POKIT-156]:
  - 룰1: `[배포대상]`·`[정의필요]` prefix가 priority=3보다 앞에 정렬됨.
  - 룰2: 동일 parent sub-issue는 Top 3 안에서 1건만 포함됨.
  - 룰3: buildSessionBrief Top 3 첫 ID == 최우선 후보 ID.
- `issueTier`, `selectNextCandidates`, `compareIssuePriority` 함수 export 추가.
- 작업 플로우 단계 정의·렌더 분리 [POKIT-157]:
  - `docs/_details/cycle-steps.json` 신규 — 단계 정의 단일 소스.
  - `scripts/internal/cycle-steps.ts` 신규 — 정의 로드·접근 유틸리티.
  - `scripts/cli/cycle-progress.ts` 리팩토링 — 하드코딩 제거, cycle-steps.ts 사용.
- `session-close`에 git status 요약 출력 추가 [POKIT-154]: 커밋되지 않은 변경사항 경고.
- `plan-gate` 스킬 신규 추가 [POKIT-158]: plan.md 존재·품질 게이트 체크.
- `skills/acceptance-criteria-author`, `skills/prd-author`, `skills/sprint-runner` 업데이트 — plan-gate 연동 [POKIT-158].
- Role Map 단일 출처 yaml + `role-check` verb [POKIT-147]:
  - `docs/_details/role-map.yaml` 신규 — 역할 정의 단일 소스.
  - `scripts/cli/role-map-check.ts` 신규 — `pokit role-check` verb 구현.
  - `scripts/internal/verb-dispatch.ts` 업데이트 — role-check 등록.

## v0.12.2 - 2026-05-16

### Added

- POKit을 Claude Code 플러그인으로 배포 가능하게 함:
  - `.claude-plugin/plugin.json` 신규 — 플러그인 메타데이터 (name, version, description, author, repository).
  - 사용자가 `/plugin marketplace add dongwonlee222/POKit` + `/plugin install pokit@<marketplace>` 명령으로 설치 시 `skills/` 자동 등록, 새 세션에서 `pokit-start`/`pokit-end` 등 트리거 자동 동작.
  - CLI 경로(`./bin/pokit`)는 변경 없음. 플러그인은 CLI 위 통합 레이어.

### Changed

- `docs/ONBOARDING.md`: 설치 경로 두 가지 안내 — CLI 직접 사용 vs Claude Code 플러그인 설치.

## v0.12.1 - 2026-05-16

### Changed

- POKIT-155 후속: pokit-start, pokit-end 스킬을 `.claude/skills/` → `skills/`로 이동하여 POKit 스킬 디렉토리 단일 위치 통합. POKit dispatcher 스키마(`entry`, `labels`, `trigger_phrases`) 준수.
- `.gitignore`: `.claude/skills/` 예외 제거 (원복) — 모든 스킬은 `skills/`에 거주.
- `docs/_details/session-output-contract.md`: 경로·위치 구분 섹션 재작성. "POKit 내부 dispatcher vs 도구 통합 스킬" 이중 위치 → 단일 위치로 통일.

### Fixed

- `tests/skill-dispatcher.test.mjs`: 매니페스트 카운트 8→10, EXPECTED 배열에 `pokit-start`/`pokit-end` 추가.

## v0.12.0 - 2026-05-16

### Added

- POKIT-155 start/end 브리프 포맷 개편 + 스킬화:
  - `scripts/cli/session-brief.ts` start 변형 출력을 새 포맷으로 개편 — `🪧 POKit 시작 Brief`, `📅 날짜 · Team POKIT`, `- 스프린트(배포 버전): vX.Y.Z`, `- 💬 추천 다음 행동`, `📋 Linear 우선순위 Top 3`(priority 라벨 Urgent/High/Medium/Low). 기존 Profile/진행도바/Cycle 카운트 라인 제거.
  - 스프린트 버전은 `git describe --tags --abbrev=0` 사용, 실패 시 `package.json` fallback.
  - 추천 다음 행동은 `memory/resume-brief.md`의 "다음에 무엇을 하나" 섹션을 우선 채택, 없으면 기존 recommendation으로 fallback.
  - `scripts/cli/session-close.ts`에 `buildSessionCloseBrief()` + `--hypothesis` 플래그 추가. `./bin/pokit end`가 새 종료 브리프(`🎉 POKit 종료 Brief` · 스프린트 · 완료 목록 · 기대 가설 · 추천 다음 행동) 출력.
  - `.claude/skills/pokit-start`, `.claude/skills/pokit-end` 신설 — Bash tool 직접 호출 대신 스킬 경유로 stdout verbatim 출력 강제. Nexus current-context/save 패턴.

### Changed

- 명칭 통일: `Linear Weekly Cycle` / `Weekly Cycle` → **위클리 서클**, `POKit Version Run` / `Version Run` → **버전 스프린트**. 23개 파일 / 96곳 일괄 치환 (문서·코드 출력 문자열·테스트 어서션 포함). 다음 docs sync 릴리즈에 묶일 예정.

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
- `docs/ROADMAP.md` North Star/현재 목표/Identity Fit Check Q8에 LLM 명확성 기록.
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
- `tests/agents-md-size-regression.test.mjs`: AGENTS.md 라인 ceiling 40 → 45 (Core Principle 기록 ~4줄 사유).
- README.md, docs/VERSIONING.md, docs/OPERATING_MODEL.md: DESIGN.md Public 참조 제거.
- `.gitignore`: `docs/plans/`, `docs/history/`, `dogfood/`, `memory/manifests/`, `memory/problem-reviews/`, `.claude/` 추가. `artifacts/manifests/` whitelist 제거 (memory로 이동).

### Docs / Policy

- LLM 명확성을 POKit North Star/현재 목표/Identity Fit Check에 기록. 가벼움의 기준은 분량이 아니라 작업자 LLM이 헷갈리지 않는 구조다.
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
- Clarified 위클리 서클 vs 버전 스프린트 vs Release Bundle boundaries.
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
