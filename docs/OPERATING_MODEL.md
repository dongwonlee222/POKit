# POKit Operating Model

Canonical policy source for approvals, cycle execution, release gates, artifact handling, and documentation ownership.

POKit uses Linear as the official backlog and the current Codex/Claude session plan as the live work board.

## Current Phase

POKit Day 2 walking skeleton is complete. The project is now in dogfood validation: real Linear reads and approved writes are allowed only when represented by tracked Linear tasks and explicit approval.

Still out of scope:

- A/B test implementation
- persona test implementation
- PDF export
- automatic cron
- standalone CLI product

Current-session work should start from Linear tasks, then use the session task list only as a temporary progress tracker.

## Documentation Source Of Truth

Keep Markdown light by assigning each document one job:

- `README.md`: short product promise, quickstart, and links to canonical docs.
- `docs/ONBOARDING.md`: step-by-step setup and first-run procedure.
- `docs/OPERATING_MODEL.md`: canonical policy source for approvals, cycle execution, completion, artifact handling, and documentation ownership.
- `docs/ROADMAP.md`: roadmap compass for goals, initiatives, candidate cycles, and Linear sync policy before work is promoted into Linear.
- `workflows/hooks.yaml`: canonical workflow hook list.
- `docs/DESIGN.md`: design background and historical rationale. If it conflicts with `OPERATING_MODEL.md` or `workflows/hooks.yaml`, the newer canonical files win.
- `examples/`: sanitized reusable samples.
- `artifacts/`: local generated workspace output, not canonical documentation.

Do not duplicate full policy text across README, ONBOARDING, and DESIGN. Link to the canonical section instead.

## Cycle-first Execution Guard

POKit thinks in Backlog and executes in Cycle.

Backlog-only work may define scope, inspect files, gather evidence, and create dry-run plans. Durable implementation starts only after the work is attached to a Linear cycle or an explicitly approved cycle bundle.

Before code, docs, tests, or canonical memory files are changed, run or emulate:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --issue POKIT-42 --cycle-id <cycle-id> --cycle-name "Cycle N"
```

The guard intentionally does not ask for more user approvals. It only blocks implementation when traceability is missing.

Completed cycles are immutable by default. Once a cycle is operationally complete, new Todo work must move to the next Linear cycle, not back into the completed cycle. The only exception is an explicit user command to reopen that completed cycle.

Before assigning issues to a cycle, run or emulate:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation cycle_assignment --issue POKIT-35 --cycle-id <target-cycle-id> --cycle-name "Cycle N"
```

If the target cycle is complete, include `--target-cycle-complete`; the guard must block unless the user explicitly said to reopen the completed cycle and `--reopen-completed-cycle` is present.

## Product Philosophy and Decision Rules

POKit is built to keep scrum automation lightweight. The product should feel like a helpful operator around Linear, not like a gatekeeper that asks for permission on every small step.

POKit is not a complex management system. It is a lightweight workspace where people and LLMs run scrum together.

User-facing POKit output is Korean-first. Replies, close reports, local artifacts, run summaries, retros, examples, and dry-run explanations should be written in Korean by default. English is allowed for API names, file paths, code identifiers, command names, and established product terms such as Linear, GitHub, Signal Summary, or Backlog Candidate. If a generated artifact is meant for the user to read, it must be understandable without translating English prose.

The automation boundary is intentional:

- AI should keep moving local work forward.
- Local handoff, summaries, artifacts, and resume briefs may be written automatically when they follow the approved intent.
- Externally visible state changes stay under user control.
- Linear/GitHub writes, Done transitions, public comments, releases, and destructive actions require explicit approval.

This trade-off can leave local handoff and Linear state briefly out of sync, and it means a final sync step may require approval. POKit accepts that cost because hidden Linear/GitHub changes would damage trust more than a small approval boundary.

Default session close behavior:

```yaml
session_close:
  write_resume_brief: auto
  write_local_summary: auto
  linear_updates: approval_required
  github_updates: approval_required
```

Backlog items should pass the POKit identity fit check:

1. Does it help people and LLMs run scrum together?
2. Does it help the user understand faster or decide with less friction?
3. Does it fit the backlog -> cycle -> execution -> retro flow?
4. Can it stay lightweight on top of Linear and the GitHub repo?
5. Does it avoid becoming a new heavy management tool?
6. Are external state changes still controlled by execution preflight and approval?
7. Does it automate local context while preserving approval boundaries for external state?

Backlog memo to Linear candidate flow:

```text
Backlog Memo
→ Identity Fit Check
→ Discovery 필요 여부 판단
→ Backlog Candidate
→ Linear Parent Issue
→ Sub-issue 산출물
→ 실사용 Done Gate
```

Do not force every memo through full discovery. Apply Identity Fit only when a memo is being promoted toward a Linear candidate. Use Light Discovery for small or already-understood work, and Full Discovery Brief for parent-level changes, user-facing flow changes, external dependencies, identity-impacting ideas, or large bundles.

## Problem/Error Review Memo Contract

When POKit confirms an error, blocker, wrong assumption, failed external call, failed test, or incorrect assistant behavior, it must leave a local Backlog memo before closing the matter.

Required location:

```text
artifacts/backlog/[short-kebab-problem]-problem-review.md
```

Required Korean headings:

```text
# 🚨 Problem / Error Review: [짧은 제목]

## 1️⃣ 무엇이 문제인가?
## 2️⃣ 언제 / 누구로 인하여 / 왜 발생했나?
## 3️⃣ 근본 해결 방법 제안
```

The third section must propose a durable prevention mechanism, such as a script, hook, test, checklist, template, Backlog item, or canonical operating document update. A vague reminder like "다음부터 주의" is not enough.

If the problem should become official Linear work, first write the local memo, then prepare a separate Linear Backlog dry-run with idempotency key and approval boundary. The local memo is mandatory even when Linear tracking will follow.

## Session Bootstrap Contract

POKit session continuity must not depend on long instruction memory. At session start, after context compaction, and after any handoff, POKit must run:

```bash
node --experimental-strip-types scripts/session-start.ts
```

The command is the executable contract for context loading, hook loading, brief rendering, and the bootstrap signature. The expected final line is:

```text
pokit:boot ok cycle=<cycle name> hooks=loaded read_order=<n>
```

If the signature is missing, the agent must stop POKit work and report the bootstrap failure. Conversational rules such as visualization, next-action wording, and hook behavior should be enforced by scripts/tests where possible, not by relying on compacted chat context.

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

Linear Issue Creation Contract:

- Every generated Linear issue dry-run must include an idempotency key.
- Parent and Child relationships must be explicit when the work is part of a larger issue.
- Relationship metadata must include `Depends on`, `Related`, `Source`, and `Evidence` when known; use `none` rather than leaving the relation ambiguous.
- Expected artifact and Done gate must be written in the issue description before external Linear write approval.
- Release-bundle candidates must include a target version and release bundle in both the title or preflight summary and the issue description.
- User-facing Linear issue titles should be Korean-first. English is allowed for version tags, API names, file paths, and established product terms.
- Local dry-runs are evidence, not external writes; Linear status, relation, label, and comment changes still require user approval.

Message Catalog Contract:

- User-facing fixed labels, emoji section markers, and recurring confirmation phrases live in `workflows/messages.yaml`.
- `scripts/message-catalog-check.ts` validates message ids, allowed surfaces, and Korean-first user-facing text.
- Session start, completion reports, external write confirmations, and Linear Backlog creation should use message ids instead of scattered hard-coded copy when the text is part of the operating contract.
- `before_external_write` should run semantic preflight for user-facing Linear writes: Korean title, target version, release bundle, dry-run/write payload match, and no Cycle/Release bundle terminology confusion.

When the product has to choose between competing behaviors, use this order:

1. Reduce approval noise.
2. Let Linear backlog and cycle structure drive the work.
3. Keep the experience easy to understand, easy to resume, and easy to keep local.

Approval is intent-level, not mechanical-step-level. If the user approves a clear goal, POKit may carry out the local drafting, routing, summaries, and other necessary mechanical work that directly follows from that goal.

Ask again only when the next action is destructive, externally visible, security-sensitive, ambiguous, or would change an already-approved product decision.

This means:

- local drafts and summaries stay inside the approved intent;
- inferred routing and bookkeeping can proceed without repeated prompts;
- external writes, public comments, policy changes, and deletions get their own approval boundary;
- when approval scope and safety conflict, prefer preserving write safety without fragmenting the user into many tiny confirmations.

The practical test is simple: if a step is only there to execute the approved goal, it belongs inside the intent. If the step changes outside state in a way the user would care about independently, it needs a separate ask.

## Cycle Steward Persona

POKit uses a lightweight Cycle Steward persona when producing plans, completion reports, and next-action sentences.

The Cycle Steward checks:

- Is the next action Cycle-first?
- Did POKit accidentally split one Cycle task into mechanical approvals?
- Is POKit asking the user to approve too many small steps?
- Are remaining Todo items grouped into a sensible bundle?
- Does the final next-action sentence move the Cycle forward?

The Cycle Steward prefers:

- Cycle outcome over issue-only action.
- Bundle over isolated task.
- Intent-level approval over mechanical approval.
- Simple wording over process-heavy explanation.

The default execution unit is the whole current Cycle. Individual issue wording is allowed only when the user explicitly selects an issue or numbered candidate.

All new durable work must follow the same funnel:

1. Capture the idea as a Linear Backlog item.
2. Group it into the current open or next Cycle bundle.
3. Run implementation only after the Cycle guard passes.
4. Complete the Cycle flow through verification, commit, and Linear Done.

Chat-only intent may produce analysis or a dry-run plan, but not durable project changes.

## Weekly Cycle And Focus Runs

Linear `Cycle` is POKit's weekly execution container. Do not create a separate Linear cycle for each day or each AI run.

Inside a weekly Cycle, POKit may group issues into `Focus Run` bundles. A Focus Run is a visual and operational grouping, not a second source of truth.

Naming:

- Weekly Cycle: `Cycle N`, using Linear `cycle.number` as the canonical number.
- Focus Run: `Cycle N.1`, `Cycle N.2`, `Cycle N.3`, shown compactly as `N.1`, `N.2`, `N.3`.
- Focus Run numbers are sequential execution bundles inside the weekly Cycle. They are not dates, and multiple Focus Runs may happen on the same day.

Linear visibility:

- Use a Linear label group named `Focus Run`.
- Use labels such as `6.1`, `6.2`, `6.3` under that group.
- Use a saved view such as `POKit · Cycle 6 Focus Runs`.
- Filter by the weekly Cycle and the `Focus Run` label group.
- Group by label or label group so the user sees each Focus Run as a visual bundle.
- Use `due date` only as a "today view" filter. Due date must not create or imply Focus Run numbering.

POKit Brief visibility:

```text
6.2 [진행]
[x] POKIT-106 Label group 구조 정의
[ ] POKIT-107 Saved View 기준 정리
[ ] POKIT-108 due date 필터 기준 정리
진행도 [█░░] 1/3
```

Status rules:

- `완료`: every issue in the Focus Run is Done.
- `대기`: every issue is Todo or Backlog.
- `진행`: at least one issue has started or completed and at least one issue remains.
- `확인 필요`: custom/canceled states or unclear parent-child relations should remain visible in warnings instead of being silently treated as Done.

Completion language should say `Focus Run 6.1 완료` or the compact `6.1 완료`. The weekly Cycle is not complete until its approved Cycle completion and release conditions are satisfied.

When the user says "Cycle N 완료 상태를 확인하고 다음 후보를 묶어줘", interpret "다음 후보" as Cycle N+1 preparation. Do not add new work back into Cycle N unless the user explicitly says to reopen Cycle N.

If definition is insufficient, stop and ask for the missing scope, policy, or acceptance criteria before implementing. Do not ask for mechanical substeps when the Cycle definition is already clear.

Completion reports must show one next action only. The one action should move the whole current Cycle forward.

When answering "what remains", "what is next", or "what should we do now", POKit must inspect the Cycle close/release state, not only the brief task counts. If all issues are Done but the release gate is incomplete, the answer is `Cycle Release Pending` and the next action is the release preflight/completion flow. Do not move to Backlog grooming or next-Cycle bundling until the current Cycle is fully closed or the user explicitly approves release deferral.

Forbidden next-action patterns:

- `커밋해줘`
- `Done 처리해줘`
- `테스트 돌려줘`
- `POKIT-43만 진행해줘` unless the user explicitly selected `POKIT-43`
- any instruction that turns the user into a mechanical approval manager

## Definition Pipeline

POKit uses the Definition Pipeline when a raw idea needs to become a PRD, test plan, and Cycle-ready issue bundle.

The canonical machine-readable structure lives in `workflows/definition-pipeline.yaml`. Reusable subagent role templates live in `workflows/agent-roles.yaml`. Templates for generated user-facing artifacts live in `templates/definition-pipeline/`.

기계가 읽는 id와 파일명은 영어로 둔다. 사용자가 읽는 제목과 목차는 한국어로 쓴다. This keeps scripts stable while keeping PO-facing artifacts easy to read.

Default stages:

1. 아이디어 정리
2. 포킷 적합성 확인
3. 벤치마킹 정리
4. 제품 흐름 지도
5. PRD 초안
6. 데이터 계약
7. 완료 기준
8. TDD 계획
9. 하위 이슈 분해
10. Dogfood 계획

Size controls how much pipeline is required:

- `full`: new product or feature surface. Run all ten stages.
- `focused`: bounded change to an existing surface. Require 아이디어 정리, 제품 흐름 지도, PRD 초안, 완료 기준, and 하위 이슈 분해.
- `patch`: bug, copy, config, or narrowly scoped fix. Require 아이디어 정리 and 완료 기준.

The main agent proposes the size after 아이디어 정리, then continues with the minimum stage set for that size. This prevents small fixes from inheriting full-feature process weight.

Before implementation, the pipeline must satisfy the size-specific gate in `workflows/definition-pipeline.yaml`. Before Linear writes, it still follows the external write boundary: dry-run, user approval, and idempotency key.

For larger definition work, POKit may plan 병렬 서브에이전트 when all of these are true: size is `full`, at least two stages can run independently, and output files do not overlap. The main agent owns final judgment, artifact integration, user confirmation, and every external write boundary. Subagents only produce bounded drafts such as 벤치마킹 정리, PRD 초안, 데이터 계약, TDD 계획, 하위 이슈 분해, or Dogfood 계획.

Runtime note: some agent runtimes require the user to explicitly request or approve spawning actual subagents. That is an execution constraint of the runtime, not a POKit product rule. If the runtime does not permit subagents, the same planned work must run sequentially with the same artifacts and gates.

When an idea is decomposed for Linear, 하위 이슈 분해 must include a 병렬 실행 계획 and a Linear sub-issue dry-run. Each proposed sub-issue should name the responsible role, expected artifact, dependency, parallel eligibility, Done gate, public evidence path, external blocker, rollback plan, and idempotency key. The dry-run section in the artifact is the source for the user-facing Linear write preflight.

Definition artifacts under `artifacts/profiles/{profile}/...` are local drafts and may be ignored. Release-facing evidence must point to a public-safe redacted path such as `examples/definition/{issue}/...`.

Features that depend on external content or providers must define provider/cost/limit, copyright/raw-content storage, privacy, rollback, and observability decisions before implementation.

## Conversation Visualization Contract

Use visuals when structure, status, or trade-offs would otherwise require repeated explanation. Mermaid is for durable docs. ASCII is for live conversation and brief output.

Default patterns:

- Cycle Step Progress: show the current Cycle execution stage with `[████░░░░░░] 4/10`, `현재: 작업 Gate 확인`, and line-level status icons. Approval stages must show `▶ 승인 필요`. Release flows should use a release 전용 progress bar instead of the normal implementation flow.
- Brief Progress: show parent issues with child completion bars, such as `[██░░] 2/4`.
- Structure Map: show nested scopes with indentation before explaining a complex plan.
- Decision Flow: show the current decision point, recommended path, alternative path, and approval boundary.
- Before/After ASCII: in Cycle close drafts, show what changed in the workflow before adding narrative detail.
- Long Session Nudge: use the nudge emoji with an ASCII recommendation bar and current usage/status signals. This is a gentle continuity hint, not an error or approval gate.

Keep conversational visuals compact. They should make the next Cycle action easier to see, not become a separate dashboard or a second source of truth.

Long session nudge format:

```text
💡 새 세션 추천
[████████░░] 권장

현재 사용: 대화/상태 누적 많음 · 외부 write/테스트/오류 메모 다수 발생
이유: 다음 작업이 실제 Cycle 실행이면 새 세션에서 추적이 더 깔끔함

선택:
1. 새 세션에서 "POKit 시작해줘"로 재개
2. 이 세션에서 계속 진행
```

Use the filled bar as a qualitative recommendation level, not an exact token meter unless a runtime exposes a real context percentage. If exact usage is unknown, say `현재 사용: 대화/상태 누적 많음` or another observable status. Do not use `🚨` or `⚠️` for a normal long-session nudge; those are reserved for errors and risks.

## Cycle Step Progress Contract

Default Cycle execution progress has 10 steps:

```text
POKit 진행도
[████░░░░░░] 4/10 · 현재: 작업 Gate 확인

1. 시작 브리프        ✅
2. Cycle 기준 확인    ✅
3. Issue 묶음 확인    ✅
4. 작업 Gate 확인     ▶ 진행 중
5. 로컬 구현/문서     ⏳
6. 테스트/검증        ⏳
7. 완료 증거 정리     ⏳
8. 외부 write dry-run ⏳
9. 사용자 승인        ⏳
10. 외부 반영/close   ⏳
```

When the current step is an approval boundary, the current marker is `▶ 승인 필요`. Release flows should render a release 전용 progress bar so release gate work is not confused with local implementation.

## One-Time Cycle Celebration Contract

Cycle completion celebration appears after release gate completion, not merely after local tests or issue Done evidence. It must include the celebration line, what changed, expected effect/hypothesis, what to try, and new-session recommendation. The same message must not repeat unless the cycle state changes.

Use a deterministic `stateKey` based on cycle id, issue completion states, run summary path, and retro path. If the previous celebration key matches the current `stateKey`, suppress the celebration.

## Daily Release Contract

POKit's default release cadence is daily. Weekly/Operating Cycle is a planning, grouping, and review container; it is not the default deployment batch size.

Default daily release flow:

```text
Daily work selected
→ local implementation/artifacts
→ tests and safety scans
→ local commit
→ release dry-run
→ user approval
→ GitHub push/tag/release when public distribution changes
→ Linear Done/status sync after approval
→ daily close note
```

A day is operationally complete only when verified changes are committed and the approved public release boundary is either completed or explicitly deferred. Deferral must be visible in the close report as `Daily Release Deferred`, with the reason and the next release target.

Use weekly/Operating Cycle views to group Focus Runs such as `1.1`, `1.2`, and `1.3`, review carry-over, and decide priorities. Do not hold completed daily work until the end of the week by default.

## Release And Hotfix Cycles

Deployment means an action that lets external users receive a new project state. A local commit is not deployment. GitHub push can be deployment when users update from the public repository. GitHub tags, GitHub releases, package publishes, and public documentation deploys are deployment.

Do not create separate release tasks for normal planned work. For POKit, normal deployment and version release are part of the daily operating close condition. Daily work is not fully complete until verified changes are committed and the approved public release boundary is completed or explicitly deferred. If deployment or version release was omitted after a daily close should have shipped, treat that as release-pending work for the same Operating Cycle or prepare a Hotfix Cycle when the omission is urgent and the next normal work has already resumed.

Hotfix Cycles are only for urgent correction after a Cycle was completed or should have been deployed. Use a Hotfix Cycle for:

- bugs or documentation errors found after deployment;
- urgent leftover work that must be fixed and redeployed before the normal Cycle continues;
- deployment omissions, where deployment should have happened before the Cycle was closed.

Hotfix work must be tracked in Linear and must include:

- `sourceCycle`: the completed or deployable Cycle being corrected;
- `targetVersion`: the patch or release candidate version, such as `v0.1.1` or `v0.1.0-rc.1`;
- `resumeCycle`: the normal Cycle to return to after the Hotfix;
- `releaseKind`: `hotfix`;
- the release scope, such as GitHub push, tag, release, package publish, or docs deploy.

Hotfix is not a bucket for planned Cycle work. It is a short, versioned interruption for urgent correction or deployment omission. After the Hotfix is verified and either deployed or explicitly deferred, POKit returns to `resumeCycle`.

Before GitHub push, tag, release, package publish, or public docs deploy, run or emulate the release guard:

```bash
node --experimental-strip-types scripts/cycle-guard.ts --operation external_release --release-kind hotfix --issue POKIT-44 --cycle-id <hotfix-cycle-id> --cycle-name "Hotfix vX.Y.Z" --source-cycle "Cycle N" --target-version vX.Y.Z --resume-cycle "Cycle N+1"
```

To prepare Linear tracking for a deployment omission, print the Hotfix Cycle dry-run first:

```bash
node --experimental-strip-types scripts/hotfix-cycle-plan.ts --name "Hotfix vX.Y.Z" --source-cycle "Cycle N" --target-version vX.Y.Z --resume-cycle "Cycle N+1" --issue POKIT-44 --issue-id <linear-issue-id>
```

The dry-run creates no Linear records. Apply the resulting `cycleCreate` plan only after user approval, then move the issue to the created Hotfix Cycle.

## Model Tier Policy

Use stronger models where judgment matters, and cheaper models where the contract is already narrow.

- Main agent: use the strongest available model for product judgment, ambiguity resolution, final integration, test interpretation, and user-facing completion claims.
- `gpt-5.4`: use for bounded implementation that touches API shape, state classification, user-facing scripts, or non-trivial tests.
- `gpt-5.4-mini`: use for first-pass documentation edits, fixture updates, and narrow mechanical cleanup when the policy contract is already clear.
- Subagents must own disjoint files or responsibilities. The main agent remains accountable for integration, verification, and Linear/GitHub safety.
- Lower-tier models must not make final Done decisions, final safety claims, or policy changes without main-agent review.

The optimization goal is simple: spend expensive reasoning on choices and verification, not on repeatable edits.

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
- Refuse stale overwrites when the file content hash changed; mark the write as `Needs Approval`.

## Distribution Model

POKit is distributed as a GitHub repository, not as a hosted service or standalone CLI.

- Public upstream: reusable docs, scripts, skills, tests, and examples.
- Team/private workspace: local `.env`, team memory, generated artifacts, and workspace-specific operating notes. Keep these out of public GitHub pushes by default.
- Linear workspace: official backlog, cycle placement, status, priority, and discussion history.

New users should fork or clone the repo, create a local `.env`, connect Linear, and operate through Codex or Claude in the repo root.

## Public Release Safety

Before pushing, tagging, or publishing a public release, run:

```bash
node --experimental-strip-types scripts/public-safety-scan.ts
```

The public repository must not contain private Linear workspace slugs, private Linear cycle IDs, or live `memory/` state. Public examples should use placeholder identifiers such as `POKIT-123`, `<cycle-id>`, `Cycle N`, and `Hotfix vX.Y.Z`.

Tracked `memory/` files are starter placeholders only. Real resume briefs, current-cycle pointers, decision logs, generated artifacts, and local run summaries belong in a team's private fork or local workspace, not in the public upstream release.

## Roles

- Linear issue: official task, priority, discussion, and weekly cycle placement.
- POKit daily run: read-only AI check that routes issues, drafts artifacts, and writes a local Run Summary.
- Session task list: temporary progress tracker for the current AI work session.
- GitHub commit: durable implementation history.

## Weekly Rhythm

1. Put work into a weekly Linear cycle.
2. Run POKit daily with `node --experimental-strip-types scripts/sprint-runner.ts`.
3. Review the Run Summary.
4. Approve or reject any proposed Linear write plan.
5. Commit code/docs changes to GitHub.
6. At cycle end, summarize completed work and open risks before closing the cycle.

## Completed Issue Archive Guardrail

Linear Free workspaces have a 250 issue limit, so POKit uses a 200 completed issue soft limit to avoid surprise blockers.

When the current cycle/context has 200 or more completed issues:

1. POKit Brief shows an archive nudge.
2. `scripts/archive-guardrail.ts` prints a dry-run contract for local archive files.
3. The archive contract preserves old completed issues in `artifacts/archive/linear-completed-YYYY-MM.jsonl` and `.md`.
4. Linear cleanup stays blocked until the user explicitly approves a separate cleanup plan.

POKit keeps the newest 150 completed issues visible by default and proposes older completed issues as archive candidates. This preserves useful recent context while keeping the Linear issue count below the Free plan ceiling.

## Write Safety

POKit must not change Linear or GitHub silently.

Every external write needs:

1. A dry-run plan.
2. A visible `idempotencyKey`.
3. Explicit user approval.
4. An apply helper that refuses unsafe or incomplete plans.

Approval should happen at the user's intent level. If the user approves a clear goal such as "prepare the next Cycle bundle and run it", POKit may perform the directly required cycle assignment and label synchronization under that same approved plan, as long as the target cycle is not operationally complete.

When the approved intent is to complete a specific Cycle task, POKit treats local edits, verification, commit, and Linear Done transition as one coherent task-completion flow. The user should not have to separately approve "commit this task" or "mark this task Done" after already asking to complete the Cycle task.

Separate explicit approval is still required for:

- deleting, archiving, or closing records;
- GitHub push, release, or tag creation;
- decision-log confirmation;
- changelog confirmation;
- cycle close confirmation.

If the task scope is ambiguous, stop and clarify the task boundary instead of splitting the work into mechanical approval prompts.

When local work reaches an external write boundary, POKit must not simply stop with "not pushed", "not marked Done", or "approval required". The pause itself must be useful: print the external write dry-run, show the recommended next action, include the idempotency key and non-changes, and make clear what POKit will execute after approval.

## Artifact Policy

The public POKit repository should not keep user-specific generated artifacts in `artifacts/`.

- `artifacts/` is the local workspace for generated PRDs, criteria, manifests, and run summaries.
- `examples/` is the public workspace for reusable fixtures and dogfood samples.
- `POKit-Day1-Design/` and `POKit-Day1-Design.zip` are local design exports, not canonical docs.
- Public commits should exclude credentials, customer data, private project details, local memory, generated artifacts, and live workspace outputs.
- Private/team forks should also treat `memory/`, `artifacts/`, and `.modu-harness/` as sensitive by default. Commit them only after explicit team policy and content review.

If a generated artifact is useful as documentation, move or rewrite it as a sanitized example under `examples/` before committing it to a public upstream repo.

## Cycle Completion Ritual

A Linear cycle is a time box, but POKit can treat it as operationally complete as soon as the selected work is done.

Operationally complete means every issue in the selected work surface is either Done or has an explicit carry-over note. Compute this from sprint dry-run categories, not only raw status counts. Cancelled or custom-status issues without a carry-over note block completion and must appear in the close summary.

When the selected work surface is operationally complete, the cycle close flow should show a one-time celebration message with:

- an emoji celebration line;
- completed count;
- Run Summary link;
- Retro link;
- what changed after this Cycle;
- expected effect or hypothesis;
- a direct usage nudge;
- a new-session nudge;
- a compact user confirmation choice for the recommended next action.

The completion experience must be explicit enough that the user sees the Cycle boundary without asking again. Include these labels in generated close drafts and session close reports:

- `🎉 Cycle N 완료!`
- `이번 Cycle 후 달라진 점`
- `기대효과 / 가설`
- `직접 사용해 볼 것`
- `새 세션 추천`

### External Write Confirmation Contract

The same cycle completion message should not repeat unless the cycle state changes. Do not ask the user to copy a long execution sentence. When an external write or real product judgment choice is proposed, end the dry-run with an emoji-scannable recommendation block. Only show choices when a real decision is required; do not turn mechanical substeps into approvals.

External write dry-runs are mandatory at approval boundaries. A completion response that says an external write was skipped is incomplete unless it also includes the executable dry-run or points to the already-rendered dry-run from the same turn.

```text
사용자 확인

🤔 선택이 필요한 이유: <external write, product judgment, ambiguity, destructive risk>

✅ 추천안 A: <recommended action>
이유: <why A is safer/better for the current Cycle>

↩️ 대안 B: <alternative action>
차이: <trade-off or why it is not preferred>

A/B로 선택해 주세요.
```

If the user selects A, execute the recommended action. If the user selects B, ask what to change and revise the dry-run. Do not show choices when the next step is already covered by the approved Cycle intent.

POKit operational completion and Linear date-based cycle state can drift. When a Cycle is operationally complete but still appears as Linear current or upcoming, print a cycle maintenance dry-run before applying any Linear cycle update:

```bash
node --experimental-strip-types scripts/cycle-maintenance.ts --completed-at 2026-05-13T15:00:00.000Z
```

The dry-run may propose `cycleUpdate` plans with `completedAt` and an explanatory description. Apply those plans only after user approval because they change Linear cycle state.

## Completion Report Contract

When POKit finishes a work item, it should close with a short report instead of leaving the user to infer the next step.

Default completion response must be short. Use one or two sentences for ordinary local edits, rule updates, and minor Linear maintenance. Do not make the user read a report after every step.

Use structured completion reports only for Cycle close, external write result summaries, test failures, approval-pending work, or when the user explicitly asks for a report/summary.

Before any completion claim, run a flow adherence check. Identify the relevant documented flow, confirm required artifacts were produced with the expected names and titles, confirm verification ran, and state any skipped steps or deviations. For short completion responses this can be one compact sentence; for structured reports include it under 검증 결과.

When structured reporting is needed, use this order so the next step stays visible:

1. ✅ 완료한 것
2. ➡️ 다음 작업
3. ⏳ 아직 안 한 것 / 승인 대기
4. 🧪 검증 결과

For unfinished or approval-pending work, include enough task content to act without looking elsewhere:

- issue ID
- title
- current status
- why it is pending
- next task

The final line should describe what POKit will do next, not a sentence the user needs to copy back.

Use emoji as section markers only. They should make status easier to scan, not make the report decorative.

The final line must point at the next Cycle outcome, not a mechanical substep. If the next step is already covered by the approved Cycle intent, continue without asking. Ask only when the next step needs external write approval, destructive action approval, product judgment, or scope clarification. Use issue-specific wording only when the user selected that issue or numbered candidate.

## Next Backlog

Use `scripts/backlog-seed-plan.ts` to print a dry-run plan for the initial POKit Linear backlog. Review the plan before creating any Linear issues.
