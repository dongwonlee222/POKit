---
id: bl-2026-05-17-006
created: 2026-05-17
status: promoted
domain: docs
size: S
title: "dogfood historical 참조 정리 (docs/PRD.md, docs/DESIGN.md 등)"
target_version: v0.17.1
promoted_to: POKIT-197
source: v0.16-unresolved/dogfood-references-cleanup
---

## AS-IS

- docs/PRD.md · docs/DESIGN.md 등에 historical dogfood 참조 존재
- 의도 유지(박물관) vs 정리(제거) 결정 미정 → 신규 작업자 혼선
- 사용자 결정: **정리 방향** (옵션 B)

## TO-BE

- dogfood historical 참조 grep → 분류
  - 운영에 영향 0 + 단순 회고 = 제거
  - 정책·근거 참조 = 명시적 "Historical:" 주석으로 보존 + 위치 명확화
- docs/PRD.md / docs/DESIGN.md / 기타 노출 파일 일괄 정리

## 성공 검증

- `rg "dogfood" docs/` 결과 = 의도된 historical 참조만 (Historical: 라벨 동반)
- docs/PRD.md / docs/DESIGN.md 첫 진입 시 dogfood 참조 노이즈 0
- 정리 PR description에 제거/유지 분류 기준 명시

## 담당 에이전트

미정 (docs 정리 — 검토 1회 + replace)

## 비고

- 사용자 결정 (옵션 B = 정리) 반영
- 정리 기준은 본 메모에 박힘 (이후 같은 결정 반복 방지)
