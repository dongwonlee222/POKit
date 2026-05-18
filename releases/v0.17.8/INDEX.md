# v0.17.8 — Release INDEX

> released_at: 2026-05-18T07:40:55.517Z · cycle: n/a

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
- Codex `pokit-start` now uses Linear MCP/Connector first. MCP issue payloads can be injected through `POKIT_LINEAR_CONTEXT_JSON`, allowing `pokit start` to render the normal brief with `linear=mcp` without direct `api.linear.app` CLI network access. Regression: `tests/integration/session-start.test.mjs`.
- `pokit-start` and onboarding now instruct Codex users to connect the Linear app when MCP is unavailable, while keeping `LINEAR_API_KEY` as the terminal/Claude/CI fallback.

## 📂 산출물
_(이관된 산출물 없음)_

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
