---
linear_issue_id: POKIT-92
cycle_id: backlog
artifact_type: prd
status: draft
skill_used: prd-author
content_hash: pokit-v0.8.0-prd-2026-05-16
target_version: v0.8.0
release_bundle: main-agent-diet
parent_issue: none
sub_issues:
  - POKIT-124
  - POKIT-137
  - POKIT-138
  - POKIT-139
  - POKIT-140
  - POKIT-141
  - POKIT-142
  - POKIT-143
---

# PRD Draft — v0.8.0 Main Agent Diet & CLI Wrapper

## Problem

POKit 메인 에이전트가 매 세션마다 도구·정책·스크립트 정보로 과부하 상태이며, 그 결과 사용자가 의도한 도구가 호출되지 않거나 다른 작업으로 새는 도구 희석(tool dilution) 현상이 발생한다.

구체적 증거:

1. **풀 커맨드 노출**: `AGENTS.md`가 `node --experimental-strip-types scripts/release-md-audit.ts --target-version=<version>` 같은 풀 명령어를 본문에 직접 포함한다. 메인 에이전트가 매 세션 30개 스크립트 × 경로 × Node 옵션 × 인자를 컨텍스트에 적재한다.
2. **거대 정책 문서 강제 참조**: `AGENTS.md`는 `docs/OPERATING_MODEL.md` (727줄), `docs/DESIGN.md` (1,252줄), `docs/IMPLEMENTATION_PLAN.md` (967줄)을 본문에서 직접 인용한다. 작업 종류와 무관하게 모두 끌려온다.
3. **자동 dispatch 부재**: OPERATING_MODEL이 "라벨 기반 라우팅"을 명시하지만 실제 dispatcher 코드가 없다. 메인 에이전트가 직접 `backlog-router` 스킬을 호출해야 하므로 라우팅 책임까지 메인이 흡수한다.
4. **scripts 평평한 노출**: scripts/ 디렉토리에 30개 .ts 파일이 평평하게 노출되어 있다. 실제 메인 에이전트가 알아야 할 entry point는 7개뿐이고, 나머지 23개는 내부 헬퍼/CI/디버깅용이다.

벤치마킹 결과 (Anthropic Skills, OpenAI Codex, Cline/Roo, Continue.dev, Aider, PAI), 동일한 문제를 푼 프로젝트들은 모두 progressive disclosure, 계층형 instruction, 조건부 도구 노출, CLI verb wrapper 같은 패턴으로 해결했다. POKit은 OPERATING_MODEL 문서에 동일한 철학이 명시되어 있으나 구현 단계에서 적용되지 않았다.

## Goal

v0.8.0에서 메인 에이전트 컨텍스트를 95% 감소시키고, 외부 사용자가 단일 CLI verb로 작업할 수 있게 한다. 이는 POKit의 "사람과 LLM이 함께 스크럼을 굴리는 가벼운 작업공간" 정체성에 직접 부합한다.

성공 측정:

- AGENTS.md ≤ 40 lines (현재 92줄)
- 메인이 알아야 할 entry point ≤ 7 (현재 30+)
- 풀 커맨드(`node --experimental-strip-types ...`) AGENTS.md 노출 0건
- Claude Code + Codex 양쪽에서 동일 verb 동작 확인
- 모든 기존 기능 회귀 없음 (테스트 통과)

## Non-Goals

- DESIGN.md (1,252줄) 분할 — v0.9.0+ 후보. AGENTS.md에서 강제 참조하지 않으므로 메인 컨텍스트 직접 오염 없음.
- IMPLEMENTATION_PLAN.md (967줄) 정리 — 동일 이유로 v0.9.0+ 후보.
- Cline mode-based 조건부 도구 노출 — 구조 추가 부담 큼. v1.1+ 후보.
- Aider Architect/Editor 별도 패턴 도입 — POKit Subagent Contract가 이미 OPERATING_MODEL L204-221에 문서화. 구현만 하면 됨.
- Linear Backlog priority 일괄 설정 (ICE-lite 적용) — 별도 운영 작업.
- POKIT-136 approval token — v0.9.0으로 이동.

## User Scenario

### 시나리오 A — 외부 사용자 첫 사용

새로운 PO 사용자가 POKit GitHub repo를 clone한다. README의 안내대로 `.env`를 채우고 `npm install` 한 뒤 `pokit start`를 입력한다. 단일 verb로 세션이 시작된다. AGENTS.md를 열어보면 40줄짜리 인덱스만 있고, verb 목록과 다음 행동이 명확하다. `node --experimental-strip-types ...` 같은 내부 실행 방식은 보이지 않는다.

### 시나리오 B — Claude Code/Codex 호환

같은 사용자가 Claude Code와 Codex CLI 양쪽에서 POKit을 사용한다. 두 환경 모두 동일한 verb (`pokit start`, `pokit run`, `pokit close`)로 작업한다. AGENTS.md(Codex)와 CLAUDE.md(Claude Code)는 같은 verb 인덱스를 참조하므로 일관된 경험이 보장된다.

### 시나리오 C — 메인 에이전트의 가벼운 컨텍스트

LLM이 POKit 세션을 시작할 때 AGENTS.md 40줄과 7개 verb만 컨텍스트에 적재한다. 사용자가 "이번 cycle 실행"이라고 말하면 라벨 기반 dispatcher가 자동으로 적절한 SKILL을 호출한다. 메인 에이전트는 의도 해석과 승인 경계 판단에만 집중한다.

### 시나리오 D — 디버깅·CI 호환성

파워유저나 CI 파이프라인이 내부 스크립트를 직접 호출해야 할 때, `docs/_details/cli-internals.md`에 보존된 `node --experimental-strip-types scripts/cli/...` 명령어를 참조한다. `npm run start` 같은 npm scripts 백업도 동작한다. 기능은 보존되고 메인 LLM 노출만 제거된다.

## Requirements

### R1. bin/pokit CLI Wrapper

- `bin/pokit` 단일 진입점 (shell script 또는 Node entrypoint)
- 지원 verb (v0.8.0 범위): `start`, `run`, `close`, `retro`, `hotfix`, `audit`, `guard`
- 각 verb는 내부적으로 해당 스크립트 호출
- `pokit help` 으로 verb 목록과 간단 설명 표시
- `package.json` `bin` 필드에 등록하여 `npm install -g` 또는 `npx pokit` 사용 가능

### R2. scripts/ 디렉토리 재구성

```
scripts/
├── cli/        ← 7개 (pokit verb가 직접 부르는 entry point)
├── internal/   ← 15개 헬퍼 (validators, preflight, render)
└── ci/         ← 8개 (public-safety-scan, release-preflight 등)
```

분류 기준:
- cli/: 사용자 명령에 직접 대응하는 스크립트 (session-start, sprint-runner, cycle-progress, cycle-close, retro-summary, hotfix-cycle-plan, session-close)
- internal/: 다른 스크립트가 호출하는 헬퍼 (validators, preflight, render, message-catalog 등)
- ci/: GitHub Actions에서만 호출 (release-md-audit, public-safety-scan, release-preflight 등)

### R3. AGENTS.md 40줄 인덱스화

- 전체 ≤ 40 lines
- 풀 커맨드 0건. verb 명령어만 노출.
- 거대 정책 문서 본문 인용 0건. `docs/_details/` 링크만.
- 회귀 방지: POKIT-124 테스트가 size limit 검증.

### R4. OPERATING_MODEL.md 분할

- 현재 727줄 → 인덱스 + 6~8개 주제별 파일
- 주제 분할 예시:
  - `docs/_details/approval-flow.md`: 외부 write 승인 경계
  - `docs/_details/memory-contract.md`: Memory MVP 계약
  - `docs/_details/release-flow.md`: Version Run, Release Bundle
  - `docs/_details/cycle-flow.md`: Cycle/Focus Run 운영
  - `docs/_details/subagent-contract.md`: Main/Subagent 분리
  - `docs/_details/completion-report.md`: Completion Report 계약
  - `docs/_details/visualization.md`: Conversation Visualization 계약
- 외부 참조 깨짐 없음 (grep 검증)
- 메인 OPERATING_MODEL.md는 인덱스 + 짧은 요약 + 링크

### R5. SKILL.md frontmatter + dispatcher

각 SKILL.md 최상단에 YAML frontmatter:

```yaml
---
name: <skill-name>
description: <한 줄 설명>
entry: pokit <verb>
labels: [pokit:prd, pokit:criteria]  # 트리거 라벨
---
```

dispatcher 코드 (`scripts/internal/dispatch.ts`):
- 입력: Linear issue ID
- 동작: 이슈 라벨 → frontmatter labels 매칭 → 해당 SKILL의 entry verb 호출
- pokit run 내부에서 사용

### R6. node 명령어 archive

- `docs/_details/cli-internals.md` 생성
  - 각 verb별 내부 node 명령어 매핑 보존
  - 디버깅 시 직접 호출 방법
  - CI workflow 참조용
- `package.json` scripts에 모든 node 명령어 유지 (`npm run start` 등)
- AGENTS.md 본문에서 node 명령어 완전 제거

### R7. 회귀 방지 (POKIT-124)

- 테스트 추가: AGENTS.md size ≤ 40 lines 자동 검증
- 테스트 추가: AGENTS.md 본문에 `node --experimental-strip-types` 문자열 부재 검증
- public-safety-scan에 통합

## Acceptance Notes

- Sub-issue별 상세 acceptance criteria는 `artifacts/criteria/POKIT-{124,137,138,139,140,141,142,143}.md`에 작성.
- TDD: 각 sub-issue 구현 전 회귀 테스트 먼저 작성.
- 외부 write 안전: 본 작업은 코드/문서 리팩토링이며 Linear/GitHub 외부 상태 변경은 없음.
- Dogfood: v0.8.0 완료 후 본인이 1주 사용하면서 컨텍스트 부담 체감 변화 기록.
- 호환성: `npm run start`, `node scripts/cli/session-start.ts` 등 내부 방식 모두 동작 유지.

## Open Questions

1. **`bin/pokit` 구현 방식**: shell script vs Node binary? — shell이 가볍지만 cross-platform 고려 시 Node binary가 안전. PoC(POKIT-137)에서 결정.
2. **verb naming**: `pokit run` vs `pokit cycle run`? — 짧음 우선. PoC에서 검증.
3. **글로벌 설치 가이드**: `npm install -g` vs `npx pokit` 어느 쪽 권장? — README에서 권장 안내 필요.
4. **회사 사용자 영향**: workspace 회사 컴퓨터에서 git pull 시 verb 마이그레이션 학습 비용 — README CHANGELOG로 충분한가?
5. **OPERATING_MODEL 분할 시 anchor link 깨짐**: 현재 `OPERATING_MODEL.md#...` 형식 참조가 다수. 자동 redirect 또는 anchor 보존 전략 필요.

## Source Context

- 분석 보고서: `artifacts/pokit-deep-analysis-2026-05-16.md`
- 정책 원본: `docs/OPERATING_MODEL.md` L87-94 (Identity Fit), L204-221 (Subagent Contract), L353-365 (Definition Pipeline), L507-517 (Model Tier)
- 로드맵 정렬: `docs/ROADMAP.md` (Cycle 4-9 흐름 안에서 Cycle 4 "Context Boundary & Brief Trust"의 자연스러운 확장)
- 벤치마크: anthropics/skills, openai/codex AGENTS.md, Cline/Roo Code, Continue.dev, Aider, PAI

### Identity Fit Check 결과

OPERATING_MODEL L87-94 7가지 항목 모두 통과:
1. 사람과 LLM이 함께 스크럼을 굴리는 데 도움 — ✅ LLM 운영 효율 직접 개선
2. 사용자가 더 빨리 이해/적은 마찰로 결정 — ✅ verb 7개로 마찰 감소
3. backlog→cycle→실행→회고 흐름 적합 — ✅ 표준 흐름
4. Linear와 GitHub repo 위 가볍게 동작 — ✅ pure refactoring
5. 새 무거운 관리 도구가 되지 않음 — ✅ 도구 수 감소
6. 외부 상태 변경 실행 전 확인 통제 유지 — ✅ apply 시점 유지
7. 로컬 자동화 + 외부 승인 경계 유지 — ✅ 변경 없음

결론: `진행`
