# Memory Contracts — POKit Memory MVP and Resume Brief

## POKit Memory MVP Contract

POKit memory starts as local runtime state, not public product content. The goal is session continuity and traceability without publishing private memory or raw collected data.

Private Memory Boundary:

- Recent handoff state remains in `memory/resume-brief.md`, `memory/current-cycle.yaml`, `memory/current-cycle.md`, `memory/decision-log.yaml`, and `memory/context-map.yaml`.
- Long-term private notes live in `memory/notes/*.md` and are ignored by git.
- Location memory is a generated `memory/index.yaml`; regenerate it from notes instead of hand-editing it.
- External/raw collection input lives under `collected/` and is ignored by git.
- Public reusable examples must be sanitized and stored under `examples/`, not copied from private notes or `collected/`.

Minimal Frontmatter Schema:

```yaml
id: mem-YYYY-MM-DD-short-topic
kind: note
scope: private
source: POKIT-109
updated_at: YYYY-MM-DD
```

Allowed `scope` values are `private` and `sanitized_example`. Public memory scope is not allowed in private memory notes.

Validator:

```bash
node --experimental-strip-types scripts/memory-frontmatter-validator.ts memory/notes
```

Unified Memory Index:

```bash
node --experimental-strip-types scripts/memory-index.ts memory/notes > memory/index.yaml
```

## Linear Issue Creation Contract

- Every generated Linear issue dry-run must include an idempotency key.
- Parent and Child relationships must be explicit when the work is part of a larger issue.
- Relationship metadata must include `Depends on`, `Related`, `Source`, and `Evidence` when known; use `none` rather than leaving the relation ambiguous.
- Expected artifact and Done gate must be written in the issue description before external Linear write approval.
- Release-bundle candidates must include a target version and release bundle in both the title or preflight summary and the issue description.
- User-facing Linear issue titles should be Korean-first. English is allowed for version tags, API names, file paths, and established product terms.
- Local dry-runs are evidence, not external writes; Linear status, relation, label, and comment changes still require user approval.

## Resume Brief Contract

`memory/resume-brief.md` is the compact handoff for the next POKit session. It should stay small enough to read before any other memory file.

Required sections:

1. `## 어디서 멈췄나`
2. `## 다음에 무엇을 하나`
3. `## 차단된 것`
4. `## 참조`

Rules:

- Keep it near 1-2KB.
- Use one Cycle-level next action, not a mechanical substep.
- Mention pending issue IDs only as context inside the Cycle bundle.
- Link to commands or canonical docs instead of copying long policy text.
- Include an artifact, doc, template, or workflow link in `## 참조`; command-only handoff is not enough.
- Do not include raw context, full transcripts, or long original text blocks.
- Refuse stale overwrites when the file content hash changed; mark the write as `Needs Approval`.

Validator:

```bash
node --experimental-strip-types scripts/resume-brief-validator.ts memory/resume-brief.md
```
