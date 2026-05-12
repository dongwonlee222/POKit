# sprint-runner

## Trigger

Use when the PO says "이번 cycle 실행", "이번 cycle 준비", or asks to process the current cycle.

## Flow

1. Read `memory/context-map.yaml`.
2. Run label preflight.
3. Route `pokit:prd` and `pokit:criteria` issues.
4. Mark missing labels as `Needs Label`.
5. Mark missing required context as `Needs Clarification`.
6. Write Run Summary with "AI가 하지 않은 것" first.

## Decision Log Rule

If the PO overrides priority, confirms scope, or makes a product policy decision during the run, ask whether to append it to `memory/decision-log.md`.
