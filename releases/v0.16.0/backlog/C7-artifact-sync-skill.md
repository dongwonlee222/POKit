---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-c7-artifact-sync-skill
dependencies:
  - C4
source: 워크플로우 갭 분석 G5 (artifacts ↔ Linear 단절)
proposed_labels:
  - area:artifacts
  - area:linear-sync
  - type:feature
  - release:v0.16.0
proposed_state: Backlog
id: C7
title: [v0.16.0] artifact-sync 스킬 — PRD/AC 생성 시 Linear description 자동 link
action: create (new issue)
proposedLabels:
  - area:artifacts
  - area:linear-sync
  - type:feature
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-c7-artifact-sync-skill
schema_version: 1
---

## 시각화

```
Before:                          After:

prd-author 실행                  prd-author 실행
   │                                  │
   ▼                                  ▼
artifacts/prds/POKIT-50.md       artifacts/prds/POKIT-50.md
                                       │
사람이 Linear 열어                자동 트리거 (PostToolUse hook)
"📎 PRD: ..." 수동 추가                │
                                       ▼
잊어버림 (자주)                  Linear POKIT-50 description
PRD가 draft 상태로 떠 있음       "📎 PRD: artifacts/prds/POKIT-50.md"
                                  (자동 append)
```

## AS-IS

`prd-author` / `acceptance-criteria-author` subagent가 PRD/AC 생성 후 `artifacts/prds/POKIT-N.md`, `artifacts/criteria/POKIT-N.md` 에 저장.

그러나:
- Linear POKIT-N description에 PRD/AC 링크 자동 추가 안 됨
- 사람이 따로 "📎 PRD: artifacts/prds/POKIT-N.md" 같은 라인 추가해야 함
- 누락 빈번 → PRD/AC가 draft 상태로 떠 있음 (워크플로우 갭 G5)

POKIT-175 진행 후 경로가 `releases/v*/prds/POKIT-N.md` 로 바뀌면 더 복잡.

## TO-BE

신규 스킬 `artifact-sync` — PRD/AC 생성 직후 Linear description에 자동 link append:

```
.claude/skills/artifact-sync/SKILL.md
---
name: artifact-sync
description: PRD/AC/sprint 산출물 생성 직후 연관 Linear 이슈 description에 link 자동 append. C4 frontmatter linked_issues 메타 기반.
trigger:
  - prd-author 종료 시 자동 호출
  - acceptance-criteria-author 종료 시 자동 호출
  - "/artifact-sync POKIT-N" 수동 호출
---

## Procedure

1. 산출물 frontmatter 읽어 linked_issues 추출 (C4 의존)
2. 각 issue에 대해:
   a. 현재 Linear description 끝부분 read
   b. "📎 PRD:" / "📎 AC:" 라인이 이미 있으면 경로 비교, 다르면 갱신
   c. linear-issue-manager Update 분기 호출 (planUpdateIssue → 사용자 승인 → applyUpdateIssue)
3. dry-run mode: 변경 사항 표시만, 사용자 명시 승인 후 apply
```

### 자동 호출 시점

- subagent (prd-author 등) 종료 시 PostToolUse hook 으로 트리거
- workflow-state 가 "병렬 실행" 단계일 때만 활성
- 자유 모드에선 자동 X, 수동 호출만

### 멱등성

- 같은 경로의 link가 이미 있으면 skip
- 경로가 바뀐 경우 (POKIT-175 마이그레이션 후) 자동 갱신
- 여러 이슈에 동일 PRD 연결 시 각각 처리

## 성공 검증

- [ ] artifact-sync 스킬 SKILL.md 작성
- [ ] frontmatter linked_issues 읽기 → Linear description append 동작
- [ ] 멱등성 — 같은 산출물 두 번 sync 해도 description 한 번만 추가
- [ ] 경로 변경 자동 감지 + 갱신
- [ ] dry-run plan 사용자 승인 후 apply
- [ ] 워크플로우 모드에서만 자동 트리거 (자유 모드 X)
- [ ] block-linear-curl hook 통과 (planUpdateIssue 경유)

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: builder (스킬 + PostToolUse hook)
- 검수: tdd-writer (멱등성 회귀)
