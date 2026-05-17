---
id: M6
title: releases/v<버전>/ 단위 묶음 도입 + artifacts/ 역할 재정의 + dogfood/ 제거
proposedLabels: [refactor, folder-structure, release-infra]
proposedState: Backlog
idempotencyKey: memo-20260517-m6-releases-folder-restructure
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
---

## AS-IS

- 버전별 산출물이 `artifacts/{prds,criteria,sprints}/`에 종류별로 분산되어 있어 "v0.14.0에 뭐 했어?"를 답하려면 3~4개 폴더를 순서대로 점프해야 한다.
- `memory/releases/v*.yaml`은 별도 경로에 manifest만 박제되어 산출물과 물리적으로 분리된 상태다.
- `docs/architecture/15-folder-layout.md:44`에 `dogfood/`가 최상위 폴더로 선언되어 있으나 실제 폴더는 존재하지 않는다 — 선언과 현실 부정합.
- `docs/_details/role-map.yaml:199`에도 `dogfood/`가 등재되어 있어 이중 불일치 상태다.
- 결과적으로 에이전트 cold start 시 "버전 단위 컨텍스트"를 복원하는 단일 진입점이 없다.

## TO-BE

최상위에 `releases/` 폴더를 신설하여 버전별 단위 묶음을 제공한다.

```
releases/
  ├─ v0.13.0/
  │   ├─ manifest.yaml
  │   ├─ prds/
  │   ├─ criteria/
  │   ├─ sprints/
  │   ├─ retro.md
  │   ├─ unresolved.md       (M4 연계)
  │   ├─ gaps/                (M3 연계)
  │   └─ CHANGELOG-excerpt.md
  ├─ v0.14.0/
  ├─ v0.15.0/
  ├─ v0.15.1/
  └─ _template/
```

마이그레이션 항목:
- `memory/releases/v*.yaml` → `releases/v*/manifest.yaml` 이동 후 `memory/releases/` 폐기
- `artifacts/prds/*` → `releases/v*/prds/` (frontmatter의 version 필드로 릴리스 매핑)
- `artifacts/criteria/*`, `artifacts/sprints/*` 동일 방식 재분류
- `artifacts/`는 `analyses/`, `cross-runtime-diff/`, `profiles/` 만 잔존 (비-버전성 작업물 보관소)
- `dogfood/` 선언 및 등재 삭제: `docs/architecture/15-folder-layout.md`, `docs/_details/role-map.yaml` 갱신
- `scripts/internal/release-manifest.ts` writer 경로: `memory/releases/` → `releases/`
- `scripts/internal/manifest-lookup.ts` lookup 경로 동일 변경
- `scripts/cli/release.ts` [4/8] manifest 경로 동일 변경 (M2의 `manifestPath()` 헬퍼를 통해 변경)
- `dogfood`라는 단어는 `OPERATING_MODEL.md` 등 문서에서 "행위/단계" 의미로만 유지, 폴더 선언에선 전면 제거

## 성공 검증

- [ ] `releases/v0.13.0/manifest.yaml` 이상 모든 버전 폴더가 존재하고 manifest 로드 가능
- [ ] `memory/releases/` 폴더가 삭제되거나 빈 상태
- [ ] `artifacts/`에 `prds/`, `criteria/`, `sprints/` 하위 폴더 없음 (gitkeep 포함 삭제)
- [ ] `docs/architecture/15-folder-layout.md`에서 `dogfood` 미등장, `releases/` 항목 신규 등재 확인
- [ ] `docs/_details/role-map.yaml`에서 `dogfood` 미등장, `releases/` 항목 신규 등재 확인
- [ ] `./bin/pokit release` 실행 시 manifest를 `releases/v<VERSION>/manifest.yaml` 경로에 정상 기록
- [ ] `./bin/pokit brief` 실행 시 최신 manifest를 새 경로에서 로드하여 정상 출력
- [ ] 마이그레이션 후 기존 산출물 frontmatter의 version 필드 기준 분류 누락 0건

## 실행 순서

- 선행: **M2 — `manifestPath()` 헬퍼가 먼저 추출되어야 함.** M2 미완 상태에서 본 메모 진행 시 release.ts 직접 수정 필요 → 변경 표면적 증가
- 후행: M4(unresolved 카드)는 본 메모와 같은 manifest 파일 건드림. M6 완료 후 M4의 `unresolved.md` 별도 파일 vs manifest 내 `unresolved:` 필드 위치 재확정 필요
- 부수 영향: schema 위치 (`memory/releases/SCHEMA.md` → `releases/SCHEMA.md` 또는 `docs/_details/release-manifest-schema.md`로 이동) 결정 필요

## 담당 에이전트

- 설계: claude-opus-4-7 (메인 PO 세션, 2026-05-17)
- 구현: claude-sonnet-4-6 (마이그레이션 + 경로 변경, 다파일 일괄 작업)
- 검수: claude-opus-4-7 (선언/현실 부정합 회귀 확인 + brief/release verb 동작 검증)
