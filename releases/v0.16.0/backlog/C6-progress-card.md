---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-c6-progress-card
dependencies:
  - C5
source: 워크플로우 갭 분석 G6 (진행률 가시성 없음)
proposed_labels:
  - area:session-brief
  - area:visualization
  - type:ux
  - release:v0.16.0
proposed_state: Backlog
id: C6
title: [v0.16.0] 진행률 카드 — session-brief에 cycle 진행 상태 통합
action: create (new issue)
proposedLabels:
  - area:session-brief
  - area:visualization
  - type:ux
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-c6-progress-card
schema_version: 1
---

## 시각화

```
Before (pokit start):            After (pokit start):

🪧 POKit 시작 Brief              🪧 POKit 시작 Brief
- 마지막 배포: v0.15.3           - 마지막 배포: v0.15.3
- 다음 target: (미정)

사용자: "얼마나 남았지?"         [현재 cycle] cycle-5 — 진행 70%
  ↓                               ┌──────────────────────┐
별도 명령으로 확인                │ ████████████░░  70%   │
                                  └──────────────────────┘
                                  ✅ Done   8/12
                                  🔄 진행중 2/12  POKIT-52
                                  ⏸  대기  2/12

                                  다음 발화: "사이클 마감해줘"
```

## AS-IS

`pokit start` brief 출력에 진행률 표시 없음:
- "마지막 스프린트 배포 버전: v0.15.3"
- "다음 스프린트 target version: (미정)"
- "💬 추천 다음 행동: ..."

→ 현재 cycle 작업 중이라도 brief에는 "이번 cycle 30% 진행" 같은 가시화 없음.
→ "얼마나 남았지?" 매번 사용자가 물어봐야 함.
→ verb `progress` 가 있긴 하나 별도 실행 필요.

## TO-BE

`session-brief.ts` 의 `buildSessionBrief("start")` 출력에 진행률 카드 추가:

```
🪧 POKit 시작 Brief
📅 2026-05-17 ...

[현재 cycle] cycle-5 (v0.16.0 target) — 진행 70%
  ┌────────────────────────────────────────────────┐
  │ ████████████████████████████░░░░░░░░░░░░  70%   │
  └────────────────────────────────────────────────┘

  ✅ Done    (8 / 12)  POKIT-50, POKIT-51, ...
  🔄 진행중  (2 / 12)  POKIT-52 (builder), POKIT-53 (tdd)
  ⏸  대기   (2 / 12)  POKIT-54, POKIT-55

[현재 단계] [5] 병렬 실행 (workflow-state.yaml 참조)
[다음 단계] [6] cycle-close
[다음 발화] "사이클 마감해줘"

[블로커] 없음
```

### 데이터 소스

- C5의 `memory/workflow-state.yaml` (current_step, current_cycle.progress)
- Linear API (이슈별 state 실시간)
- session-brief 가 두 소스 머지해서 카드 렌더링

### 카드 표출 조건

- 현재 cycle 진행 중일 때만 (Team Backlog 상태에선 표시 안 함)
- workflow-state.yaml 부재 시 fallback: Linear cycle 진행률만 표시

## 성공 검증

- [ ] session-brief 가 workflow-state.yaml 읽어 진행률 카드 렌더링
- [ ] ASCII 진행률 바 정확도 (8/12 → 67% 표시)
- [ ] 현재 단계 + 다음 단계 + 다음 발화 일관 표출
- [ ] workflow-state 없는 환경 (자유 모드) fallback 동작
- [ ] pokit:boot ok 헤더 라인 위치 보존 (sentinel 검증 통과)
- [ ] 회귀 테스트 — 기존 brief 출력 형식 보존 (start variant 외)

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: builder + tdd-writer
- 검수: 1회 dogfood (실제 cycle 진행 중에 brief 확인)
