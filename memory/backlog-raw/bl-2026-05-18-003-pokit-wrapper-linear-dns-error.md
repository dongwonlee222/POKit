---
id: bl-2026-05-18-003
created: 2026-05-18
status: refined
domain: tooling+workflow
size: S
title: "pokit wrapper가 Linear DNS 실패를 일반 Node 오류로 숨김"
target_version: null
promoted_to: null
source: chat/pokit-start-wrapper-failure-analysis
depends_on: []
absorbs: []
---

## AS-IS

- 사용자가 `포킷 시작`을 요청했을 때 처음에는 `pokit start`가 PATH에서 잡히지 않았다.
- repo-local 진입점 `./bin/pokit start`를 찾은 뒤 실행했지만, `node:internal/modules/run_main:107`만 원인처럼 보이는 generic error review가 생성됐다.
- 실제 부팅 본체인 `node --experimental-strip-types scripts/cli/session-start.ts`는 정상 출력과 `pokit:boot ok`를 만들 수 있었다.
- 추가 재현 결과, `verb-dispatch.ts`가 child process로 `scripts/cli/session-start.ts`를 실행하는 경로에서 `fetch("https://api.linear.app/graphql")`가 `getaddrinfo ENOTFOUND api.linear.app`로 실패했다.
- 현재 dispatcher의 `extractErrorMessage()`가 stack trace 첫 줄인 `node:internal/modules/run_main:107`을 대표 원인으로 뽑아, 실제 원인인 Linear API DNS/network 실패를 숨긴다.
- 그래서 사용자는 PATH 문제, Node runtime 문제, POKit boot 문제 중 무엇이 원인인지 구분하기 어렵다.

## TO-BE

- `pokit start` 실패 시 `fetch failed`, `ENOTFOUND api.linear.app`, `Missing LINEAR_API_KEY` 같은 네트워크/설정 원인이 error review의 `문제/원인`에 그대로 드러난다.
- dispatcher stderr 추출 로직이 Node internal stack frame보다 Error cause, `code`, `hostname`, user-presentable message를 우선한다.
- `pokit start`는 Linear API 연결 실패를 별도 known error로 분류하고, 사용자가 취할 수 있는 다음 행동을 명확히 보여준다.
- 가능하면 `session-start`에 read-only fallback brief 또는 cached context fallback을 검토해, 네트워크 장애와 POKit instruction boot 실패를 분리한다.

## 성공 검증

- Linear DNS가 막힌 환경에서 `./bin/pokit start`를 실행하면 error review에 `ENOTFOUND api.linear.app` 또는 `Linear API 연결 실패`가 표시된다.
- `node --test` 또는 contract test로 `extractErrorMessage()`가 `node:internal/modules/run_main:107` 대신 nested cause의 `ENOTFOUND api.linear.app`를 선택하는지 검증한다.
- 정상 네트워크 환경에서는 `./bin/pokit start`가 첫 줄 `🪧 POKit 시작 Brief`, 중간 `pokit:boot ok`, 마지막 sentinel을 포함한다.
- `pokit start` 실패 artifact가 `memory/problem-reviews/`에 생성되더라도 원인 문구가 사용자가 바로 이해할 수 있는 수준으로 남는다.

## 담당 에이전트

- design: main agent
- build: main agent
- review: main agent

## 비고

- 원인 확인 명령:
  - `node --experimental-strip-types scripts/cli/session-start.ts` → 정상 boot 출력 확인
  - `./bin/pokit start` → generic `node:internal/modules/run_main:107` error review 재현
  - child process 직접 재현 → `[TypeError: fetch failed]` / `getaddrinfo ENOTFOUND api.linear.app`
- 외부 write 후보 idempotency key: `memo-20260518-pokit-wrapper-linear-dns`
