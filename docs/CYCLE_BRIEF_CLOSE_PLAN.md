# POKit Cycle Brief and Close Plan

Status: Draft for Opus review  
Date: 2026-05-13

## Review Question

Does this plan keep POKit aligned with its product philosophy while fixing the current session brief and cycle completion gaps?

## POKit Philosophy

POKit is built for lightweight scrum automation, not for turning the user into an approval manager.

When designing or changing POKit, prefer decisions in this order:

1. Minimize user approvals.
2. Automate around the Linear backlog and cycle workflow.
3. Keep the experience simple, light, and easy to resume.

User approval should happen at the intent level, not at every mechanical step. If the user approves a clear goal, POKit should handle the directly required local drafts, routing, summaries, and safe mechanical updates as one coherent flow.

POKit should ask again only when the action is destructive, externally visible, ambiguous, security-sensitive, or changes an approved product decision.

Good POKit behavior feels like:

- "Run this cycle bundle."
- "Close this completed cycle."
- "Prepare the next backlog candidates."

Bad POKit behavior feels like:

- asking for approval on every file draft;
- asking separately for every label or minor status sync;
- making the user decide implementation details that POKit can infer from the backlog;
- hiding risky external writes.

The default posture is: do the obvious safe work, show concise evidence, and ask once when judgment or irreversible action is required.

## Current Problem

The current POKit brief only follows Linear's active cycle. On 2026-05-13, Linear still reports Cycle N-1 as active, so `scripts/session-brief.ts` shows:

- Todo 0
- In Progress 0
- Done 27
- no next candidates
- recommendation to add new backlog candidates

That output is misleading because actual Linear state also contains:

- Cycle N Todo issues: POKIT-32, POKIT-33, POKIT-34
- Backlog issues: POKIT-35 through POKIT-39

The root issue is that POKit treats "Linear active cycle" as "POKit working target." These should be related, but not identical. A Linear cycle is a calendar container; POKit's working target should be the next useful scrum work surface.

## Design Goals

1. Keep the first brief useful even when the active cycle is operationally complete.
2. Add a lightweight cycle close flow that starts after all selected tasks are done.
3. Show next cycle candidates and backlog candidates without requiring extra user prompts.
4. Preserve external write safety without fragmenting approval into many small gates.
5. Prepare for subagent-based implementation without file conflicts.
6. Fold A/B before-after planning into the cycle workflow as a lightweight artifact, not a full experiment engine.

## Non-Goals

- Do not build a standalone CLI product.
- Do not build an A/B test execution engine.
- Do not auto-close or mutate Linear cycles without an intent-level approval.
- Do not add repeated confirmation prompts for local drafts, summaries, or inferred routing.
- Do not make the brief long or dashboard-heavy.

## Proposed Behavior

### Session Brief

POKit should still inspect the Linear active cycle first, but it should classify it as either active work or operationally complete.

Operationally complete means:

- every issue in the active cycle is Done, or has an explicit carry-over note;
- completion is computed from sprint dry-run categories, not raw status counts alone;
- Cancelled issues without carry-over notes block completion and appear in the close summary;
- custom statuses that POKit cannot classify block completion and appear as "Needs Review" rather than disappearing from the brief.

When the active cycle is operationally complete:

1. Show a compact completion line for the active cycle.
2. Prefer upcoming cycle issues as "next candidates."
3. Show team Backlog issues below the next candidates.
4. Recommend the next action with compact confirmation choices based on real candidates.
5. Only recommend adding new backlog when upcoming cycle and backlog are both empty.

Expected shape:

```text
Cycle N-1 complete: Todo 0 · 진행 0 · 완료 27

다음 후보 (Cycle N, 2026-05-14 시작)
1. POKIT-32 model-tier policy 문서화 · Todo · pokit:criteria
2. POKIT-33 resume-brief compact contract 강화 · Todo · pokit:criteria
3. POKIT-34 session-close 종료 리포트 스크립트 구현 · Todo · pokit:prd

Backlog
- POKIT-35 prioritizer ICE-lite 시범 구현
- POKIT-36 history-maintainer skill 추가
- POKIT-37 cycle-close 사이클 종료 초안 생성
- POKIT-38 changelog 후보 자동 추출
- POKIT-39 history write conflict warning 구현

실행: "Cycle N 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘"
```

### Cycle Completion

Cycle completion should be intent-level and lightweight.

When all selected tasks are done, POKit should automatically prepare a close summary. The user should see one concise confirmation, not a series of small approvals.

The close summary should include:

- completed issue count;
- generated artifact list;
- open carry-over items, if any;
- Run Summary path;
- Retro path;
- decision-log candidates, if any;
- changelog candidates, if any;
- next recommended action with compact confirmation choices.

If the user says "마무리해줘", "완료 처리해줘", or approves the close summary, POKit may run the directly required local close work as one coherent flow.

Intent-level approval scope:

| Work | Included in close intent | Separate approval |
|---|---:|---:|
| Run Summary and Retro local markdown generation | yes | no |
| Decision-log candidate extraction to a separate draft file | yes | no |
| Decision-log append to canonical `memory/decision-log.md` | no | yes |
| Changelog candidate extraction to a separate draft file | yes | no |
| `CHANGELOG.md` append | no | yes |
| `memory/resume-brief.md` and `memory/current-cycle.{md,yaml}` refresh | yes | no |
| Carry-over dry-run plan generation | yes | no |
| Linear issue cycle or status changes | no | yes |
| GitHub comment, PR, push, release, or tag | no | yes |

Rule: writing candidates to separate draft artifacts is included in the close intent. Editing canonical history, public changelog, or external systems requires separate approval.

Decision-log candidate caps:

- session close: at most 3 candidates;
- cycle close: at most 5 candidates;
- if more candidates appear, surface a warning and let the user trim instead of filling history with noise.

Separate confirmation is still required for:

- destructive Linear/GitHub changes;
- GitHub push, release, or tag;
- externally visible comments;
- ambiguous Done transitions;
- decision-log confirmation if the entry changes product policy.

### A/B Before-After in Cycle

POKit already defines `pokit:abtest` as a Day 3+ extension in `docs/DESIGN.md` and `docs/PRD.md`.

This plan should keep that extension lightweight:

1. During cycle execution, detect issues labeled `pokit:abtest`.
2. Route them to an A/B planning artifact, not to an experiment runtime.
3. Require baseline, variant, goal metric, primary metric, guardrails, and success criteria.
4. If those fields are missing, mark the issue as `Needs Clarification` and ask in one grouped clarification block.
5. Generate local artifacts under `artifacts/experiments/`.
6. Do not auto-generate persona before-after notes in the first pass.
7. Generate `artifacts/persona-tests/` only when the PO explicitly asks "페르소나 관점도 봐줘", or when the experiment artifact has been edited by the PO at least once and its content hash changed.

This supports the POKit philosophy because the user can put an experiment idea in the backlog and run the cycle. POKit prepares the before-after comparison and user-perspective checks without making the user manage a separate testing workflow.

## Subagent Parallelization

Subagents can help if implementation is split by file ownership. The main Codex agent should remain responsible for final integration and verification.

Model assignment should follow the same philosophy as the model-tier policy:

- Main agent: use `gpt-5.5` for judgment-heavy work, final integration, risk review, test interpretation, and user-facing decisions.
- Agent A, docs: use `gpt-5.4-mini` for first-pass documentation edits when the contract is already clear. Escalate to `gpt-5.4` if the approval philosophy or write-safety language becomes ambiguous.
- Agent B, Linear context: use `gpt-5.4` because `scripts/linear.ts` changes affect API shape, caching, state classification, and downstream behavior.
- Agent C, brief output: use `gpt-5.4` because `scripts/session-brief.ts` is user-facing and must balance compact UX, Korean copy, and correctness.
- Verification/review pass: use main `gpt-5.5` after subagents finish. Do not let a cheaper model make final completion or safety claims.

This keeps expensive reasoning concentrated in the main thread while letting bounded, file-owned implementation happen with lower-cost models.

Phase 0 should happen before parallel work:

1. Main defines the `WorkingContext` type contract in `scripts/linear.ts`.
2. Main adds the philosophy section skeleton to `docs/OPERATING_MODEL.md`.
3. Main keeps Phase 0 under 30 minutes and does not implement full behavior.

After Phase 0, the type and philosophy contracts are stable enough for parallel workers.

Recommended split:

| Agent | Scope | Files |
|---|---|---|
| Main agent | Phase 0 contracts, integration, test run, safety review | all touched files |
| Agent A | Philosophy and operating docs | `README.md`, `docs/OPERATING_MODEL.md`, `AGENTS.md` |
| Agent B | Working target and Linear context | `scripts/linear.ts`, `tests/linear.test.mjs` |
| Agent C | Brief output and before-after checks | `scripts/session-brief.ts`, `tests/session-brief.test.mjs` |

Use subagents only after the design is approved. Do not let multiple agents edit the same files.

## Implementation Backlog Proposal

Create these Linear issues after review and user approval:

### 1. POKit Philosophy decision 기준 문서화

Label: `pokit:criteria`

Scope:

- Add philosophy section to `README.md`.
- Add decision rules to `docs/OPERATING_MODEL.md`.
- Add compressed agent rule to `AGENTS.md`.
- Ensure the write-safety language supports intent-level approval rather than many mechanical approvals.

Acceptance:

- Philosophy is visible to users and agents.
- Approval minimization is explicit.
- Risky external writes still require clear approval.

### 2. Session Brief working target 개선

Label: `pokit:criteria`

Scope:

- Update `scripts/linear.ts` so POKit can see active cycle, upcoming cycle, and team backlog together.
- Update `scripts/session-brief.ts` so an operationally complete active cycle does not hide next-cycle or backlog work.
- Show upcoming cycle start date in the heading so future planned cycles do not look like already-approved execution work.
- Add tests for active-cycle-complete plus upcoming/backlog candidates.

Acceptance:

- If active cycle has no remaining actionable work, brief shows next cycle candidates.
- Backlog issues are visible below next candidates.
- Recommendation sentence is based on real candidates.
- If the upcoming cycle starts in the future, brief labels it as scheduled and uses a review-oriented sentence instead of an execution push.
- "Add new backlog" appears only when no upcoming or backlog candidates exist.

### 3. Cycle close summary and next-cycle handoff

Label: `pokit:prd`

Scope:

- Add a local cycle close summary flow.
- Keep local summary generation automatic after all selected tasks are complete.
- Ask once at intent level before externally visible or policy-changing writes.
- Update resume brief or memory pointer so the next session does not get stuck on the completed cycle.
- Block close when cancelled or custom-status issues lack carry-over classification.

Acceptance:

- Completed cycle produces a short close summary.
- Run Summary, Retro, carry-over, changelog candidates, and decision-log candidates are surfaced.
- Next brief points to upcoming cycle or backlog.
- No repeated confirmation prompts are introduced.
- Candidate history noise is capped: 3 decision-log candidates for session close, 5 for cycle close.

### 4. A/B before-after cycle artifact 설계

Label: `pokit:criteria`

Scope:

- Document how `pokit:abtest` enters the cycle runner.
- Define minimum artifact schema for `artifacts/experiments/[issue-id].md`.
- Define grouped clarification behavior when baseline, variant, or metric inputs are missing.
- Keep persona tests as an explicit follow-up artifact, not an automatic side effect.

Acceptance:

- A/B work is a cycle artifact, not an execution engine.
- Missing experiment inputs are grouped into one clarification block.
- Persona before-after notes are generated only after explicit PO request or after PO-edited experiment artifact hash changes.
- The design matches `docs/DESIGN.md` and `docs/PRD.md`.

## File-Level Change Map

### `README.md`

Add a short "POKit Philosophy" section near the opening promise and before day-to-day usage.

### `docs/OPERATING_MODEL.md`

Add a "Product Philosophy and Decision Rules" section near the top. Update Write Safety so intent-level approval is the default and per-step approval is reserved for risky actions.

### `AGENTS.md`

Add compressed agent-facing philosophy rules near the top, before session start behavior.

### `scripts/linear.ts`

Current relevant area:

- `WorkingCycleContext` type around line 71
- `getWorkingCycleContext()` around line 330

Needed change:

- Either extend `WorkingCycleContext` with active/upcoming/backlog fields, or create a new `WorkingContext` type.
- Fetch active cycle issues, upcoming cycle issues, and team backlog issues in one GraphQL context call where possible.
- Cache the context for 30 seconds within a session so repeated brief renders do not hit Linear again.
- Invalidate cache on cycle close or explicit refresh.

### `scripts/session-brief.ts`

Current relevant area:

- `buildSessionBrief()` around line 19
- `buildBacklogDetail()` around line 84
- `selectNextCandidates()` around line 194

Needed change:

- Select display target based on operational completeness.
- Add a compact completed-cycle line.
- Render backlog candidates as a separate section.
- Keep output short.

### Tests

Update:

- `tests/linear.test.mjs`
- `tests/session-brief.test.mjs`

Add cases:

- active cycle has only Done issues, upcoming cycle has Todo issues, backlog has issues;
- active cycle has Todo issues, so it remains the working target;
- no upcoming/backlog issues, so "add new backlog" is shown;
- backlog detail includes actual Backlog state issues.

## Before and After Check

Before:

```text
Cycle N-1만 봄
Todo 0 · 진행 0 · 완료 27
다음 후보 없음
추천: 새 후보를 Backlog에 정리
```

After:

```text
Cycle N-1 complete 표시
Cycle N 후보 POKIT-32~34 표시
Backlog POKIT-35~39 표시
추천: Cycle 전체 후보 실행
```

Success criteria:

- User can tell what to do next without asking a follow-up.
- Brief stays compact.
- Approval prompts do not increase.
- Linear/GitHub writes remain dry-run protected.
- Cycle close becomes a single intent-level action.

## Optimization and Risk Review

### Complexity Risk

Risk: Brief context becomes too large.

Mitigation: show top 3 next candidates and a compact backlog list. Detail views can show more.

### Approval Creep

Risk: Cycle close adds many confirmation gates.

Mitigation: one close summary, one intent-level approval, grouped risky writes only.

### Linear API Cost

Risk: fetching active, upcoming, and backlog issues adds API calls.

Mitigation: prefer one GraphQL query that fetches active cycle issues, upcoming cycle issues, and team backlog issues with enough fields, then classify locally. Cache the result for 30 seconds within a session. Invalidate cache on cycle close or explicit "refresh".

### False Completion

Risk: active cycle looks complete but hidden approvals or clarifications remain.

Mitigation: compute completion from sprint dry-run categories, not only issue status counts.

### A/B Scope Creep

Risk: A/B test turns into analytics or experiment execution.

Mitigation: explicitly limit to planning artifacts and before-after comparison.

## Opus Review Prompt

Please review this POKit design plan.

Focus on:

1. Does it follow the POKit philosophy of minimal user approval, scrum/backlog automation, and lightweight UX?
2. Does the cycle completion flow avoid excessive confirmation while preserving safety?
3. Does the session brief design correctly avoid getting stuck on an already-complete active cycle?
4. Is the subagent split safe from file conflicts?
5. Is the A/B before-after cycle integration appropriately lightweight, or does it risk scope creep?
6. Are there hidden risks in Linear state handling, completion detection, or next-cycle handoff?

Please respond with:

- Keep / Change / Reject for the overall plan.
- Top 5 risks.
- Specific edits recommended before implementation.
- Any simpler alternative that better fits POKit.
