# Cycle Flow — Steward, 위클리 서클s, Progress, Completion

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
2. Group it into a 버전 스프린트 through a Cycle Bundle.
3. Run implementation only after the Cycle guard passes.
4. Complete the 버전 스프린트 through verification, commit when applicable, Linear Done when applicable, and release/non-release close.

Chat-only intent may produce analysis or a dry-run plan, but not durable project changes.

## 위클리 서클 And Focus Runs

Linear `Cycle` is POKit's weekly execution container. Do not create a separate Linear cycle for each day or each AI run.

Inside a weekly Cycle, POKit may group issues into `Focus Run` bundles. A Focus Run is a visual and operational grouping, not a second source of truth.

Naming:

- 위클리 서클: `Cycle N`, using Linear `cycle.number` as the canonical number.
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

## Cycle Step Progress Contract

단계 정의(단계명·설명·순서·라벨·approvalBoundary)의 단일 소스는 [`docs/_details/cycle-steps.json`](./cycle-steps.json)이다. 이 섹션의 예시는 참조용이며, 코드는 해당 JSON을 읽어 렌더한다.

Default Cycle execution progress has 10 steps:

```text
POKit 진행도
[████░░░░░░] 4/10 · 현재: 작업 Gate 확인

1. 시작 브리프               ✅
2. Cycle 기준 확인           ✅
3. Issue 묶음/우선순위 확인  ✅
4. 작업 Gate 확인            ▶ 진행 중
5. 로컬 구현/문서/산출물 작성 ⏳
6. 테스트/검증               ⏳
7. 완료 증거 정리            ⏳
8. 외부 write dry-run        ⏳
9. 사용자 승인               ⏳
10. 외부 반영/close          ⏳
```

When the current step is an approval boundary, the current marker is `▶ 승인 필요`. Release flows should render a release 전용 progress bar so release gate work is not confused with local implementation.

Step 4 작업 Gate에서 메인 에이전트는 **Operator Pre-task Judgment**를 사용자에게 공개한다 (모델 선택 · 병렬화 · 외부 write 예상 · **정책 전제**). 정책 전제가 미충족이면 본 작업은 시작하지 않고 선행 정책 정의 작업으로 전환한다. 자세한 절차와 판단 기준은 [`docs/_details/subagent-contract.md`](./subagent-contract.md#operator-pre-task-judgment) 및 [`Policy Precondition Gate`](./subagent-contract.md#policy-precondition-gate) 참조. 이 게이트를 건너뛰면 Step 5(구현)로 진입할 수 없다.

## One-Time Cycle Celebration Contract

Cycle completion celebration appears after release gate completion, not merely after local tests or issue Done evidence. It must include the celebration line, what changed, expected effect/hypothesis, what to try, and new-session recommendation. The same message must not repeat unless the cycle state changes.

Use a deterministic `stateKey` based on cycle id, issue completion states, run summary path, and retro path. If the previous celebration key matches the current `stateKey`, suppress the celebration.

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

Cycle 완료 직후 축하 메시지는 release gate 완료 후 1회만 표시한다. 같은 `stateKey`는 반복하지 않는다.

## Remains/Next Answer Rule

When the user asks what remains/next, check current Cycle task state and close/release state. Do not recommend Backlog or next-Cycle work while `Cycle Release Pending`.
