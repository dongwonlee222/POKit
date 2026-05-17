---
kind: memo
workflow_action: update
idempotency_key: memo-20260517-a1-pokit-159-retrieval
dependencies: []
source: v0.15.3 unresolved carry-forward (5건 중 1건)
proposed_labels:
  - area:memory
  - area:retrieval
  - release:v0.16.0
proposed_state: Backlog
linked_issues:
  - POKIT-159
id: A1
title: [v0.16.0] POKIT-159 보강 — v0.15.3 후속 retrieval 메모
linkedIssue: POKIT-159
action: update (description append)
proposedLabels:
  - area:memory
  - area:retrieval
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-a1-pokit-159-retrieval
schema_version: 1
---

## 시각화

```
v0.15.3 unresolved (5건 중 1건)
       │
       ▼
POKIT-159 description에 메모 한 줄 추가
"v0.15.3 후속 — M9 참조, 별도 cycle 진입 시 retrieval 구현"
       │
       ▼
다음 cycle 시작 시 잊어버리지 않음
  ※ 본 작업(retrieval 설계)은 후속 cycle
```

## AS-IS

POKIT-159 ("장기기억 retrieval 메커니즘 설계")는 Backlog 상태. 본 작업은 위치기억 retrieval의 **설계**가 범위.

v0.15.3 release manifest unresolved에 다음 항목 박제됨:
- `pokit-159-retrieval-impl` — "POKIT-159 위치기억 retrieval 구현 (M9 메모 참조, 별도 cycle 진입 시)" (owner: POKIT-159)

→ 별도 신규 이슈로 만들지 말고 POKIT-159 본체에 메모 인계.

description append 전 **중복 체크 필요**: 기존 description 끝부분에 이미 "v0.15.3 후속" 또는 "M9" 섹션이 있으면 append 스킵.

## TO-BE

POKIT-159 description 현재 상태 확인 후, 다음 섹션이 없으면 append:

```
## v0.15.3 후속 메모 (2026-05-17)

- M9 메모 참조 (artifacts/backlog/v0.15.2/M9-location-memory-retrieval-wiring.md)
- 위치기억 retrieval 구현은 별도 cycle 진입 시 착수
- 본 이슈는 설계 범위, 구현은 후속 cycle 또는 sub-issue로 분리
- 인계 채널: v0.15.3 manifest unresolved + 본 메모 + decision-log
```

## 성공 검증

- [ ] POKIT-159 description 끝부분 확인 후 중복 없을 때만 append
- [ ] append 후 v0.15.3 unresolved의 `pokit-159-retrieval-impl` 항목 해소 표시 가능
- [ ] M9 메모 경로가 description에 명시되어 cold start 세션이 찾을 수 있음

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: linear-issue-manager (Update 분기, append만)
- 검수: 본 세션에서 description 끝부분 read 후 진행
