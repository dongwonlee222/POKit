---
id: bl-2026-05-18-002
created: 2026-05-18
status: promoted
domain: workflow+hooks+tests+plugin
size: M
title: "pokit-start strict output contract 강화"
target_version: v0.17.5
promoted_to: POKIT-215
source: chat/pokit-start-verbatim-output-contract
depends_on: []
absorbs: []
---

## AS-IS

- 사용자가 `포킷 시작`을 요청하면 `skills/pokit-start/SKILL.md` 계약상 `./bin/pokit start` stdout을 그대로 출력해야 한다.
- 실제 세션에서 CLI는 실행됐지만 assistant 최종 답변이 요약으로 바뀌어, `stdout 그대로 출력` 및 `추가 멘트 0줄` 계약이 지켜지지 않았다.
- 현재 `workflows/hooks.yaml`의 훅은 POKit 내부 CLI/정책 흐름에는 적용되지만, assistant 최종 응답을 직접 가로채는 강제 장치는 아니다.
- repo에는 `.claude-plugin/plugin.json`만 있고 `.codex-plugin/plugin.json`이 없어, Codex 쪽에서는 POKit 로컬 `skills/`를 프로젝트 플러그인으로 노출하는 계약이 약하다.
- `.claude-plugin/plugin.json`의 version이 `0.12.2`로, 실제 `package.json` 버전 `0.17.4`와 drift가 있다.
- `dispatchByTriggerPhrase`가 짧은 phrase 선착순으로 매칭되어 `Linear 백로그 등록`이 `linear-issue-manager`가 아니라 `backlog-memo`로 오분기될 수 있다.
- `backlog-memo`가 실제 존재하지 않는 `linear-backlog-manager` 스킬명으로 위임 안내한다.
- `linear-issue-manager` 문서에서 dry-run용 `plan*`과 write용 `apply*` 승인 경계가 모순적으로 적혀 있다.
- 따라서 모델 기억에만 의존하지 않도록 문서 계약, 회귀 테스트, CLI output validator hook을 함께 두는 장치가 필요하다.

## TO-BE

- `AGENTS.md`에 `포킷 시작`/`포킷 start`/`POKit 시작해줘`는 반드시 `pokit-start` 스킬 계약을 따르며, 최종 답변에 stdout 외 텍스트를 붙이지 않는다는 hard rule을 둔다.
- `skills/pokit-start/SKILL.md`와 `docs/_details/session-output-contract.md`에 최종 assistant 응답 계약을 더 명확히 적는다.
- `tests/contracts/agent-rules.test.mjs` 또는 별도 contract test가 `pokit-start`, `stdout 그대로`, `추가 멘트 0줄`, sentinel 문구를 검증한다.
- 선택적으로 `scripts/ci/session-start-output-check.ts` 같은 validator를 추가하고, `workflows/hooks.yaml`에 `after_session_start_output` 훅을 선언해 CLI stdout 자체의 shape를 검사한다.
- `.codex-plugin/plugin.json`을 추가해 글로벌 설치 없이도 POKit repo-local skills를 Codex 프로젝트 플러그인으로 정의한다.
- `.claude-plugin/plugin.json` 버전을 `package.json`과 동기화하고, version sync contract test를 둔다.
- 필요하면 `.agents/plugins/marketplace.json`에 local source 항목을 추가해 플러그인 발견/설치 경로를 명확히 한다.
- `dispatchByTriggerPhrase`를 가장 긴 phrase 우선 또는 명시적 우선순위 방식으로 바꿔 `Linear 백로그 등록` 같은 충돌 문구를 정확히 라우팅한다.
- `pokit-start` trigger에 `POKit 시작`, `POKit 시작해줘` 같은 대소문자/영문 혼합 문구를 추가한다.
- `backlog-memo`의 `linear-backlog-manager` 참조를 `linear-issue-manager`로 정정한다.
- `linear-issue-manager` 문서에서 `plan*`은 승인 전 dry-run 허용, `apply*`만 승인 후 write로 정리한다.

## 성공 검증

- `node --test tests/contracts/agent-rules.test.mjs` 통과.
- 새 validator를 만들 경우 `node --experimental-strip-types scripts/ci/session-start-output-check.ts` 또는 대응 테스트 통과.
- `./bin/pokit start` 출력이 첫 줄 `🪧 POKit 시작 Brief`, `pokit:boot ok`, 마지막 sentinel을 포함한다.
- `AGENTS.md`가 과도하게 길어지지 않고 기존 AGENTS line budget 회귀 테스트를 통과한다.
- `.codex-plugin/plugin.json`이 존재하고, plugin contract test가 name/version/description 및 skills 노출 의도를 확인한다.
- `.claude-plugin/plugin.json`과 `package.json` version sync test 통과.
- critical trigger matrix 통과:
  - `Linear 백로그 등록` → `linear-issue-manager`
  - `백로그 등록해줘` → `backlog-memo`
  - `Linear에 refined 다 등록` → `backlog-promote`
  - `POKit 시작해줘` → `pokit-start`
- `backlog-memo` 문서에 존재하지 않는 스킬명(`linear-backlog-manager`) 참조가 없다.
- `linear-issue-manager` 문서가 `plan*` dry-run / `apply*` write 경계를 명확히 설명한다.
- `포킷 시작` 요청에 대한 운영 절차가 “스킬 계약 호출 → stdout verbatim 최종 출력”으로 cold start 작업자에게 명확하다.

## 담당 에이전트

- design: main agent
- build: main agent
- review: main agent

## 비고

- Linear 등록 전 로컬 백로그 메모다.
- 외부 write 후보 idempotency key: `memo-20260518-pokit-start-strict-output`
