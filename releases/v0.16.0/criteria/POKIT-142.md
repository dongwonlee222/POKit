---
linear_issue_id: POKIT-142
parent_issue: POKIT-92
cycle_id: backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
target_version: v0.8.0
content_hash: pokit-142-criteria-2026-05-16
---

# Acceptance Criteria Draft — POKIT-142: SKILL.md frontmatter + 라벨 dispatcher 구현

## Scenario

v0.8.0에서 8개 SKILL.md 각각에 YAML frontmatter가 추가되고, `scripts/internal/dispatch.ts` dispatcher가 라벨/자연어 트리거 기반으로 적절한 SKILL을 반환한다. `pokit run`이 dispatcher를 통해 이슈 라벨을 SKILL로 매핑한다.

## Criteria

### AC-1: 8개 SKILL.md frontmatter 추가

- Given: 8개 skills/*/SKILL.md 파일
- When: 각 SKILL.md를 파싱
- Then: 모든 파일 최상단에 YAML frontmatter (`---` 구분자)가 존재함
- And: `name`, `description`, `entry`, `labels`, `trigger_phrases` 필드가 모두 존재함
- And: 기존 본문(## Trigger, ## Output 등) 내용이 변경되지 않음

### AC-2: frontmatter 스키마 준수

- Given: 각 SKILL.md frontmatter 파싱
- When: `name` 필드 확인
- Then: 디렉토리명과 일치하는 kebab-case 값 (예: `acceptance-criteria-author`)
- And: `description`은 한 줄 설명 + 자연어 트리거 패턴 1-2개 포함
- And: `entry`는 `pokit run`, `pokit audit`, `internal:dispatcher`, `internal:session-close`, `conversational` 중 하나
- And: `labels`는 배열 (빈 배열 포함)
- And: `trigger_phrases`는 한국어 자연어 트리거 문자열 배열

### AC-3: scripts/internal/dispatch.ts 구현

- Given: `dispatch.ts` import
- When: `loadSkillManifests()` 호출
- Then: 8개 SkillManifest 객체 반환
- And: 각 manifest에 `name`, `description`, `entry`, `labels`, `trigger_phrases`, `body` 필드 존재

### AC-4: dispatchByLabels 동작

- Given: `loadSkillManifests()` 결과
- When: `dispatchByLabels(["pokit:prd"], manifests)` 호출
- Then: `name === "prd-author"` manifest 반환
- When: `dispatchByLabels(["pokit:criteria"], manifests)` 호출
- Then: `name === "acceptance-criteria-author"` manifest 반환
- When: `dispatchByLabels(["pokit:unknown"], manifests)` 호출
- Then: 빈 배열 반환

### AC-5: dispatchByTriggerPhrase 동작

- Given: `loadSkillManifests()` 결과
- When: `dispatchByTriggerPhrase("이번 cycle 실행", manifests)` 호출
- Then: `name === "sprint-runner"` manifest 반환
- When: `dispatchByTriggerPhrase("알 수 없는 요청", manifests)` 호출
- Then: `null` 반환

### AC-6: 테스트 통과

- Given: `node --experimental-strip-types --test tests/*.test.mjs`
- When: 실행
- Then: 기존 213 PASS 유지 (사전 ENOENT 1건 외 새 실패 없음)
- And: `tests/skill-dispatcher.test.mjs` 신규 테스트 모두 통과

## Edge Cases

- SKILL.md에 frontmatter가 없는 경우 → `loadSkillManifests`는 해당 파일을 오류 없이 스킵하거나 빈 필드로 처리
- `labels: []` (빈 배열) SKILL은 dispatchByLabels에서 매칭되지 않음
- `trigger_phrases`에 부분 일치하는 입력 → 매칭됨 (includes 검사)

## Open Questions

- sprint-runner 연결: 기존 hard-coded POKIT_LABELS 로직과 dispatcher 병행 운영 허용 여부 (v0.8.0 범위에서는 병행으로 확인)

## Source Context

- Linear issue: POKIT-142
- Parent PRD: POKIT-92 R5
- Labels: [pokit:criteria]
