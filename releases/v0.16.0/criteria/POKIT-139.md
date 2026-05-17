---
linear_issue_id: POKIT-139
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-139-criteria-2026-05-16
---

# Acceptance Criteria Draft — POKIT-139: 전체 verb 마이그레이션 7개 (v0.8.0)

## Scenario

`bin/pokit` shell script가 7개 PRD verb(start, run, close, retro, hotfix, audit, guard)를 완전히 구현한다.
추가로 PRD 외 cli/ 스크립트 4개(cycle-progress, session-close, session-brief, public-safety-scan)를 처리한다.
AGENTS.md 본문의 모든 `node --experimental-strip-types scripts/...` 풀 커맨드가 동등한 verb로 치환된다.

## Criteria

### AC-1: help 출력에 7개 PRD verb 모두 포함

- Given: 환경변수 미설정 상태
- When: `pokit help` 실행
- Then: stdout에 `start`, `run`, `close`, `retro`, `hotfix`, `audit`, `guard` 7개 verb가 모두 포함됨
- And: exit code 0

### AC-2: 각 verb가 올바른 스크립트로 dispatch

- Given: 올바른 `LINEAR_API_KEY` 없이도 dispatch 경로 확인 가능한 환경
- When: 각 verb 실행 시
- Then: 아래 매핑대로 스크립트가 호출됨

| verb | 스크립트 |
|---|---|
| start | scripts/cli/session-start.ts |
| run | scripts/cli/sprint-runner.ts |
| close | scripts/cli/cycle-close.ts |
| retro | scripts/cli/retro-summary.ts |
| hotfix | scripts/cli/hotfix-cycle-plan.ts |
| audit | scripts/ci/release-md-audit.ts |
| guard | scripts/ci/cycle-guard.ts |
| progress | scripts/cli/cycle-progress.ts |
| end | scripts/cli/session-close.ts |
| brief | scripts/internal/session-brief.ts |
| safety | scripts/ci/public-safety-scan.ts |

### AC-3: 인자 위임

- Given: 임의 verb에 추가 인자 전달 시
- When: `pokit <verb> arg1 arg2` 실행
- Then: 하위 스크립트에 `arg1 arg2`가 그대로 전달됨 (shell "${@:2}" 패턴)

### AC-4: 기존 pokit start 회귀 없음

- Given: `LINEAR_API_KEY` 설정 환경
- When: `pokit start` 실행
- Then: stdout에 `pokit:boot ok` 시그니처 포함
- And: 기존 `tests/session-start.test.mjs` 전체 PASS

### AC-5: unknown verb 여전히 exit 1

- Given: 존재하지 않는 verb
- When: `pokit unknown-verb` 실행
- Then: stderr에 오류 메시지 출력
- And: exit code 1

### AC-6: AGENTS.md 풀 커맨드 0건

- Given: 현재 AGENTS.md
- When: `grep -c "node --experimental-strip-types" AGENTS.md` 실행
- Then: 결과가 0
- And: `scripts/cycle-guard.ts` 등 직접 스크립트 경로 참조도 동등한 verb로 치환됨

### AC-7: 테스트 확장 — 각 verb dispatch 검증

- Given: `tests/pokit-cli.test.mjs`
- When: `node --experimental-strip-types --test tests/pokit-cli.test.mjs` 실행
- Then: 각 verb(run, close, retro, hotfix, audit, guard, progress, end, brief, safety)에 대한 dispatch 검증 테스트 포함
- And: help 출력에 7개 PRD verb 모두 포함 검증 통과

### AC-8: 전체 테스트 회귀 없음

- Given: 기존 테스트 스위트
- When: `node --experimental-strip-types --test tests/*.test.mjs` 실행
- Then: 기존 PASS 카운트 유지 또는 증가
- And: 새로 깨진 테스트 0건 (사전 ENOENT 1건 제외)

### AC-9: help 출력 각 verb에 1줄 설명 포함

- Given: `pokit help` 출력
- When: 출력 확인
- Then: 각 verb 옆에 스크립트 docstring 기반 1줄 설명이 포함됨

## 추가 cli/ 스크립트 처리 결정

### cycle-progress.ts

옵션 A 채택: `progress` verb 추가.
이유: `renderCycleProgress` 함수가 다른 스크립트(session-close.ts, session-brief.ts)에서도 사용되는 독립 기능 단위이며, CLI에서 직접 진행률 시각화를 원할 수 있음.

### session-close.ts

옵션 A 채택: `end` verb 추가.
이유: `close`는 이미 cycle-close.ts에 할당됨. `end`는 세션 종료 의미를 명확히 전달.

### internal/session-brief.ts

`brief` verb 추가 (`scripts/internal/session-brief.ts` 연결).
이유: session-start.ts는 `--detail`/`--candidate` 플래그를 처리하지 않음 (buildSessionStart 함수는 이들 인자를 받지 않음). session-brief.ts는 자체 main()과 인자 파싱을 가진 독립 실행 스크립트임.
AGENTS.md에서 `node --experimental-strip-types scripts/session-brief.ts --detail cycle` → `pokit brief --detail cycle`로 치환.

### public-safety-scan.ts

`safety` verb 추가 (`scripts/ci/public-safety-scan.ts` 연결).
이유: audit(release-md-audit)과 별개 기능 — private slug/cycle ID 노출 방지 스캔. 별도 verb가 의미적으로 정확.

## Edge Cases

- `pokit help` 출력에서 모든 verb가 알파벳순 또는 논리적 그룹 순으로 나열됨
- 각 verb dispatch는 인자 없이 실행 시 하위 스크립트 자체 error 처리에 위임 (bin/pokit 레벨에서 인자 유효성 검사 없음)

## Source Context

- PRD: `artifacts/prds/POKIT-92.md` Requirements R1
- PoC: `artifacts/criteria/POKIT-137.md`
- 기존 테스트: `tests/pokit-cli.test.mjs`
- 현재 PoC 구현: `bin/pokit`
