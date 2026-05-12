# Cross-Runtime Diff Checklist

The goal is matching structure, not matching prose.

For each scenario, compare:

1. Frontmatter YAML keys are the same.
2. Markdown H1/H2 heading order is the same.
3. Artifact path pattern is the same: `artifacts/<type>/<issue-id>.md`.
4. Approval plan includes `idempotencyKey` and `writes[]`.
5. Status values use the same set: `Ready`, `Needs Label`, `Needs Clarification`, `Needs Approval`, `Skipped`, `Failed`.

Save execution notes here:

- Codex CLI: `workflows/cross-runtime-diff-results/codex/scenario-[n].md`
- Claude Code: `workflows/cross-runtime-diff-results/claude-code/scenario-[n].md`

Day 2 may ship with the checklist and empty result directories if Claude Code is unavailable. If both runtimes are available, at least Scenario 1 must have result files from both runtimes.
