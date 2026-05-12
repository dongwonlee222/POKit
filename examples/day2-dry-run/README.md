# Day 2 Dry-Run Simulation

This folder shows how the Day 2 walking skeleton should behave without calling Linear or GitHub.

## Fixture

`linear-cycle-fixture.yaml` contains three fake issues:

1. `POKIT-18` has `pokit:prd` and should route to `artifacts/prds/POKIT-18.md`.
2. `POKIT-22` has `pokit:criteria` and should route to `artifacts/criteria/POKIT-22.md`.
3. `POKIT-25` has no `pokit:*` label and must stay `Needs Label` until the PO approves the proposed label.

## Expected Behavior

- No external write is executed.
- Missing labels produce an approval item, not an artifact.
- Generated artifacts remain `status: draft`.
- Run Summary starts with "AI가 하지 않은 것".
- Any future Linear comment/status update is represented as a dry-run plan with an `idempotencyKey`.

## Related Outputs

- `artifacts/prds/POKIT-18.md`
- `artifacts/criteria/POKIT-22.md`
- `artifacts/sprints/2026-W20-dry-run-simulation.md`
