---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-c9-backlog-memo-visualization
dependencies: []
source: 사용자 PO 요청 (메모 이해도 약함) + v0.16.0 12개 메모 사후 보강 경험
proposed_labels:
  - area:backlog-memo
  - area:standardization
  - type:ux
  - release:v0.16.0
proposed_state: Backlog
id: C9
title: [v0.16.0] backlog-memo 양식에 '시각화' 섹션 강제 — ASCII Before/After 의무
action: create (new issue)
proposedLabels:
  - area:backlog-memo
  - area:standardization
  - type:ux
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-c9-backlog-memo-visualization
schema_version: 1
---

## 시각화

```
Before (현재 backlog-memo 양식):

---
id: M<N>
title: "..."
---
## AS-IS                          사용자: "이게 뭐하는 작업이야?"
<텍스트만>                              ↓
                                  메모 전체 읽고 본인이 머릿속에서
## TO-BE                          Before/After 재구성
<텍스트만>

----

After (v0.16.0 양식 강제):

---
id: M<N>
title: "..."
---
## 시각화                         사용자: 그림 보면 즉시 이해
```                                     ↓
Before:    After:                 "아, 이거 하는 거구나"
<ASCII>    <ASCII>
```

## AS-IS                          (양식 contract test로 강제)
<텍스트>

## TO-BE
<텍스트>
```

## AS-IS

POKit `backlog-memo` 스킬 양식 (artifacts/backlog/v*/M*.md) 은 텍스트 4섹션 (AS-IS / TO-BE / 성공 검증 / 담당 에이전트) 만 강제.

문제:
- 사용자가 메모 읽고 "이 작업이 끝나면 뭐가 달라지는지" 직관 파악 어려움
- 텍스트 AS-IS/TO-BE 읽고 머릿속에서 Before/After 재구성 필요
- v0.16.0 작업 중 12개 메모 작성 후 사용자가 "이해 어렵다" 피드백 → 시각화 사후 추가 발생

PO·메인 에이전트 모두 메모 첫 진입 시 텍스트 스캔으로 인지 비용 큼.

## TO-BE

`backlog-memo` 스킬 양식에 `## 시각화` 섹션 의무 추가 — AS-IS 바로 위 위치.

### 양식 변경

```markdown
---
id: ...
title: ...
linkedIssue: ...
action: ...
proposedLabels: [...]
proposedState: Backlog
idempotencyKey: ...
source: ...
dependencies: [...]
---

## 시각화

\`\`\`
Before:                     After:

<현재 상태 ASCII>          <변경 후 ASCII>
\`\`\`

## AS-IS
...

## TO-BE
...

## 성공 검증
- [ ] ...

## 담당 에이전트
- 설계: ...
```

### 시각화 가이드

스킬 SKILL.md에 시각화 작성 가이드 추가:

1. **Before / After 좌우 대비** — 변화를 한눈에
2. **사용자 시점·시스템 시점 중 택일** — 명령 비교는 사용자 시점, 데이터 흐름은 시스템 시점
3. **화살표·박스 활용** — `│ ▼ ─ ┌ └ ┐ ┘` 일관
4. **이모지 마커** — ✅(완료) 🔄(진행) ⏸(대기) ❌(실패) ⚠(주의) 📎(첨부)
5. **80자 폭 이내** — 터미널 가독성

### 헬퍼 함수

`scripts/internal/backlog-outline.ts` 에 추가:

```typescript
function renderLocalBacklogMemo(input: LocalBacklogMemoInput): string {
  // 기존 4섹션 + 시각화 섹션 추가
  // input.visualization 필드 (string, ASCII 본문) 추가
  // 누락 시 placeholder + 경고 출력
}
```

### 검증

- `tests/backlog-memo-format-contract.test.mjs` — 모든 M*.md 파일에서 `## 시각화` 섹션 강제
- 시각화 본문이 빈 코드블럭이면 fail
- v0.16.0 메모 12개는 본 작업 진행 전 이미 사후 보강됨

## 성공 검증

- [ ] `backlog-memo` SKILL.md에 시각화 섹션 가이드 추가
- [ ] `renderLocalBacklogMemo` 함수에 `visualization` 필드 추가
- [ ] contract test가 시각화 누락 메모 차단
- [ ] 시각화 가이드 (Before/After 패턴, 80자 폭, 이모지 마커) 명문화
- [ ] v0.17.0 이후 신규 메모는 시각화 없이 등록 불가능
- [ ] dogfood — v0.17.0 첫 메모 작성 시 시각화 자동 강제 확인

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, v0.16.0 12개 메모 사후 보강 경험 기반)
- 구현: builder (스킬 + 헬퍼 + contract test)
- 검수: 1회 dogfood (신규 메모 작성 시 양식 강제 동작)
