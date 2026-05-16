# POKit Operating Model

Canonical policy source for approvals, cycle execution, release gates, artifact handling, and documentation ownership.

POKit uses Linear as the official backlog and the current Codex/Claude session plan as the live work board.

## Current Phase

POKit Day 2 walking skeleton is complete. The project is now in dogfood validation: real Linear reads and approved writes are allowed only when represented by tracked Linear tasks and explicit approval.

Still out of scope: A/B test implementation, persona test implementation, PDF export, automatic cron, standalone CLI product.

## Documentation Source Of Truth

Each document has one job:

- `README.md`: short product promise, quickstart, and links to canonical docs.
- `docs/ONBOARDING.md`: step-by-step setup and first-run procedure.
- `docs/OPERATING_MODEL.md`: canonical policy source for approvals, cycle execution, completion, artifact handling, and documentation ownership.
- `docs/ROADMAP.md`: roadmap compass for goals, initiatives, candidate cycles, and Linear sync policy.
- `workflows/hooks.yaml`: canonical workflow hook list.
- `examples/`: sanitized reusable samples.
- `artifacts/`: local generated workspace output, not canonical documentation.

Do not duplicate full policy text across README and ONBOARDING. Link to the canonical section instead.

## Product Philosophy and Decision Rules

POKit is built to keep scrum automation lightweight. User-facing POKit output is Korean-first. Replies, close reports, local artifacts, run summaries, retros, examples, and dry-run explanations should be written in Korean by default. English is allowed for API names, file paths, code identifiers, command names, and established product terms. If a generated artifact is meant for the user to read, it must be understandable without translating English prose.

Backlog items should pass the POKit identity fit check:

1. Does it help people and LLMs run scrum together?
2. Does it help the user understand faster or decide with less friction?
3. Does it fit the backlog -> cycle -> execution -> retro flow?
4. Can it stay lightweight on top of Linear and the GitHub repo?
5. Does it avoid becoming a new heavy management tool?
6. Are external state changes still controlled by execution preflight and approval?
7. Does it automate local context while preserving approval boundaries for external state?

## Detailed Policy Documents

Full policy text lives in `docs/_details/`:

| Topic | File |
|-------|------|
| External write approval, dry-run, idempotency, Write Safety | [`docs/_details/approval-flow.md`](docs/_details/approval-flow.md) |
| POKit Memory MVP Contract, Resume Brief Contract, frontmatter schema | [`docs/_details/memory-contract.md`](docs/_details/memory-contract.md) |
| Inline Fix, 버전 스프린트 Release, Release And Hotfix Cycles, Public Release Safety | [`docs/_details/release-flow.md`](docs/_details/release-flow.md) |
| Cycle Steward, 위클리 서클, Focus Runs, Cycle Step Progress, Celebration, Completion Ritual, Cycle-first Guard | [`docs/_details/cycle-flow.md`](docs/_details/cycle-flow.md) |
| Main Context/Subagent Call Contract, Model Tier Policy, Definition Pipeline | [`docs/_details/subagent-contract.md`](docs/_details/subagent-contract.md) |
| Completion Report Contract, External Write Confirmation Contract | [`docs/_details/completion-report.md`](docs/_details/completion-report.md) |
| Conversation Visualization Contract, ASCII rules | [`docs/_details/visualization.md`](docs/_details/visualization.md) |

## Section Index (Anchor Targets)

The following H2 anchors are preserved for backward compatibility with existing references:

### Problem/Error Review Memo Contract

When POKit confirms an error, blocker, wrong assumption, failed external call, failed test, or incorrect assistant behavior, it must leave a local Backlog memo before closing the matter.

Required location: `memory/problem-reviews/[short-kebab-problem]-problem-review.md`

Required Korean headings:

```text
# 🚨 Problem / Error Review: [짧은 제목]

## 1️⃣ 무엇이 문제인가?
## 2️⃣ 언제 / 누구로 인하여 / 왜 발생했나?
## 3️⃣ 근본 해결 방법 제안
```

The third section must propose a durable prevention mechanism. A vague reminder like "다음부터 주의" is not enough. The local memo is mandatory even when Linear tracking will follow.

### Session Bootstrap Contract

POKit session continuity must not depend on long instruction memory. At session start, after context compaction, and after any handoff, POKit must run:

```bash
node --experimental-strip-types scripts/session-start.ts
```

The expected final line is:

```text
pokit:boot ok cycle=<cycle name> hooks=loaded read_order=<n>
```

If the signature is missing, the agent must stop POKit work and report the bootstrap failure.

### Model Tier Policy

See full details: [`docs/_details/subagent-contract.md#model-tier-policy`](docs/_details/subagent-contract.md#model-tier-policy)

Use stronger models where judgment matters. Main agent owns product judgment, integration, and final Done claims. Lower-tier subagents handle bounded file-owned work only.

### Resume Brief Contract

See full details: [`docs/_details/memory-contract.md#resume-brief-contract`](docs/_details/memory-contract.md#resume-brief-contract)

`memory/resume-brief.md` is the compact handoff for the next POKit session. Keep it near 1-2KB. Do not include raw context, full transcripts, or long original text blocks.

### Cycle Step Progress Contract

See full details: [`docs/_details/cycle-flow.md#cycle-step-progress-contract`](docs/_details/cycle-flow.md#cycle-step-progress-contract)

Default Cycle execution progress has 10 steps. Approval stages show `▶ 승인 필요`. Release flows use a release 전용 progress bar.

### Completion Report Contract

See full details: [`docs/_details/completion-report.md#completion-report-contract`](docs/_details/completion-report.md#completion-report-contract)

Default completion response must be short. Use structured reports only for Cycle close, external write result summaries, test failures, approval-pending work, or explicit report requests.

### External Write Confirmation Contract

See full details: [`docs/_details/completion-report.md#external-write-confirmation-contract`](docs/_details/completion-report.md#external-write-confirmation-contract)

External write dry-runs are mandatory at approval boundaries. A completion response that says an external write was skipped is incomplete unless it also includes the executable dry-run.

## Operating Units

POKit separates tracking, execution, and release units. The canonical glossary lives in `docs/architecture/00-glossary.md`.

- 위클리 서클: a Monday-starting weekly tracking container in Linear.
- 버전 스프린트: the actual execution loop, scoped by `targetVersion` or `runId`.
- Cycle Bundle: the issue bundle selected for a 버전 스프린트.
- Release Bundle: the public release bundle for a specific `targetVersion`.
- Non-release Run: a 버전 스프린트 that closes without public release.

Architecture flow references: `docs/architecture/07-backlog-intake-flow.md`, `docs/architecture/08-cycle-vs-linear-cycle.md`, `docs/architecture/09-release-and-non-release-flow.md`, `docs/architecture/10-versioning-policy.md`

## Roles

- Linear issue: official task, priority, discussion, and weekly cycle placement.
- 버전 스프린트: scoped execution loop.
- Session task list: temporary progress tracker for the current AI work session.
- GitHub commit: durable implementation history.

## Artifact Policy

- `artifacts/` is the local workspace for generated PRDs, criteria, manifests, and run summaries.
- `examples/` is the public workspace for reusable fixtures and dogfood samples.
- Public commits should exclude credentials, customer data, private project details, local memory, generated artifacts, and live workspace outputs.

## Distribution Model

POKit is distributed as a GitHub repository, not as a hosted service or standalone CLI.

- Public upstream: reusable docs, scripts, skills, tests, and examples.
- Team/private workspace: local `.env`, team memory, generated artifacts, and workspace-specific operating notes.
- Linear workspace: official backlog, cycle placement, status, priority, and discussion history.

## Weekly Rhythm

1. Put work into a weekly Linear cycle.
2. Run 버전 스프린트s.
3. Review the Run Summary.
4. Approve or reject any proposed Linear write plan.
5. Commit code/docs changes to GitHub.
6. At cycle end, summarize completed work and open risks before closing the cycle.

## Completed Issue Archive Guardrail

Linear Free workspaces have a 250 issue limit, so POKit uses a 200 completed issue soft limit.

When the current cycle/context has 200 or more completed issues, `scripts/archive-guardrail.ts` prints a dry-run contract for local archive files. Linear cleanup stays blocked until the user explicitly approves a separate cleanup plan.

## Next Backlog

Use `scripts/backlog-seed-plan.ts` to print a dry-run plan for the initial POKit Linear backlog. Review the plan before creating any Linear issues.
