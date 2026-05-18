# v0.17.7 — Release INDEX

> released_at: 2026-05-18T07:20:21.650Z · cycle: n/a

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
- Codex local installer now creates a PATH-ready `~/.local/bin/pokit` wrapper, so fresh installs can run `pokit start` directly instead of failing with `command not found`. Regression: `tests/integration/codex-plugin-install.test.mjs`.
- `pokit start` now keeps flow progress visible and preserves existing flow state across session starts. Linear DNS failures are surfaced as `fetch failed: ENOTFOUND api.linear.app` instead of a generic Node stack tail. Regression: `tests/integration/session-start.test.mjs`, `tests/internal/workflow-state.test.mjs`, `tests/integration/verb-dispatch.test.mjs`.
- Onboarding now routes fresh users through `./bin/install-codex-plugin` before `pokit start`, and explains the `~/.local/bin` PATH expectation.

## 📂 산출물
_(이관된 산출물 없음)_

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
