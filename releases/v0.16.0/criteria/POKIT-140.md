---
linear_issue_id: POKIT-140
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-140-criteria-2026-05-16
---

# Acceptance Criteria — POKIT-140: AGENTS.md 40줄 인덱스화

## Scenario

v0.8.0에서 AGENTS.md를 메인 LLM 컨텍스트 부담을 최소화하는 인덱스 문서로 슬림화한다. 거대 운영 정책은 모두 `docs/_details/*.md`로 분산되고, AGENTS.md는 bootstrap·verb 포인터·링크맵만 유지한다.

## Criteria

### AC-1: AGENTS.md ≤ 40 lines

- Given: 저장소 루트의 AGENTS.md
- When: `wc -l AGENTS.md` 실행
- Then: ≤ 40 lines

### AC-2: 핵심 phrase 보존

- AGENTS.md 본문에 다음 phrase가 포함되어야 함:
  - `Main Agent Orchestration Contract`
  - `orchestrates POKit work; it does not replace hooks, templates, scripts, or subagent contracts`
  - `사용자-facing 답변, 보고서, 로컬 artifact는 한국어를 기본으로 쓴다`
  - `POKit session start contract`
  - `pokit start`
  - `context compaction`
  - `pokit:boot ok`

### AC-3: 풀 커맨드 부재

- AGENTS.md 본문에 `node --experimental-strip-types scripts/...` 풀 커맨드 0건
- 직접 스크립트 경로(`scripts/...`) 참조 0건 (링크 대상으로 `docs/_details/`만 노출)

### AC-4: 정책 링크맵 8개 이상

- `docs/_details/approval-flow.md`, `cycle-flow.md`, `release-flow.md`, `subagent-contract.md`, `memory-contract.md`, `completion-report.md`, `visualization.md`, `cli-internals.md` 8개 모두 링크
- `docs/OPERATING_MODEL.md` 인덱스 링크 유지

### AC-5: 테스트 회귀 0건

- `node --experimental-strip-types --test tests/*.test.mjs` 실행 시 새로 깨진 테스트 0건
- 사전 ENOENT(korean-language-contract) 1건은 제외 추적

### AC-6: 이동된 phrase가 docs/_details/에 보존

- 다음 phrase는 적절한 docs/_details/*.md에서 검증 가능해야 함:
  - `Human Intervention Matrix` → approval-flow.md
  - `When local work is complete and the next step is an external write` → approval-flow.md
  - `Before reporting procedure/Cycle completion` → completion-report.md
  - `When the user asks what remains/next` → cycle-flow.md
  - `When a confirmed error/blocker occurs` → approval-flow.md
  - `Cycle 완료 직후 축하 메시지는 release gate 완료 후 1회만 표시한다` → cycle-flow.md
  - `Version Run release is default` → release-flow.md
  - `Linear Weekly Cycle is only a weekly tracking/review container` → release-flow.md

### AC-7: agent-rules.test.mjs 분기

- tests/agent-rules.test.mjs의 7개 테스트가 AGENTS.md 대신 docs/_details/*.md를 읽도록 갱신됨
- 핵심 부트스트랩(test 117), Korean-first(test 41), 메인 오케스트레이션 contract(test 5)는 여전히 AGENTS.md를 읽음

## Verification Notes

```bash
wc -l AGENTS.md  # ≤ 40
grep -c "node --experimental-strip-types scripts" AGENTS.md  # 0
node --experimental-strip-types --test tests/*.test.mjs  # pass 227+ / fail 1 (ENOENT only)
```
