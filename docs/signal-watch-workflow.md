# PO Signal Watch Workflow

This workflow turns one observed signal into a product judgment without becoming a monitoring dashboard.

## Flow

```text
Source Registry
-> Raw Signal
-> Signal Summary
-> Discovery Depth
-> Discovery Brief
-> Backlog Candidate dry-run
-> user-approved Linear write only when needed
```

## Signal Summary

A Signal Summary is the smallest useful interpretation of a source item.

Required fields:

- source and date checked;
- raw observation;
- why it matters to POKit;
- affected product area;
- confidence;
- recommended next step.

## Discovery Depth

Use Light Discovery when the signal is narrow, already understandable, and only needs one candidate or one docs update.

Use Full Discovery Brief when the signal changes a parent-level flow, user-facing behavior, external dependency, product identity, release policy, or a multi-issue bundle.

Do not force every signal through full discovery. The default is the lightest path that gives the PO a clear decision.

## Backlog Candidate dry-run

A candidate created from Signal Watch must include:

- candidate title and parent/child shape;
- evidence from the Signal Summary;
- discovery depth used;
- expected benefit;
- what will not change;
- idempotencyKey;
- approval block.

Signal Watch must not create Linear issues without approval. The dry-run is the stopping point unless the user explicitly approves the external write.
