# POKit Scripts

Scripts are thin helpers for external systems. All external writes must be split into `plan` and `apply`.

Day 2 scripts may be dry-run first. Never call `apply*` without explicit user approval.

External write hooks must satisfy `before_external_write` in `workflows/hooks.yaml`.
