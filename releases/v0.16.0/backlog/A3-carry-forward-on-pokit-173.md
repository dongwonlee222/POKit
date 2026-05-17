---
kind: memo
workflow_action: update
idempotency_key: memo-20260517-a3-pokit-173-carry-forward
dependencies: []
source: v0.15.3 unresolved 5건 수기 처리 사고 + advisor 권고
proposed_labels:
  - area:release-manifest
  - area:carry-forward
  - type:feature
  - release:v0.16.0
proposed_state: Backlog
linked_issues:
  - POKIT-173
id: A3
title: [v0.16.0] POKIT-173 보강 — buildReleaseManifest carry-forward 자동화
linkedIssue: POKIT-173
action: update (description append)
proposedLabels:
  - area:release-manifest
  - area:carry-forward
  - type:feature
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-a3-pokit-173-carry-forward
schema_version: 1
---

## 시각화

```
Before (v0.15.3에서 발생한 사고):  After (v0.16.0):

미결 5건 발생                     미결 5건 발생
   │                                  │
사람이 yaml 열어서                 buildReleaseManifest
copy/paste 5번                    가 자동 인계
   │                                  │
   ▼                                  ▼
manifest.yaml                     manifest.yaml
unresolved:                       unresolved:
  - (수기 5건)                       - (자동 5건)

※ 같은 사고 재발 차단
```

## AS-IS

POKIT-173 ("[v0.15.2] 미결 인계 메커니즘")는 Backlog. v0.15.2/v0.15.3 hotfix에서 일부 진행:
- `ReleaseManifest.unresolved` 필드 추가 ✅
- `renderReleaseManifest` / `parseReleaseManifest` round-trip ✅
- session-brief unresolved 카드 ✅
- 경로 헬퍼 `releaseManifestPath()` (v0.15.3 hotfix) ✅

**미완료**: 자동 carry-forward 자체.

현재 `buildReleaseManifest`는 unresolved 필드를 **호출자가 직접 전달**해야 함. v0.15.3 dispatcher 실행 시 5건의 미결을 수기로 carry-forward 했음 (decision-log 2026-05-17 entry 증거). 같은 사고 재발 위험.

## TO-BE

POKIT-173 description 본문 끝에 다음 섹션 append:

```
## v0.16.0 보강 — 자동 carry-forward (2026-05-17)

### 추가 작업
1. `buildReleaseManifest(version, opts?)`에 자동 carry-forward 단계 추가
   - 직전 release manifest를 `releaseManifestPath(prevVersion)`로 로드
   - prev.unresolved 배열을 새 manifest의 unresolved에 자동 머지
   - 신규 미결과 prev unresolved 중복 시 신규 우선 (id 기준)
2. owner 보존 — prev.unresolved의 owner 필드를 그대로 carry
3. resolved 마킹 — opts.resolved: string[] 으로 id 배열 받아 carry 대상에서 제외
4. 회귀 테스트 — v0.15.3 fixture (unresolved 5건)로 round-trip 검증

### 의존
- 본 작업 자체 의존 없음 (POKIT-173 기존 schema 위에 얹기)
- A2 (wiring intended 자동 추출)와 동일 함수 수정 → C2/C3와 직렬 진행 권장
  (단 본 작업은 buildReleaseManifest, A2는 PRD/CHANGELOG 파서 — 충돌 영역 다름)

### CHANGELOG
- buildReleaseManifest 자동 carry-forward 추가 — 매 릴리스마다 수기 인계 불필요
- 같은 사고(v0.15.3 5건 수기 처리) 재발 차단
```

## 성공 검증

- [ ] POKIT-173 description에 v0.16.0 보강 섹션 append됨
- [ ] `buildReleaseManifest` 호출 시 prev unresolved 자동 포함
- [ ] resolved 옵션으로 carry 대상 명시적 제외 가능
- [ ] v0.15.3 fixture 회귀 테스트 PASS
- [ ] owner/note 필드 손실 없음

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: builder + tdd-writer (테스트 우선)
- 검수: auditor (회귀 테스트 fixture 검증)
