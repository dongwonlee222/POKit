---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-wf12-linear-ts-cli
dependencies: []
source: 2026-05-17 POKIT-187 (WF10) update 직후 마찰 분석 — 80%가 CLI 부재 비용
proposed_labels:
  - Improvement
proposed_state: Backlog
id: WF12
title: [v0.16.0] scripts/internal/linear.ts CLI 진입점 추가 — update/create 한 줄 명령
action: create (new issue)
proposedLabels:
  - Improvement
proposedState: Backlog
idempotencyKey: memo-20260517-wf12-linear-ts-cli
schema_version: 1
---

## 시각화

### Before (현재 — POKIT-187 update 시 실측)

```
사용자 발화                Claude                    파일/시스템
   │                         │                           │
   │ "POKIT-187 Done"         │                           │
   ├────────────────────────▶│                           │
   │                         │ ① /tmp/pokit_187_update.ts │  🔴 40줄 손작성
   │                         │   import + plan + apply    │
   │                         ├──────────────────────────▶│
   │                         │ ② tsx 실행                 │  🔴 command not found
   │                         │ ③ npx tsx 재시도           │  🔴 top-level await 오류
   │                         │ ④ async main() 래핑 수정   │  🔴
   │                         │ ⑤ 재실행 PASS              │
   │                         ├──────────────────────────▶│ Linear API
   │                         │ ⑥ /tmp 정리                │
   │                         │                            │

총 6 step · 매 update마다 반복 · 40줄 보일러플레이트
```

### After (CLI 도입 시)

```
사용자 발화                Claude                    파일/시스템
   │                         │                           │
   │ "POKIT-187 Done"         │                           │
   ├────────────────────────▶│                           │
   │                         │ ① append 본문을           │
   │                         │   /tmp/append.md에 쓰기   │
   │                         ├──────────────────────────▶│
   │                         │ ② node scripts/internal/  │
   │                         │   linear.ts update         │
   │                         │   POKIT-187 --state Done   │
   │                         │   --description-append-    │
   │                         │   file /tmp/append.md      │
   │                         ├──────────────────────────▶│ Linear API
   │                         │                            │ decision-log auto

총 2 step · 40줄 → 1줄 명령
```

### 마찰 분포 (POKIT-187 update 체감)

```
🔴 CLI 부재 (보일러 + 오류)    ████████████████████ 60%
🔴 tsx runtime 오류 디버깅     ████████ 20%
⚠️ "Linear" 재발화 요구         ████ 10%   ← 메모리로 해소
⚠️ skill guard 안내             ██ 5%
✅ 본질 절차                    ██ 5%
                                └────────────────────┘
                                0%      50%     100%
```

**80%가 CLI 부재 비용. 본 항목 1개로 해소.**

## AS-IS

`scripts/internal/linear.ts`는 함수 라이브러리. CLI 진입점 없음.

- `planCreateIssue`, `applyCreateIssue`, `planUpdateIssue`, `applyUpdateIssue` 모두 named export
- 직접 실행 불가 → 매번 임시 `.ts` 파일 작성해서 import 후 호출 필요
- 2026-05-17 POKIT-187 update 시 `/tmp/pokit_187_update.ts` 40줄 손작성

부수 문제:
- `tsx` 글로벌 미설치 → `npx tsx` 매번 다운로드 시간
- `package.json` `"type": "module"` 없음 → top-level await 불가, `async main()` 래핑 강제
- decision-log auto append가 임시 스크립트에서는 자동 안 됨 (linear-issue-manager 스킬 외부)

## TO-BE

`scripts/internal/linear.ts` 하단에 CLI 진입점 추가:

```typescript
if (import.meta.url === `file://${process.argv[1]}`) {
  // argv parsing: subcommand (create | update | assign-label) + flags
  // 각 함수 호출 + dry-run/apply 분기 + decision-log append
}
```

지원 명령:
```bash
# update
node scripts/internal/linear.ts update POKIT-187 \
  --state Done \
  --description-append-file /tmp/append.md

# create
node scripts/internal/linear.ts create \
  --title "[v0.16.0] ..." \
  --labels Improvement \
  --description-file /tmp/desc.md

# assign label
node scripts/internal/linear.ts assign-label POKIT-187 --label Done
```

### 설계 원칙

1. **dry-run 기본** — `--apply` 플래그 없으면 plan만 출력
2. **승인 흔적** — `--apply` 시 actor 명시 강제 (`--actor main_agent`)
3. **파일 기반 입력** — long markdown은 stdin 또는 `--*-file` (argv 길이 폭주 방지)
4. **node 실행** — tsx 의존 제거. Node.js 24+ native `.ts` 지원 활용 (또는 빌드 후 .js 배치)
5. **hook 호환** — 화이트리스트 패턴 `^\s*(node|deno|tsx|bun|npx\s+tsx)\s+scripts/internal/linear\.ts` 그대로 통과 (이미 커버됨)
6. **decision-log auto append** — `--apply` 성공 시 자동 기록

### Node native .ts 실행 검토

Node.js 24+는 `--experimental-strip-types` 플래그로 `.ts` 직접 실행 가능. tsx 의존 제거 가능.
대안: `package.json` scripts에 `"linear": "tsx scripts/internal/linear.ts"` 추가하여 `npm run linear -- update POKIT-187 ...` 형태.

## 성공 검증

- [ ] `scripts/internal/linear.ts` 하단에 CLI 진입점 추가 (import.meta.url 체크)
- [ ] subcommand 3종 동작: `create` / `update` / `assign-label`
- [ ] dry-run 기본, `--apply` 명시 시만 실제 write
- [ ] long markdown 입력: `--description-file` / `--description-append-file` 지원
- [ ] decision-log auto append (`--apply` 성공 시)
- [ ] tsx 의존 제거 (node 직접 실행)
- [ ] 기존 함수 import 사용처 (있다면) 회귀 없음
- [ ] hook 화이트리스트 통과 회귀 테스트 (tests/hook-linear-bypass.test.mjs에 케이스 추가)
- [ ] 테스트: `node scripts/internal/linear.ts update POKIT-187 --state Done --description-append-file /tmp/test-append.md` → dry-run plan 출력
- [ ] linear-issue-manager 스킬도 신규 CLI 경유로 마이그레이션 (선택, 후속 작업 가능)

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, POKIT-187 update 직후 마찰 분석)
- 구현: fullstack-developer (CLI argv 파싱 + 기존 함수 wiring)
- 검수: feature-dev:code-reviewer (CLI 인터페이스 일관성, dry-run/apply 분리, 입력 검증)

## 비고

- POKIT-187 update 작업의 직접적 후속. WF11(tests 통합)과 독립.
- v0.16.0 scope 추가 (15건 → 16건). 1차 병렬 그룹 (의존 0).
- 본 항목 완료 후 모든 후속 Linear update/create가 1줄 명령으로 단축됨 → C7 (artifact-sync 스킬) 구현 비용도 함께 감소.

## 구현 결과 (2026-05-17, fullstack-developer Sonnet 4.6)

### 채택 패턴

- **CLI 진입점**: `import.meta.url === pathToFileURL(process.argv[1]).href` — `pathToFileURL` 사용으로 macOS symlink·공백 경로 안전
- **ESM import 위치**: `parseArgs`, `readFile`, `realpath`, `stat`, `appendFile`, `resolvePath`, `pathToFileURL` 모두 파일 상단에 추가 (ESM 정적 import 규칙 준수)
- **exit code 규약**: 0=성공, 1=plan 생성 실패, 2=usage/argv 오류, 3=apply API 오류, 4=decision-log append 실패
- **파일 입력 검증**: `readDescriptionFile()` — realpath 체크 + 512 KB 한도 + 한국어 에러
- **dry-run에서 API 호출 없음**: `assign-label` dry-run은 `listLabels()` 미호출. plan에 labelName만 기록
- **POKIT_TEST_MOCK=1 sentinel**: `--apply` 분기에서 실제 API 호출 전 mock JSON 출력 후 return
- **printUsage → stderr**: subcommand 없음·--help 시 `console.error`로 출력 (테스트 검증 통과)

### 한정사항

- **CLI create --apply 미지원**: `planCreateIssue`의 description이 `LinearBacklogDescriptionInput` 객체 구조라 raw string 직접 전달 불가. dry-run plan만 출력, apply 시 exit 1 에러. 4섹션 description은 `update --description-append-file`로 후속 추가하는 워크플로우 권장
- **assign-label apply**: 기존 라벨 덮어쓰기 방식 (`labelIds: [labelId]`). 라벨 보존(추가) 로직은 별도 후속 작업
- **hook 화이트리스트**: `node --experimental-strip-types scripts/internal/linear.ts ...`는 hook 화이트리스트 정규식 미매칭이나, `api.linear.app` 문자열 없으면 hook 통과. 화이트리스트 패턴 보강은 별도 후속

### 회귀 테스트 결과

- `node --test tests/linear-cli.test.mjs` → **10/10 PASS**
- `node --test tests/hook-linear-bypass.test.mjs` → **15/15 PASS** (신규 2건 포함)
- `.claude/hooks/block-linear-api.sh test` → **17/17 PASS**

### 변경 파일

- `scripts/internal/linear.ts` — CLI 블록 추가 (1421줄 → 1801줄, +380줄)
- `tests/hook-linear-bypass.test.mjs` — CLI hook 회귀 케이스 2건 추가 (13→15케이스)
- `artifacts/backlog/v0.16.0/WF12-linear-ts-cli.md` — 구현 결과 append (본 섹션)

### 다음 단계

- hook 화이트리스트에 `--experimental-strip-types` 플래그 허용 패턴 추가 (별도 후속)
- CLI create --apply 지원: raw description → IssueInput 변환 로직 (별도 후속)
- linear-issue-manager 스킬 CLI 경유 마이그레이션 (선택, 별도 후속)
