---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-wf11-tests-consolidation
dependencies: []
source: 2026-05-17 v0.16.0 메모 작성 중 사용자 우려 — "tests 계속 늘어가는데?
proposed_labels:
  - Improvement
proposed_state: Backlog
id: WF11
title: [v0.16.0] tests/ 폭증 통합 — 55개+ → 카테고리 정리 + contract dispatcher
action: create (new issue)
proposedLabels:
  - Improvement
proposedState: Backlog
idempotencyKey: memo-20260517-wf11-tests-consolidation
schema_version: 1
---

## 시각화

```
Before (현재):                   After (정리 후):

tests/                           tests/
├── 55개 .test.mjs 평면 나열      ├── contract/
│   ├── *-contract.test.mjs (7)  │   ├── all-contracts.test.mjs (단일 dispatcher)
│   ├── *-regression (cycle별)   │   └── (cycle별 contract 모듈 import)
│   ├── *-validator (5)          ├── unit/
│   ├── *-preflight (3)          │   ├── (함수 단위 테스트)
│   └── ...                      ├── integration/
                                  │   ├── (end-to-end 시나리오)
v0.16.0 후:                       ├── regression/
+ 10개 추가 → 65+개               │   ├── v0.15.3-unresolved.test.mjs
                                  │   └── (fixture-driven, cycle 묶음)
사용자: "계속 늘어가는데?"        ├── fixtures/
                                  │   ├── v0.15.3/
                                  │   └── v0.16.0/
신규 cycle = 신규 test 폭증       └── _setup/
                                      └── (공통 setup·helper)

                                 신규 cycle당 test 증가율 ≤ 3개
```

## AS-IS

`tests/` 디렉토리 현재 55개 `.test.mjs` 파일 평면 나열:
- **contract test 7개**: agent-rules, archive-guardrail, external-write-guard, folder-layout-contract, hooks-contract, korean-language-contract, subagent-payload-check
- **validator test 5개**: memory-frontmatter-validator, message-catalog, resume-brief-validator, label-preflight, linear-create-preflight
- **preflight 3개**: release-preflight, linear-write-semantic-preflight, label-preflight
- **회귀 테스트**: cycle별 fixture (예: session-brief manifest 경로 fix POKIT-173 회귀)
- **단위 + integration 혼재**

문제:
1. **카테고리 분리 없음** — 신규 작성자가 어디에 둘지 매번 판단
2. **공통 setup 중복** — 각 test가 자체 fixture 로딩, env 설정
3. **회귀 테스트 영구 누적** — 한 번 작성하면 cycle 끝나도 유지, deprecation 정책 없음
4. **contract test 분산** — 7개로 분산되어 단일 contract 위반 시 한번에 보기 어려움
5. v0.16.0 메모 12건 중 **신규 contract test 5건 + 회귀 5건 = 10개 추가** 예정

신규 cycle마다 5-10개 추가 → 1년 후 100+개 예상. test 실행 시간·유지보수 비용·심리적 부담 증가.

## TO-BE

`tests/` 디렉토리 카테고리 분리 + contract dispatcher 도입.

### 1. 디렉토리 재구성
```
tests/
├── contract/           # 깨지면 안 되는 계약 (folder-layout, frontmatter, agent-rules 등)
│   ├── all-contracts.test.mjs    ← 단일 진입점
│   └── *.contract.mjs            ← 모듈로 import
├── unit/               # 함수 단위 테스트
├── integration/        # end-to-end 시나리오 (release flow 등)
├── regression/         # cycle별 fixture-driven 회귀
│   ├── v0.15.3-unresolved.test.mjs
│   └── v0.16.0-*.test.mjs
├── fixtures/           # 버전별 fixture 묶음
│   ├── v0.15.3/
│   └── v0.16.0/
└── _setup/             # 공통 setup·helper
    ├── env.mjs
    ├── linear-mock.mjs
    └── manifest-helpers.mjs
```

### 2. Contract Dispatcher
`tests/contract/all-contracts.test.mjs` — 모든 contract 테스트를 한 곳에서 실행:
```typescript
import { folderLayout } from "./folder-layout.contract.mjs";
import { frontmatter } from "./artifact-frontmatter.contract.mjs";
import { skillTail } from "./skill-tail.contract.mjs";
import { dryRunFormat } from "./dry-run-format.contract.mjs";
import { backlogMemoVisualization } from "./backlog-memo-visualization.contract.mjs";
// ... 모든 contract module

describe("POKit Contracts", () => {
  folderLayout();
  frontmatter();
  skillTail();
  dryRunFormat();
  backlogMemoVisualization();
});
```
→ 신규 contract 추가 시 import 1줄. test 파일 수 증가 X.

### 3. 회귀 테스트 deprecation 정책
- 회귀 테스트는 `regression/v<version>-<bug-id>.test.mjs` 명명 강제
- v<version>은 회귀 발견 버전
- v<X+2> 도달 시 자동 알림 ("이 회귀 테스트 아직 의미 있나?")
- 명백히 obsolete 시 archive 또는 삭제 (contract test로 승격 가능하면 승격)

### 4. v0.16.0 신규 test 흡수 계획
v0.16.0 메모들의 신규 contract test 제안 5건을 **단일 contract dispatcher에 통합**:
- C3 → skill-tail.contract.mjs
- C4 → artifact-frontmatter.contract.mjs
- C8 → dry-run-format.contract.mjs
- C9 → backlog-memo-visualization.contract.mjs
- (기존) folder-layout, hooks 등은 기존 위치에서 contract/ 폴더로 이동

회귀 테스트 5건(A2/A3/A4/C5/C6)은 `regression/v0.16.0-*` 명명.

→ **신규 파일 5개 → 0개**, 회귀 5개는 명명 표준화. tests 디렉토리 65 → ~60개로 오히려 감소 가능.

## 성공 검증

- [ ] `tests/` 디렉토리에 5개 하위 카테고리 (contract/unit/integration/regression/fixtures) 생성
- [ ] `tests/contract/all-contracts.test.mjs` dispatcher 동작 — 모든 contract 단일 실행
- [ ] v0.16.0 신규 contract 5건이 dispatcher에 흡수됨 (신규 .test.mjs 파일 0개)
- [ ] 회귀 테스트 명명 표준 (regression/v<X>-<bug>.test.mjs) 강제
- [ ] tests/_setup/ 공통 helper 1개 이상 추출 (중복 setup 제거)
- [ ] 신규 cycle당 test 파일 증가율 ≤ 3개 (이전 cycle 대비 측정)
- [ ] `tests/folder-layout-contract.test.mjs` 가 본 카테고리 강제 (오용 차단)
- [ ] CI 실행 시간 변화 ±10% 이내 (퍼포먼스 회귀 X)

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, 사용자 우려 기반)
- 구현: architect + builder (디렉토리 마이그레이션 + dispatcher)
- 검수: auditor + tdd-writer (CI 실행·회귀 확인)
