# prd-author

## Trigger

Use for issues labeled `pokit:prd`.

## Output

Create a PRD draft at `artifacts/prds/[issue-id].md` using `template.md`.

## Required Context

- Linear issue id and title
- Problem or user need
- Cycle id

If required context is missing, do not generate a draft. Mark the issue `Needs Clarification` and add questions to the Run Summary.
