---
linear_issue_id: POKIT-138
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-138-criteria-2026-05-16
---

# Acceptance Criteria Draft — POKIT-138: scripts/ 디렉토리 재구성 (cli/internal/ci)

## Scenario

v0.8.0에서 scripts/ 디렉토리가 cli/internal/ci 세 카테고리로 재구성된다. 메인 에이전트가 알아야 할 entry point 7개는 cli/에 위치하고, 나머지 헬퍼·CI 파일은 각자의 역할에 맞는 디렉토리에 분리된다.

## Criteria

### AC-1: scripts/cli/ — CLI entry point 7개

- Given: scripts/ 디렉토리 재구성 완료
- When: `ls scripts/cli/` 실행
- Then: 정확히 7개 파일이 존재함
  - `session-start.ts`, `sprint-runner.ts`, `cycle-progress.ts`, `cycle-close.ts`, `retro-summary.ts`, `hotfix-cycle-plan.ts`, `session-close.ts`

### AC-2: scripts/ci/ — CI/릴리스 파일 8개

- Given: scripts/ 디렉토리 재구성 완료
- When: `ls scripts/ci/` 실행
- Then: 정확히 8개 파일이 존재함
  - `release-preflight.ts`, `release-md-audit.ts`, `cycle-guard.ts`, `cycle-maintenance.ts`, `linear-create-preflight.ts`, `linear-write-semantic-preflight.ts`, `label-preflight.ts`, `public-safety-scan.ts`

### AC-3: scripts/internal/ — 헬퍼 파일 및 서브디렉토리

- Given: scripts/ 디렉토리 재구성 완료
- When: `ls scripts/internal/` 실행
- Then: 17개 .ts 파일 + 3개 서브디렉토리(render/, lib/, external-write/)가 존재함
- And: `scripts/internal/render/ascii.ts` 존재
- And: `scripts/internal/lib/history-collector.ts` 존재
- And: `scripts/internal/external-write/guard.ts` 존재

### AC-4: bin/pokit start 회귀 없음

- Given: 유효한 환경변수 설정
- When: `bin/pokit start` 실행 (또는 `pokit-cli.test.mjs` 테스트)
- Then: stdout에 `pokit:boot ok` 시그니처가 포함됨
- And: 기존 9개 테스트 모두 PASS (pokit-cli.test.mjs 9/9)

### AC-5: session-start.test.mjs PASS 유지

- Given: 재구성된 scripts/cli/session-start.ts
- When: `node --experimental-strip-types --test tests/session-start.test.mjs` 실행
- Then: 2/2 PASS

### AC-6: 모든 import 경로 해결됨

- Given: 재구성 완료 후
- When: 전체 테스트 스위트 실행
- Then: Import 해결 실패(ERR_MODULE_NOT_FOUND)로 인한 실패 0건
- And: 재구성 이전과 동일한 fail 건수 유지 (사전 실패 제외)

### AC-7: package.json scripts.start 경로 갱신

- Given: scripts/ 재구성 완료
- When: `cat package.json | grep start` 실행
- Then: `scripts/cli/session-start.ts`가 경로에 포함됨 (구 `scripts/session-start.ts` 없음)

### AC-8: 기존 서브디렉토리 internal/ 안으로 이동

- Given: 재구성 완료
- When: `ls scripts/` 실행
- Then: 루트에 `render/`, `lib/`, `external-write/` 디렉토리가 없음
- And: 해당 파일들이 `scripts/internal/render/`, `scripts/internal/lib/`, `scripts/internal/external-write/`에 위치함

## Edge Cases

- `cli/session-close.ts`는 같은 cli/ 내의 `cycle-progress.ts`를 `./cycle-progress.ts`로 import한다 (cli→cli 의존, 정상)
- `internal/session-brief.ts`는 cli/의 `cycle-progress.ts`와 `sprint-runner.ts`를 `../cli/X.ts`로 import한다 (internal→cli 역방향 의존 발생 — 기능 정상이나 레이어링 관점 비권장)

## Open Questions

- `internal/session-brief.ts`가 `cli/cycle-progress.ts`와 `cli/sprint-runner.ts`에 의존하는 역방향 계층 문제: `cycle-progress.ts`를 internal/로 재분류하면 해소되나, PRD R2에서 cli/ 명시적 지정. v0.9.0 리팩토링 시 검토 권장.
- `workflows/hooks.yaml`의 `runner: scripts/release-preflight.ts` 및 `runner: scripts/hooks-runner.ts` 경로: 제약 조건("workflows/ 건드리지 말 것")으로 미갱신. 현재 runner 값은 file path로 resolve되지 않고 semantic 문자열로만 사용되므로 테스트 영향 없음. POKIT-139 또는 별도 issue에서 처리 권장.

## Source Context

- PRD: `artifacts/prds/POKIT-92.md` Requirements R2
- 구현 파일: `scripts/cli/`, `scripts/internal/`, `scripts/ci/`
- 핵심 진입점 갱신: `bin/pokit`, `package.json`
