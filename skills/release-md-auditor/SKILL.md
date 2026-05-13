---
name: release-md-auditor
description: Use before a POKit public release, GitHub push/tag/release, or release candidate to check Markdown files for clear document roles, stale release targets, oversized AGENTS.md instructions, and release-readiness notes.
---

# release-md-auditor

## Workflow

Run the deterministic audit before public release work:

```bash
node --experimental-strip-types scripts/release-md-audit.ts --target-version=<version>
```

If it fails, fix only release-facing Markdown role problems:

- stale release checklist target
- unclear canonical policy/source-of-truth language
- overly large `AGENTS.md`
- missing historical/draft role markers
- missing `Docs / Policy` changelog section for release-facing Markdown changes

Then re-run:

```bash
node --experimental-strip-types scripts/release-md-audit.ts --target-version=<version>
node --experimental-strip-types scripts/public-safety-scan.ts
node --experimental-strip-types --test tests/*.test.mjs
```

Show a user-readable release approval preview before GitHub push, tag, or release.

## Boundaries

- Do not push, tag, or create a GitHub release from this skill.
- Do not rewrite product intent in `docs/PRD.md`.
- Do not move historical plans into current policy docs. Add role markers instead.
- Do not add per-file Markdown version fields unless the user explicitly asks for that heavier policy.
