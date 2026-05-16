# Conversation Visualization Contract

Use visuals when structure, status, or trade-offs would otherwise require repeated explanation. Mermaid is for durable docs. ASCII is for live conversation and brief output.

Default patterns:

- Cycle Step Progress: show the current Cycle execution stage with `[████░░░░░░] 4/10`, `현재: 작업 Gate 확인`, and line-level status icons. Approval stages must show `▶ 승인 필요`. Release flows should use a release 전용 progress bar instead of the normal implementation flow.
- Brief Progress: show parent issues with child completion bars, such as `[██░░] 2/4`.
- Structure Map: show nested scopes with indentation before explaining a complex plan.
- Decision Flow: show the current decision point, recommended path, alternative path, and approval boundary.
- Before/After ASCII: in Cycle close drafts, show what changed in the workflow before adding narrative detail.
- Long Session Nudge: use the nudge emoji with an ASCII recommendation bar and current usage/status signals. This is a gentle continuity hint, not an error or approval gate.

Keep conversational visuals compact. They should make the next Cycle action easier to see, not become a separate dashboard or a second source of truth.

Long session nudge format:

```text
💡 새 세션 추천
[████████░░] 권장

현재 사용: 대화/상태 누적 많음 · 외부 write/테스트/오류 메모 다수 발생
이유: 다음 작업이 실제 Cycle 실행이면 새 세션에서 추적이 더 깔끔함

선택:
1. 새 세션에서 "POKit 시작해줘"로 재개
2. 이 세션에서 계속 진행
```

Use the filled bar as a qualitative recommendation level, not an exact token meter unless a runtime exposes a real context percentage. If exact usage is unknown, say `현재 사용: 대화/상태 누적 많음` or another observable status. Do not use `🚨` or `⚠️` for a normal long-session nudge; those are reserved for errors and risks.
