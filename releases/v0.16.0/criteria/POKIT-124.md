---
linear_issue_id: POKIT-124
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-124-criteria-2026-05-16
---

# Acceptance Criteria — POKIT-124: AGENTS.md 크기 제한 회귀 방지

## Scenario

v0.8.0이 AGENTS.md를 92→35줄로 슬림화한 후, 향후 변경으로 다시 비대해지지 않도록 자동 회귀 테스트를 추가한다. 이는 메인 에이전트 컨텍스트 다이어트 효과를 지속적으로 보호한다.

## Criteria

### AC-1: 회귀 테스트 파일 존재

- `tests/agents-md-size-regression.test.mjs` 파일이 존재
- node:test 기반 (다른 POKit 테스트와 동일 패턴)

### AC-2: 라인 수 ceiling 검증

- AGENTS.md 라인 수가 40을 초과하면 테스트 실패
- 실패 메시지에 "Move detail to docs/_details/*.md and keep AGENTS.md as an index" 가이드 포함

### AC-3: 풀 커맨드 부재 검증

- AGENTS.md 본문에 `node --experimental-strip-types scripts/` 패턴이 있으면 테스트 실패
- 실패 메시지에 "docs/_details/cli-internals.md" escape hatch 안내

### AC-4: 필수 링크 검증

- AGENTS.md가 docs/_details/ 의 7개 핵심 정책 파일을 모두 링크해야 함
- 누락 시 어느 링크가 빠졌는지 명시

### AC-5: 전체 테스트 통과

- `node --experimental-strip-types --test tests/*.test.mjs` 실행 시 새 회귀 테스트 3건 모두 PASS
- 기존 테스트 회귀 0건

## Verification

```bash
node --experimental-strip-types --test tests/agents-md-size-regression.test.mjs
node --experimental-strip-types --test tests/*.test.mjs
```
