# POKit — Claude Code Instructions

이 프로젝트의 에이전트 계약은 [`AGENTS.md`](./AGENTS.md)를 단일 소스로 사용합니다.

**Claude Code 세션 시작 시 반드시 `AGENTS.md`를 먼저 읽고 그 규칙을 따르세요.**

이 파일은 의도적으로 짧게 유지됩니다. 모든 운영 계약 — 세션 시작 절차, 외부 쓰기 승인 규칙, Cycle 흐름, 완료 보고 규약 등 — 은 `AGENTS.md`와 `docs/` 하위 문서에 있습니다. Codex 사용자와 Claude Code 사용자가 동일한 계약으로 협업할 수 있도록 한 곳에서 관리합니다.

## 출력 규칙

- `./bin/pokit start` 또는 `./bin/pokit brief` 실행 후 stdout 전체를 그대로 assistant 텍스트로 출력한다. 요약·해석·추가 설명 금지.

## 빠른 참조

- 세션 시작 / 현재 상태 브리핑 / "포킷 시작해줘":
  ```bash
  ./bin/pokit start
  ```
- 자세한 계약: [`AGENTS.md`](./AGENTS.md)
- 운영 모델: [`docs/OPERATING_MODEL.md`](./docs/OPERATING_MODEL.md)
- 온보딩: [`docs/ONBOARDING.md`](./docs/ONBOARDING.md)
