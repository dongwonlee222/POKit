---
kind: memo
workflow_action: update
idempotency_key: memo-20260517-p1-pokit-167-scope
dependencies:
  - C5
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
proposed_labels:
  - area:release
  - area:cycle-close
  - type:feature
  - release:v0.16.0
proposed_state: Backlog
linked_issues:
  - POKIT-167
id: P1
title: [v0.16.0] POKIT-167 scope 재정의 — 남은 5항목 + workflow 통합
linkedIssue: POKIT-167
action: update (description append)
proposedLabels:
  - area:release
  - area:cycle-close
  - type:feature
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-p1-pokit-167-scope
schema_version: 1
---

## 시각화

```
Before:                          After:

$ ./bin/pokit close              $ "릴리즈 하자"  (자연어)
$ ./bin/pokit release 0.16.0           │
$ ./bin/pokit wizard                   ▼
  ↑ 3개 명령 외워야              [1/8] ✅ 안전 검사
                                  [2/8] ✅ manifest 작성
사용자: "순서 뭐였지?"            [3/8] 🔄 git tag
                                  [4/8] ⏸  push
                                  ...
                                  ✅ v0.16.0 배포 완료
                                  다음: "포킷 종료"
```

## AS-IS

POKIT-167 description의 9항목 중 v0.15.2에서 일부 흡수됨:
- ④ `backlog-manager` → `linear-issue-manager` 리네임 + 4섹션 강제 ✅ 완료
- ⑤ `planCreateIssue` 타입 강제 (`StructuredInput`) ✅ 완료
- ⑥ `renderLinearBacklogDescription` 4섹션 추가 ✅ 완료

미흡수 항목 (v0.16.0에서 처리):
- ① `./bin/pokit release` 8단계 통합 명령 (현재 verb-dispatch에 release는 있으나 스킬 진입점 없음)
- ② `memory/releases/v<VERSION>.yaml` manifest 자동 생성 (M2에서 부분 처리, dogfood 검증 미완)
- ③ 이전 버전 wiring 점검 → `pokit:gap` 라벨 자동 등록
- ⑦ `docs/architecture/13-...md` 진입점 명시
- ⑧ next-action wizard 입력 강제 (`--no-wizard` 제거, `--resume <version>` 추가)

## TO-BE

POKIT-167 description 본문 끝에 다음 섹션 append:

```
## v0.16.0 scope 재정의 (2026-05-17)

### 이미 흡수된 항목 (v0.15.2 완료)
- ④ linear-issue-manager 리네임 + 4섹션 강제
- ⑤ planCreateIssue StructuredInput
- ⑥ renderLinearBacklogDescription 4섹션

### v0.16.0에서 처리할 남은 항목
- ① pokit release 8단계 통합 + release 스킬 신설 (자연어 진입 "릴리즈 하자")
- ② manifest 자동 생성 — releases/v*/manifest.yaml 경로 표준화 후 dogfood 검증
- ③ pokit:gap 자동 등록
- ⑦ docs/architecture/13-*.md 진입점 명시
- ⑧ next-action wizard 강제

### 신규 추가 (워크플로우 제품화 일환)
- close 스킬 신설 (자연어 진입 "사이클 마감해줘") — POKIT-167 ⑤와 통합
- 8-step 진행 가시화 (각 step ✅/🔄/⏸/❌ 상태 표시)
- 실패 시 복구 가이드 출력 ("❌ step N 실패. 복구: ./bin/pokit ...")

### 의존
- C5 (workflow-state.yaml) 완료 후 8-step 상태 추적 가능
```

## 성공 검증

- [ ] POKIT-167 description에 v0.16.0 scope 섹션 append됨
- [ ] 이미 흡수된 4·5·6 항목이 명시되어 다음 세션이 재확인 없이 인지 가능
- [ ] 남은 5항목 + 신규 3항목이 plan-gate 진입 시 1:1 task 매핑 가능
- [ ] cycle-close 스킬 신설 작업이 POKIT-167 ⑤와 단일 작업으로 결합됨

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17, 메인 세션)
- 구현: (plan-gate 시점 결정)
- 검수: TBD
