---
linear_issue_id: POKIT-146
cycle_id: ceac566d-f52c-4dd3-9d31-58ac4de3c619
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 991ef4867edac4c93287e1a87faa5e70136cfaced86b9988d1fe60c19b60d41b
---

# Acceptance Criteria Draft: [배포대상 v0.9.0] korean-language-contract 테스트 - ENOENT 해결

## Scenario

## 목적

tests/korean-language-contract.test.mjs가 artifacts/profiles/pokit/sprints/.../md-flow-audit.md 파일을 찾지 못해 ENOENT로 실패한다. 테스트 픽스처 또는 조건부 스킵으로 안정화한다.

## 사용자에게 보이는 변화

npm test 전체에서 korean-language-contract 테스트가 정상 통과한다.

## 완료 조건

ENOENT 실패 0건, 전체 테스트 통과(단 다른 기존 실패는 별도 처리).

## 범위

테스트 픽스처 추가 또는 조건부 스킵, 원인 분석 메모

## 제외 범위

전체 테스트 인프라 재설계

## 증거 / 출처

* npm test 실패 로그 (2026-05-16)
* memory/resume-brief.md (v0.9.0 후보)

## 배포 여부

releaseKind: normal
targetVersion: v0.9.0
runId: none

## Linear 변수

state: Backlog
labels: pokit:criteria, Improvement
source: problem_review

## idempotency key

linear:create_issue:\[배포대상 v0.9.0\] korean-language-contract 테스트 - ENOENT 해결

## Criteria

**AC-1: ENOENT 원인 식별**
- Given `tests/korean-language-contract.test.mjs`의 `USER_FACING_MARKDOWN` 배열
- When 5개 경로 각각의 git tracking 상태와 .gitignore 매칭 여부를 점검
- Then `artifacts/profiles/pokit/sprints/Cycle-5-PO-Signal-Watch---Backlog-Share/md-flow-audit.md`만 `.gitignore`의 `artifacts/*` 패턴에 매칭되어 release artifact가 아님이 확인된다

**AC-2: 테스트 대상 경로 정리**
- Given AC-1에서 release 영역(`docs/`, `examples/`)만 검증 대상으로 적합함이 확인됨
- When `USER_FACING_MARKDOWN` 배열에서 `artifacts/profiles/...` 항목을 제거
- Then 남은 4개 경로(`docs/source-registry.md`, `docs/signal-watch-workflow.md`, `examples/signal-watch/discovery-brief-sample.md`, `examples/signal-watch/backlog-candidate-dry-run.md`)는 모두 git tracking 대상이며 파일이 실존한다

**AC-3: 회귀 무결성**
- Given POKIT-146 수정 적용 후
- When `npm test` 실행
- Then `korean-language-contract.test.mjs`가 PASS, 전체 fail은 기존 1건(public-safety-scan)만 남고 ENOENT 사라짐

## Edge Cases

- 향후 동일 audit 결과를 release-facing으로 노출하려면 `examples/signal-watch/md-flow-audit-sample.md`로 별도 추가하고 테스트 대상에 포함시킨다. 본 이슈 범위 밖.
- profile 기능을 쓰는 사용자가 자신의 local artifact를 검증하고 싶다면 별도 옵션 테스트가 필요. 본 이슈 범위 밖.

## Open Questions

- 없음. 본 이슈는 명백한 테스트 설계 오류 수정 (patch-size inline fix).

## Source Context

- Linear issue: POKIT-146
- Linear URL: https://linear.app/example/issue/POKIT-146/배포대상-v090-korean-language-contract-테스트-enoent-해결
- Labels: pokit:criteria, Improvement
