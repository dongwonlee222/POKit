# Release Flow — Version Run, Hotfix, and Public Release Safety

## Version Run Release Contract

POKit's default release unit is the Version Run. Linear Weekly Cycle is a planning, grouping, tracking, and review container; it is not the deployment batch size.

Version Run release is default for public-release work. Linear Weekly Cycle is only a weekly tracking/review container.

Default Version Run release flow:

```text
Version Run selected
→ local implementation/artifacts
→ tests and safety scans
→ local commit
→ release dry-run
→ user approval
→ GitHub push/tag/release when public distribution changes
→ release completion evidence
→ Cycle Completion Experience
→ Linear Done/status sync after approval
→ Version Run close note
```

A public-release Version Run is operationally complete only when verified changes are committed when applicable and the approved public release boundary is either completed or explicitly deferred. Deferral must be visible in the close report as `Version Run Release Deferred`, with the reason and the next release target.

After GitHub push/tag/release succeeds, render `Release Completion Evidence` with `scripts/release-preflight.ts#renderReleaseCompletionEvidence`. The final response must then render or summarize the Cycle Completion Experience; otherwise the Version Run can be publicly released but still appear unfinished to the POKit close flow.

Use Linear Weekly Cycle views to group Version Runs, review carry-over, and decide priorities. Do not hold completed release-ready work until the end of the week by default.

## Release And Hotfix Cycles

Deployment means an action that lets external users receive a new project state. A local commit is not deployment. GitHub push can be deployment when users update from the public repository. GitHub tags, GitHub releases, package publishes, and public documentation deploys are deployment.

Do not create separate release tasks for normal planned work. For POKit, normal deployment and version release are part of the Version Run close condition. Public-release Version Runs are not fully complete until verified changes are committed when applicable and the approved public release boundary is completed or explicitly deferred. If deployment or version release was omitted after a Version Run should have shipped, treat that as release-pending work for the same Version Run or prepare a Hotfix Cycle when the omission is urgent and the next normal work has already resumed.

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

## Public Release Safety

Before pushing, tagging, or publishing a public release, run:

```bash
node --experimental-strip-types scripts/public-safety-scan.ts
```

The public repository must not contain private Linear workspace slugs, private Linear cycle IDs, or live `memory/` state. Public examples should use placeholder identifiers such as `POKIT-123`, `<cycle-id>`, `Cycle N`, and `Hotfix vX.Y.Z`.

Tracked `memory/` files are starter placeholders only. Real resume briefs, current-cycle pointers, decision logs, generated artifacts, and local run summaries belong in a team's private fork or local workspace, not in the public upstream release.
