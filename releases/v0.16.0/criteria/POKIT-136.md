---
linear_issue_id: POKIT-136
cycle_id: ceac566d-f52c-4dd3-9d31-58ac4de3c619
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: f0b62ed9e2487d6f9989c2753e3be4569d638cc942acbc9eb174903f3aec7910
---

# Acceptance Criteria Draft: v0.9.0 · approval token 기반 외부 write 권한 강화

## Scenario

## 목적

외부 write 승인 경계를 actor 문자열과 semantic preflight보다 더 강하게 만들기 위해, 사용자 승인 후 메인 에이전트가 발행하는 1회용 approval token 모델을 설계하고 구현한다.

## 배포 묶음

Target version: `v0.8.0`
Release bundle: 외부 write 권한 강화

## 배경

[POKIT-133](https://linear.app/example/issue/POKIT-133/v070-메시지-카탈로그와-훅-하네스)에서 `actor: "main_agent"` guard와 semantic preflight로 최소 강제는 추가됐다. 그러나 approval token은 사용자 승인, 세션 lifecycle, payload hash, replay 방지까지 포함하므로 별도 설계가 필요하다.

## Expected artifacts

* approval token threat model / design note
* `scripts/external-write/approval-token.ts`
* `tests/external-write-approval-token.test.mjs`
* external write apply helper 연동
* `docs/OPERATING_MODEL.md` external write contract 보강

## Done gate

* 메인 에이전트가 사용자 승인 후 1회용 approval token을 발행한다.
* token은 write target, idempotency key, payload hash에 바인딩된다.
* external write apply helper는 token, actor, idempotency key, dry-run hash를 함께 검증한다.
* replay, payload drift, actor spoofing을 negative test로 차단한다.

## 관계

Related: [POKIT-133](https://linear.app/example/issue/POKIT-133/v070-메시지-카탈로그와-훅-하네스)
Source: [POKIT-133](https://linear.app/example/issue/POKIT-133/v070-메시지-카탈로그와-훅-하네스) 후속 백로그 생성 dry-run
Evidence: `artifacts/backlog/pokit-133-follow-up-backlog-dry-run.md`

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-136
- Linear URL: https://linear.app/example/issue/POKIT-136/v090-approval-token-기반-외부-write-권한-강화
- Labels: pokit:criteria, Improvement
