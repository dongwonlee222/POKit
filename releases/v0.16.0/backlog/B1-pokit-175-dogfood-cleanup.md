---
kind: memo
workflow_action: update
idempotency_key: memo-20260517-b1-pokit-175-dogfood
dependencies: []
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
proposed_labels:
  - area:folder-layout
  - type:refactor
  - release:v0.16.0
proposed_state: Backlog
linked_issues:
  - POKIT-175
id: B1
title: [v0.16.0] POKIT-175 보강 — dogfood 제거 + cycle-meta 위치 + 15-folder-layout 갱신
linkedIssue: POKIT-175
action: update (description append)
proposedLabels:
  - area:folder-layout
  - type:refactor
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-b1-pokit-175-dogfood
schema_version: 1
---

## 시각화

```
Before (현재):                   After (v0.16.0):

.                                .
├── releases/v0.15.3/            ├── releases/v0.16.0/
│   └── manifest.yaml            │   ├── manifest.yaml
│      (만)                      │   ├── prds/POKIT-N.md
├── artifacts/                   │   ├── criteria/POKIT-N.md
│   ├── prds/  ← 버전 무관 위치  │   ├── sprints/
│   ├── criteria/                │   └── retro/
│   └── sprints/                 │
└── dogfood/                     ├── artifacts/
    ├── prds/  ← 중복!           │   ├── backlog/
    ├── criteria/                │   ├── analyses/
    └── sprints/                 │   └── profiles/
                                 │
                                 (dogfood/ 제거)
```

## AS-IS

POKIT-175 ("releases/v<버전>/ 단위 묶음 도입 + artifacts/ 역할 재정의 + dogfood/ 제거")는 Backlog 상태. M6 일부 진행 (manifest 경로 헬퍼 v0.15.3 hotfix)되었으나 본 작업 미완료.

현재 디렉토리 상태:
- `releases/v*/` — manifest.yaml만, 하위 디렉토리 없음
- `artifacts/` — prds, criteria, sprints (버전 무관 위치), backlog, analyses, profiles, cross-runtime-diff 혼재
- `dogfood/` — 별도 존재, prds/criteria/sprints가 artifacts와 중복

`docs/architecture/15-folder-layout.md` 라인 175-181:
> 1. 새 최상위 폴더 추가/제거 시 본 문서 갱신 안 하면 `tests/folder-layout-contract.test.mjs` 가 차단
> 3. AGENTS.md Core Principle 변경 시 본 문서도 함께 갱신

→ dogfood 제거 시 15-folder-layout.md 갱신 + contract test 갱신 필수.

추가 결정 필요: `memory/releases/v*.yaml`(cycle 메타)를 `releases/v*/cycle-meta.yaml`로 이동할지.

## TO-BE

POKIT-175 description 본문 끝에 다음 섹션 append:

```
## v0.16.0 보강 (2026-05-17)

### 추가 작업
1. dogfood/ 디렉토리 제거
   - dogfood/{prds,criteria,sprints} 내용을 dogfood/legacy/로 격리 후 gitignore 추가
   - 신규 추가 차단 (15-folder-layout.md 라인 47 정책 강화)
2. artifacts/ 역할 재정의
   - 잔존: backlog/, analyses/, profiles/, cross-runtime-diff/
   - 제거: prds/, criteria/, sprints/, manifests/(빈 폴더)
3. releases/v*/ 하위 표준 디렉토리
   - prds/, criteria/, sprints/, retro/, gaps/
4. 15-folder-layout.md 갱신
   - 라인 43-44 (artifacts·releases 정의) 재작성
   - 라인 47, 69 (dogfood) 제거 또는 legacy 마크
   - 라인 142-154 (신규 폴더 표) 갱신
5. tests/folder-layout-contract.test.mjs 갱신
   - dogfood 차단, releases/v*/prds 등 신규 디렉토리 허용

### 결정 필요
- memory/releases/v*.yaml → releases/v*/cycle-meta.yaml 이동 여부
  - 찬: 버전 단위 자료 한 곳 모음, releaseManifestPath() 헬퍼 일관성
  - 반: memory는 cross-run, releases는 per-version. 의미상 분리 유지
  - 추천: 이번 cycle에서 결정 → 결정 시 manifestPath()와 동일 패턴으로 cycleMetaPath() 헬퍼 신설
```

## 성공 검증

- [ ] POKIT-175 description에 v0.16.0 보강 섹션 append됨
- [ ] dogfood/ 제거 작업이 명확한 단계로 분해됨 (격리 → gitignore → 신규 차단)
- [ ] 15-folder-layout.md 갱신 항목이 라인 단위로 식별 가능
- [ ] cycle-meta 위치 결정 옵션이 cycle 진입 시 의사결정 가능 상태로 박제됨

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: builder + auditor (디렉토리 마이그레이션은 누락 검증 필수)
- 검수: contract test 자동
