# POKit Goal Loop

POKit uses a goal-driven loop so Codex and Claude Code can run the same PO workflow without turning the user into a prompt manager.

## Runtime Difference

Claude Code supports `/goal` as a session-scoped completion condition. Use it when the work has a verifiable end state and Claude should continue across turns until the condition is met.

Codex does not rely on Claude's `/goal` command. In Codex, POKit uses skills as the repeatable playbook, plus `scripts/session-brief.ts` and Linear tasks to keep the same goal loop visible and bounded.

## Recommended User Prompts

Claude Code:

```text
/goal POKit shows a brief, processes the selected Linear tasks, all tests pass, git status is clean except known local files, completed Linear issues are marked Done, and the Cycle is either released or explicitly release-pending.
```

Codex:

```text
POKit 시작해줘. Brief의 현재 Cycle 묶음을 기준으로 완료 조건까지 진행하고, 완료된 Cycle 이슈를 Linear Done 처리해줘.
```

Both runtimes should follow the same operating loop:

1. Show `POKit Brief`.
2. Pick the current Cycle bundle from the brief.
3. Use POKit skills for routing and artifact work.
4. Use scripts only as helpers or smoke tests.
5. Verify tests and repo state.
6. Mark completed Linear issues Done.
7. Run the release gate for substantial Cycle work, or show release-pending status when approval is still needed.
8. Show the next brief or next nudge only after the Cycle is released or explicitly deferred.

## POKit Completion Conditions

Use these conditions for substantial POKit runs:

- Linear task list exists before implementation starts.
- Only the selected task bundle is worked on.
- External Linear/GitHub writes are dry-run first and explicitly approved.
- Tests pass.
- Generated artifacts are local unless intentionally documented as examples.
- Completed Cycle issues are marked Done in Linear.
- Substantial Cycle work is not called fully complete until the approved commit, push, tag, and GitHub release are done.
- If release is not approved yet, the final response says `release pending` and does not recommend the next Cycle as if the current Cycle were complete.
- The final response names the latest commit and remaining tasks.

## References

- Claude Code `/goal`: https://code.claude.com/docs/en/goal
- Claude Code slash commands and skills: https://docs.anthropic.com/en/docs/claude-code/slash-commands
- OpenAI Codex app skills overview: https://openai.com/index/introducing-the-codex-app/
- OpenAI skills catalog: https://github.com/openai/skills
