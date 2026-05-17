---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-c5-workflow-state-machine
dependencies:
  - C4
source: 워크플로우 갭 분석 G3 (현재 단계 표시 없음)
proposed_labels:
  - area:workflow
  - area:state-machine
  - type:foundation
  - release:v0.16.0
proposed_state: Backlog
id: C5
title: [v0.16.0] workflow-state.yaml 상태 머신 + 자동 갱신 hook
action: create (new issue)
proposedLabels:
  - area:workflow
  - area:state-machine
  - type:foundation
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-c5-workflow-state-machine
schema_version: 1
---

## 시각화

```
Before:                          After:

[세션 1 종료]                    [세션 1 종료] → workflow-state.yaml 박제
                                                          │
새 세션 시작                                              ▼
"어디까지 했지?"                                   memory/workflow-state.yaml
"cycle 5인가?"                                     current_step: 5
"플랜 게이트 했나?"                                next_action: cycle-close
   ↓                                                      │
사용자가 매번 추론                                        ▼
                                                  [새 세션] pokit start
                                                  → "현재 [5] 병렬 실행
                                                     다음 [6] cycle-close
                                                     발화: '사이클 마감해줘'"
```

## AS-IS

POKit 워크플로우 단계 ([1] backlog-memo → [10] pokit-end) 진행 중 현재 위치 추적 불가:
- `memory/brief` 에 "어디서 멈췄나" 텍스트만, 워크플로우 단계 인덱스 없음
- 세션 재진입 시 "지금 [3]인지 [5]인지" 매번 사용자가 추론
- subagent spawn 시 어느 단계의 작업인지 컨텍스트 부재

메인 에이전트가 "context owner" 역할을 해야 하는데, 상태 머신이 없으니 매번 사용자 발화로부터 단계 재구성.

## TO-BE

`memory/workflow-state.yaml` 신설 — 메인 에이전트가 매 스킬 종료 시 갱신:

```yaml
---
kind: workflow-state
version: 1.0
created: 2026-05-17T15:00:00Z
updated: 2026-05-17T15:30:00Z
---

current_step:
  index: 5
  name: "병렬 실행"
  entered_at: 2026-05-17T15:25:00Z

current_cycle:
  id: cycle-5
  target_version: v0.16.0
  progress:
    total: 12
    done: 3
    in_progress: 4
    pending: 5

next_action:
  trigger: "사이클 마감해줘"
  skill: cycle-close

active_subagents:
  - id: builder-POKIT-50
    started_at: 2026-05-17T15:26:00Z
  - id: tdd-writer-POKIT-51
    started_at: 2026-05-17T15:27:00Z

blockers: []

history:
  - step: 4
    name: plan-gate
    completed_at: 2026-05-17T15:24:00Z
    approved_by: human
```

### 자동 갱신 메커니즘

- PostToolUse hook: 스킬 종료 시 workflow-state.yaml 자동 update
- 메인 에이전트가 매 응답 시작 시 state 읽어 컨텍스트 로드
- pokit-end 시 마지막 state snapshot이 resume-brief에 포함

### 자동 갱신 vs 수동 호출 모드

- 워크플로우 모드: 자동 갱신, 다음 단계 자동 안내
- 자유 모드: 스킬 단독 호출 가능, state 갱신 안 함
- 모드 전환: `pokit start` = 워크플로우 모드 진입, `pokit end` = 종료

## 성공 검증

- [ ] workflow-state.yaml schema 정의 (C4 frontmatter 표준 준수)
- [ ] PostToolUse hook 작성 — 스킬 종료 감지 시 갱신
- [ ] 모든 워크플로우 스킬 (15+ 개) 에서 state 갱신 동작 확인
- [ ] 세션 재진입 시 pokit start 가 state 읽어 정확한 단계 안내
- [ ] 자유 모드에서 스킬 단독 호출 시 state 갱신 안 됨 (오염 방지)
- [ ] resume-brief 에 마지막 state snapshot 포함

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, 상태 머신 설계)
- 구현: architect + builder (schema + hook)
- 검수: tdd-writer (state transition 회귀 테스트)
