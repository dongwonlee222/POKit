# Conversation Visualization Contract

Use visuals when structure, status, or trade-offs would otherwise require repeated explanation. Mermaid is for durable docs. ASCII is for live conversation and brief output.

Default patterns:

- Cycle Step Progress: show the current Cycle execution stage with `[████░░░░░░] 4/10`, `현재: 작업 Gate 확인`, and line-level status icons. Approval stages must show `▶ 승인 필요`. Release flows should use a release 전용 progress bar instead of the normal implementation flow.
- Brief Progress: show parent issues with child completion bars, such as `[██░░] 2/4`.
- Structure Map: show nested scopes with indentation before explaining a complex plan.
- Decision Flow: show the current decision point, recommended path, alternative path, and approval boundary.
- Before/After ASCII: in Cycle close drafts, show what changed in the workflow before adding narrative detail.
- Long Session Nudge: use the nudge emoji with an ASCII recommendation bar and current usage/status signals. This is a gentle continuity hint, not an error or approval gate.
- **Improvement / Friction Analysis (필수, 도구 무관)**: 사용자가 마찰·문제·개선점·회고·우선순위·Before/After를 물을 때(예: "뭐가 문제야?", "왜 오래 걸려?", "비효율", "개선안") 텍스트 단락 나열 금지. 항상 시각화 우선:
  - 흐름·단계 → ASCII sequence diagram (사용자/Claude/시스템 컬럼)
  - 분포·비율 → ASCII bar chart (Pareto 우선)
  - 원인-해결 매핑 → 3열 표 (마찰 / 원인 / 해결)
  - 본질 vs 우발 → ✅/⚠️/🔴 아이콘 + 카운트
  - Before/After → 같은 흐름도 2개 나란히, step 수 비교
  - 우선순위 → 효과×시급도 매트릭스 (1사분면 강조)

  각 시각화 뒤 **핵심 인사이트 1줄** ("핵심: 80%가 CLI 부재" 같은) 명시. 시각화는 데이터, 인사이트는 결론. 본 규칙은 Claude Code·Codex 등 진입 에이전트와 무관하게 동일 적용 (AGENTS.md → visualization.md 참조 경로로 양쪽 모두 로드).

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
