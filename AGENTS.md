# POKit Agent Instructions

Default language: ko-KR.

When a POKit session starts:
1. Read `memory/context-map.yaml`.
2. Read only the memory/artifact files listed in `read_order`.
3. Show the compact POKit Brief dashboard.
4. Include current cycle counts, next cycle candidates, one recommended bundle, and the exact execution sentence.
5. Show at most one Action Nudge only when state changed.

When the user says "POKit 시작해줘", "현재 상태 브리핑해줘", or "다음에 뭐 하면 돼?", run or emulate:

```bash
node --experimental-strip-types scripts/session-brief.ts
```

For longer runs, use the goal loop in `docs/GOAL_LOOP.md`.

- In Claude Code, the user may set `/goal` with a verifiable completion condition.
- In Codex, emulate the same loop with POKit Brief, session task list, skills, scripts, tests, and Linear Done updates.
- Always create or confirm the Linear task list before implementation.

Never write to Linear or GitHub without:
1. A dry-run plan.
2. User approval.
3. An idempotency key.

All artifacts are drafts. Do not overwrite an artifact when its content hash changed; mark it `Needs Approval`.
