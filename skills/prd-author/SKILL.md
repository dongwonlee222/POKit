---
name: prd-author
description: pokit:prd 라벨 이슈의 PRD 초안을 artifacts/prds/에 생성한다. "PRD 작성해줘", "기획서 만들어줘" 요청 또는 pokit run 디스패치 시 사용.
entry: pokit run
labels: [pokit:prd]
trigger_phrases:
  - "PRD 작성해줘"
  - "기획서 만들어줘"
  - "prd 만들어줘"
---

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
