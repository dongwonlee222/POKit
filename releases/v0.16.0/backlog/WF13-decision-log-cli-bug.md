---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-wf13-decision-log-cli-bug
dependencies:
  - POKIT-189
source: 2026-05-17 POKIT-189 (WF12) self-dogfood 직후 발견
proposed_labels:
  - Bug
proposed_state: Backlog
id: WF13
title: [v0.16.0] linear.ts CLI decision-log append 위치·타임존·스키마 버그 수정
action: create (new issue)
proposedLabels:
  - Bug
proposedState: Backlog
idempotencyKey: memo-20260517-wf13-decision-log-cli-bug
schema_version: 1
---

## 시각화

### 버그 — 잘못된 append 위치

```
현재 decision-log.yaml 구조 (POKIT-189 apply 후)
─────────────────────────────────────────────────
decisions:
  - id: dec-2026-05-17-pokit189-...        ← 정상 (수동)
  - id: dec-2026-05-17-pokit187-...        ← 정상 (수동)
  - id: dec-2026-05-17-v0152-bundle        ← 정상 (수동)
    linear_refs:
      - POKIT-177
latest_decision_at: "2026-05-17T15:00:00Z"  ← 배열 종료 마커
  - id: dec-20260517-cli-update-pokit-189   🔴 배열 밖!
    timestamp: ...                          🔴 들여쓰기 어긋남
    actor: "main_agent"                     🔴 YAML 파싱 시 dangling
```

### CLI append 로직 문제

```
현재 동작                        ─→     문제
─────────────────────────────────────────────────────
fs.appendFile(yaml, entryText)   ─→  파일 끝에 단순 append
                                     latest_decision_at 라인 뒤에 박힘
                                     decisions: 배열 밖

타임스탬프                       ─→  UTC ISO8601 (10:37Z = 한국 19:37)
                                     기존 entry는 한국 시간대 정렬

스키마                           ─→  필드 누락:
                                     - alternatives_rejected: []
                                     - evidence: []
                                     - title 형식 다름
                                       (기존: "POKIT-189 (WF12) ...")
                                       (CLI:  "CLI update POKIT-189")
```

### 수정 후 (TO-BE)

```
decisions:
  - id: dec-20260517-cli-update-pokit-189  ✅ 배열 안 (최상단)
    timestamp: "2026-05-17T19:37:28.118Z"  ✅ 한국 시간대 정렬
    title: "POKIT-189 CLI self-apply"      ✅ 일관된 형식
    summary: "..."
    decision: "applyUpdateIssue 성공"
    alternatives_rejected: []              ✅ 빈 배열로라도 명시
    evidence: []
    linear_refs: [POKIT-189]
    actor: "main_agent"
  - id: dec-2026-05-17-pokit189-wf12-...   (기존)
  ...
latest_decision_at: "2026-05-17T19:37:28.118Z"  ✅ 최신값으로 갱신
```

## AS-IS

`scripts/internal/linear.ts` CLI 진입점의 `appendDecisionLog` 헬퍼 함수가 다음 3가지 문제 보유:

### 1. Append 위치 오류 (🔴 critical)
- 현재: `fs.appendFile(yamlPath, entryText)` — 파일 EOF에 단순 추가
- 결과: `latest_decision_at:` 라인 뒤에 entry가 박혀 `decisions:` 배열 밖에 위치
- YAML 파싱 시 dangling entry 발생 (`js-yaml` parse 에러 위험)
- 2026-05-17 POKIT-189 apply 시 실제 발생 (line 72-79 참조)

### 2. 타임존 불일치
- 현재: `new Date().toISOString()` → UTC (예: `2026-05-17T10:37:28.118Z`)
- 기존 entry: 한국 시간대 ISO (예: `2026-05-17T19:00:00Z` 같은 보정값)
- 정렬·검색 시 시간순 혼란

### 3. 스키마 비대칭
- 현재 CLI append entry 필드: `id`, `timestamp`, `title`, `summary`, `decision`, `linear_refs`, `actor`
- 기존 entry 필드: `id`, `timestamp`, `title`, `summary`, `decision`, `alternatives_rejected[]`, `evidence[]`, `linear_refs[]`, (선택) `limitations[]`, `files_changed[]`
- `alternatives_rejected`, `evidence` 누락 → 후속 회고·분석 시 비대칭

## TO-BE

`scripts/internal/linear.ts`의 `appendDecisionLog` 함수 재작성:

### 변경 사항

1. **YAML 파싱 기반 append** — 단순 `appendFile` 폐기:
   ```typescript
   import yaml from "js-yaml";  // 또는 jsr 표준 yaml
   const doc = yaml.load(await readFile(yamlPath, "utf8")) as { decisions: Entry[]; latest_decision_at: string };
   doc.decisions.unshift(newEntry);  // 최신을 상단에 (또는 push로 하단)
   doc.latest_decision_at = newEntry.timestamp;
   await writeFile(yamlPath, yaml.dump(doc, { lineWidth: -1, quotingType: '"' }));
   ```
2. **타임존 한국화** — `new Date().toISOString()` 유지하되, 기존 entry도 UTC로 통일 (마이그레이션 별도) OR CLI도 한국 시간대로 통일. **권장: UTC 통일** (기존 entry 마이그레이션 sweep 별도 작업)
3. **스키마 보강** — entry 생성 시 빈 배열 명시:
   ```typescript
   {
     id, timestamp, title, summary, decision,
     alternatives_rejected: [],
     evidence: [],
     linear_refs: [issueIdentifier],
     actor,
   }
   ```
4. **`.md` 동시 append** — 현재 CLI는 `.yaml`만 append. `decision-log.md`도 동기화 (또는 별도 후속)

### 회귀 테스트
- `tests/linear-cli.test.mjs`에 케이스 추가:
  - apply mock → decision-log.yaml 파싱 → decisions[] 배열 안에 entry 존재 확인
  - latest_decision_at이 새 entry timestamp와 일치 확인
  - alternatives_rejected, evidence 필드 존재 확인 (빈 배열)

## 성공 검증

- [ ] CLI apply 후 decision-log.yaml이 `js-yaml` parse 통과
- [ ] 새 entry가 `decisions:` 배열 안에 위치
- [ ] `latest_decision_at`이 최신 timestamp로 갱신
- [ ] 필드 누락 없음 (`alternatives_rejected`, `evidence` 빈 배열로라도 명시)
- [ ] 기존 수동 entry와 비교 시 스키마 동일
- [ ] 회귀 테스트 PASS (linear-cli.test.mjs 케이스 추가)
- [ ] (선택) decision-log.md도 동시 append — 미포함 시 별도 후속 명시
- [ ] (선택) 기존 line 72-79 dangling entry 정리 마이그레이션

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, WF12 self-dogfood 직후 발견)
- 구현: fullstack-developer (CLI helper 함수 재작성)
- 검수: feature-dev:code-reviewer (YAML 무결성·기존 entry 회귀)

## 비고

- POKIT-189 (WF12) 직접적 후속. WF12 완료 후 발견.
- 현재 dangling entry (line 72-79)는 WF13 구현과 함께 수동 정리 또는 마이그레이션 스크립트로 일괄 처리.
- v0.16.0 scope 추가 검토 (16건 → 17건). 1차 병렬 그룹 (의존 0, POKIT-189 완료된 상태).
- 우선순위: 🔴 high — 후속 모든 CLI apply가 동일 버그 누적. 빨리 수정할수록 정리 비용 감소.
