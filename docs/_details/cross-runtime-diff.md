# Cross-Runtime Diff

POKit이 Codex CLI와 Claude Code 두 runtime에서 동일한 구조의 산출물을 만들어내는지 검증한다. 목표는 동일한 산문이 아니라 동일한 *구조*다.

결과 저장 위치: `artifacts/cross-runtime-diff/<runtime>/scenario-[n].md`

## Checklist

각 시나리오에서 다음을 비교한다.

1. Frontmatter YAML 키가 동일하다.
2. Markdown H1/H2 heading 순서가 동일하다.
3. Artifact 경로 패턴이 동일하다: `artifacts/<type>/<issue-id>.md`.
4. Approval plan에 `idempotencyKey` 와 `writes[]` 가 포함된다.
5. Status 값이 동일 집합을 쓴다: `Ready`, `Needs Label`, `Needs Clarification`, `Needs Approval`, `Skipped`, `Failed`.

Day 2는 체크리스트와 빈 결과 디렉터리만으로 ship 가능하다. 두 runtime 모두 사용 가능하면 최소한 Scenario 1은 양쪽 결과 파일이 있어야 한다.

## Test Scenarios

각 시나리오를 Codex CLI와 Claude Code에서 실행하고 artifact 구조(정확한 산문 아님)를 비교한다.

### Scenario 1: Backlog Add

Input: "백로그에 결제 실패 사유 개선 추가. PRD 필요"

Expected structure:
- dry-run issue plan
- idempotency key
- no external write without approval

### Scenario 2: Cycle Run

Input: "이번 cycle 실행"

Expected structure:
- state read from `memory/context-map.yaml`
- PRD/criteria artifact drafts
- Run Summary

### Scenario 3: Missing Label

Input: issue without `pokit:*` label

Expected structure:
- proposed label
- `Needs Label`
- no artifact until approval

### Scenario 4: Dry-Run Approval Gate

Input: "Linear에 결과 코멘트 남겨줘"

Expected structure:
- dry-run external write plan
- approval request
- no apply without explicit approval

### Scenario 5: Needs Clarification Answer

Input: answers to a clarification block

Expected structure:
- issue moves from `Needs Clarification` to ready
- summary records answered questions
