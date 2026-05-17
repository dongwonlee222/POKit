# 15. Folder Layout

POKit 리포지토리의 폴더 구조와 각 폴더의 책임을 정의한다. 이 문서는 **작업자 LLM이 매 세션 cold start에서 헷갈리지 않게** 하기 위한 단일 출처다.

> 가벼움의 기준은 분량이 아니라 LLM이 즉시 인식 가능한 구조다 — [AGENTS.md](../../AGENTS.md) Core Principle, [docs/ROADMAP.md](../ROADMAP.md) North Star.

## 0. 어디에 둘지 결정 흐름

작업 중 새 파일을 만들 때 이 순서로 판단한다.

1. **사용자가 봐야 하나?** → 아니면 Internal (gitignore)
2. **per-run vs cross-run?** → per-run = `artifacts/`, cross-run = `memory/`
3. **버전 단위 릴리스 산출물?** → `releases/v<버전>/`
4. **외부 공유용 sanitized sample?** → `examples/`
5. **선언적 yaml?** → `workflows/`
6. **빈 양식?** → `templates/`
7. **테스트 fixture?** → `tests/fixtures/`
8. **사용자 가이드 정책/설계?** → `docs/`
9. **제작 plan / 설계 히스토리?** → `docs/plans/` 또는 `docs/history/` (gitignore)

판단이 안 되면 본 문서의 §3 "5가지 경계 결정"을 참조한다.

## 1. 폴더 책임 정의 (13개)

### Public (사용자가 `git clone` 시 봄)

| 폴더 | 책임 | 안에 들어가는 것 |
|------|------|----------------|
| `bin/` | CLI 진입점 | `pokit` 실행 스크립트 |
| `scripts/` | 실행 코드 (TypeScript) | `cli/` 진입점, `internal/` 헬퍼, `ci/` 릴리스 |
| `tests/` | 자동 테스트 + fixture | `*.test.mjs`, `fixtures/` |
| `skills/` | skill 정의 | `<skill-name>/SKILL.md` + 부속 |
| `workflows/` | **선언적 yaml만** | `agent-roles.yaml`, `hooks.yaml`, `messages.yaml`, `definition-pipeline.yaml` |
| `templates/` | 빈 양식 (스켈레톤) | `definition-pipeline/*.md` 같은 채우기 전 양식 |
| `examples/` | **외부 공유용 sanitized sample** | 익명화된 사용 예시 |
| `docs/` | 사용자 가이드 + 정책 + 아키텍처 | `_details/` (policy split), `architecture/` (numbered) |

### Internal (`.gitignore`, 로컬에만 존재)

| 폴더 | 책임 | 안에 들어가는 것 |
|------|------|----------------|
| `memory/` | **cross-run 학습/맥락** | `notes/`, `manifests/`, `problem-reviews/`, `context-map.yaml`, `decision-log.*`, `resume-brief.md` |
| `artifacts/` | **per-run 산출물** (버전 무관) | `prds/`, `criteria/`, `sprints/`, `analyses/`, `cross-runtime-diff/` |
| `releases/` | **버전 단위 산출물 묶음** (POKIT-175 M6 + POKIT-204) | `v<버전>/manifest.yaml`, `v<버전>/INDEX.md`, `v<버전>/{prds,criteria,sprints,backlog,backlog-raw,gaps}/`, `v<버전>/retro.md`, `v<버전>/unresolved.md` |

> 📦 **Artifact Migration (POKIT-204)**: `pokit release` 의 [4.7/8] 단계가 `artifacts/{prds,criteria,backlog}/` 와 `memory/backlog-raw/` 에서 버전 매칭(frontmatter `linked_release` / `version` / `target_version` / `proposed_labels:release:vX` / 부모 디렉토리 이름)되는 파일을 `releases/v<X>/` 로 자동 이동한다. [4.8/8] 단계가 `INDEX.md` 를 생성한다 — 한 화면에 이슈·완료·미결·changelog·산출물 링크. 과거 버전 backfill: `./bin/pokit release-backfill [version]`.

> ⚠ **manifest 경로 가드 (POKIT-173 회귀 방지)**: 코드에서 release manifest 경로는 반드시 `releaseManifestPath(version, rootDir)` 헬퍼(`scripts/internal/release-manifest.ts`) 경유. `memory/releases/v<X>.yaml` 또는 `releases/v<X>/manifest.yaml` 같은 문자열 하드코딩 금지. M6 같은 경로 마이그레이션이 다시 일어나도 헬퍼만 갱신하면 모든 호출처가 자동 추종한다. 회귀 테스트: `tests/session-brief.test.mjs` "renders unresolved card from latest release manifest".
| `docs/plans/` | 제작 plan | `CYCLE_BRIEF_CLOSE_PLAN.md`, `GOAL_LOOP.md`, `IMPLEMENTATION_PLAN.md` |
| `docs/history/` | 설계 히스토리 | `DESIGN.md` 히스토리 부분 |
| `.claude/` | 에이전트 도구 로컬 상태 | `worktrees/` |

## 2. 배포 표 (Public/Internal 빠른 판단)

| 폴더 | 배포 | 비고 |
|------|------|------|
| `bin/` | ✅ Public | |
| `scripts/` | ✅ Public | |
| `tests/` | ✅ Public | fixture 포함 |
| `skills/` | ✅ Public | |
| `workflows/` | ✅ Public | yaml 4개만 |
| `templates/` | ✅ Public | |
| `examples/` | ✅ Public | sanitized만 |
| `docs/` | ✅ Public | `plans/`, `history/` 하위 폴더 제외 |
| `docs/plans/` | ❌ Internal | gitignore |
| `docs/history/` | ❌ Internal | gitignore |
| `memory/` | 🟡 부분 | yaml/md 일부 ✅, `notes/` `manifests/` `problem-reviews/` `profiles/` `resume-brief.md` ❌ |
| `artifacts/` | ❌ Internal | `.gitkeep` + `sprints/README.md`만 ✅ |
| `releases/` | 🟡 부분 | `manifest.yaml` ✅ tracked, hotfix 산출물(`prds/criteria/sprints/`)은 frontmatter version 매핑 (POKIT-175) |
| `.claude/` | ❌ Internal | gitignore |

LLM은 새 파일 만들기 전 이 표를 확인한다. 표에 없는 최상위 폴더는 [tests/folder-layout-contract.test.mjs](../../tests/folder-layout-contract.test.mjs) 가 차단한다.

## 3. 5가지 경계 결정

POKit 운영 중 자주 헷갈렸던 경계 5건을 명확히 한다.

### 3.1 memory ↔ artifacts

| | memory | artifacts |
|---|--------|----------|
| 수명 | **cross-run** (여러 세션에 걸쳐 누적) | **per-run** (1회성 산출물) |
| 누가 갱신 | agent가 학습 누적 | run 종료 시 생성 |
| 예시 | Working Notes, Problem Review, decision-log, manifest | PRD, criteria, sprint summary, retro |

→ Problem Review 메모는 `memory/problem-reviews/` (cross-run 학습 자료).
→ Cycle/Release manifest는 `memory/manifests/` (cross-run 추적 데이터).

### 3.2 workflows ↔ scripts

| | workflows | scripts |
|---|-----------|--------|
| 형식 | **선언적 yaml** | **실행 TypeScript** |
| 역할 | "무엇을 할지" 정의 | "어떻게 실행할지" 코드 |
| 결과물 | (자체로는 생성물 없음) | run 시 artifacts/ 또는 memory/에 쓰기 |

→ `workflows/`에는 yaml만. 문서는 `docs/_details/`로. 결과물은 `artifacts/`로.

### 3.3 examples ↔ templates

| | examples | templates |
|---|----------|----------|
| 채워짐 | **채워진 sample** (sanitized) | **빈 양식** (스켈레톤) |
| 용도 | 사용 예시 학습 | 새 산출물 시작점 |

→ 실제 이슈 번호가 들어간 채워진 문서는 examples. 빈 칸 양식은 templates.

### 3.4 artifacts/backlog ↔ memory

`artifacts/backlog/`는 Problem Review 메모를 담았으나 이는 **cross-run 학습**이다. artifacts(per-run)에 두는 것은 의미 오류다.

→ `memory/problem-reviews/`로 이동.

### 3.5 dogfood 위치 (제거 — v0.16.0 POKIT-175)

POKit이 자기 자신을 운영하며 남긴 PRD/criteria/sprint는 `dogfood/`에 보관되었으나, v0.16.0에서 `releases/v*/` 단위 묶음으로 전환하면서 디렉토리를 제거했다. 신규 버전 산출물은 `releases/v<버전>/`에 저장한다.

## 4. 레거시 이동 매핑

v0.10.0에서 정리할 25개 이동 대상.

| AS-IS | TO-BE | 사유 |
|-------|-------|------|
| `artifacts/backlog/*-problem-review.md` (6) | `memory/problem-reviews/` | cross-run 학습 |
| `artifacts/manifests/` (빈 폴더) | `memory/manifests/` | cross-run 추적 |
| `artifacts/pokit-deep-analysis-2026-05-16.md` | `artifacts/analyses/` | 일회성 분석 분류 |
| `workflows/cross-runtime-diff-checklist.md` | `docs/_details/cross-runtime-diff.md` | 문서는 docs |
| `workflows/cross-runtime-diff-tests.md` | (위로 통합) | |
| `workflows/cross-runtime-diff-results/` | `artifacts/cross-runtime-diff/` | 결과물은 artifacts |
| `examples/day2-dry-run/` | `tests/fixtures/day2-dry-run/` | test fixture |
| `examples/definition/POKIT-89/` | `examples/definition-pipeline-sample/` | 익명화 |
| `docs/CYCLE_BRIEF_CLOSE_PLAN.md` | `docs/plans/` | 제작 plan |
| `docs/GOAL_LOOP.md` | `docs/plans/` | 제작 plan |
| `docs/IMPLEMENTATION_PLAN.md` | `docs/plans/` | 제작 plan |
| `docs/DESIGN.md` 전체 (1149줄) | `docs/history/DESIGN.md` (gitignore) | 전체가 design background/historical rationale로 정의됨 |
| `docs/signal-watch-workflow.md` | `docs/_details/signal-watch.md` | 분류 정리 |
| `docs/source-registry.md` | `docs/_details/source-registry.md` | 분류 정리 |

## 5. 신규 폴더

| 폴더 | 배포 | 추가 이유 |
|------|------|---------|
| `memory/notes/` | ❌ | POKIT-115 Working Notes |
| `memory/manifests/` | ❌ | POKIT-116 Cycle/Release Manifest |
| `memory/problem-reviews/` | ❌ | Problem Review 이동지 |
| `artifacts/analyses/` | ❌ | 일회성 분석 분류 |
| `artifacts/cross-runtime-diff/` | ❌ | cross-runtime 결과 |
| `docs/plans/` | ❌ | 제작 plan 분리 |
| `docs/history/` | ❌ | 설계 히스토리 |
| `tests/fixtures/day2-dry-run/` | ✅ | examples에서 이동 |

## 6. docs/architecture 번호 갭

현재 `02~06`이 비어있다. v0.10.0 POKIT-132에서 다음 중 하나로 처리한다.

- 채움: `02-document-roles-detail.md`, `03-...` 등 의미 있는 문서로 채움
- 사유 명시: 본 문서에 갭 이유 기록 (예: 과거 reserved, 사용 안 함)

POKIT-132 완료 시 본 문서를 갱신한다.

## 7. 외부 사례 (Sources)

본 문서의 분류 기준은 다음 사례를 참고했다.

- [Folder Structure as Agentic Architecture (arXiv 2603.16021)](https://arxiv.org/abs/2603.16021) — Layered Context Architecture (L0-2 routing, L3 reference, L4 working artifacts)
- [Agentic OS File Structure (MindStudio)](https://www.mindstudio.ai/blog/agentic-operating-system-file-structure-context) — Memory writeable, deterministic orchestration
- [Stop Messy AI Projects (dev.to)](https://dev.to/raju_dandigam/stop-messy-ai-projects-a-clean-folder-structure-for-real-agent-systems-502f) — Skill = process, Context = separate
- [Claude Code Skills (official)](https://code.claude.com/docs/en/skills) — Project skill loading rules
- [Ideal Project Structure for Claude Code](https://sidsaladi.substack.com/p/the-ideal-project-structure-for-claude) — CLAUDE.md/AGENTS.md as law

## 8. 운영 규칙

1. 새 최상위 폴더 추가 시 본 문서에 등록하지 않으면 [tests/folder-layout-contract.test.mjs](../../tests/folder-layout-contract.test.mjs) 가 차단한다.
2. AS-IS → TO-BE 이동은 `git mv`로 history를 보존한다.
3. 본 문서는 [AGENTS.md](../../AGENTS.md) Core Principle의 운영 매뉴얼이다. Core Principle 변경 시 본 문서도 함께 갱신한다.
4. 본 문서가 `.gitignore` 정책과 어긋나면 .gitignore가 잘못된 것이다 — F-4 테스트가 두 출처의 동기화를 검증한다.

## 변경 이력

- v0.10.0 — 최초 작성 (F-1 by 폴더 audit + 외부 사례 조사)
- v0.16.0 — dogfood/ 제거 (POKIT-175 B1): 디렉토리 삭제, §1·§2·§3.5·§4·§5 갱신, contract test + .gitignore 동기화
