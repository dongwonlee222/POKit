---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-c4-artifact-frontmatter
dependencies: []
source: 워크플로우 갭 분석 (산출물 형식 제각각)
proposed_labels:
  - area:artifacts
  - area:standardization
  - type:foundation
  - release:v0.16.0
proposed_state: Backlog
id: C4
title: [v0.16.0] 산출물 frontmatter 표준 — kind/linked_*/version 공통 메타
action: create (new issue)
proposedLabels:
  - area:artifacts
  - area:standardization
  - type:foundation
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-c4-artifact-frontmatter
schema_version: 1
---

## 시각화

```
Before:                          After:

decision-log.md                  모든 산출물 .md/.yaml:
  ↑ frontmatter 없음             ┌─────────────────────┐
                                 │ ---                 │
manifest.yaml                    │ kind: decision-log  │
  ↑ 다른 형식                    │ version: 1.0        │
                                 │ linked_issues:      │
PRD                              │   - POKIT-50        │
  ↑ 자유 형식                    │ linked_cycle: ...   │
                                 │ ---                 │
메인 에이전트:                   │ # 본문...           │
"이 파일 뭐지?" (매번 읽음)      └─────────────────────┘

                                 메인: "decision-log이네"
                                       (kind 한 줄로 판단)
```

## AS-IS

POKit 산출물이 형식 제각각:
- `memory/decision-log.md` — 5섹션 (배경/결정/대안/근거/다음액션), frontmatter 없음
- `releases/v*/manifest.yaml` — 7키 (version/issues/changelog/wiring_status/unresolved/...), frontmatter 없음
- `memory/resume-brief.md` — 4섹션 (어디서/다음/차단/참조), frontmatter 없음
- `artifacts/backlog/v0.15.2/M*.md` — frontmatter 있음 (id/title/labels/state/key/source)
- `artifacts/prds/POKIT-*.md` — 자유 형식
- Linear description — 4섹션 (AS-IS/TO-BE/성공/담당자)

결과:
- 메인 에이전트가 산출물 kind를 보고 판단할 수 없음
- 산출물 간 cross-link 어려움 (linked_issue, linked_cycle 메타 부재)
- 새 산출물 만들 때마다 형식 재발명

## TO-BE

모든 POKit 산출물 (md/yaml) 에 공통 frontmatter 강제:

```yaml
---
kind: decision-log | manifest | brief | memo | prd | criteria | history | retro
version: 1.0                            # 산출물 schema 버전
created: 2026-05-17T15:00:00Z
updated: 2026-05-17T15:30:00Z
linked_issues: [POKIT-50, POKIT-51]     # 연관 Linear 이슈
linked_cycle: cycle-5                    # 연관 cycle (선택)
linked_release: v0.16.0                  # 연관 릴리즈 (선택)
author: main-agent | builder | tdd-writer | ...
---

# 본문 (kind별 표준 섹션)
```

### kind별 본문 표준 섹션

| kind | 본문 섹션 (고정 순서) |
|---|---|
| decision-log | 배경 / 결정 / 대안 검토 / 근거 / 다음 액션 |
| manifest | (yaml — keys: version/issues/changelog/wiring_status/unresolved/git_tag) |
| brief | 어디서 멈췄나 / 다음 / 차단 / 참조 |
| memo | AS-IS / TO-BE / 성공 검증 / 담당 에이전트 |
| prd | 문제 / 사용자 / 해결책 / 성공 지표 / 범위 외 |
| criteria | Given / When / Then (시나리오별 반복) |
| linear-desc | AS-IS / TO-BE / 성공 검증 / 담당 에이전트 |
| retro | Keep / Problem / Try |

### 검증 인프라

- `scripts/internal/artifact-frontmatter.ts` — `parseFrontmatter` / `renderFrontmatter` / `validateKind`
- `tests/artifact-frontmatter-contract.test.mjs` — 모든 산출물 디렉토리 스캔 후 frontmatter 강제
- 마이그레이션 스크립트 — 기존 산출물에 frontmatter 일괄 주입

## 성공 검증

- [ ] `artifact-frontmatter.ts` 모듈 작성 + 단위 테스트
- [ ] 모든 기존 산출물에 frontmatter 마이그레이션 (idempotent)
- [ ] contract test가 frontmatter 누락 산출물 차단
- [ ] kind 한 줄 보고 메인 에이전트가 어떤 산출물인지 즉시 판단 가능
- [ ] linked_issues 메타로 산출물 → Linear 이슈 역방향 추적 가능
- [ ] v0.16.0 내 다른 작업 (C5/C7) 이 본 표준 위에 구축 가능

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, foundation 작업)
- 구현: architect + builder + tdd-writer (모듈 설계 + 마이그레이션 + 테스트)
- 검수: auditor (전수 산출물 검증)
