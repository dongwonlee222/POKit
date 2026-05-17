---
linear_issue_id: POKIT-137
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-137-criteria-2026-05-16
---

# Acceptance Criteria Draft — POKIT-137: bin/pokit CLI Wrapper PoC

## Scenario

v0.8.0 PoC에서 `bin/pokit` shell script가 단일 진입점으로 동작한다. 사용자는 `node --experimental-strip-types scripts/session-start.ts` 대신 `pokit start`를 실행하여 세션을 시작한다.

## Criteria

### AC-1: 실행 권한

- Given: `bin/pokit` 파일이 저장소에 존재함
- When: `ls -l bin/pokit` 실행
- Then: 실행 권한 비트(`-rwxr-xr-x` 등 user execute bit)가 설정되어 있음

### AC-2: start verb 출력 동일성

- Given: 유효한 `LINEAR_API_KEY` 및 필요 환경변수가 설정된 환경
- When: `pokit start` 실행
- Then: stdout에 `pokit:boot ok` 시그니처가 포함됨
- And: `node --experimental-strip-types scripts/session-start.ts` 직접 호출과 동일한 출력 생성

### AC-3: help / 인자 없음 출력

- Given: 환경변수 미설정 상태(네트워크 접근 불필요)
- When: `pokit help`, `pokit -h`, `pokit --help`, 또는 인자 없이 `pokit` 실행
- Then: stdout에 사용 가능한 verb 목록이 출력됨 (`start`, `run`, `close`, `retro`, `hotfix`, `audit`, `guard` 포함)
- And: exit code 0

### AC-4: 미구현 verb 처리

- Given: v0.8.0 PoC 환경
- When: `pokit run`, `pokit close` 등 `start` 외 verb 실행
- Then: "Not implemented in v0.8.0 PoC. Use: pokit start" 메시지 출력
- And: exit code 1

### AC-5: package.json bin 필드 등록

- Given: 저장소 루트에 `package.json` 존재
- When: `cat package.json | grep -A2 '"bin"'` 실행
- Then: `"pokit": "./bin/pokit"` 매핑이 등록되어 있음
- And: `npm run start` 명령어가 `node --experimental-strip-types scripts/session-start.ts`를 실행함

### AC-6: 기존 직접 호출 회귀 없음

- Given: 유효한 환경변수 설정
- When: `node --experimental-strip-types scripts/session-start.ts` 직접 실행
- Then: AC-2와 동일한 출력 생성 (기존 동작 보존)
- And: 기존 테스트 스위트 (`tests/session-start.test.mjs`) 모두 PASS

## Edge Cases

- `bin/pokit`이 프로젝트 루트가 아닌 다른 경로에서 호출되어도 (`cd /tmp && /path/to/bin/pokit help`) 스크립트 위치를 자동 탐지하여 올바른 프로젝트 루트에서 실행됨
- `POKIT_PROFILE` 환경변수가 설정된 경우에도 `pokit start`가 올바르게 동작함

## Open Questions

- v0.8.0 이후 `run`, `close` 등 추가 verb 구현 시: `bin/pokit` 내 `case` 문 확장으로 충분한가, 아니면 별도 dispatcher 스크립트 도입 필요한가? (POKIT-138 스코프)
- `npm install -g` vs `npx pokit` 권장 방식은 README에서 별도 결정 (Open Question in POKIT-92)

## Source Context

- PRD: `artifacts/prds/POKIT-92.md` Requirements R1
- 회귀 테스트: `tests/pokit-cli.test.mjs` (AC-2~4 자동 검증)
- 기존 테스트: `tests/session-start.test.mjs` (AC-6 회귀 검증)
