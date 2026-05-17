---
id: M4
title: "[v0.15.2] 미결 인계 메커니즘 — manifest unresolved 섹션 + session-brief 카드"
proposedLabels: [area:session-brief, area:release-manifest, type:feature, release:v0.15.2]
proposedState: Backlog
idempotencyKey: memo-20260517-m4-unresolved-carry-forward
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
---

## AS-IS

`memory/resume-brief.md` — [8/8] 단계에서 "다음에 무엇을 하나" 한 줄짜리 텍스트만 박제된다. 구조화된 항목이 없어서 미결 작업이 다음 세션에 사라진다.

`scripts/cli/session-brief.ts:134-138` — `buildPreviousSessionBlock`이 `memory/resume-brief.md` 전체를 원문 그대로 렌더링한다. 이 파일에 구조가 없으면 brief 카드도 구조 없이 출력된다.

`memory/releases/SCHEMA.md` — 현재 `ReleaseManifest` 타입(`scripts/internal/release-manifest.ts:41-52`)에 `unresolved` 필드가 없다. `parseReleaseManifest`의 "정의된 키만 통과" 규칙(SCHEMA.md line 62)에 따라 schema 확장 없이 저장하면 round-trip 시 데이터가 소실된다.

결과: POKIT-167 미결 3건(retro-check 미적용, manifest 미생성, gap 미등록)이 v0.15.1 릴리스 이후 다음 세션 brief에 등장하지 않아 누락된 채 다음 사이클로 넘어갔다.

## TO-BE

두 곳을 동시 확장한다.

**1. ReleaseManifest schema 확장** (`scripts/internal/release-manifest.ts`, `memory/releases/SCHEMA.md`)

`ReleaseManifest` 타입에 optional 필드 추가:

```typescript
unresolved?: Array<{
  id: string;        // 짧은 식별자 (예: "gap-retro-check", "POKIT-167-sub1")
  note: string;      // 사람이 읽는 한 줄 설명
  owner: string;     // "human" | "<verb-name>" | "<Linear-issue-id>"
}>;
```

`renderReleaseManifest` — `unresolved` 배열을 `retro` 블록 앞에 직렬화한다 (키 순서 안정성 보장).
`parseReleaseManifest` — `unresolved` 키를 파싱한다. 없으면 `undefined`로 취급한다 (optional).

M6에서 manifest 파일 위치가 `releases/v<버전>/manifest.yaml`로 이동 예정이므로, schema 키 형식 자체는 이번에 확정하되 경로는 `manifestPath()` 헬퍼(M2에서 신규 추출)를 통해 참조한다.

**2. session-brief unresolved 카드** (`scripts/cli/session-brief.ts`)

`buildSessionBrief` — variant `"start"` 분기에서 직전 릴리스 manifest를 `parseReleaseManifest`로 로드하고 `unresolved` 배열이 1건 이상이면 아래 카드를 출력 블록에 추가한다:

```
🪧 이전 릴리스 미결 N건
- [<id>] <note> (owner: <owner>)
...
```

manifest가 없거나 `unresolved`가 비어 있으면 카드 자체를 출력하지 않는다 (기존 brief 레이아웃 보존).

M7(`wiring_status.actual` 실측) 결과가 확정되면 실측 누락 wiring을 `unresolved` 항목으로 자동 박제하는 경로를 retro-check 또는 release dispatcher [4/8]에 추가할 수 있다. 단 이 연동은 M7 완료 후 별도 이슈로 진행한다.

## 성공 검증

- [ ] `ReleaseManifest` 타입에 `unresolved` 필드가 추가된다
- [ ] `renderReleaseManifest` + `parseReleaseManifest` round-trip 시 `unresolved` 데이터가 보존된다
- [ ] `unresolved` 없는 기존 yaml 파일(`v0.13.0.yaml` ~ `v0.15.1.yaml`)이 `parseReleaseManifest`에서 오류 없이 파싱된다 (하위 호환)
- [ ] `memory/releases/SCHEMA.md`에 `unresolved` 키 정의가 추가된다
- [ ] `./bin/pokit start` 실행 시 직전 릴리스 manifest에 `unresolved`가 있으면 "🪧 이전 릴리스 미결 N건" 카드가 출력된다
- [ ] `unresolved`가 없거나 빈 배열이면 카드가 출력되지 않는다

## 담당 에이전트

- 설계: claude-sonnet-4-6 (2026-05-17 메인 세션)
- 구현: claude-sonnet-4-6
- 검수: 사용자 (PO) — brief 카드 출력 확인 및 기존 yaml 하위 호환 검증
