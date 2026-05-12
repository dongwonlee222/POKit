# POKit History and Model Tiering Backlog Plan

This document records the reviewed backlog plan that was used to create Linear issues EVM-32 through EVM-39. It is kept as planning history; future external writes still require a fresh dry-run plan, idempotency key, and user approval.

## Context

POKit Day 2 walking skeleton is complete, but history management and model-tier policy are not yet formalized. Session start will only stay fast if session close and cycle close produce compact, reliable history artifacts.

Direction:

- Use high-capability models for judgment, ambiguity classification, prioritization, and risk-sensitive planning.
- Use lower-cost models for bookkeeping drafts: history summaries, session close reports, changelog candidates, decision-log candidates, and resume briefs.
- Keep the user as the only authority for Linear/GitHub writes, decision-log confirmation, and cycle close confirmation.
- Keep Linear as official task history, run summaries as execution facts, retros as cycle interpretation, changelog as product history, and decision-log as approved decision history.

## Proposed Linear Backlog Items

### 1. model-tier policy 문서화

- idempotencyKey: `linear:create_issue:model-tier policy 문서화`
- labels: `pokit:criteria`
- target: backlog

Description:

토큰 최적화를 위해 어떤 작업을 낮은 모델에 맡기고 어떤 작업을 높은 모델/사용자가 검토해야 하는지 정책화한다.

Scope:

- 낮은 모델은 evidence와 draft만 만든다.
- 낮은 모델은 issue Done 여부를 판단하지 않고 completion evidence만 수집한다.
- 높은 모델은 제품 판단, 우선순위, 모호함 분류, 복잡한 write plan risk summary를 맡는다.
- 사용자는 Linear/GitHub write 승인, decision-log 확정, cycle close 확정의 유일한 권한자다.

Acceptance notes:

- `docs/OPERATING_MODEL.md` 또는 별도 문서에 모델 티어 역할이 추가된다.
- 외부 write에 대한 AI 검토가 사용자 승인처럼 보이지 않도록 명명과 책임이 분리된다.
- 모호한 요구사항은 AI가 임의 해석하지 않고 clarification 유형으로 분류한다.

### 2. resume-brief compact contract 강화

- idempotencyKey: `linear:create_issue:resume-brief compact contract 강화`
- labels: `pokit:criteria`
- target: backlog

Description:

다음 세션 시작이 빠르도록 `memory/resume-brief.md`의 최소 필드와 길이 제한을 명확히 한다.

Scope:

- resume brief는 상태 나열이 아니라 복귀 행동을 담는다.
- 필드는 `어디서 멈췄나`, `다음에 무엇을 하나`, `차단된 것`, `참조` 4개 섹션으로 제한한다.
- git status, 테스트 결과, 전체 남은 task 목록처럼 명령어로 즉시 얻을 수 있거나 stale되기 쉬운 정보는 링크/참조로 둔다.
- 1-2KB 목표를 유지한다.

Acceptance notes:

- `memory/context-map.yaml`의 read order와 호환된다.
- session start가 전체 docs를 다시 읽지 않아도 된다.
- 다음 실행 문장이 자연어 1문장으로 포함된다.

### 3. session-close 종료 리포트 스크립트 구현

- idempotencyKey: `linear:create_issue:session-close 종료 리포트 스크립트 구현`
- labels: `pokit:prd`
- target: backlog

Description:

세션 종료 시 다음 세션 시작을 빠르게 만들기 위한 종료 리포트를 생성한다.

Scope:

- `scripts/session-close.ts`를 추가한다.
- `session-brief`, `git status --short --branch`, 테스트 결과 요약, Linear cycle 상태, 승인 대기, 다음 추천 작업을 한 화면에 모은다.
- 기존 run summary를 새로 쓰지 않고 참조/요약한다.
- `memory/resume-brief.md` 갱신은 compact contract를 따른다.
- Linear/GitHub write는 하지 않는다.

Acceptance notes:

- 종료 리포트에 완료/미완료/승인 대기/다음 추천 작업이 포함된다.
- 테스트 명령이 실패하면 실패 상태를 숨기지 않는다.
- resume-brief 갱신 전 updated marker/hash 충돌을 감지한다.
- `tests/session-close.test.mjs`가 주요 출력 구조를 검증한다.

### 4. prioritizer ICE-lite 시범 구현

- idempotencyKey: `linear:create_issue:prioritizer ICE-lite 시범 구현`
- labels: `pokit:criteria`
- target: backlog

Description:

history/model-tiering 최소 골격을 실제로 소비하는 첫 Phase 2 기능으로 ICE-lite 기반 우선순위 제안을 시범 구현한다.

Scope:

- `skills/prioritizer/SKILL.md`를 추가한다.
- Impact, Confidence, Ease 기준으로 후보 issue를 점수화한다.
- 우선순위 변경은 Linear write로 바로 실행하지 않고 dry-run plan만 만든다.
- override 또는 정책성 판단은 decision-log 후보로만 제안한다.

Acceptance notes:

- prioritizer가 resume-brief/run summary/decision-log를 어떻게 읽는지 명시한다.
- decision-log 후보는 최대 3개로 제한한다.
- 사용자가 승인하기 전까지 Linear priority/status는 변경하지 않는다.

### 5. history-maintainer skill 추가

- idempotencyKey: `linear:create_issue:history-maintainer skill 추가`
- labels: `pokit:criteria`
- target: backlog

Description:

낮은 모델이 세션/사이클/제품 히스토리 초안을 관리하도록 전용 skill을 만든다.

Scope:

- `skills/history-maintainer/SKILL.md`를 추가한다.
- Task History, Session History, Cycle History, Product History, Decision History의 역할을 분리한다.
- 낮은 모델이 작성 가능한 draft와 사용자/고성능 모델 확인이 필요한 판단을 분리한다.

Acceptance notes:

- Linear 완료 처리, run summary, retro, changelog, decision-log 후보의 경계가 설명된다.
- 낮은 모델은 completion evidence만 정리하고 Done 판단은 하지 않는다.
- decision-log 후보는 최대 3개로 제한하고, 확정 append는 사용자 승인 후에만 한다.

### 6. cycle-close 사이클 종료 초안 생성

- idempotencyKey: `linear:create_issue:cycle-close 사이클 종료 초안 생성`
- labels: `pokit:prd`
- target: backlog

Description:

Cycle 종료 시 완료 작업, 이월 작업, 승인 대기, 산출물, changelog 후보, decision-log 후보를 정리하는 초안을 생성한다.

Scope:

- `scripts/cycle-close.ts`를 `session-close.ts`와 별도 entry로 추가한다.
- 공통 수집 로직은 `scripts/lib/history-collector.ts` 같은 shared helper로 분리한다.
- `artifacts/sprints/[cycle]/retro.md`와 run summary를 읽어 종료 초안을 만든다.
- 남은 issue는 Done 처리하지 않고 carry-over 후보로 표시한다.

Acceptance notes:

- Linear write 없이 종료 초안만 생성한다.
- 완료/이월/보류/승인 대기 항목이 분리된다.
- Cycle 1이 메타 개발 cycle이면 실제 dogfood는 Cycle 2 종료 시점부터 한다.

### 7. changelog 후보 자동 추출

- idempotencyKey: `linear:create_issue:changelog 후보 자동 추출`
- labels: `pokit:criteria`
- target: backlog

Description:

세션 또는 cycle 종료 시 제품 변경 이력으로 남길 항목만 `CHANGELOG.md` 후보로 분리한다.

Scope:

- 사용자-facing 기능, workflow 변경, script/skill 추가, 안전 규칙 변경을 changelog 후보로 표시한다.
- 단순 내부 정리나 테스트 보강은 run summary에만 남긴다.
- 실제 `CHANGELOG.md` 수정은 사용자 승인 후 별도 작업으로 한다.
- Cycle 2-3개 데이터가 쌓인 뒤 자동 추출 규칙을 조정한다.

Acceptance notes:

- changelog 후보와 run-summary-only 항목이 구분된다.
- release note에 들어갈 문장 초안이 생성된다.
- 낮은 모델이 초안 작성 가능한 형식이다.

### 8. history write conflict warning 구현

- idempotencyKey: `linear:create_issue:history write conflict warning 구현`
- labels: `pokit:criteria`
- target: backlog

Description:

세션 종료 또는 long-running worker가 동시에 memory/history 파일을 갱신할 때 한쪽 컨텍스트가 조용히 사라지지 않도록 충돌 경고를 구현한다.

Scope:

- `memory/resume-brief.md` 갱신 전에 updated marker 또는 content hash를 확인한다.
- 예상한 이전 hash와 다르면 overwrite하지 않고 conflict warning을 출력한다.
- 충돌 상태는 종료 리포트에 포함하고 사용자의 병합/재생성 승인을 기다린다.

Acceptance notes:

- session-close 구현의 첫 시나리오에 conflict warning 케이스가 포함된다.
- 후행 write 우선 규칙을 유지하되 조용한 컨텍스트 손실은 막는다.
- Needs Approval 상태로 분류할 수 있다.

## Recommended Execution Order

1. model-tier policy 문서화
2. resume-brief compact contract 강화
3. session-close 종료 리포트 스크립트 구현
4. prioritizer ICE-lite 시범 구현
5. history-maintainer skill 추가
6. cycle-close 사이클 종료 초안 생성
7. changelog 후보 자동 추출
8. history write conflict warning 구현

## Notes Before Applying

- This was the reviewed plan for EVM-32 through EVM-39.
- Future changes need a new dry-run plan.
- Apply external writes only after explicit user approval.
- If Cycle 1 is a meta development cycle, use Cycle 2 as the first meaningful cycle-close dogfood target.
