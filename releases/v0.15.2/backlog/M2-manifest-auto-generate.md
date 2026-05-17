---
id: M2
title: "[v0.15.2] release dispatcher [4/8] — manifest 미존재 시 자동 생성"
proposedLabels: [area:release-dispatcher, type:bug, release:v0.15.2]
proposedState: Backlog
idempotencyKey: memo-20260517-m2-manifest-auto-generate
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
---

## AS-IS

`scripts/cli/release.ts:101-108` — [4/8] 단계에서 `memory/releases/v<VERSION>.yaml` 경로를 확인한다. 파일이 존재하면 재생성 없이 통과하고, 미존재 시 `⚠ manifest 미존재 — 수동 작성 또는 backfill 필요` 경고만 출력하고 그대로 계속 진행한다.

결과: release dispatcher 실행 후 manifest가 없는 상태에서 [6/8] retro-check, [7/8] next-action wizard 등 manifest를 읽는 하위 단계가 파일을 찾지 못해 silently 실패하거나 빈 데이터로 동작한다. v0.15.0, v0.15.1 릴리스 시 실제 manifest가 누락된 상태로 진행된 것이 확인된다(`memory/releases/v0.15.1.yaml` 존재하나 백필 방식으로 수작업 생성).

## TO-BE

`scripts/cli/release.ts` [4/8] 분기를 수정한다. manifest가 없을 때 `scripts/internal/release-manifest.ts`의 `writeReleaseManifest`를 호출해 초안을 자동 생성한다.

입력 소스 우선순위:
1. Linear cycle issues — `scripts/internal/linear.ts`의 `getWorkingContext`로 현재 cycle 이슈 목록 조회
2. CHANGELOG.md — 해당 버전 섹션 파싱 (정규식: `## \[?v?<VERSION>\]?`)
3. `git diff HEAD~1 -- artifacts/` — artifacts 변경 경로 추출

생성 초안의 `wiring_status.intended`, `wiring_status.actual`, `wiring_status.gaps`는 빈 배열로 초기화한다 — [6/8] retro-check가 채운다.

M6(releases/ 폴더 재구조화)와의 호환성 제약: manifest 파일 경로를 `release.ts` 내에 하드코딩하지 말고 `scripts/internal/release-manifest.ts`의 `manifestPath(version, rootDir)` 헬퍼(신규 추출)를 통해 참조한다. M6 이후 경로가 `releases/v<VERSION>/manifest.yaml`로 변경될 때 헬퍼만 교체하면 되도록 단일 진입점을 만든다.

## 성공 검증

- [ ] `./bin/pokit release 0.15.2 --dry-run` 실행 후 `memory/releases/v0.15.2.yaml`이 자동 생성된다
- [ ] 생성된 파일이 `parseReleaseManifest`로 오류 없이 파싱된다 (필수 키 전부 존재, semver·ISO 8601 검증 통과)
- [ ] `issues` 필드에 Linear cycle 이슈가 1건 이상 포함된다 (cycle 이슈 0건이면 빈 배열 `[]`)
- [ ] `changelog` 필드에 CHANGELOG.md 해당 버전 bullet이 파싱된다 (해당 섹션 없으면 빈 배열)
- [ ] manifest 이미 존재하는 경우 재생성 없이 `✓ manifest 이미 존재` 메시지 그대로 출력한다 (기존 동작 보존)
- [ ] M6 경로 변경 후에도 `manifestPath` 헬퍼만 교체하면 release.ts 수정 없이 동작한다

## 실행 순서

- 선행: 없음 (이번 묶음의 기반)
- 후행: **M6보다 먼저 진행** — `manifestPath()` 헬퍼를 본 메모에서 신규 추출하고, M6는 헬퍼 구현체만 새 경로로 교체

## 담당 에이전트

- 설계: claude-sonnet-4-6 (2026-05-17 메인 세션)
- 구현: claude-sonnet-4-6
- 검수: 사용자 (PO) — Linear 등록 승인 및 실제 릴리스 검증
