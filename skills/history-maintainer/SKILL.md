# history-maintainer

## Trigger

Use when a POKit session, Cycle, run summary, retro, changelog draft, or decision-log candidate needs history maintenance.

## Purpose

Keep POKit history useful without letting a lower-tier model make final product or workflow judgments.

## History Layers

- Task History: per-issue completion evidence, verification commands, changed files, and remaining gaps.
- Session History: compact handoff for the next session, usually `memory/resume-brief.md`.
- Cycle History: run summary, retro, carry-over candidates, approval pending items, and cycle-close draft.
- Product History: changelog candidates and release-note sentence drafts.
- Decision History: decision-log candidates and links to evidence.

## Draftable Work

A lower-tier model may draft:

- completion evidence from command output and diffs
- run summary bullets
- retro observations
- changelog candidates
- cycle-close carry-over lists
- a maximum of 3 decision-log candidates

## Approval-only Work

A lower-tier model must not:

- must not mark Linear issues Done
- append final decisions to `memory/decision-log.md`
- decide that ambiguous scope is complete
- overwrite changed history files when a content hash or updated marker changed
- publish changelog, release notes, tags, GitHub releases, or public deploys

These actions require user approval and, when they touch Linear or GitHub, an idempotency key.

## Completion Evidence Rule

The maintainer can summarize completion evidence, but Done judgment stays with the main agent and the user-approved Cycle flow. If evidence is incomplete, output `Needs Clarification` or `Needs Approval` with the reason.

## Output

Use this compact shape:

```text
Task History
- EVM-39: conflict warning implemented; tests passed.

Cycle History
- Carry-over: EVM-46 remains Todo.

Product History
- Changelog candidate: history write conflict warning.

Decision History
- Candidate 1: confirm whether VERSION file becomes release source of truth.
```
