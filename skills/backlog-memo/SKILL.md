---
name: backlog-memo
description: 백로그 아이디어를 로컬 메모(dry-run)로만 정리한다. 외부 write 절대 금지. 사용자 승인 후 linear-backlog-manager로 위임.
entry: conversational
labels: []
trigger_phrases:
  - "백로그 메모"
  - "backlog memo"
  - "로컬 백로그 초안"
  - "/backlog-memo"
  - "백로그 아이디어 정리"
  - "일단 메모만"
---

# backlog-memo

## Trigger

Use when the PO wants to draft a backlog idea locally without committing to Linear yet.
Phrases: "백로그 메모", "backlog memo", "로컬 백로그 초안", "/backlog-memo", "일단 메모만 해줘"

## External Write Rule — ABSOLUTE

이 스킬은 외부 write를 절대 수행하지 않는다.

금지 목록:
- `api.linear.app` GraphQL mutation (createIssue, updateIssue 등)
- `gh issue create` 또는 GitHub API write
- Linear SDK `linearClient.*` 호출
- `curl`, `fetch`, `axios` 등 외부 HTTP write
- 파일 시스템 외부 저장 (DB, 원격 저장소)

이 스킬의 출력은 **stdout 메모**뿐이다.

## Renderer Reference

```typescript
// scripts/internal/backlog-outline.ts
export type LocalBacklogMemoInput = {
  title: string;
  summary: string;
  source: string;
  proposedLinearTitle: string;
  proposedLabels: string[];
  proposedState: string;
  nonChanges: string[];
  idempotencyKey: string;
};

export function renderLocalBacklogMemo(input: LocalBacklogMemoInput): string
```

LLM은 이 타입을 채워 `renderLocalBacklogMemo`를 호출하거나, 동등한 마크다운 출력을 직접 생성한다.

## Procedure

### Step 1 — 사용자 raw idea 수집

다음 정보를 자연어로 받아 정리한다:
- **title**: 한 줄 요약 (아이디어 제목)
- **summary**: 무엇을 왜 하고 싶은지 (2~4문장)
- **source**: 아이디어 출처 (사용자 관찰, 미팅, 이슈 번호 등)
- **nonChanges**: 이번에 건드리지 않을 것들 (범위 제한)

정보가 부족하면 한 번만 짧게 질문한다. 충분하면 바로 Step 2로 진행.

### Step 2 — idempotency key 생성

형식: `memo-<YYYYMMDD>-<scope-hash>`

scope-hash: title의 앞 8자 소문자 슬러그 (공백→하이픈, 특수문자 제거)

예: `memo-20260517-backlog-me`

### Step 3 — renderLocalBacklogMemo 호출

`LocalBacklogMemoInput`을 채워 렌더링한다:
- `proposedLinearTitle`: `[Backlog] <title>` 형식 제안
- `proposedLabels`: 내용 기반 추론 (예: `["feature"]`, `["bug"]`)
- `proposedState`: 기본값 `"Backlog"`

### Step 4 — 출력 및 안내

렌더링 결과를 그대로 출력한 뒤, 아래 문구를 반드시 추가한다:

```
---
> **이건 로컬 메모입니다. Linear에 아직 등록되지 않았습니다.**
> 등록하려면 "OK 등록해" 또는 "linear-backlog-manager로 넘겨"라고 말해주세요.
```

### Step 5 — 사용자 승인 대기

- "OK 등록해" / "linear-backlog-manager로 넘겨" → linear-backlog-manager 스킬로 위임. **자동 호출 금지** — 사용자가 명시적으로 요청할 때만.
- 수정 요청 → Step 3~4 반복.
- "됐어" / "그냥 저장" → 메모로 종료. 외부 등록 없음.

## Self-Verification Checklist

출력 전 확인:
- [ ] 출력에 "Linear에 아직 등록되지 않았습니다" 문구 포함
- [ ] `api.linear.app` 호출 흔적 없음
- [ ] GraphQL mutation 없음
- [ ] idempotency key 형식 `memo-YYYYMMDD-*` 준수
- [ ] `renderLocalBacklogMemo` 출력 섹션 구조 일치 (요약 / 출처 / 제안 Linear 형태 / 바꾸지 않을 것 / idempotency key)
