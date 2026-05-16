# POKit Agent Instructions

Default language: ko-KR. 사용자-facing 답변, 보고서, 로컬 artifact는 한국어를 기본으로 쓴다. API 이름, 파일명, 코드 식별자, 고유 product 용어만 영어를 허용한다.

## Core Principle

모든 구조 결정은 **LLM 명확성**을 최우선으로 한다. 폴더·문서·메모리 위치는 매 세션 cold start 작업자가 즉시 인식 가능한 형태로 유지한다. 가벼움의 기준은 분량이 아니라 작업자 LLM이 헷갈리지 않는 구조다.

## Main Agent Orchestration Contract

The main agent orchestrates POKit work; it does not replace hooks, templates, scripts, or subagent contracts.

- Keep user intent, scope, approval boundary, and final judgment in the main context.
- Use subagents only for bounded draft work; the main agent integrates, verifies, and owns completion claims.

## POKit session start contract

- First run `pokit start`. Output must include `pokit:boot ok`.
- Re-run after any session resume, context compaction, or handoff before continuing POKit work.
- For "POKit 시작해줘" / "현재 상태 브리핑해줘" / "다음에 뭐 하면 돼?": `pokit start`.
- For detail or "1번 자세히": `pokit brief --detail {cycle|backlog|approvals}` or `pokit brief --candidate N`.

## Verbs

`pokit help` for the full list. Primary verbs: `start`, `brief`, `run`, `close`, `retro`, `hotfix`, `audit`, `guard`, `progress`, `end`, `safety`. 모든 verb는 `scripts/internal/verb-dispatch.ts`를 경유해 on_error 자동 처리.

작업 분류(Inline Fix vs hotfix vs 백로그) 기준: [docs/_details/release-flow.md](docs/_details/release-flow.md). 일회성 ad-hoc 스크립트는 dispatcher 미경유 — 직접 try/catch + console.error로 종료, 재사용 흐름이면 `cli/`로 승격.

## Detailed Policies

모든 운영 규칙은 주제별 파일에 있다. 작업 종류에 따라 필요한 것만 읽는다.

- [docs/_details/approval-flow.md](docs/_details/approval-flow.md) — write safety, human intervention matrix, external write rules, error/blocker handling
- [docs/_details/cycle-flow.md](docs/_details/cycle-flow.md) — Cycle Steward, progress contract, completion celebration, remains/next
- [docs/_details/release-flow.md](docs/_details/release-flow.md) — Version Run, Linear Weekly Cycle, hotfix
- [docs/_details/subagent-contract.md](docs/_details/subagent-contract.md) — main/subagent split, model tiers, definition pipeline
- [docs/_details/memory-contract.md](docs/_details/memory-contract.md) — resume brief, memory MVP, frontmatter schema
- [docs/_details/completion-report.md](docs/_details/completion-report.md) — flow adherence, completion structure, dry-run rules
- [docs/_details/visualization.md](docs/_details/visualization.md) — ASCII/Mermaid usage
- [docs/_details/cli-internals.md](docs/_details/cli-internals.md) — verb → node mapping (debugging escape hatch)
- [docs/OPERATING_MODEL.md](docs/OPERATING_MODEL.md) — index + anchor stubs
