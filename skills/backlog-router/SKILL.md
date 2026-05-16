---
name: backlog-router
description: pokit:prd 또는 pokit:criteria 라벨을 읽어 적절한 artifact 스킬로 이슈를 라우팅한다. 내부 dispatcher가 자동 호출.
entry: internal:dispatcher
labels: [pokit:prd, pokit:criteria]
trigger_phrases:
  - "이슈 라우팅해줘"
  - "라벨 보고 스킬 골라줘"
---

# backlog-router

## Trigger

Use when an issue needs to be routed to a POKit artifact skill.

## LLM-first Rule

The LLM should route issues after reading Linear labels and issue context. Users do not need to choose scripts manually; they approve or adjust the route in natural language.

## Routing

- `pokit:prd` -> `skills/prd-author/SKILL.md`
- `pokit:criteria` -> `skills/acceptance-criteria-author/SKILL.md`
- 백로그 등록 요청 (모호) -> `skills/backlog-memo/SKILL.md` (dry-run 구조 먼저)
- 백로그 등록 요청 (Linear write 확정) -> `skills/linear-backlog-manager/SKILL.md`

## Missing Label Rule

If no `pokit:*` label exists, propose one artifact type from the issue title/description and mark the issue `Needs Label` until the PO approves.
