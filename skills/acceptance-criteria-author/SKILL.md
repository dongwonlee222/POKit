---
name: acceptance-criteria-author
description: pokit:criteria 라벨 이슈의 acceptance criteria 초안을 artifacts/criteria/에 생성한다. "AC 작성해줘", "criteria 만들어줘" 요청 시 사용.
entry: pokit run
labels: [pokit:criteria]
trigger_phrases:
  - "AC 작성해줘"
  - "criteria 만들어줘"
  - "수락 기준 작성"
---

# acceptance-criteria-author

## Flow

1. plan-gate 호출 → 사용자 승인 받음 (task 분할·모델 매핑 표 출력 후 "승인하시면 즉시 N개 서브에이전트를 spawn합니다" 출력)
2. 승인 수신 후 AC 초안 생성 진행

## Trigger

Use for issues labeled `pokit:criteria`.

## Output

Create acceptance criteria draft at `artifacts/criteria/[issue-id].md` using `template.md`.

## Required Context

- Linear issue id and title
- Expected behavior
- Known edge cases, if any

If expected behavior is unclear, mark the issue `Needs Clarification` and ask concise questions in the Run Summary.
