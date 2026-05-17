---
id: M7
title: wiring_status.actual 실측 자동화 — wiring-probe.ts 신규 + retro-check 연동
proposedLabels: [reliability, release-infra, observability]
proposedState: Backlog
idempotencyKey: memo-20260517-m7-wiring-status-actual-probe
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
---

## AS-IS

- `memory/releases/v0.14.0.yaml:35-42`의 `wiring_status.actual: []`은 수동으로도 채워지지 않은 영구 빈 배열이다. `intended` 3건(active_profile_manifest, working_notes_validation, collected_governance) 모두 `actual`에 없고 `gaps`에 structural 3건이 수작업으로 기록되어 있다.
- `memory/releases/v0.15.0.yaml:37-40`의 `actual`은 `intended`와 동일하게 채워져 있으나, 실측 로직 없이 수동 편집된 값이다 — manifest 신뢰도를 보장하지 않는다.
- `memory/index.yaml` 모듈과 파일 정의는 존재하지만 `memory-index` import 횟수가 0건이다. 이런 bitrot은 현재 `retro-check.ts`에서 자동으로 감지되지 않는다.
- `wiring_status.actual`은 매 릴리스마다 사람이 판단·입력해야 하는 구조이므로 누락·오기입이 구조적으로 발생한다.

## TO-BE

- `scripts/internal/wiring-probe.ts` 신규: 각 wiring id별 probe 함수를 등록하고, grep/import 카운트/CLI 실행 로그 등으로 "실제 호출 흔적"을 측정하여 boolean 결과를 반환한다.
- 예시 probe:
  - `renderLinearBacklogDescription` — 함수명 grep + 호출 흔적 (scripts/ 범위)
  - `release_manifest_writer` — `writeReleaseManifest` 호출 흔적 grep
  - `memory_index_retrieval` — `buildMemoryIndex` import 흔적 grep (현재 0건으로 bitrot 즉시 감지 대상)
- release dispatcher [4/8]: `manifest.wiring_status.actual = scanWiring(manifest.wiring_status.intended)` 자동 호출하여 실측값 주입
- `scripts/internal/retro-check.ts`: `gap = intended - actual` 자동 계산 후 `WiringGapCategory`(structural / partial / bitrot) 분류하여 manifest `gaps` 배열에 기록 (`WiringGapCategory`는 `scripts/internal/release-manifest.ts:9`에 기존 정의)
- `wiring_status.actual`이 비어 있으면 retro-check에서 WARN을 발생시켜 수동 릴리스 체크리스트 항목으로 escalate

## 성공 검증

- [ ] 새 버전 릴리스 시 dispatcher 실행 후 `releases/v<VERSION>/manifest.yaml`의 `wiring_status.actual`이 비어 있지 않음
- [ ] `memory_index_retrieval` probe를 실행하면 import 0건이 감지되어 `bitrot` gap으로 분류됨
- [ ] `renderLinearBacklogDescription` import를 의도적으로 제거하고 retro-check 실행 시 해당 wiring id가 `structural` gap으로 보고됨
- [ ] `intended`와 `actual`이 완전히 일치하는 릴리스에서 `gaps: []` 유지
- [ ] `wiring_status.actual: []` 상태에서 retro-check를 실행하면 WARN 로그 출력 확인
- [ ] probe 함수 신규 등록 시 단위 테스트 1건 이상 통과

## 담당 에이전트

- 설계: claude-opus-4-7 (메인 PO 세션, 2026-05-17)
- 구현: claude-sonnet-4-6 (probe 함수 + retro-check 연동)
- 검수: claude-opus-4-7 (현재 bitrot 케이스 `memory_index_retrieval` 검출 직접 확인)
