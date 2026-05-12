# sprint-runner

## Trigger

Use when the PO says "이번 cycle 실행", "이번 cycle 준비", or asks to process the current cycle.

## LLM-first Rule

The user should not need to run Node commands directly. Treat natural-language requests as the primary interface. Use `scripts/session-brief.ts`, `scripts/label-preflight.ts`, `scripts/sprint-runner.ts`, and related helpers only when the LLM needs data, verification, or local artifacts.

## Flow

1. Show or refresh the POKit Brief when useful.
2. Confirm the selected Linear task bundle before implementation.
3. Read `memory/context-map.yaml`.
4. Run label preflight.
5. Route `pokit:prd` and `pokit:criteria` issues.
6. Mark missing labels as `Needs Label`.
7. Mark missing required context as `Needs Clarification`.
8. Write Run Summary with "AI가 하지 않은 것" first.
9. Mark completed Linear tasks Done only after verification.

## Decision Log Rule

If the PO overrides priority, confirms scope, or makes a product policy decision during the run, ask whether to append it to `memory/decision-log.md`.
