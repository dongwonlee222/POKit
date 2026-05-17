---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-c8-dry-run-format-unified
dependencies: []
source: 워크플로우 갭 분석 G4 (dry-run 형식 비일관)
proposed_labels:
  - area:dry-run
  - area:standardization
  - type:ux
  - release:v0.16.0
proposed_state: Backlog
id: C8
title: [v0.16.0] dry-run 형식 통일 — 대상/변경/승인 3섹션 표준
action: create (new issue)
proposedLabels:
  - area:dry-run
  - area:standardization
  - type:ux
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-c8-dry-run-format-unified
schema_version: 1
---

## 시각화

```
Before (5개 영역 다 다름):       After (공통 3섹션):

linear create dry-run:           모든 dry-run:
"제목: ...                        ┌─────────────────────┐
 라벨: ...                        │ ## 1. 대상          │
 desc: ..."                       │ ## 2. 변경          │
                                  │ ## 3. 승인          │
cycle close dry-run:              └─────────────────────┘
"변경: ..."
                                 (linear/cycle/release/
release dry-run:                  artifact-sync 전부 동일)
"8-step..."
                                 사용자: 같은 위치 보면 됨
사용자: 매번 다른 형식
```

## AS-IS

각 단계의 dry-run plan 출력 형식이 제각각:
- `linear-issue-manager` Create: 제목/라벨/description 미리보기 (4섹션 강제)
- `linear-issue-manager` Update: 대상/변경 필드/idempotencyKey/현재 desc 앞 5줄/추가 섹션
- `cycle-close` (C1 신설 예정): 표준 없음
- `release` (C2 신설 예정): 8-step만 가시화, dry-run plan 형식 없음
- `planCreateCycle` / `planUpdateCycle`: 텍스트로 변경 항목만

결과: 같은 "승인" 단계인데 사용자가 봐야 할 정보의 양·위치가 매번 다름. 워크플로우 갭 G4.

## TO-BE

모든 dry-run 출력 공통 3섹션 표준:

```
[dry-run plan]

## 1. 대상 (Target)
- 종류: <create-issue | update-issue | close-cycle | release | artifact-sync>
- 식별자: <POKIT-N | cycle-5 | v0.16.0 | ...>
- 현재 상태: <Backlog | In Progress | ...>

## 2. 변경 (Change)
<kind 별 표준 본문 — 4섹션·diff·표 등>

## 3. 승인 (Approval)
- idempotencyKey: <linear:...:YYYYMMDD:hash>
- 예상 영향: <외부 시스템 1건 | 파일 N건 변경 | ...>
- 되돌리기: <auto | manual (가이드 링크) | impossible>

▶ 진행하시려면 'y' 또는 '진행', 수정하시려면 발화.
```

### 구현 위치

- `scripts/internal/dry-run-format.ts` — `renderDryRunPlan(target, change, approval)`
- 모든 plan* 함수가 본 헬퍼 경유
- linear-issue-manager / cycle-close / release / artifact-sync 전부 적용

### 표준 위반 검증

- `tests/dry-run-format-contract.test.mjs` — 모든 dry-run 출력 paths에서 3섹션 마커 강제

## 성공 검증

- [ ] `renderDryRunPlan` 헬퍼 작성 + 단위 테스트
- [ ] 5개 영역 (Linear create/update, cycle-close, release, artifact-sync) 모두 본 헬퍼 경유
- [ ] 3섹션 마커 (대상/변경/승인) 항상 존재
- [ ] idempotencyKey 형식 일관
- [ ] 되돌리기 안내 명시 (특히 release 같은 외부 영향 큰 액션)
- [ ] dogfood — v0.16.0 release dispatcher 실행 시 본 형식 출력 확인

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: architect + builder (헬퍼 + 5개 영역 마이그레이션)
- 검수: contract test + 1회 dogfood
