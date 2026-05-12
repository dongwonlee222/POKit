# backlog-router

## Trigger

Use when an issue needs to be routed to a POKit artifact skill.

## LLM-first Rule

The LLM should route issues after reading Linear labels and issue context. Users do not need to choose scripts manually; they approve or adjust the route in natural language.

## Routing

- `pokit:prd` -> `skills/prd-author/SKILL.md`
- `pokit:criteria` -> `skills/acceptance-criteria-author/SKILL.md`

## Missing Label Rule

If no `pokit:*` label exists, propose one artifact type from the issue title/description and mark the issue `Needs Label` until the PO approves.
