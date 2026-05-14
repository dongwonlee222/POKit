# PO Signal Watch Source Registry

PO Signal Watch is a lightweight source list for product judgment. It is not a news archive. A source stays here only when it can produce signals that may change product prioritization, backlog shape, or stakeholder communication.

## Source Types

| Type | Watch for | Keep when |
|---|---|---|
| competitor changelogs | workflow changes, pricing shifts, AI/productivity features | the change affects POKit positioning or backlog quality |
| user communities | repeated pain, workaround patterns, vocabulary users naturally use | at least one product decision could change |
| internal Linear/GitHub activity | recurring labels, blocked work, repeated review comments | it reveals friction in the backlog -> cycle -> execution flow |
| standards or platform docs | policy changes, API changes, ecosystem constraints | the change can block or simplify a POKit workflow |

## Entry Format

```yaml
source:
  name: "<source name>"
  type: "competitor changelog | user community | internal Linear/GitHub activity | platform doc"
  url_or_location: "<link or local path>"
  cadence: "weekly | cycle-start | release-watch | ad hoc"
  watch_keywords:
    - "<keyword>"
  keep_if: "<product decision that this source can influence>"
```

## Guardrails

- Do not store private customer data or credentials in the registry.
- Do not collect signals just because they are interesting.
- Prefer one useful signal over many stale links.
- External writes created from signals must stop at Backlog Candidate dry-run until the user approves.
