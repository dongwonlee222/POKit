---
name: sprint-runner
description: 현재 Cycle 이슈를 처리하고 run summary를 생성한다. "이번 cycle 실행", "이번 cycle 준비" 요청 시 사용.
entry: pokit run
labels: []
trigger_phrases:
  - "이번 cycle 실행"
  - "이번 cycle 준비"
  - "스프린트 실행해줘"
  - "cycle 처리해줘"
---

# sprint-runner

## Trigger

Use when the PO says "이번 cycle 실행", "이번 cycle 준비", or asks to process the current cycle.

## LLM-first Rule

The user should not need to run Node commands directly. Treat natural-language requests as the primary interface. Use `scripts/session-brief.ts`, `scripts/label-preflight.ts`, `scripts/sprint-runner.ts`, and related helpers only when the LLM needs data, verification, or local artifacts.

## Flow

1. plan-gate 호출 → 사용자 승인 받음 (task 분할·모델 매핑 표 출력 후 "승인하시면 즉시 N개 서브에이전트를 spawn합니다" 출력)
2. Show or refresh the POKit Brief when useful.
3. Confirm the selected Linear task bundle before implementation.
4. Read `memory/context-map.yaml`.
5. Run label preflight.
6. Route `pokit:prd` and `pokit:criteria` issues.
7. Mark missing labels as `Needs Label`.
8. Mark missing required context as `Needs Clarification`.
9. Write Run Summary with "AI가 하지 않은 것" first.
10. Mark completed Linear tasks Done only after verification.

## Decision Log Rule

If the PO overrides priority, confirms scope, or makes a product policy decision during the run, ask whether to append it to `memory/decision-log.md`.
