# Backlog Candidate dry-run

이 문서는 Signal Watch Discovery Brief 샘플에서 만든 dry-run이다. 사용자 승인 전에는 Linear issue를 만들지 않는다.

## 후보

- Parent title: Cycle 변화 가시성
- 추천 labels: `pokit:prd`
- 추천 cycle: 다음 open Cycle
- Discovery 깊이: Light Discovery

## 증거

- 신호 출처: 경쟁 제품 변경 기록
- Signal Summary: project owner는 주간 변경 digest에서 도움을 받는다.
- POKit 적합성: cycle handoff와 session brief가 이미 이 맥락을 담는 위치다.

## 제안 Linear 형태

```text
Parent: Cycle 변화 가시성
  - Brief progress snapshot
  - Cycle close Before/After summary
```

## 바꾸지 않을 것

- 별도 dashboard를 만들지 않는다.
- Slack 메시지를 보내지 않는다.
- 이 dry-run 중에는 Linear issue를 만들지 않는다.

## Idempotency

```yaml
idempotencyKey: signal-watch:2026-05-14:cycle-change-visibility
```

## 사용자 확인

🤔 선택이 필요한 이유: Linear issue creation은 외부 write다.

✅ 추천안 A: 제안한 Backlog Candidate를 Linear에 만든다.
이유: 신호의 POKit 적합성이 분명하고, 영향 범위가 가볍게 닫힌다.

↩️ 대안 B: 로컬 예시로만 유지한다.
차이: 외부 planning 상태는 바뀌지 않지만, Linear backlog에는 후보가 보이지 않는다.

A/B로 선택해 주세요.
