---
linear_issue_id: POKIT-144
cycle_id: ceac566d-f52c-4dd3-9d31-58ac4de3c619
artifact_type: prd
status: draft
skill_used: prd-author
content_hash: ac7af2736de059434ae65609a73efa6f31fa73c7d79657ac0b01786f28673c40
---

# PRD Draft: [배포대상 v0.9.0] dispatcher 일반화 - sprint runner 연결 + on_error 트리거 자동화

## Problem

## 목적

scripts/internal/verb-dispatch.ts가 모든 cli verb의 진입점이 되도록 일반화하고, 그 과정에서 (1) sprint-runner와의 연결을 마무리하며 (2) on_error 훅을 dispatcher 단에서 자동 트리거하도록 한다. v0.8.0 다이어트 효과를 확장한다.

## 사용자에게 보이는 변화

pokit <verb> 호출이 dispatcher를 경유하면서, 어떤 verb에서 오류가 발생해도 ASCII 형식의 Problem/Error Review가 표시되고 artifacts/backlog/\*-problem-review.md가 저장된다. 정상 케이스 출력은 동일하게 유지된다.

## 완료 조건

verb-dispatch.ts가 bin/pokit의 모든 cli verb에 대한 단일 진입점으로 동작한다.
dispatcher 단의 try/catch에서 on_error를 자동 트리거한다 (verb별 에러 매핑 포함).
session-start.ts의 임시 catch 블록이 dispatcher로 이관·통합된다.
20+ 영향 테스트가 모두 PASS한다.
신규 dispatcher 단위 테스트가 추가된다.

## 범위

verb-dispatch.ts 일반화, bin/pokit 변경, 7개 cli/\* 스크립트 연결, on_error 자동 트리거, session-start.ts catch 이관, 영향 테스트 회귀 확인

## 제외 범위

dispatcher 외부 구조 재설계, 새로운 verb 추가, scripts/ci/\* 적용(별도 판단)

## 증거 / 출처

* memory/resume-brief.md (v0.9.0 후보)
* POKIT-142 (v0.8.0 dispatcher 도입)
* 2026-05-16 세션: on_error 트리거 일반화 누락 발견 (session-start.ts만 연결됨)

## 배포 여부

releaseKind: normal
targetVersion: v0.9.0
runId: none

## Linear 변수

state: Todo
labels: pokit:criteria, Improvement
source: chat

## idempotency key

linear:update_issue:POKIT-144:scope-expand-on-error

## Goal

1. `scripts/internal/verb-dispatch.ts`가 모든 `cli/*` verb의 단일 진입점이 된다.
2. 어떤 verb에서 오류가 발생해도 dispatcher catch에서 `on_error` 훅이 자동 호출되어 ASCII Problem/Error Review가 출력되고 `artifacts/backlog/*-problem-review.md`가 저장된다.
3. `session-start.ts`의 임시 try/catch + `resolveBootError` + `renderBootErrorAscii`가 dispatcher로 이관되어 단일 출처가 된다.
4. 새 verb 추가 시 별도 작업 없이 동일한 오류 처리가 자동 적용된다.

## Non-Goals

- `scripts/ci/*` 적용 (build/검증 스크립트는 별도 판단, 본 PRD 범위 밖)
- 새 verb 추가 (start/brief/run/close/retro/hotfix/progress/end 11개 그대로)
- dispatcher 외부의 모듈 구조 재설계
- on_error → Linear Backlog 자동 등록 (이건 POKIT-122 책임)
- `/tmp/*.ts` 같은 일회성 ad-hoc 스크립트의 오류 처리 (정책으로만 명시)

## User Scenario

**시나리오 1 (정상)** — `pokit start` → 기존과 동일한 brief + `pokit:boot ok` 출력. 동작 변경 없음.

**시나리오 2 (start 부팅 실패)** — `memory/context-map.yaml` 삭제 후 `pokit start`:
```
🚨 pokit:boot FAILED — session-start: context-map.yaml 없음
──────────────────────────────────────────────────
1) 문제: ...
2) 원인: ...
3) 해결: ...

artifact: artifacts/backlog/session-start-context-map-yaml-없음-problem-review.md
```
출력 형식은 기존 v0.8.5 인라인 픽스 결과와 동일. 단, 처리 경로가 dispatcher로 이동.

**시나리오 3 (다른 verb 실패)** — `pokit run` 실행 중 Linear API 401:
```
🚨 pokit:run FAILED — sprint-runner: Linear API 연결 실패
──────────────────────────────────────────────────
1) 문제: ...
2) 원인: LINEAR_API_KEY가 없거나 만료...
3) 해결: ...

artifact: artifacts/backlog/sprint-runner-linear-api-연결-실패-problem-review.md
```
이전에는 Node.js raw stack trace였음. dispatcher 일반화로 11개 verb 모두 동일 형식 보장.

**시나리오 4 (신규 verb 추가)** — 개발자가 `pokit foo` verb를 추가:
- `bin/pokit`에 등록만 하면 dispatcher가 자동으로 catch + on_error 트리거
- verb별 에러 매핑이 없으면 fallback 매핑 사용 (`pokit:<verb> FAILED reason=...`)

## Requirements

**R1. Dispatcher 진입점화**
- `bin/pokit <verb> [args...]`가 `node ... verb-dispatch.ts <verb> [args...]`를 호출하는 형태로 단순화한다.
- `verb-dispatch.ts`가 verb → 실제 cli 스크립트 모듈을 동적 import하여 `main()` 실행한다.

**R2. 에러 핸들링 일반화**
- `verb-dispatch.ts`가 모든 verb 실행을 try/catch로 감싼다.
- catch에서 verb별 에러 매핑 테이블을 조회 → `ProblemErrorReviewInput` 생성 → `renderBootErrorAscii` 출력 + `writeProblemReviewMemo` 저장.
- 매핑 없으면 fallback (verb 이름 + raw message).

**R3. 매핑 테이블 위치**
- `scripts/internal/error-mappings.ts` 신규 파일.
- 각 verb별 에러 매핑 함수 export. dispatcher가 verb에 따라 적절한 매퍼 호출.

**R4. session-start.ts 이관**
- `resolveBootError`, `renderBootErrorAscii`를 `error-mappings.ts`로 이관.
- `session-start.ts` `main()`의 try/catch 제거. 단순히 `await getWorkingContext() + console.log(buildSessionStart(...))`만 남김.
- 기존 테스트 (`resolveBootError maps ...` 4건)는 `error-mappings.ts`로 이동.

**R5. cli 진입점 패턴 통일**
- 11개 `cli/*` 스크립트가 `main()` export 형태로 통일 (또는 dispatcher가 인식할 수 있는 명명 규약).
- 기존 `if (import.meta.url === ...)` 블록은 유지 (직접 실행 호환성) 또는 제거 (dispatcher 강제).

**R6. 신규 단위 테스트**
- `tests/dispatch.test.mjs` 신규.
- 케이스: 정상 verb 실행 / catch 후 ASCII 출력 / artifact 저장 / 매핑 없는 verb의 fallback / 알 수 없는 verb 거부.

**R7. 회귀 무결성**
- 기존 233 pass 유지 (기존 fail 2건은 별도 이슈).
- session-start, sprint-runner, cycle-close, retro-summary, hotfix-cycle-plan 등 영향 테스트 모두 PASS.

## Acceptance Notes

- 정상 케이스 출력 변경 0건 (사용자가 차이를 느끼지 않아야 함).
- `npm test`에서 dispatcher 신규 테스트 추가분만큼 pass 증가, fail은 그대로 (기존 2건).
- `artifacts/backlog/*-problem-review.md` 파일이 verb별 슬러그로 누적 가능해야 함 (`session-start-...`, `sprint-runner-...`, `cycle-close-...`).
- `bin/pokit`의 case 분기는 제거되거나 단순 위임으로 축소.
- session-start.ts에서 try/catch 제거 후에도 `tests/session-start.test.mjs`의 `resolveBootError ...` 테스트 4건이 새 위치에서 PASS.

## Resolved Decisions

1. **bin/pokit thin wrapper** — 모든 verb를 `node ... verb-dispatch.ts <verb> [args...]`로 위임. case 분기 제거. dispatcher가 단일 진입점 역할.
2. **함수형 매핑** — verb별 매핑 함수 `mapSessionStartError(msg)`, `mapSprintRunnerError(msg)` 등을 `error-mappings.ts`에 모음. 타입 안전성과 테스트 용이성 우선.
3. **`ci/*` 적용은 v0.10.0 후보** — 본 PRD는 `cli/*` 11개 verb에 한정. `release-md-audit`, `cycle-guard`, `public-safety-scan`은 v0.10.0 별도 이슈로 등록.
4. **dispatcher 자체 오류 fallback** — error-mappings.ts 로드 실패 등 dispatcher 내부 오류 시, 하드코딩된 최소 ASCII 출력(`🚨 pokit:dispatcher FAILED reason=...`)으로 종료. 재귀 catch 방지.
5. **ad-hoc 스크립트 정책 AGENTS.md 추가** — `/tmp/*.ts`, 일회성 스크립트는 dispatcher 경유 불필요. AGENTS.md에 한 줄: "일회성 스크립트는 직접 try/catch + console.error로 끝낸다. 재사용 흐름이면 cli/로 승격해 dispatcher 경유."

## Source Context

- Linear issue: POKIT-144
- Linear URL: https://linear.app/example/issue/POKIT-144/배포대상-v090-dispatcher-일반화-sprint-runner-연결-on-error-트리거-자동화
- Labels: Improvement, pokit:prd
