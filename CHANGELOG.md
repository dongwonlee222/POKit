# Changelog

## v0.1.0 Candidate - 2026-05-12

POKit v0.1.0 is the Day 2 dogfood release candidate.

### Included

- GitHub-distributed repo-native AI workspace for PO/PM work.
- LLM-first quickstart for Codex and Claude natural-language use.
- POKit Brief / next-cycle nudge dashboard.
- Goal-loop guidance for Claude Code `/goal` and Codex skill-based operation.
- Linear read helpers for teams, working cycle context, cycle issues, and labels.
- Optional Linear team selection with automatic single-team detection and `LINEAR_TEAM_KEY` support.
- Dry-run first Linear write helpers with idempotency keys and explicit approval guards.
- Sprint runner that routes `pokit:prd` and `pokit:criteria` issues.
- Run Summary with `AI가 하지 않은 것` first.
- Local PRD and acceptance criteria draft generation with `content_hash` frontmatter.
- Completed/canceled Linear issue skipping.
- Label preflight dry-run helper.
- Cycle retro draft helper.
- Onboarding checklist, README quickstart, first-run smoke test, skill guidance, and example Linear issues.
- Security guidance for `.env`, API key rotation, and generated artifacts.
- Public repo artifact policy: dogfood examples live under `examples/`, local generated outputs stay under `artifacts/`.

### Out Of Scope

- A/B test implementation.
- Persona test implementation.
- PDF export.
- Automatic cron.
- Standalone CLI product or global installer.
- Silent Linear/GitHub writes.

### Release Gate

- Clean check recorded in `docs/RELEASE_CHECKLIST.md`.
- Test suite passed: 31/31.
- GitHub tag `v0.1.0` is not created yet.
- GitHub release is not created yet.
- Tag/release creation requires separate user approval.
