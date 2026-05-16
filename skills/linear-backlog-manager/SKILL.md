---
name: linear-backlog-manager
description: Linear에 백로그 이슈를 실제 등록할 때 사용한다. backlog-memo 출력(또는 동등 구조)을 입력으로 받아 4섹션 검증 → renderLinearBacklogDescription → dry-run → 사용자 승인 → 실제 등록 순으로 진행.
entry: conversational
labels: []
trigger_phrases:
  - "Linear 백로그 등록"
  - "linear-backlog-manager"
  - "/linear-backlog-manager"
  - "Linear에 이슈 만들어줘"
  - "Linear에 올려줘"
  - "실제로 등록해줘"
  - "Linear에 넣어줘"
---

# linear-backlog-manager

## Trigger

"Linear 백로그 등록", "Linear에 이슈 만들어줘", "/linear-backlog-manager" 등 Linear 실제 write를 요청할 때 사용한다.

모호한 표현("백로그 추가해줘", "이슈 만들어줘")은 **backlog-memo**로 먼저 진입해 dry-run 구조를 잡은 뒤 이 스킬로 넘어오도록 안내한다.

## 절차

### Step 1 — 입력 수집

backlog-memo 출력 또는 다음 항목을 포함한 동등 구조를 받는다:

- title
- labels (Linear 라벨 배열)
- 4섹션 콘텐츠: **AS-IS / TO-BE / 성공 검증 / 담당 에이전트**

### Step 2 — 4섹션 누락 검증

4섹션 중 하나라도 비어 있으면 **등록을 진행하지 않는다.** 사용자에게 어느 섹션이 빠졌는지 알리고 보충을 요청한다.

```
[등록 보류] 다음 섹션이 누락되었습니다:
- 담당 에이전트

보충 후 다시 진행할까요?
```

### Step 3 — renderLinearBacklogDescription 호출

`scripts/internal/linear.ts` 의 `renderLinearBacklogDescription` 함수를 호출해 description 문자열을 생성한다.

**금지:** LLM이 직접 description 마크다운 문자열을 작성하는 것. 반드시 함수 경유.

### Step 4 — dry-run plan 제시

사용자에게 아래 항목을 보여주고 승인을 기다린다:

```
[dry-run]
제목: <title>
라벨: <labels>
설명 미리보기:
<renderLinearBacklogDescription 출력>

Linear에 등록할까요? (yes / 수정)
```

### Step 5 — 사용자 승인 후 실제 등록

사용자가 승인하면 `planCreateIssue` (또는 `scripts/internal/linear.ts` 진입점)를 호출해 Linear에 이슈를 생성한다.

**금지:** `curl api.linear.app` 직접 호출. 반드시 내부 함수 경유. (T3 hook이 런타임에도 차단함.)

### Step 6 — Decision Log 기록

등록이 완료되면 product 결정이 확정된 것으로 간주, `memory/decision-log.md` 및 `memory/decision-log.yaml`에 자동 append한다. 별도로 물어보지 않는다.

## 금지 사항

| 금지 | 이유 |
|---|---|
| `curl api.linear.app` 직접 호출 | T3 hook 우회 — 내부 함수만 사용 |
| LLM이 description 마크다운 직접 작성 | 4섹션 구조 일관성 깨짐 — renderLinearBacklogDescription 경유 필수 |
| 4섹션 누락 상태로 등록 진행 | 백로그 품질 기준 미달 — 누락 섹션 보충 후 재시도 |
| 사용자 승인 없이 apply* 호출 | External Write Rule 위반 |

## External Write Rule

dry-run plan을 먼저 제시한다. PO의 명시적 승인 전까지 `apply*` / `planCreateIssue` 를 호출하지 않는다.

## LLM-first Rule

사용자는 자연어로 말한다. LLM이 내용을 해석해 함수 호출로 변환한다. 스크립트를 직접 노출하지 않는다.
