# v0.17.9 — Release INDEX

> released_at: 2026-05-18T08:03:28.254Z · cycle: n/a

## 📋 이슈 (계획)
_(manifest issues 비어 있음)_

## ✅ 완료
_(없음)_

## ⏭️ 미결 → 다음 cycle
- **artifacts-migration** —  _(owner: agent)_
- **pokit-159-retrieval-impl** —  _(owner: POKIT-159)_
- **wiring-intended-auto-extract** —  _(owner: agent)_
- **build-release-manifest-carry-forward** —  _(owner: agent)_
- **parse-changelog-section-date-line** —  _(owner: agent)_

## 📝 Changelog
- Cold-start agent instructions now make MCP-capable runtimes explicitly MCP-first and forbid bare `pokit start` before Linear MCP payload injection. This prevents new sessions from following the API-key DNS approval loop when Linear Connector is available. Regression: `tests/contracts/agent-rules.test.mjs`.
- Onboarding and `CLAUDE.md` now separate MCP-first skill invocation (`$pokit-start` / `@pokit`) from terminal/CI-only `pokit start`.

## 📂 산출물
_(이관된 산출물 없음)_

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
