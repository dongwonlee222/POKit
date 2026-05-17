---
name: backlog-promote
description: memory/backlog-raw/*.md raw 메모를 Linear에 배치 승격하는 스킬. 단건 처리는 linear-issue-manager 사용. raw 메모 없는 모호 발화는 backlog-memo.
entry: conversational
labels: []
trigger_phrases:
  - "리니어 대량 등록"
  - "리니어 일괄 등록"
  - "백로그 일괄 승격"
  - "Linear에 여러 개 등록"
  - "Linear batch register"
  - "promote multiple memos"
  - "Linear에 다 등록"
  - "Linear에 refined 다 등록"
  - "backlog-promote"
  - "/backlog-promote"
---

# backlog-promote

## Trigger Guard

사용자 발화에 `Linear` 또는 `linear` 단어가 없으면 즉시 거부:

> "백로그 배치 승격은 'Linear에 등록' 발화가 필요합니다. raw 메모만 추가하려면 backlog-memo를 사용하세요."

봇 채널·자동 실행 환경에서 의도하지 않은 Linear write 차단.

## 적용 대상

- **이 스킬**: memory/backlog-raw/ 다건 배치 (필터: target_version / status / id)
- **linear-issue-manager**: 단건 create/update
- **backlog-memo**: 로컬 raw 메모만 (외부 write 0)

## 절차

### Step 1 — 발화에서 파라미터 추출

사용자 자연어 → CLI 옵션 매핑:

| 발화 패턴 | CLI 옵션 |
|---|---|
| "Linear에 v0.17.1 등록" | `--target v0.17.1` |
| "Linear에 refined 다 등록" | `--status refined` |
| "Linear에 bl-005, 006 등록" | `--id bl-2026-XX-XX-005,bl-2026-XX-XX-006` |
| "Linear에 다 등록" | (필터 없음, 모든 refined) |

기본값:
- `--label pokit:criteria`
- 미지정 시 `--status refined`로 한정 권장 (raw 메모 실수 등록 방지)

### Step 2 — dry-run 호출

```
./bin/pokit backlog-promote --target <ver> --status <st> --id <ids>
```

dry-run 결과를 사용자에게 출력. 항목별로 표시:
- 제목 (target_version 접두사 포함)
- 라벨 · size · status
- create vs update 모드 표시

### Step 3 — 사용자 승인 대기

dry-run 결과 + "Linear에 N건 등록할까요?" 메시지 후 사용자 발화 대기.

승인 발화 (= 즉시 진행):
- "apply", "진행", "ㄱㄱ", "OK", "그렇게 하자", "네"

거부 발화 (= 보류):
- "잠깐", "멈춰", "수정", "잠시만"

### Step 4 — apply 호출

```
./bin/pokit backlog-promote <same filters> --apply --actor main_agent
```

CLI가 자동 처리:
- `planCreateIssue` / `planUpdateIssue` 경유 (renderLinearBacklogDescription 또는 rawDescription)
- `applyCreateIssue` / `applyUpdateIssue` 호출
- memo frontmatter 자동 갱신 (`status: promoted`, `promoted_to: POKIT-XXX`)
- decision-log append (linear-issue-manager 규약)

### Step 5 — 결과 보고

발급 POKIT-XXX 목록 + 갱신된 memo 파일 명시.

## 호출 주체별 진입

| 주체 | 진입 |
|---|---|
| 👤 사용자 (자연어) | 본 스킬 |
| 🤖 메인 LLM | 본 스킬 (사용자 발화 받아) |
| 🤖 sub-agent (work-agents) | CLI 직접 (`pokit backlog-promote ...`) |
| ⚙️ 자동화 hook | CLI (사전 위임 범위 내, dry-run까지) |

스킬 우회 OK — Trigger Guard는 자연어 진입용. 프로그램 호출은 책임자 사용자.

## 금지

| 금지 | 이유 |
|---|---|
| `curl api.linear.app` 직접 호출 | T3 hook 우회 — 내부 함수 경유 |
| Trigger Guard 없이 진입 | 의도하지 않은 외부 write |
| 사용자 승인 없이 --apply 직행 | External Write Rule |
| 자동 cron으로 --apply | 사전 위임 외 자동 write 금지 |
| memo frontmatter 수동 갱신 후 등록 | promoted_to 충돌 — CLI가 자동 처리 |

## External Write Rule

dry-run plan 먼저 제시. 사용자 명시 승인 전까지 `--apply` 호출 금지.

## LLM-first Rule

사용자는 자연어로 말한다. LLM이 발화를 분석해 CLI 옵션으로 변환한다.
CLI 명령 자체를 사용자에게 노출하지 않는다 (디버깅 외).

## 관련 문서

- `memory/backlog-raw/README.md` — 메모 양식
- `scripts/cli/backlog-promote.ts` — CLI 구현
- `skills/linear-issue-manager/SKILL.md` — 단건 처리 자매 스킬
