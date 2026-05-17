---
id: bl-2026-05-17-001
created: 2026-05-17
status: promoted
domain: docs+tooling
size: S
title: "박제 어휘 맥락별 치환 (기록 / dry-run 미리보기 등)"
target_version: v0.17.1
promoted_to: POKIT-193
---

## AS-IS

- "박제"가 4개 맥락에 단일 단어로 과부하
  - release manifest 박제
  - 결정 박제 (decision-log)
  - unresolved 박제 (carry-forward)
  - dry-run 박제 + 승인 게이트
- 일반 SW 어휘 아님 + 죽은 동물 비유 → 신입·외부 협업자 진입장벽
- 사용자 명시 거부: "박제란 단어는 쓰지 마"

## TO-BE

맥락별 치환:

| 기존 | 치환 |
|---|---|
| release manifest 박제 | 기록 |
| 결정 박제 | 기록 |
| unresolved 박제 (carry-forward) | 기록 |
| dry-run 박제 + 승인 | dry-run 미리보기 + 승인 |

### 어휘 정리 확장 (2026-05-17 추가)

사용자 피드백으로 추가 발견된 어색한 표현:

| 기존 | 치환 | 맥락 |
|---|---|---|
| 승인 발화 | 'OK 한 마디' / '네 답하면' / '짧은 동의로' | 사용자 안내·대화 흐름 |
| 진입 | 진행 | 대화 흐름 (기술 컨텍스트에서 "진입"은 유지 가능) |
| 발화 | 답·말 | 사용자 안내 (학술 어휘 회피) |

→ 일상어 우선. "발화"는 학술 용어로 사용자 안내에 부적합.

대상 파일 (1차 grep 결과):
- CHANGELOG.md
- CLAUDE.md
- docs/_details/approval-flow.md
- docs/architecture/13-backlog-title-and-outline-standards.md
- releases/v0.15.3/manifest.yaml (히스토리 — 보존 검토)
- scripts/internal/release-manifest.ts
- scripts/internal/next-action-wizard.ts
- scripts/cli/release.ts
- skills/linear-issue-manager/SKILL.md
- AGENTS.md / MEMORY.md / 활성 행동 규칙 sentinel

## 성공 검증

- `rg "박제" --type md --type ts --type sh --type yaml` 결과 0건 (히스토리 manifest 제외)
- pokit start/end 출력에서 "박제" 미노출
- approval-flow 문서가 "dry-run 미리보기 + 승인" 어휘로 일관
- AGENTS.md / CLAUDE.md / sentinel 블록 갱신
- 활성 행동 규칙 (세션 시작 시 노출) "dry-run 후 일반 승인" 문구 점검

## 담당 에이전트

미정 (string replace 위주 — Claude Code 단독으로 가능)

## 비고

- 글로벌 sentinel 블록(`SessionStart:startup hook success`)에 "dry-run 박제" 표현 있음 → 함께 갱신 필요
- 히스토리 manifest의 "박제"는 그대로 둘지 결정 필요 (사용자 옵션: B 정리 = 제거 권장)
