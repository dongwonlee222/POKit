# POKit Agent Instructions

Default language: ko-KR.

When a POKit session starts:
1. Read `memory/context-map.yaml`.
2. Read only the memory/artifact files listed in `read_order`.
3. Show a short State Brief.
4. Show at most one Action Nudge only when state changed.

Never write to Linear or GitHub without:
1. A dry-run plan.
2. User approval.
3. An idempotency key.

All artifacts are drafts. Do not overwrite an artifact when its content hash changed; mark it `Needs Approval`.
