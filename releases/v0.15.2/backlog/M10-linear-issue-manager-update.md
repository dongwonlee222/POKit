---
id: M10
title: linear-backlog-manager → linear-issue-manager (update 분기 추가)
proposedLabels: [skill, linear-write, refactor]
proposedState: Backlog
idempotencyKey: memo-20260517-m10-linear-issue-manager-update
source: 사용자 PO 결정 + advisor 점검 (2026-05-17)
---

## AS-IS

`skills/linear-backlog-manager/SKILL.md` 및 `scripts/internal/linear.ts`의 `planCreateIssue` / `applyCreateIssue`는 **신규 이슈 생성 전용** 진입점이다. SKILL의 라우팅·검증·dry-run 흐름 전체가 create를 가정하고 짜여 있다.

`linear.ts:1198`에 `applyUpdateIssue` 모듈이 존재하지만:
- SKILL 트리거에 update 분기가 노출되지 않음
- description append 시 기존 본문 보존 로직 없음 (덮어쓰기 위험)
- update용 dry-run plan 포맷 없음 — create plan만 있음
- `assertExternalWriteAllowed` 호출 시 update plan의 idempotency key 규약 미정

결과: 단발 update가 필요한 케이스(예: POKIT-170 상태 전환 + 보류 사유 append, POKIT-159 description에 메모 link append)는 매번 메인 에이전트가 SKILL 우회해서 직접 처리해야 한다. 라우팅 표준이 무너지고 update 작업의 검증·승인·박제 경로가 매번 임시 우회된다.

직접적 증거 (v0.15.2 hotfix 박제 결정):
- M8 (POKIT-170 보류): SKILL 적용 불가 → "메인이 직접 update" 우회 결정
- M9 (POKIT-159 link append): 동일 사유로 보류

## TO-BE

`linear-backlog-manager`를 **`linear-issue-manager`로 리네임**하고 create/update 두 분기를 1개 SKILL로 통합한다.

설계 항목:
- SKILL 리네임: `skills/linear-backlog-manager/` → `skills/linear-issue-manager/`
- 진입 분기:
  - **Create 트리거** (기존 유지): "Linear 백로그 등록", "Linear에 이슈 만들어줘"
  - **Update 트리거** (신규): "Linear `POKIT-XXX` description 추가", "Linear `POKIT-XXX` 상태 변경", "Linear `POKIT-XXX` 보류 처리"
- 라우팅: 발화에 Linear issue id(`POKIT-\d+`) 포함 여부로 1차 분기. 포함 시 update, 미포함 시 create
- 신규 함수: `scripts/internal/linear.ts`에 `planUpdateIssue` 추가 (현재 `applyUpdateIssue`만 있음)
- description append 로직: 기존 본문 fetch → 신규 섹션 append → dry-run plan에 diff 형태로 표시
- update dry-run plan 포맷:
  ```
  [update plan]
  대상: POKIT-XXX "<title>"
  변경 필드: description (append), state (Cancelled)
  idempotencyKey: update-<issue-id>-<date>-<scope-hash>
  현재 description (앞 5줄): ...
  추가될 섹션:
  -----
  <append 내용>
  -----
  ```
- guard 정합: `external-write/guard.ts` `assertExternalWriteAllowed`가 update plan도 동일 조건(approved=true, actor=main_agent, idempotencyKey 존재)으로 통과
- `block-linear-curl.sh` hook 적용 대상 확장: update 경로의 raw curl도 차단
- 호환: `skills/backlog-router/SKILL.md`의 "Linear write 확정" 라우팅을 새 SKILL 이름으로 갱신
- 참조 문서: `docs/_details/subagent-contract.md`, `docs/PRD.md` 갱신

## 첫 사용 케이스 (acceptance) — 추적용

M10 SKILL 완성 후 즉시 처리할 보류 케이스 2건:
- **M8**: POKIT-170 description에 "## 보류 결정 (2026-05-17)" 섹션 append + state Cancelled 전환
- **M9**: POKIT-159 description에 `artifacts/backlog/v0.15.2/M9-location-memory-retrieval-wiring.md` link append

이 2건은 v0.15.2 release manifest의 `unresolved:` 섹션(M4 산출물)에도 박제된다. 3채널 추적: ① manifest unresolved ② 본 메모의 acceptance ③ decision-log.

## 성공 검증

- [ ] SKILL 디렉토리 `skills/linear-issue-manager/` 존재. 구 디렉토리 폐기 또는 redirect
- [ ] `backlog-router` SKILL의 라우팅이 새 이름으로 갱신됨
- [ ] `planUpdateIssue` 함수 export. type 정의 + 단위 테스트 1건
- [ ] "Linear POKIT-170 보류 처리해줘" 발화 시 update 분기 진입 + dry-run plan 출력
- [ ] dry-run plan에 description diff (현재 본문 앞 5줄 + 추가될 섹션) 표시
- [ ] 사용자 `y` 승인 후 `applyUpdateIssue` 호출 + 기존 description 보존 + 신규 섹션 append 결과 확인
- [ ] `assertExternalWriteAllowed`가 update plan 통과 (approved/actor/idempotencyKey 강제)
- [ ] `block-linear-curl.sh` hook이 update 경로 raw curl 차단 확인
- [ ] **첫 사용 케이스 통과**: M8 (POKIT-170 보류 처리) + M9 (POKIT-159 link append) 둘 다 본 SKILL로 처리되어 완료
- [ ] 회귀: 기존 create 흐름 (4섹션 강제, planCreateIssue) 정상 동작

## 담당 에이전트

- 설계: claude-opus-4-7 (메인 PO 세션)
- 구현: claude-sonnet-4-6 (SKILL 리네임 + planUpdateIssue + dry-run 포맷)
- 검수: claude-opus-4-7 + 사용자 PO (M8/M9 첫 사용 케이스 직접 검증)

본 메모는 v0.15.2 hotfix 묶음에 포함되지만 구현 자체는 별도 cycle(v0.15.3 또는 v0.16.0)에서 진행 추천. v0.15.2에는 메모 박제만.
