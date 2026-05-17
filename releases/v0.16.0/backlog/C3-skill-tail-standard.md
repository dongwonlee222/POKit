---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-c3-skill-tail-standard
dependencies:
  - C4
source: 워크플로우 갭 분석 G2 (단계 간 자동 이행 부재)
proposed_labels:
  - area:skills
  - area:workflow
  - type:standardization
  - release:v0.16.0
proposed_state: Backlog
id: C3
title: [v0.16.0] 스킬 끝맺음 표준 — 모든 스킬에 '다음 액션 안내' 추가
action: create (new issue)
proposedLabels:
  - area:skills
  - area:workflow
  - type:standardization
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-c3-skill-tail-standard
schema_version: 1
---

## 시각화

```
Before:                          After:

[backlog-memo 실행]              [backlog-memo 실행]
   │                                  │
   ▼                                  ▼
(끝)                             ✅ 메모 박제 완료
                                  다음: "Linear에 올려" 발화
사용자: "음... 다음 뭐?"
       추론·기억 의존             사용자: 안내 따라가면 됨

(전체 15+ 스킬 일괄 적용)
```

## AS-IS

POKit 스킬마다 끝맺음 형식이 제각각:
- `pokit-start` — verbatim brief 출력만, 다음 액션 안내는 brief 본문에만
- `backlog-memo` — "Linear에 올리려면 'Linear 백로그 등록' 발화" 안내 ✅ 있음
- `linear-issue-manager` — Step 6 decision-log append 후 종료 멘트 없음
- `sprint-runner` — 종료 멘트 없음
- `pokit-end` — verbatim 출력만
- `plan-gate` — 승인 후 다음 단계 안내 없음

결과: 사용자가 매번 "다음에 뭐 해야 하지?" 추론해야 함. 워크플로우 제품으로서 자동 이행 약함 (갭 분석 G2).

## TO-BE

모든 스킬 SKILL.md에 표준 종료 섹션 추가:

```markdown
## 종료 출력 표준 (v0.16.0)

스킬 실행 마지막에 다음 한 줄 출력 의무:

✅ <단계명> 완료. 다음: <발화 또는 명령 안내>

예시:
- backlog-memo: "✅ 메모 박제 완료. 다음: 'Linear에 올려' 발화 또는 추가 메모"
- linear-issue-manager: "✅ POKIT-N 등록 완료. 다음: 'cycle 실행' 발화"
- plan-gate: "✅ 플랜 승인. 다음: subagent 자동 spawn (대기)"
- sprint-runner: "✅ cycle 작업 완료. 다음: '사이클 마감해줘' 발화"
- cycle-close: "✅ cycle Completed. 다음: '릴리즈 하자' 또는 다음 cycle"
- release: "✅ v0.X.Y 배포 완료. 다음: '포킷 종료' 또는 새 cycle"
- pokit-end: "👋 세션 종료. 다음 세션: './bin/pokit start'"
```

표준 위반 검출:
- `tests/skill-tail-contract.test.mjs` 신설 — SKILL.md에 "종료 출력 표준" 섹션 강제

## 성공 검증

- [ ] 모든 SKILL.md (15+ 개) 에 종료 출력 표준 섹션 추가
- [ ] 각 스킬 실행 시 `✅` 또는 `👋` 마커 + "다음:" 안내 출력 확인
- [ ] contract test가 표준 위반 SKILL.md 차단
- [ ] sample 세션 end-to-end 흐름 — 사용자가 다음 발화 추론 없이 안내만 보고 진행 가능

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: builder (15+ SKILL.md 일괄 수정, C4 frontmatter 표준 적용 후)
- 검수: contract test 자동 + 1회 dogfood
