# POKit — Claude Code Instructions

이 프로젝트의 에이전트 계약은 [`AGENTS.md`](./AGENTS.md)를 단일 소스로 사용합니다.

**Claude Code 세션 시작 시 반드시 `AGENTS.md`를 먼저 읽고 그 규칙을 따르세요.**

이 파일은 의도적으로 짧게 유지됩니다. 모든 운영 계약 — 세션 시작 절차, 외부 쓰기 승인 규칙, Cycle 흐름, 완료 보고 규약 등 — 은 `AGENTS.md`와 `docs/` 하위 문서에 있습니다. Codex 사용자와 Claude Code 사용자가 동일한 계약으로 협업할 수 있도록 한 곳에서 관리합니다.

## 출력 규칙

- Claude Code도 Linear MCP/Connector가 연결된 런타임이면 MCP-first 경로를 사용한다. MCP가 없으면 `.env`의 `LINEAR_API_KEY`를 전제로 `./bin/pokit start` 또는 `./bin/pokit brief`를 실행한다. 어떤 경로든 stdout 전체를 그대로 assistant 텍스트로 출력한다. 요약·해석·추가 설명 금지.

## 빠른 참조

- 세션 시작 / 현재 상태 브리핑 / "포킷 시작해줘":
  ```bash
  ./bin/pokit start
  ```
- Linear MCP-first 세부 계약은 `AGENTS.md`와 `docs/_details/session-output-contract.md`를 따른다.
- 자세한 계약: [`AGENTS.md`](./AGENTS.md)
- 운영 모델: [`docs/OPERATING_MODEL.md`](./docs/OPERATING_MODEL.md)
- 온보딩: [`docs/ONBOARDING.md`](./docs/ONBOARDING.md)

## 백로그 라우팅 규약

- "백로그" 관련 모호 표현(추가/등록/만들어/올려)은 모두 `backlog-memo` 스킬로 진입한다. dry-run 미리보기 후 사용자 명시 승인 시에만 Linear write로 진행한다.
- `linear-backlog-manager`(또는 향후 `linear-issue-manager`) 진입은 사용자 발화에 `Linear` 단어가 명시된 경우에만 허용한다. "OK 등록해"·"등록해" 같은 모호 표현은 거부한다.
- 글로벌 nexus의 `backlog-add` 스킬은 POKit cwd(`workspace/pokit/`)에서 호출하지 않는다.
