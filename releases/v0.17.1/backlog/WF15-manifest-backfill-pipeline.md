---
kind: memo
schema_version: 1
title: "[v0.17.0] release dispatcher [4.5/8] manifest backfill 자동화 — carry-forward 영구 루프 차단"
created: "2026-05-17T21:00:00Z"
updated: "2026-05-17T21:00:00Z"
author: "claude-opus-4-7"
linked_issues: []
linked_release: "v0.17.1"
workflow_action: create
idempotency_key: memo-20260517-wf15-manifest-backfill
dependencies: [POKIT-171, POKIT-173, POKIT-176]
source: 2026-05-17 v0.16.0 release 직후 brief 출력 누락 발견 (carry-forward 2번째 재발)
proposed_labels:
  - Improvement
  - area:release-dispatcher
  - priority:high
proposed_state: Backlog
---

## 시각화

### 재발 Timeline — 박제의 자기 영구화 루프

```
2026-05-?? v0.15.x cycle
   └─► 버그 인지 → unresolved 박제 (owner: human)

2026-05-17 v0.15.3 release
   └─► [build-release-manifest-carry-forward] unresolved 박제
       🔴 1st 발견 — 박제만, 미수정

2026-05-17 v0.16.0 cycle
   └─► 1차 그룹 10건 진행, carry-forward는 미포함

2026-05-17 v0.16.0 release 직후
   └─► 🔴 2nd 발견 — manifest 빈 채로 박제
       → brief에 "이전 릴리스 미결 N건" 섹션 누락
       → carry-forward 영구 루프 (자기 자신의 fix가 carry되지 못함)
```

### Pareto — 왜 안 고쳐졌나

```
🔴 owner: human → 자동 우선순위 못 잡음   ████████████ 40%
🔴 박제 ≠ 실행 (자기 영구화 루프)         ████████ 25%
🔴 carry-forward 메타 작업 → 가치 안 보임 ██████ 20%
⚠️ scope 선정 시 1차 그룹 누락           ███ 10%
⚠️ 다른 큰 cycle(v0.16.0) 먼저 진입       █ 5%
```

**핵심:** "owner=human + 메타 작업" 조합이 시스템적으로 우선순위 못 잡음.

### Before / After — release dispatcher 단계

```
Before (현재)                              After (TO-BE)
─────────────────────                      ─────────────────────
[4/8] manifest 생성 (빈 껍데기)             [4/8] manifest 생성
[5/8] cycle close                          [4.5/8] manifest backfill ✨
[6/8] retro-check                            - issues: Linear 자동 수집
[7/8] next-action wizard                     - unresolved: 직전 carry + 신규 merge
[8/8] resume-brief 박제 (빈 manifest)        - wiring.actual: probe 박제
                                             - owner=human N cycle 카운트 +
                                               임계치 시 priority 자동 상승
                                           [5/8] cycle close
                                           [6/8] retro-check
                                           [7/8] next-action wizard
                                           [8/8] resume-brief 박제 (채워진 manifest)
```

## AS-IS

`scripts/cli/release.ts` 의 dispatcher 단계가 빈 manifest 껍데기만 생성하고 끝남:

- **[4/8] manifest 생성** (`buildReleaseManifest`): `issues: []`, `wiring_status.actual: []`, `artifacts.code_paths: []` 모두 빈 배열로 박제
- **carry-forward 자동화 부재**: 직전 manifest의 `unresolved` 필드를 신규 manifest로 자동 복사 안 함 (M4 / POKIT-173 메모는 있으나 실구현 미완)
- **probe 결과 미통합**: wiring-probe(POKIT-176)가 실측은 하지만 manifest.wiring_status.actual에 결과 박제 안 함
- **owner=human 미결 정책 없음**: 박제만 누적, N cycle 후에도 우선순위 자동 상승 X

### 실증 (2회 재발)

- v0.15.3 release: unresolved 5건 박제 (`[build-release-manifest-carry-forward]` 포함)
- v0.16.0 release: 같은 버그 재발 — `unresolved` 필드 자체 없음, brief에 미결 섹션 누락
- 같은 버그가 **자기 자신의 fix를 carry하지 못함** = 영구 루프

## TO-BE

`scripts/cli/release.ts` 에 `[4.5/8] manifest backfill` 단계 신규 추가.

### Step 1 — issues 자동 수집
```typescript
// scripts/internal/release-manifest.ts 확장
async function collectCycleIssues(targetVersion: string): Promise<IssueRef[]>;
// Linear cycle 쿼리 또는 description의 targetVersion 매칭
// POKIT-187, POKIT-189, ... 자동 수집
```

### Step 2 — unresolved carry-forward
```typescript
async function carryForwardUnresolved(prevVersion: string, currVersion: string): Promise<UnresolvedItem[]>;
// 직전 manifest unresolved + 신규 미결 merge
// 해결된 항목(state=Done) 자동 제거
```

### Step 3 — wiring.actual 박제
```typescript
async function snapshotWiringActual(manifestPath: string): Promise<void>;
// wiring-probe 실행 → 결과를 manifest.wiring_status.actual에 박제
```

### Step 4 — owner=human 정책 강화
```typescript
function escalateUnresolved(unresolved: UnresolvedItem[]): UnresolvedItem[];
// owner=human + cycle_count >= 2 인 항목은 owner=agent 전환
// priority도 자동 상승 (Backlog → Triage)
```

### Step 5 — release dispatcher 통합
`scripts/cli/release.ts` [4/8] 직후 `await backfillManifest(version, prevVersion)` 호출.

### 검증 인프라
- `tests/integration/release-dispatcher.test.mjs` — backfill 단계 회귀 테스트
- fixture: v0.15.3 → v0.16.0 carry-forward 시나리오 재현

## 성공 검증

- [ ] `backfillManifest(version, prevVersion)` 함수 신규 + 단위 테스트
- [ ] release dispatcher [4.5/8] 단계 추가 (release.ts)
- [ ] issues 자동 수집 — v0.16.0 manifest에 POKIT-175/178/179/181/185/186/187/189/190/191 10건 채워짐
- [ ] unresolved carry-forward — 직전 manifest unresolved 자동 복사, 해결된 항목 제거
- [ ] wiring.actual 박제 — probe 결과 자동 박제
- [ ] owner=human 미결 cycle_count >= 2 → owner=agent 전환 (정책)
- [ ] 회귀 테스트 — v0.15.3→v0.16.0 시나리오 PASS
- [ ] dogfood — v0.17.0 release 시 brief에 "이전 릴리스 미결 N건" 정상 출력
- [ ] v0.16.0 manifest 일회 backfill (보정 마이그레이션)

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, v0.16.0 release 직후 2nd 발견 + 자기 영구화 루프 진단)
- 구현: fullstack-developer (4 함수 + dispatcher 통합)
- 검수: feature-dev:code-reviewer (carry-forward 정확성, owner 정책 정합)

## 비고

- v0.15.3 unresolved `[build-release-manifest-carry-forward]`와 직접 매칭. 본 항목이 그 fix.
- v0.17.0 1차 그룹 권장 (foundation, 다른 메타 작업 의존 해소)
- C5(POKIT-182 workflow-state)와 독립이지만 같이 진행 시 시너지 (workflow-state도 manifest 의존)
- owner=human 정책 변경은 운영 룰 — `docs/_details/approval-flow.md` 동기화 필요
- 박제 → 실행 영구 루프 패턴은 향후 다른 메타 작업에도 적용될 일반화 원칙
