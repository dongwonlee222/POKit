# Conversation Standards

이 문서는 POKit이 사용자에게 말하는 주요 상황별 문구를 표준화한다. 목표는 사용자가 지금 상태를 직관적으로 알아보고, context 희석 후에도 같은 상황에서 같은 톤과 구조가 나오게 하는 것이다.

## Principle

```text
LLM = 지금 어떤 상황인지 판단
Message catalog = 반복 라벨, 이모지, 짧은 고정 문구
Renderer = 진행바, 선택지, 상태 블록의 실제 출력
Tests = 문구와 ASCII가 흔들리지 않게 고정
```

반복되는 문구는 `workflows/messages.yaml`에 둔다. 진행바, A/B 선택지, preflight status block은 `scripts/render/ascii.ts`에서 렌더링한다. LLM은 상황 판단과 요약만 맡고, 표준 문구를 새로 꾸며 쓰지 않는다.

## Situation Map

| Situation | When It Appears | User Should Notice | Standard Signal | Owner |
|---|---|---|---|---|
| `session_start` | `POKit 시작해줘`, 현재 상태 확인 | 현재 작업면과 다음 행동 | `📌 현재`, `🧺 다음 후보`, `💬 추천 다음 행동` | `scripts/session-start.ts`, `scripts/session-brief.ts` |
| `resume_compaction` | resume, context compaction, handoff 이후 | 오케스트레이터 기준이 다시 로드됨 | `🧭 세션 복구 확인`, `✅ 오케스트레이터 기준을 다시 불러왔습니다` | `scripts/session-start.ts` |
| `stage_progress` | 단계가 있는 작업 진행 중 | 현재 몇 단계인지 | `📍 POKit 진행도`, `▶ 현재 단계` | `scripts/cycle-progress.ts`, `scripts/render/ascii.ts` |
| `backlog_intake` | 아이디어를 Linear Backlog 후보로 만들 때 | 아직 외부 write 전임 | `🧺 Backlog 등록 사전 확인`, `⏳ 실제 Linear write는 승인 대기` | `scripts/linear-create-preflight.ts` |
| `definition_gate` | 요구사항, 기준, 범위가 부족할 때 | 지금 멈춘 이유 | `❓ 정의 확인 필요`, `⚠️ 진행하려면 추가 기준이 필요합니다` | main agent, definition pipeline |
| `local_work_done` | 로컬 파일 수정/초안/검증 전 완료 | 외부 상태는 아직 바뀌지 않음 | `✅ 로컬 작업 완료`, `🧪 이제 검증 결과를 확인합니다` | main agent, scripts |
| `verification` | 테스트, guard, dry-run 검증 후 | 통과/실패 여부 | `🧪 검증 결과`, `✅ 검증 통과`, `🚨 검증 실패` | tests, guard scripts |
| `external_write_preflight` | Linear/GitHub write 직전 | 승인 전 사전 확인 | `🔐 외부 write 사전 확인`, status block, idempotency key | external write guard |
| `decision_choice` | 실제 결정이 필요할 때 | A/B 중 무엇을 고를지 | `🤔 선택이 필요한 이유`, `✅ 추천안 A`, `↩️ 대안 B` | `renderDecisionChoiceBlock` |
| `error_incident` | 에러, 장애, 실패, 잘못된 동작 확인 | 문제와 다음 조치 | `🚨 문제 / 에러 검토`, `➡️ 다음 조치` | `scripts/problem-error-review.ts`, hooks |

## Standard Examples

### Session Start

```text
# POKit Brief

📅 2026. 05. 16. 토요일 · Team Backlog
Profile: pokit · Team Key: POKIT

POKit 진행도
[█░░░░░░░░░] 1/10 · 현재: 시작 브리프

📌 현재: Todo 20 · 진행 0 · 완료 0

🧺 다음 후보
1. POKIT-92 ...

💬 추천 다음 행동: Team Backlog 남은 Todo 전체 진행

pokit:boot ok cycle=Team Backlog hooks=loaded orchestrator=loaded read_order=6
```

### Backlog Intake / Linear Create Preflight

```text
Linear Backlog 등록 사전 확인
[████████░░] 80%

✅ 로컬 후보/증거 분류 완료
✅ Linear issue 생성 payload 준비 완료
✅ idempotency key 확인 완료
⏳ 실제 Linear write는 승인 대기
```

사용자가 봐야 하는 의미:

- 초록 체크는 POKit 내부 준비가 끝났다는 뜻이다.
- 모래시계는 아직 외부 시스템이 바뀌지 않았다는 뜻이다.
- idempotency key가 보이면 중복 write 방지 준비가 끝난 것이다.

### Decision Choice

```text
사용자 확인

🤔 선택이 필요한 이유: Linear 외부 write 승인 경계

✅ 추천안 A: 준비한 Backlog issue를 생성
이유: dry-run payload와 idempotency key가 확인됨

↩️ 대안 B: 생성하지 않고 로컬 메모만 유지
차이: Linear 추적은 남지 않음

A/B로 선택해 주세요.
```

A/B는 실제 결정이 필요할 때만 나온다. 로컬 파일 수정, 테스트 실행, 초안 생성처럼 이미 승인된 작업 흐름 안의 기계적 단계에는 쓰지 않는다.

### Verification

```text
🧪 검증 결과

✅ 검증 통과
- node --test tests/ascii-renderer.test.mjs
- node --test tests/message-catalog.test.mjs
```

실패하면 성공 요약으로 덮지 않고 `🚨 검증 실패`를 먼저 보여준다.

### Error / Incident

```text
# 🚨 Problem / Error Review: [짧은 제목]

진행 상황
[███░░] 3/5

## 1️⃣ 무엇이 문제인가?
## 2️⃣ 언제 / 누구로 인하여 / 왜 발생했나?
## 3️⃣ 근본 해결 방법 제안
## 다음 조치
```

## Phrase Rules

- 사용자가 지금 해야 할 일이 있으면 `사용자 확인` 또는 `정의 확인 필요`로 분명히 말한다.
- 사용자가 기다리기만 하면 되는 기계적 단계는 A/B로 만들지 않는다.
- 정상 진행에는 `🚨`를 쓰지 않는다. `🚨`는 실패, 장애, blocker 전용이다.
- `✅`는 실제로 완료된 내부 준비나 검증에만 쓴다.
- `⏳`는 POKit이 멈춘 게 아니라 승인 또는 외부 write 경계에서 대기 중임을 뜻한다.
- `💬 추천 다음 행동`은 한 개만 보여준다.

## Context Dilution Guard

Context 희석에 민감한 판단:

- 지금 상황이 `definition_gate`인지 `external_write_preflight`인지 구분
- A/B 선택지가 필요한 실제 결정인지 판단
- 실패를 Problem/Error Review로 승격할지 판단

Context 희석에 흔들리면 안 되는 형식:

- section label
- emoji
- 진행바 폭
- A/B 마지막 안내문
- external write 전 idempotency key 표시

따라서 반복 문구는 `workflows/messages.yaml`, 출력 구조는 `scripts/render/ascii.ts`, 회귀 방지는 `tests/message-catalog.test.mjs`와 `tests/ascii-renderer.test.mjs`에 둔다.
