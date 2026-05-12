# POKit Day 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest GitHub-distributed POKit repo skeleton that can read a cycle, route PRD/criteria work, generate draft artifacts, produce a Run Summary, and protect external writes behind dry-run approval.

**Architecture:** POKit is a repo-native AI work environment, not a CLI app or SaaS. Codex CLI or Claude Code reads `AGENTS.md`, `skills/`, `memory/context-map.yaml`, and `docs/` to orchestrate workflows. TypeScript scripts provide safe Linear/GitHub helper functions with `plan`/`apply` separation, while Markdown + YAML memory files preserve PO context.

**Tech Stack:** Markdown, YAML, TypeScript on Node.js, GitHub repo distribution, Linear API helpers, Codex CLI, Claude Code.

---

## Day 2 Scope

### Must Finish

- GitHub-distributed repo skeleton
- README first line: "POKit의 첫 번째 약속은 신뢰다."
- `AGENTS.md` runtime instruction baseline
- `.env.example`, `.gitignore`, `pokit.config.yaml`
- Markdown + YAML memory structure with `context-map.yaml`
- PRD and acceptance criteria skills
- Backlog manager, sprint runner, backlog router skills
- Minimal `scripts/linear.ts` plan/apply helper signatures
- `pokit:*` label preflight plan
- Run Summary format
- State Brief / Action Nudge rules
- Content hash protection rule
- Cross-runtime diff test scenarios

### Time-Boxed Optional

- `scripts/github.ts` read-only contract stub with no external write implementation
- Example artifact files under `examples/`
- Basic schema files for memory/artifacts

### Explicitly Not Doing

- No npm/global installer
- No standalone CLI command
- No SaaS UI
- No A/B test implementation
- No persona test implementation
- No dynamic subagents
- No PDF export
- No automatic cron
- No real external write without dry-run approval

---

## File Map

### Root

- Create `README.md`: GitHub entrypoint and trust contract
- Create `AGENTS.md`: runtime instructions for Codex/Claude
- Create `CHANGELOG.md`: release notes
- Create `LICENSE`: MIT license text unless the PO chooses a different license before Day 2 implementation
- Create `.gitignore`: secrets, dependencies, generated local files
- Create `.env.example`: required env names only
- Create `pokit.config.yaml`: language, brief, weather, Linear label config

### Memory

- Create `memory/current-cycle.md`: human-readable current cycle summary
- Create `memory/current-cycle.yaml`: machine-readable current cycle pointer
- Create `memory/decision-log.md`: append-only PO decisions
- Create `memory/decision-log.yaml`: decision index
- Create `memory/resume-brief.md`: next-session brief
- Create `memory/context-map.yaml`: context read order

### Skills

- Create `skills/backlog-manager/SKILL.md`
- Create `skills/sprint-runner/SKILL.md`
- Create `skills/backlog-router/SKILL.md`
- Create `skills/prd-author/SKILL.md`
- Create `skills/prd-author/template.md`
- Create `skills/acceptance-criteria-author/SKILL.md`
- Create `skills/acceptance-criteria-author/template.md`

### Scripts

- Create `scripts/README.md`
- Create `scripts/linear.ts`

### Workflows

- Create `workflows/hooks.yaml`
- Create `workflows/cross-runtime-diff-tests.md`

### Artifacts

- Create artifact directories only:
  - `artifacts/prds/`
  - `artifacts/criteria/`
  - `artifacts/sprints/`
  - `artifacts/manifests/`

---

## Task 1: GitHub Repo Skeleton

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`
- Create: `CHANGELOG.md`
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `pokit.config.yaml`

- [ ] **Step 1: Create root files**

Create `README.md` with this opening contract:

```markdown
# POKit

POKit의 첫 번째 약속은 신뢰다.

POKit is a GitHub-distributed AI scrum workspace for PO/PM work. It is not a separate CLI, SaaS, or chat UI. Clone or fork this repo, fill `.env`, open Codex CLI or Claude Code in the repo root, and work in natural language.

## Core Contract

POKit은 cycle 안에서 산출물과 승인 계획을 만든다. Linear/GitHub 같은 외부 시스템의 상태는 사용자의 명시적 승인 없이는 절대 바꾸지 않는다.

- All AI-generated artifacts are drafts with source context and rationale.
- Run Summary lists generated, needs-label, needs-clarification, needs-approval, and failed items separately, with "what AI did not do" shown first.
- State Brief renders every session and is read-only.
- Action Nudge appears at most once per session and only when cycle state changed.
- Fork users who want to commit personal memory/artifacts should review `.gitignore` first.
```

- [ ] **Step 2: Create `LICENSE`**

```text
MIT License

Copyright (c) 2026 POKit contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Create `AGENTS.md`**

```markdown
# POKit Agent Instructions

Default language: ko-KR.

When a POKit session starts:
1. Read `memory/context-map.yaml`.
2. Read only the memory/artifact files listed in `read_order`.
3. Show a short State Brief.
4. Show at most one Action Nudge only when state changed.

Never write to Linear or GitHub without:
1. A dry-run plan.
2. User approval.
3. An idempotency key.

All artifacts are drafts. Do not overwrite an artifact when its content hash changed; mark it `Needs Approval`.
```

- [ ] **Step 4: Create `.env.example`**

```bash
LINEAR_API_KEY=
LINEAR_TEAM_ID=
GITHUB_TOKEN=
POKIT_LANGUAGE=ko-KR
POKIT_WEATHER_ENABLED=true
POKIT_WEATHER_LOCATION=
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
.env
node_modules/
*.local.*
.DS_Store

# Personal artifacts. Fork users may un-ignore these in their private fork.
artifacts/sprints/*-run-summary.md
```

- [ ] **Step 6: Create `pokit.config.yaml`**

```yaml
language: ko-KR

brief:
  weather_enabled: true
  weather_location: ""
  action_nudge_max_day2: 1

linear:
  labels:
    - pokit:prd
    - pokit:criteria
    - pokit:design
    - pokit:research
    - pokit:abtest

artifacts:
  hash_algorithm: sha256
```

- [ ] **Step 7: Verify root skeleton**

Run:

```bash
ls README.md AGENTS.md CHANGELOG.md LICENSE .gitignore .env.example pokit.config.yaml
```

Expected: all files exist.

---

## Task 2: Memory and Context Map

**Files:**
- Create: `memory/current-cycle.md`
- Create: `memory/current-cycle.yaml`
- Create: `memory/decision-log.md`
- Create: `memory/decision-log.yaml`
- Create: `memory/resume-brief.md`
- Create: `memory/context-map.yaml`

- [ ] **Step 1: Create `memory/context-map.yaml`**

```yaml
current_cycle:
  id: null
  summary_file: memory/current-cycle.md
  state_file: memory/current-cycle.yaml
  run_summary: null

decision_log:
  file: memory/decision-log.md
  index_file: memory/decision-log.yaml
  latest_decision_at: null

read_order:
  - memory/resume-brief.md
  - memory/current-cycle.yaml
  - memory/current-cycle.md
  - memory/decision-log.yaml
```

- [ ] **Step 2: Create `memory/current-cycle.yaml`**

```yaml
cycle:
  id: null
  name: null
  starts_at: null
  ends_at: null
  latest_run_summary: null
  issue_count: 0
updated_at: null
```

- [ ] **Step 3: Create `memory/current-cycle.md`**

```markdown
# Current Cycle

No active cycle loaded yet.

The machine-readable pointer lives in `memory/current-cycle.yaml`.
```

- [ ] **Step 4: Create decision memory files**

`memory/decision-log.md`:

```markdown
# Decision Log

Append-only. Add a timestamped section only after the PO explicitly confirms a decision should be recorded.
```

`memory/decision-log.yaml`:

```yaml
decisions: []
latest_decision_at: null
```

- [ ] **Step 5: Create `memory/resume-brief.md`**

```markdown
# Resume Brief

No previous POKit run yet.
```

- [ ] **Step 6: Verify context files**

Run:

```bash
ls memory/current-cycle.md memory/current-cycle.yaml memory/decision-log.md memory/decision-log.yaml memory/resume-brief.md memory/context-map.yaml
```

Expected: all files exist.

---

## Task 3: Artifact and Run Summary Format

**Files:**
- Create directories: `artifacts/prds/`, `artifacts/criteria/`, `artifacts/sprints/`, `artifacts/manifests/`
- Create: `artifacts/sprints/README.md`
- Create: `artifacts/sprints/_example-run-summary.md`

- [ ] **Step 1: Create artifact directories**

Run:

```bash
mkdir -p artifacts/prds artifacts/criteria artifacts/sprints artifacts/manifests
```

- [ ] **Step 2: Create `artifacts/sprints/README.md`**

```markdown
# Sprint Run Summaries

Run Summary is generated after a user-started cycle run. Session Start Brief must not create a new Run Summary.

Required sections:

1. AI가 하지 않은 것
2. 생성됨
3. 확인 필요
4. 라벨 필요
5. 승인 대기
6. 실패
7. 다음 추천 행동
```

- [ ] **Step 3: Create sample Run Summary**

```markdown
---
cycle_id: 2026-W20
generated_at: 2026-05-12T18:30:00+09:00
status: draft
---

# Run Summary: 2026-W20

## 1. AI가 하지 않은 것

- Linear/GitHub 외부 write는 실행하지 않음. 승인 대기 plan만 생성함.
- 정보가 부족한 issue는 산출물을 만들지 않음.

## 2. 생성됨

- POKIT-18: `artifacts/prds/POKIT-18.md`
- POKIT-22: `artifacts/criteria/POKIT-22.md`

## 3. 확인 필요

아래 질문에 답하면 다음 cycle run에서 처리할 수 있음.

POKIT-21 환불 정책 문구 정리
1. 환불 예외 케이스는 어떤 기준으로 판단하나요?
2. 고객에게 노출하면 안 되는 내부 정책이 있나요?

## 4. 라벨 필요

- POKIT-25 알림 설정 개선
  - AI 제안: `pokit:criteria`
  - 필요한 행동: 라벨 제안 승인 또는 수정

## 5. 승인 대기

- Linear comment 작성 plan
  - idempotencyKey: `linear:comment:POKIT-18:prd`

## 6. 실패

- 없음

## 7. 다음 추천 행동

"확인 필요 질문에 답할게"
```

- [ ] **Step 4: Verify directories**

Run:

```bash
find artifacts -maxdepth 2 -type d | sort
```

Expected includes `artifacts/prds`, `artifacts/criteria`, `artifacts/sprints`, `artifacts/manifests`.

---

## Task 4: Minimal Linear Script Contract

**Files:**
- Create: `scripts/README.md`
- Create: `scripts/linear.ts`

- [ ] **Step 1: Create `scripts/README.md`**

```markdown
# POKit Scripts

Scripts are thin helpers for external systems. All external writes must be split into `plan` and `apply`.

Day 2 scripts may be dry-run first. Never call `apply*` without explicit user approval.
```

- [ ] **Step 2: Create `scripts/linear.ts` with signatures and safe stubs**

```ts
export type Plan = {
  idempotencyKey: string;
  summary: string;
  writes: Array<{
    type: "create_issue" | "create_label" | "comment_issue" | "update_issue";
    target: string;
    payload: unknown;
  }>;
};

export type IssueInput = {
  title: string;
  description?: string;
  labels?: string[];
  cycleId?: string;
};

export type Issue = {
  id: string;
  identifier: string;
  title: string;
  labels: string[];
};

export type Cycle = {
  id: string;
  name: string;
};

export async function getCurrentCycle(): Promise<Cycle> {
  throw new Error("Linear API implementation is not wired yet.");
}

export async function listIssues(cycleId: string): Promise<Issue[]> {
  void cycleId;
  throw new Error("Linear API implementation is not wired yet.");
}

export async function planCreateIssue(input: IssueInput): Promise<Plan> {
  return {
    idempotencyKey: `linear:create_issue:${input.title}`,
    summary: `Create Linear issue: ${input.title}`,
    writes: [
      {
        type: "create_issue",
        target: input.cycleId ?? "backlog",
        payload: input,
      },
    ],
  };
}

export async function applyCreateIssue(plan: Plan): Promise<Issue> {
  void plan;
  throw new Error("Refusing external write until Linear apply is implemented with approval checks.");
}

export async function planMissingLabels(labels: string[]): Promise<Plan> {
  return {
    idempotencyKey: `linear:create_labels:${labels.sort().join(",")}`,
    summary: `Create missing POKit labels: ${labels.join(", ")}`,
    writes: labels.map((label) => ({
      type: "create_label",
      target: "linear_workspace",
      payload: { name: label },
    })),
  };
}
```

- [ ] **Step 3: Verify TypeScript parses and external-write apply refuses**

Run:

```bash
node --experimental-strip-types -e "import('./scripts/linear.ts').then(m => m.applyCreateIssue({idempotencyKey:'test',summary:'test',writes:[]}).then(()=>process.exit(1)).catch(e => process.exit(/Refusing external write/.test(e.message) ? 0 : 1)))"
```

Expected: exit code 0 because `applyCreateIssue` must throw the refusal error. Exit code 1 means the external-write guard is missing.

---

## Task 5: Skill Skeletons

**Files:**
- Create: `skills/backlog-manager/SKILL.md`
- Create: `skills/sprint-runner/SKILL.md`
- Create: `skills/backlog-router/SKILL.md`
- Create: `skills/prd-author/SKILL.md`
- Create: `skills/prd-author/template.md`
- Create: `skills/acceptance-criteria-author/SKILL.md`
- Create: `skills/acceptance-criteria-author/template.md`

- [ ] **Step 1: Create `backlog-router` mapping**

```markdown
# backlog-router

## Trigger

Use when an issue needs to be routed to a POKit artifact skill.

## Routing

- `pokit:prd` -> `skills/prd-author/SKILL.md`
- `pokit:criteria` -> `skills/acceptance-criteria-author/SKILL.md`

## Missing Label Rule

If no `pokit:*` label exists, propose one artifact type from the issue title/description and mark the issue `Needs Label` until the PO approves.
```

- [ ] **Step 2: Create backlog and sprint skills with decision-log rule**

`skills/backlog-manager/SKILL.md`:

```markdown
# backlog-manager

## Trigger

Use when the PO asks to add, inspect, or change a backlog item.

## External Write Rule

Create a dry-run plan first. Do not call `apply*` until the PO explicitly approves.

## Decision Log Rule

When the PO makes an explicit product decision, ask: "이 결정을 decision-log에 기록할까요?"

If the PO approves, append a timestamped section to `memory/decision-log.md` and add an index entry to `memory/decision-log.yaml`.
```

`skills/sprint-runner/SKILL.md`:

```markdown
# sprint-runner

## Trigger

Use when the PO says "이번 cycle 실행", "이번 cycle 준비", or asks to process the current cycle.

## Flow

1. Read `memory/context-map.yaml`.
2. Run label preflight.
3. Route `pokit:prd` and `pokit:criteria` issues.
4. Mark missing labels as `Needs Label`.
5. Mark missing required context as `Needs Clarification`.
6. Write Run Summary with "AI가 하지 않은 것" first.

## Decision Log Rule

If the PO overrides priority, confirms scope, or makes a product policy decision during the run, ask whether to append it to `memory/decision-log.md`.
```

- [ ] **Step 3: Create PRD skill template**

`skills/prd-author/SKILL.md`:

```markdown
# prd-author

## Trigger

Use for issues labeled `pokit:prd`.

## Output

Create a PRD draft at `artifacts/prds/[issue-id].md` using `template.md`.

## Required Context

- Linear issue id and title
- Problem or user need
- Cycle id

If required context is missing, do not generate a draft. Mark the issue `Needs Clarification` and add questions to the Run Summary.
```

`skills/prd-author/template.md`:

```markdown
---
linear_issue_id:
cycle_id:
artifact_type: prd
status: draft
skill_used: prd-author
content_hash:
---

# PRD Draft

## Problem

## Goal

## Non-Goals

## User Scenario

## Requirements

## Acceptance Notes

## Open Questions

## Source Context
```

- [ ] **Step 4: Create acceptance criteria template**

`skills/acceptance-criteria-author/SKILL.md`:

```markdown
# acceptance-criteria-author

## Trigger

Use for issues labeled `pokit:criteria`.

## Output

Create acceptance criteria draft at `artifacts/criteria/[issue-id].md` using `template.md`.

## Required Context

- Linear issue id and title
- Expected behavior
- Known edge cases, if any

If expected behavior is unclear, mark the issue `Needs Clarification` and ask concise questions in the Run Summary.
```

`skills/acceptance-criteria-author/template.md`:

```markdown
---
linear_issue_id:
cycle_id:
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash:
---

# Acceptance Criteria Draft

## Scenario

## Criteria

- Given
- When
- Then

## Edge Cases

## Open Questions

## Source Context
```

- [ ] **Step 5: Verify all skill files exist**

Run:

```bash
find skills -maxdepth 3 -type f | sort
```

Expected: seven skill/template files listed.

---

## Task 6: Hooks and Brief Rules

**Files:**
- Create: `workflows/hooks.yaml`

- [ ] **Step 1: Create hooks file**

```yaml
hooks:
  session_start:
    - resolve_today
    - resolve_weather_best_effort
    - read_context_map
    - summarize_state_brief
    - detect_state_change
    - suggest_one_next_action

  preflight_labels:
    - check_pokit_labels
    - plan_missing_label_creation
    - require_user_approval

  before_each_issue:
    - load_issue_context
    - resolve_labels
    - check_existing_artifact
    - check_content_hash

  after_artifact:
    - validate_frontmatter
    - record_content_hash
    - validate_artifact_path

  before_external_write:
    - require_dry_run_plan
    - require_user_approval
    - require_idempotency_key

  after_run:
    - write_run_summary
    - update_current_cycle
    - update_context_map
    - update_resume_brief

  on_error:
    - collect_error
    - write_failure_summary
```

- [ ] **Step 2: Verify hook file**

Run:

```bash
sed -n '1,160p' workflows/hooks.yaml
```

Expected: hook names include `session_start`, `preflight_labels`, `before_external_write`, and `after_run`.

---

## Task 7: Cross-Runtime Diff Test Plan

**Files:**
- Create: `workflows/cross-runtime-diff-tests.md`
- Create: `workflows/cross-runtime-diff-checklist.md`
- Create directories: `workflows/cross-runtime-diff-results/codex/`, `workflows/cross-runtime-diff-results/claude-code/`

- [ ] **Step 1: Create diff test plan**

```markdown
# Cross-Runtime Diff Tests

Run each scenario in Codex CLI and Claude Code. Compare artifact structure, not exact prose.

## Scenario 1: Backlog Add

Input: "백로그에 결제 실패 사유 개선 추가. PRD 필요"

Expected structure:
- dry-run issue plan
- idempotency key
- no external write without approval

## Scenario 2: Cycle Run

Input: "이번 cycle 실행"

Expected structure:
- state read from `memory/context-map.yaml`
- PRD/criteria artifact drafts
- Run Summary

## Scenario 3: Missing Label

Input: issue without `pokit:*` label

Expected structure:
- proposed label
- `Needs Label`
- no artifact until approval

## Scenario 4: Dry-Run Approval Gate

Input: "Linear에 결과 코멘트 남겨줘"

Expected structure:
- dry-run external write plan
- approval request
- no apply without explicit approval

## Scenario 5: Needs Clarification Answer

Input: answers to a clarification block

Expected structure:
- issue moves from `Needs Clarification` to ready
- summary records answered questions
```

- [ ] **Step 2: Create diff checklist**

```markdown
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
```

- [ ] **Step 3: Create result directories**

Run:

```bash
mkdir -p workflows/cross-runtime-diff-results/codex workflows/cross-runtime-diff-results/claude-code
```

- [ ] **Step 4: Verify no runtime-specific wording is introduced**

Run:

```bash
rg "Codex-only|Claude-only|runtime-specific" workflows skills docs
```

Expected: no matches.

---

## Task 8: Docs Commit Readiness

**Files:**
- Keep: `docs/PRD.md`
- Keep: `docs/DESIGN.md`
- Keep: `docs/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Verify Day 1 docs are present**

Run:

```bash
ls docs/PRD.md docs/DESIGN.md docs/IMPLEMENTATION_PLAN.md
```

Expected: all three files exist.

- [ ] **Step 2: Verify docs reference context management**

Run:

```bash
rg "context-map.yaml" docs/PRD.md docs/DESIGN.md docs/IMPLEMENTATION_PLAN.md
```

Expected: all three docs contain `context-map.yaml`.

- [ ] **Step 3: Include docs in commit**

If this is a git repo:

```bash
git add docs/PRD.md docs/DESIGN.md docs/IMPLEMENTATION_PLAN.md
```

Expected: docs are staged with the Day 2 skeleton.

---

## Day 2 Completion Gate

Day 2 is complete only when:

- [ ] Root GitHub distribution files exist.
- [ ] `memory/context-map.yaml` exists and points to current memory files.
- [ ] `scripts/linear.ts` parses and `applyCreateIssue` refuses external writes.
- [ ] PRD and criteria templates exist.
- [ ] Run Summary format exists.
- [ ] Sample Run Summary exists at `artifacts/sprints/_example-run-summary.md`.
- [ ] Hooks file defines `session_start`, `preflight_labels`, `before_external_write`, `after_run`.
- [ ] Cross-runtime diff test plan exists.
- [ ] Cross-runtime diff checklist exists.
- [ ] No external write can happen without a dry-run plan.
- [ ] Day 1 docs are present in `docs/`.

## Verification Commands

Run these before closing Day 2:

```bash
find . -maxdepth 3 -type f | sort
node --experimental-strip-types -e "import('./scripts/linear.ts').then(m => m.applyCreateIssue({idempotencyKey:'test',summary:'test',writes:[]}).then(()=>process.exit(1)).catch(e => process.exit(/Refusing external write/.test(e.message) ? 0 : 1)))"
rg "POKit의 첫 번째 약속은 신뢰다" README.md
rg "context-map.yaml" AGENTS.md docs/PRD.md docs/DESIGN.md docs/IMPLEMENTATION_PLAN.md
rg "before_external_write" workflows/hooks.yaml scripts/README.md
```

Expected:

- `find` shows all planned files.
- Node command exits 0 because external writes are refused.
- `rg` commands find the required references.

## Commit Plan

If this is a git repo during Day 2:

```bash
git add .
git commit -m "feat: scaffold pokit day 2 walking skeleton"
```

If this directory is not a git repo yet, initialize or clone the GitHub repo first according to the chosen distribution workflow.
