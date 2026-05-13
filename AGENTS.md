# POKit Agent Instructions

Default language: ko-KR.

## Agent Compression Rules

- 필요한 문서만 읽고, 현재 작업에 직접 관련 없는 긴 원문은 건너뛴다.
- 철학 설명은 파일별 역할에 맞게 나눠 쓰고, 같은 문장을 반복하지 않는다.
- 사용자 승인과 기계적 실행은 한 흐름으로 묶되, 외부 write는 항상 별도 승인 경계를 지킨다.
- Linear backlog와 cycle을 기본 작업면으로 보고, 로컬 초안과 요약은 가볍게 유지한다.
- 바깥 시스템을 바꾸기 전에는 dry-run 계획이 먼저다.

When a POKit session starts:
1. Read `memory/context-map.yaml`.
2. Read only the memory/artifact files listed in `read_order`.
3. Show the compact POKit Brief dashboard.
4. Include current cycle counts, numbered next cycle candidates with issue IDs/titles, one recommended bundle, and the exact execution sentence.
5. Show at most one Action Nudge only when state changed.

When the user says "POKit 시작해줘", "현재 상태 브리핑해줘", or "다음에 뭐 하면 돼?", run or emulate:

```bash
node --experimental-strip-types scripts/session-brief.ts
```

For detail views, run or emulate:

```bash
node --experimental-strip-types scripts/session-brief.ts --detail cycle
node --experimental-strip-types scripts/session-brief.ts --detail backlog
node --experimental-strip-types scripts/session-brief.ts --detail approvals
node --experimental-strip-types scripts/session-brief.ts --candidate 1
```

If the user says "1번 자세히", "1, 2, 3번 돌려줘", or similar, map the numbers to the current brief candidates before creating or applying any plan.

For longer runs, use the goal loop in `docs/GOAL_LOOP.md`.

- In Claude Code, the user may set `/goal` with a verifiable completion condition.
- In Codex, emulate the same loop with POKit Brief, session task list, skills, scripts, tests, and Linear Done updates.
- Always create or confirm the Linear task list before implementation.
- Before durable implementation, run or emulate `node --experimental-strip-types scripts/cycle-guard.ts --issue EVM-123 --cycle-id <cycle-id>`.
- Backlog-only work may plan, inspect, and produce dry-run artifacts, but must not change durable project files.

When a POKit work item is finished, use the completion report format:

1. 완료한 것
2. 아직 안 한 것 / 승인 대기
3. 검증 결과
4. 다음에 사용자가 할 말 한 줄

Never write to Linear or GitHub without:
1. A dry-run plan.
2. User approval.
3. An idempotency key.

All artifacts are drafts. Do not overwrite an artifact when its content hash changed; mark it `Needs Approval`.
