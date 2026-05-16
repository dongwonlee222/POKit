---
name: release-md-auditor
description: 공개 릴리스 전 Markdown 파일의 문서 역할·스테일 릴리스 대상·AGENTS.md 크기·릴리스 준비 상태를 검사한다. "릴리스 감사", "audit 실행해줘" 요청 시 사용.
entry: pokit audit
labels: []
trigger_phrases:
  - "릴리스 감사해줘"
  - "audit 실행해줘"
  - "release audit"
  - "릴리스 전 검사"
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

Show a user-readable release execution preflight and expected benefit summary before GitHub push, tag, or release.

## Boundaries

- Do not push, tag, or create a GitHub release from this skill.
- Do not rewrite product intent in `docs/PRD.md`.
- Do not move historical plans into current policy docs. Add role markers instead.
- Do not add per-file Markdown version fields unless the user explicitly asks for that heavier policy.
