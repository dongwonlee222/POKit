---
name: plan-gate
version: v1.0
description: 개발 요청 진입 전 task 분할·모델 매핑·병렬 그룹을 표로 출력하고 사용자 승인을 받는다. "개발 계획", "/plan-gate", "plan-gate" 요청 시 사용.
entry: pokit run
labels: []
trigger_phrases:
  - "/plan-gate"
  - "개발 계획"
  - "plan-gate"
---

# plan-gate

## Purpose

개발 착수 전 작업 분할과 모델 배정을 가시화하여 PO의 승인을 받는다.
`prd-author`, `acceptance-criteria-author`, `sprint-runner` 진입 시 자동으로 호출된다.

## Output Standard

아래 마크다운 표를 출력한다.

| Task | 모델 | 이유 | Worktree | 병렬 그룹 |
|------|------|------|----------|-----------|
| A    | Sonnet 4.6 | 코드 구현 | `worktrees/agent-xxx` | G1 |
| B    | Opus 4.7   | 설계 검토 | `worktrees/agent-yyy` | G2 |

표 출력 후 승인 게이트 1줄을 반드시 추가한다:

> 승인하시면 즉시 N개 서브에이전트를 spawn합니다.

## Approval Gate

- 승인 전까지 실행·파일 생성·Linear 상태 변경을 하지 않는다.
- PO가 "진행", "OK", "승인" 등으로 응답하면 즉시 spawn한다.
- PO가 수정 요청 시 표를 재출력하고 다시 승인을 기다린다.

## Model Selection Guide

| 모델 | 적합 작업 |
|------|-----------|
| **Opus 4.7** | 설계·논쟁·시각화·아키텍처 리뷰 |
| **Sonnet 4.6** | 코드 구현·TDD·hook 작성·리팩터링 |
| **Haiku 4.5** | 단순 검증·정형 출력·포맷 변환 |

## Modes

`--mode` 옵션으로 동작을 제어한다.

### --mode research (읽기 전용 탐색)

- 승인 게이트 생략. 사용자 확인 없이 즉시 실행한다.
- 읽기 전용 서브에이전트(Haiku / Explore)만 사용한다.
- 외부 write 0건, 파일 변경 0건이 보장되어야 한다.
- 메인은 schema-only 응답만 컨텍스트에 적재한다.
- 탐색 결과는 `{ role, summary_ko, artifact_links, decisions_needed }` schema로만 반환한다.
- 적합 요청: "어디에 있어?", "폴더 역할 뭐야?", "정책 찾아줘", "이슈 메타 보여줘"

### --mode build (기본값, 현재 동작)

- 승인 게이트 필수. 표 출력 후 PO 승인 대기.
- 외부 write 또는 파일 변경이 있으면 반드시 이 모드를 사용한다.
- 적합 요청: "만들어줘", "구현해줘", "수정해줘", "추가해줘", "배포해줘"

모드가 명시되지 않으면 기본값은 `--mode build`다.

## Flow

1. 요청 분석 — 필요한 task 목록과 의존 관계 파악
2. 모드 판단 (`--mode research` 또는 `--mode build`)
3. **research 모드**: 읽기 전용 서브에이전트 spawn → schema 응답 반환 (승인 게이트 없음)
4. **build 모드**: 각 task에 모델·worktree·병렬 그룹 배정 → 표 + 승인 게이트 출력 → PO 승인 대기 → spawn
