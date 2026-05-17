---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-a2-wiring-intended-auto
dependencies: []
source: v0.15.3 unresolved carry-forward + M7 후속
proposed_labels:
  - area:release-manifest
  - area:wiring
  - type:feature
  - release:v0.16.0
proposed_state: Backlog
id: A2
title: [v0.16.0] buildReleaseManifest wiring intended 자동 추출 (M7 후속)
action: create (new issue)
proposedLabels:
  - area:release-manifest
  - area:wiring
  - type:feature
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-a2-wiring-intended-auto
schema_version: 1
---

## 시각화

```
Before:                          After:

PRD.md                           PRD.md
"renderXxx 호출"                 "renderXxx 호출"
       │                                │
사람이 manifest 열어              자동 파서가 백틱 식별자
직접 입력                         + "wiring intended:" 마커 추출
       │                                │
       ▼                                ▼
manifest.yaml                    manifest.yaml
wiring:                          wiring:
  intended: []  ← 빈칸 빈번        intended:
                                     - renderXxx  ← 자동
                                     - buildYyy
```

## AS-IS

`memory/releases/SCHEMA.md` 의 `wiring_status.intended` 필드는 수동 입력. v0.14.0 manifest에서 빈 배열로 박제된 사례 있음 (decision-log 2026-05-17, `memory/releases/v0.14.0.yaml:35-42`).

PRD와 CHANGELOG에는 의도된 wiring (어떤 함수·스킬·헬퍼가 production 호출되어야 하는지)이 본문에 명시되어 있으나, manifest로의 전사가 휴먼 의존 → 누락 빈번.

M7 (POKIT-176 `wiring_status.actual` 실측) 은 실측 측면을 처리. **intended 측면은 미처리**.

## TO-BE

`buildReleaseManifest(version, opts)` 에 wiring intended 자동 추출 단계 추가:

```typescript
// scripts/internal/release-manifest.ts (확장)
interface BuildReleaseManifestOpts {
  // ...
  prdPaths?: string[];        // PRD 파일 경로 배열
  changelogPath?: string;     // CHANGELOG.md 경로
}

function extractIntendedWiring(prdPath: string, changelogSection: string): string[] {
  // PRD 본문에서 다음 패턴 매칭:
  //   - 백틱으로 감싼 식별자: `renderXxx`, `buildXxx`
  //   - "wiring intended:" 또는 "production 호출" 마커 다음 라인 식별자
  // CHANGELOG에서 같은 패턴 + commit 메시지의 백틱 식별자
  // 중복 제거 후 배열 반환
}
```

manifest 생성 시:
1. opts.prdPaths의 PRD 본문 추출
2. opts.changelogPath의 해당 버전 섹션 추출
3. `extractIntendedWiring` 호출 결과를 `wiring_status.intended` 에 주입
4. 추출 결과가 비면 빈 배열이 아니라 명시적 경고 출력 ("wiring intended 자동 추출 실패: prd/changelog 마크업 부재")

## 성공 검증

- [ ] `extractIntendedWiring` 단위 테스트 — 백틱 식별자, "wiring intended:" 마커, 중복 제거
- [ ] v0.15.3 PRD/CHANGELOG fixture 로 `wiring_status.intended` 자동 채워짐 (≥ 2건)
- [ ] 추출 실패 시 빈 배열 대신 경고 출력 (`stderr`)
- [ ] 기존 manifest yaml에 intended 수동 값 있으면 자동 추출과 머지 (수동 우선)
- [ ] 회귀 테스트: v0.14.0 manifest (빈 intended) 재빌드 시 intended ≥ 1건 채워짐

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: builder + tdd-writer (파서 + 테스트)
- 검수: auditor (regex false positive 검증)
