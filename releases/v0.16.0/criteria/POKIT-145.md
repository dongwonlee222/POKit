---
linear_issue_id: POKIT-145
cycle_id: ceac566d-f52c-4dd3-9d31-58ac4de3c619
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 86f37e0595e8732565810867248096a648b2997eb9443f67cfb39acd48980cf6
---

# Acceptance Criteria Draft: [배포대상 v0.9.0] brief/safety verb 디렉토리 - cli 정합성 정리

## Scenario

## 목적

사용자 직접 사용 verb인 brief는 internal/에, safety는 ci/에 위치해 verb→디렉토리 매핑이 깨져 있다. 디렉토리 의미(cli=사용자 진입, internal=라이브러리, ci=빌드/검증)에 맞춘다.

## 사용자에게 보이는 변화

pokit brief, pokit safety 명령은 그대로 동작하고, 내부 스크립트 경로만 cli/ 하위로 이동한다.

## 완료 조건

brief, safety 스크립트가 cli/로 이동했거나 sub-command화되었고, bin/pokit, docs/\_details/cli-internals.md, 테스트 경로가 모두 일관된다.

## 범위

scripts/internal/session-brief.ts, scripts/ci/public-safety-scan.ts 위치 재검토, bin/pokit + docs + 테스트 동기화

## 제외 범위

다른 verb 재배치, 새로운 verb 추가

## 증거 / 출처

* memory/resume-brief.md (v0.9.0 후보)
* v0.8.0 디렉토리 재구성 (cli/internal/ci)

## 배포 여부

releaseKind: normal
targetVersion: v0.9.0
runId: none

## Linear 변수

state: Backlog
labels: pokit:criteria, Improvement
source: chat

## idempotency key

linear:create_issue:\[배포대상 v0.9.0\] brief/safety verb 디렉토리 - cli 정합성 정리

## 분류 기준 (POKIT-147 단일 출처 확정 전 임시 명시)

```
scripts/cli/       = 사용자가 직접 호출하는 verb의 진입점 (pokit start, brief, run, ...)
scripts/internal/  = 라이브러리 모듈 (다른 스크립트/테스트가 import)
scripts/ci/        = 빌드 검증·preflight·감사 (release 전 게이트)
```

- `brief`는 사용자 verb → **scripts/cli/** 로 이동
- `safety`는 사용자 verb → **scripts/cli/** 로 이동

## Criteria

**AC-1: 파일 이동**
- `scripts/internal/session-brief.ts` → `scripts/cli/session-brief.ts`
- `scripts/ci/public-safety-scan.ts` → `scripts/cli/public-safety-scan.ts`

**AC-2: import 경로 갱신**
- `scripts/cli/session-start.ts`의 `../internal/session-brief.ts` → `./session-brief.ts`
- `scripts/ci/release-preflight.ts`의 `./public-safety-scan.ts` → `../cli/public-safety-scan.ts`
- 기타 모든 import 갱신 후 typecheck/실행 정상

**AC-3: VERB_ROUTES 갱신**
- `scripts/internal/verb-dispatch.ts`의 `brief`, `safety` route path 갱신
- `tests/verb-dispatch.test.mjs` path 검증 PASS

**AC-4: 텍스트 참조 갱신**
- `scripts/README.md`, `scripts/cli/session-close.ts:123`, self-references, fixtures, 테스트 expected text 모두 새 경로

**AC-5: 회귀 무결성**
- `npm test` 회귀 0
- `./bin/pokit start`, `./bin/pokit brief`, `./bin/pokit safety` 정상 실행 확인

## Edge Cases

- `docs/CYCLE_BRIEF_CLOSE_PLAN.md`는 historical (Status: Draft) — 본 작업 범위 밖
- self-reference 파일 (public-safety-scan.ts KNOWN_GOOD 목록, session-brief.ts 출력 텍스트) — 이동과 함께 경로 갱신

## Open Questions

- 없음. 단일 출처는 POKIT-147(v0.10.0)에서 Role Map으로 통합.

## Source Context

- Linear issue: POKIT-145
- Linear URL: https://linear.app/example/issue/POKIT-145/배포대상-v090-briefsafety-verb-디렉토리-cli-정합성-정리
- Labels: pokit:criteria, Improvement
