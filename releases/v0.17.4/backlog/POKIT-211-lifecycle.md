---
kind: prd
schema_version: 1
title: "POKIT-211 — 백로그 lifecycle 관리 (planning gate + version 단일 source)"
created: "2026-05-18T06:30:00Z"
updated: "2026-05-18T06:30:00Z"
author: "claude-opus-4-7"
linked_issues:
  - POKIT-211
linked_cycle: "v0.17.4"
linked_release: "v0.17.4"
status: draft
---

# POKIT-211 — 백로그 lifecycle 관리

## 목표

직전 release unresolved + 신규 백로그를 통합 관리하는 단일 진입점. 매 cycle 시작 시 사용자가 `./bin/pokit plan` 한 번 호출 → carry-over/fresh 통합 목록 + 우선순위 조정 → 선택 항목에 `## 버전` description 자동 부착. cycle ≠ version 분리 정책(라벨 신설 금지) 준수.

## 비-목표

- RICE/Reach 자동 계산 (이번 cycle 범위 밖, 후속 cycle)
- Linear cycle 자동 생성 (cycle은 Team Backlog 영구 유지)
- 백로그 자동 마감 / 만료 정책

## 결정 사항 (brainstorm)

- **Q1 (수정)**: `./bin/pokit plan <ver>` — 인자로 target_version 받음. 첫 호출 시 자동으로 `markCycleStart` 호출하여 `workflow-state.yaml.target_version` 설정. 이미 설정돼있으면 동일 값이면 skip, 다른 값이면 사용자 확인. 별도 `cycle-start` verb 신설 안 함 — verb 폭증 방지.
- **Q2**: Linear priority 그대로 + 사용자 수동 조정 (RICE 자동 계산 비-목표)
- **Q3**: description `## 버전` 라인을 `## AS-IS` 바로 위에 삽입 (4섹션 표준 보존 + 최상단 가시성)
- **Q4**: carry-over는 `## 버전` 라인에 `carry-over from v0.17.3` 명시 (별도 라벨 X)
- **Q5**: `pokit start` 출력에 `🎯 v0.17.4 (N건: carry-over X / fresh Y)` 한 줄 추가

## 요구사항

### R1 — `./bin/pokit plan` CLI

```
./bin/pokit plan <ver> [--dry-run] [--apply] [--issues POKIT-X,POKIT-Y,...]
```

- 인자 `<ver>` 필수 (예: `0.17.4`). 첫 호출 시 `markCycleStart` 자동 호출.
- 기본 = dry-run (Linear write 없음)
- `--apply` 시 선택 항목 description 업데이트
- `--issues` 플래그: 명시적 이슈 목록. 지정 시 대화형 prompt skip → 비대화형/CI/Bash tool 환경 지원
- TTY 없음 + `--issues` 미지정 = exit 2 + 안내 (release.ts retro-check와 동일 패턴)

**dry-run 출력**:
```
🎯 Planning gate — target: v0.17.4

직전 release: v0.17.3 (released 2026-05-18)
─────────────────────────────────────────────
[carry-over from v0.17.3]
  □ POKIT-159  장기기억 retrieval 메커니즘 설계        priority: Medium
  □ POKIT-206  박제 잔존 비유 + 활성 메모리 치환         priority: -
  ...

[fresh — Team Backlog]
  □ POKIT-130  v0.7.0 설계 지속성 및 의도 검정          priority: Medium
  ...
─────────────────────────────────────────────

선택할 이슈 번호 (쉼표 구분): _
```

- 사용자 입력 → 선택 항목 description에 `## 버전` 라인 plan 표시
- `--apply` 추가 호출 → Linear update 실행

### R2 — description `## 버전` 라인 표준

```markdown
## 버전

v0.17.4

## AS-IS

...
```

- carry-over의 경우:
```markdown
## 버전

v0.17.4 (carry-over from v0.17.3)

## AS-IS
...
```

- 자동 위치: `## AS-IS` 바로 위. 기존 description에 `## 버전` 라인 있으면 update, 없으면 insert.

### R3 — carry-over 자동 감지

- `releases/<prev-version>/manifest.yaml` 의 `unresolved:` 섹션 파싱
- 직전 release manifest의 `owner` 가 Linear issue identifier 면 carry-over 후보로 표시
- `linked_release` description 메타로 매핑 가능 시 우선

### R4 — `pokit start` 출력 보강

현재:
```
- 다음 스프린트 target version: (미정)
```

목표:
```
🎯 다음 target version: v0.17.4 (3건 할당됨)
   └─ carry-over 1건 / fresh 2건
```

- `target_version=null` 이면 현재 출력 유지 (회귀 방지)
- 할당된 이슈 = description에 `## 버전 v0.17.4` 라인 있는 Linear 이슈 카운트
- **캐싱 전략**: 매 pokit start마다 Linear API search → 41건 fetch 비용 측정 후 결정. 1초 미만이면 직접 호출, 이상이면 `memory/cycle-cache.yaml` (target_version별 카운트 캐시) + TTL 1시간 또는 markCycleStart/apply 시 invalidate.

### R5 — workflow-state 갱신

- `markCycleStart(rootDir, targetVersion)` 신규 export
  - `target_version` set, `state: "active"`, `updated_at` 갱신
- (POKIT-208에서 `markReleaseComplete`가 release 후 `target_version: null` 비움 → 이미 wire-in 됨)

## API/CLI shape

### scripts/cli/plan.ts (신규)

```ts
async function main() {
  const opts = parseArgs(process.argv);
  const state = loadWorkflowState();
  if (!state?.target_version) {
    console.error("target_version 미설정. './bin/pokit cycle-start <ver>' 먼저 호출.");
    process.exit(2);
  }
  const carryOver = await fetchCarryOverIssues(state.last_release_version);
  const fresh = await fetchTeamBacklogIssues();
  renderPlanTable(carryOver, fresh, state.target_version);
  if (opts.apply) {
    const selected = await promptSelection();
    await applyVersionLines(selected, state.target_version);
  }
}
```

### scripts/internal/workflow-state.ts (확장)

```ts
export function markCycleStart(
  rootDir: string,
  targetVersion: string,
  now?: Date,
): WorkflowState
```

### scripts/internal/version-line.ts (신규)

```ts
export function insertVersionLine(
  description: string,
  version: string,
  carryOverFrom?: string,
): string

export function readVersionLine(description: string): {
  version: string | null;
  carryOverFrom: string | null;
}
```

## 마이그레이션

- 기존 description에 `## 버전` 라인 없는 이슈 → 본 cycle에서 사용자가 plan 호출 시 자동 부착
- POKIT-159 의 기존 carry-over append 노트(description 하단, 자유 형식)는 **그대로 보존**. 본 CLI는 별도로 `## AS-IS` 위에 `## 버전 v0.17.4 (carry-over from v0.17.3)` 라인 insert.
- `insertVersionLine` 규칙:
  - 기존 `## 버전` 라인 있으면 update (값 갈아치움)
  - 없으면 `## AS-IS` 라인 직전에 insert
  - description 하단의 기존 자유 형식 carry-over 노트는 건드리지 않음 (히스토리 보존)

## 테스트 시나리오

### 단위 (`tests/version-line.test.mjs`)
- `insertVersionLine` 신규 description에 ## 버전 삽입
- 기존 ## 버전 라인 있으면 update (값 갈아치움)
- carry-over 표기 형식
- 4섹션 표준(`## AS-IS` 위치) 보존
- **기존 하단 자유 형식 carry-over 노트가 있어도 보존되는 케이스 (POKIT-159 dogfood 패턴)**

### 통합 (`tests/integration/plan-cli.test.mjs`)
- dry-run: Linear API 호출 없음
- apply + `--issues POKIT-X,POKIT-Y`: 선택 항목 description update plan
- 첫 호출 시 markCycleStart 자동 트리거 (workflow-state.target_version 비어있을 때)
- 이미 다른 target_version 설정돼있을 때 → 사용자 확인 prompt 또는 `--force` 필요
- TTY 없음 + `--issues` 미지정 → exit 2

### 회귀 (`tests/regression/v0.17.4-plan-gate.test.mjs`)
- pokit start 출력에 "🎯 v0.17.4" 라인 (target_version 있을 때)
- target_version null 이면 기존 "(미정)" 출력

## 성공 검증

1. `./bin/pokit plan` → 직전 release unresolved + Team Backlog 통합 목록 출력
2. 사용자 선택 → `./bin/pokit plan --apply` → Linear 이슈 description에 `## 버전 v0.17.4` 라인 추가
3. `./bin/pokit start` → 🎯 라인에 정확한 carry-over/fresh 카운트
4. POKIT-159 description에 `## 버전 v0.17.4 (carry-over from v0.17.3)` 라인 update
5. `npm test` 516+ → 신규 케이스 PASS, 회귀 0

## 일정/단계

- T1: `version-line.ts` + 단위 테스트 (TDD)
- T2: `markCycleStart` workflow-state 확장 + 테스트
- T3: `scripts/cli/plan.ts` dry-run 모드 + plan rendering
- T4: `--apply` 모드 + Linear update wire
- T5: `pokit start` 출력 보강 (R4) + 회귀 테스트
- T6: POKIT-159 dogfood (실 cycle 적용)

## 의존

- 선결: 없음 (POKIT-208 wire-in은 이미 v0.17.3 머지)
- 후속: POKIT-209/207/206/210/159 — 본 CLI 위에 우선순위 자동 정렬

## 영향 파일

- `scripts/cli/plan.ts` (신규)
- `scripts/internal/version-line.ts` (신규)
- `scripts/internal/workflow-state.ts` (markCycleStart 추가)
- `scripts/cli/session-brief.ts` 또는 `scripts/cli/session-start.ts` (🎯 라인 출력)
- `bin/pokit` (verb dispatch에 `plan` 추가)
- `tests/version-line.test.mjs` (신규)
- `tests/integration/plan-cli.test.mjs` (신규)
- `tests/regression/v0.17.4-plan-gate.test.mjs` (신규)

## 담당 에이전트

- 설계: claude-opus-4-7 (본 PRD)
- 구현: claude-sonnet-4-6 (T1-T5 TDD)
- 검증: claude-haiku-4-5-20251001 (테스트 실행 + 회귀 확인)
- 검수: advisor (apply 직전 의도 점검)
