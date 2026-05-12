# backlog-router

## Trigger

Use when an issue needs to be routed to a POKit artifact skill.

## Routing

- `pokit:prd` -> `skills/prd-author/SKILL.md`
- `pokit:criteria` -> `skills/acceptance-criteria-author/SKILL.md`

## Missing Label Rule

If no `pokit:*` label exists, propose one artifact type from the issue title/description and mark the issue `Needs Label` until the PO approves.
