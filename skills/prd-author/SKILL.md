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

## Flow

1. plan-gate 호출 → 사용자 승인 받음 (task 분할·모델 매핑 표 출력 후 "승인하시면 즉시 N개 서브에이전트를 spawn합니다" 출력)
2. 승인 수신 후 PRD 초안 생성 진행

## Trigger

Use for issues labeled `pokit:prd`.

## Output

Create a PRD draft at `artifacts/prds/[issue-id].md` using `template.md`.

## Required Context

- Linear issue id and title
- Problem or user need
- Cycle id

If required context is missing, do not generate a draft. Mark the issue `Needs Clarification` and add questions to the Run Summary.
