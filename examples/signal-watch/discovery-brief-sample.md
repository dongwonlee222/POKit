# Signal Watch Discovery Brief Sample

## Signal Summary

- Source: competitor changelog
- Checked at: 2026-05-14
- Raw signal: a competing product added a weekly "review what changed" digest for project owners.
- Why it matters: POKit users can lose the thread between cycle work, local commits, and Linear status.
- Product area: session brief, cycle close, resume handoff
- Confidence: medium
- Recommended next step: create a candidate to improve cycle-level change visibility.

Recommended discovery depth: Light Discovery.

## Discovery Brief

The signal reinforces an existing POKit direction: summarize operational state in the brief instead of making the user inspect every issue. The immediate product question is not whether POKit should become a dashboard. It is whether the current brief and cycle close should make change visibility easier during handoff.

## Fit Check

1. Helps people and LLMs run scrum together: yes.
2. Helps the user understand faster: yes.
3. Fits backlog -> cycle -> execution -> retro: yes.
4. Stays lightweight on Linear/GitHub: yes.
5. Avoids becoming a heavy management tool: yes.

## Backlog Candidate

Title: Add cycle-level change visibility to POKit Brief

Shape:

```text
Parent: Cycle change visibility
  - Brief progress snapshot
  - Cycle close before/after summary
```

Done gate: a session brief or cycle close draft shows what changed without requiring a separate dashboard.
