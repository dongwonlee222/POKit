---
id: bl-2026-05-17-008
created: 2026-05-17
status: promoted
domain: tooling
size: S
title: "linear.ts CLI assign-label 누적 보존 (덮어쓰기 → append)"
target_version: v0.17.2
promoted_to: POKIT-200
source: v0.16-unresolved/assign-label-cumulative
---

## AS-IS

- `linear.ts` CLI `assign-label apply`가 기존 라벨 덮어쓰기
- 누적 라벨(예: pokit:prd + cycle 라벨 + state 라벨) 보존 로직 부재
- apply 후 기존 라벨 손실 사례 발생 가능

## TO-BE

- `assign-label` 동작 모드 명시
  - `--mode add` (기본) — 기존 + 신규 union
  - `--mode replace` — 명시적 덮어쓰기
- dry-run 출력에 before/after 라벨 diff 표시

## 성공 검증

- 기존 라벨 3개 + 신규 1개 추가 → 결과 4개 (add 모드)
- replace 모드는 명시 시에만 동작
- dry-run diff 출력 가독 확인

## 담당 에이전트

미정 (scripts/internal/linear.ts)

## 비고

- bl-004 (create --apply)와 같은 영역 — 같은 PR로 묶음 가능
