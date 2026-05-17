---
linear_issue_id: POKIT-143
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-143-criteria-2026-05-16
---

# Acceptance Criteria Draft — POKIT-143: node 명령어 archive + cli-internals 문서화

## Scenario

v0.8.0에서 AGENTS.md에서 풀 커맨드(`node --experimental-strip-types ...`)가 제거된다.
파워유저·CI·디버거는 `docs/_details/cli-internals.md`를 단일 참조점으로 사용하여 verb → 내부 node 명령어 매핑을 확인한다.
`package.json` scripts 필드에 모든 verb에 대한 npm 명령어가 보존된다.

## Criteria

### AC-1: cli-internals.md 파일 존재

- Given: 저장소 루트 기준 `docs/_details/` 디렉토리
- When: `ls docs/_details/cli-internals.md` 실행
- Then: 파일이 존재하고 읽기 가능함

### AC-2: 11개 verb 전체 내부 명령어 매핑 문서화

- Given: `docs/_details/cli-internals.md` 파일
- When: 파일 내용 확인
- Then: `start`, `brief`, `run`, `close`, `retro`, `hotfix`, `audit`, `guard`, `progress`, `end`, `safety` 11개 verb가 모두 포함된 Verb → Script Map 테이블이 존재함
- And: 각 항목에 `node --experimental-strip-types scripts/...` 형식의 내부 명령어가 명시됨
- And: 테이블 행 수 = 11 (verb 추가 시 갱신 필요 명시)

### AC-3: package.json scripts에 11개 verb 모두 등록

- Given: 저장소 루트 `package.json`
- When: `cat package.json` 실행
- Then: scripts 필드에 `start`, `brief`, `run`, `close`, `retro`, `hotfix`, `audit`, `guard`, `progress`, `end`, `safety`, `test` 12개 항목이 모두 존재함
- And: 각 스크립트 값이 `node --experimental-strip-types scripts/...` 형식임
- And: `npm run start`가 `scripts/cli/session-start.ts`를 실행함 (기존 회귀 없음)

### AC-4: 디버깅 직접 호출 가이드 포함

- Given: `docs/_details/cli-internals.md` 파일
- When: 파일 내용 확인
- Then: "When to use direct node commands" 또는 동등한 섹션이 존재함
- And: bin/pokit wrapper 문제 디버깅, CI 파이프라인, power user 활용 등 3가지 이상의 직접 호출 시나리오가 기술됨

### AC-5: CI workflow 참조용 예시 포함

- Given: `docs/_details/cli-internals.md` 파일
- When: 파일 내용 확인
- Then: GitHub Actions YAML 형식의 직접 호출 예시가 1개 이상 포함됨
- And: `public-safety-scan.ts` 또는 `release-md-audit.ts`를 사용하는 예시가 존재함

### AC-6: 회귀 방지 — AGENTS.md 풀 커맨드 노출 0건

- Given: 저장소 루트 `AGENTS.md`
- When: `grep "node --experimental-strip-types" AGENTS.md` 실행
- Then: 매칭 결과 0건 (풀 커맨드 완전 제거)
- And: `docs/_details/cli-internals.md`가 풀 커맨드의 single source of truth로 명시됨

### AC-7: 전체 테스트 회귀 없음

- Given: 저장소 루트에서 `npm test` 실행 환경
- When: `node --experimental-strip-types --test tests/*.test.mjs` 실행
- Then: 기존 213+ PASS 유지, 신규 FAIL 0건
- And: package.json scripts 변경이 기존 `npm run start` 동작에 영향을 주지 않음

## Edge Cases

- verb 이름이 npm 예약어(`start`, `test`)와 충돌하는 경우: `npm run start`는 기존과 동일하게 동작해야 함
- `npm run run` 같은 형식으로 호출할 때 정상 실행됨 (npm 특수 처리 없이 단순 스크립트 실행)
- cli-internals.md에 새 verb 추가 시 package.json과 bin/pokit 3곳을 동시에 갱신해야 함을 문서에 명시

## Open Questions

- `brief` verb가 `scripts/internal/session-brief.ts`를 호출하는 것이 `internal/` 분류와 맞는지 (POKIT-142 스코프와 중복 여부) — 현 상태 유지하고 POKIT-142에서 검토
- `npm run <verb>` 호출 시 인자 전달이 `-- <args>` 패턴 필요 여부 — cli-internals.md에 사용 예시 명시로 충분

## Source Context

- PRD: `artifacts/prds/POKIT-92.md` Requirements R6
- bin/pokit: `bin/pokit` (11개 verb case 문)
- 기존 criteria 패턴: `artifacts/criteria/POKIT-137.md`
