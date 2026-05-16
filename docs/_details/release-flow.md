# Release Flow — 버전 스프린트, Hotfix, and Public Release Safety

## 버전 스프린트 Release Contract

POKit's default release unit is the 버전 스프린트. 위클리 서클 is a planning, grouping, tracking, and review container; it is not the deployment batch size.

버전 스프린트 release is default for public-release work. 위클리 서클 is only a weekly tracking/review container.

Default 버전 스프린트 release flow:

```text
버전 스프린트 selected
→ local implementation/artifacts
→ tests and safety scans
→ local commit
→ release dry-run
→ user approval
→ GitHub push/tag/release when public distribution changes
→ release completion evidence
→ Cycle Completion Experience
→ Linear Done/status sync after approval
→ 버전 스프린트 close note
```

A public-release 버전 스프린트 is operationally complete only when verified changes are committed when applicable and the approved public release boundary is either completed or explicitly deferred. Deferral must be visible in the close report as `버전 스프린트 Release Deferred`, with the reason and the next release target.

After GitHub push/tag/release succeeds, render `Release Completion Evidence` with `scripts/release-preflight.ts#renderReleaseCompletionEvidence`. The final response must then render or summarize the Cycle Completion Experience; otherwise the 버전 스프린트 can be publicly released but still appear unfinished to the POKit close flow.

Use 위클리 서클 views to group 버전 스프린트s, review carry-over, and decide priorities. Do not hold completed release-ready work until the end of the week by default.

## Inline Fix (No Backlog, No Linear)

툴링 버그·연결 누락처럼 설계는 있으나 구현이 빠진 항목은 백로그나 Hotfix Cycle 없이 즉시 수정한다.

Inline Fix 조건 (모두 충족 시):

- 수정 파일 1~3개 이하
- 외부 배포(GitHub push/tag/release) 없음
- 새 설계 또는 기능 추가 없음 — 기존 설계의 연결 누락·오타·경로 오류 수준

Inline Fix 절차:

1. 수정 → 테스트 확인
2. CHANGELOG에 한 줄 기록 (버전 올림 없음)
3. 커밋 후 Cycle 재개

조건을 벗어나면 백로그(신규 기능) 또는 Hotfix Cycle(배포 후 긴급 수정)로 전환한다.

## Release And Hotfix Cycles

Deployment means an action that lets external users receive a new project state. A local commit is not deployment. GitHub push can be deployment when users update from the public repository. GitHub tags, GitHub releases, package publishes, and public documentation deploys are deployment.

Do not create separate release tasks for normal planned work. For POKit, normal deployment and version release are part of the 버전 스프린트 close condition. Public-release 버전 스프린트s are not fully complete until verified changes are committed when applicable and the approved public release boundary is completed or explicitly deferred. If deployment or version release was omitted after a 버전 스프린트 should have shipped, treat that as release-pending work for the same 버전 스프린트 or prepare a Hotfix Cycle when the omission is urgent and the next normal work has already resumed.

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
