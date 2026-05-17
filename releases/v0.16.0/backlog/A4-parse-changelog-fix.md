---
kind: memo
workflow_action: create
idempotency_key: memo-20260517-a4-parse-changelog-fix
dependencies: []
source: v0.15.3 unresolved carry-forward
proposed_labels:
  - area:changelog-parser
  - type:bug
  - release:v0.16.0
proposed_state: Backlog
id: A4
title: [v0.16.0] parseChangelogSection 헤더 라인 날짜 false positive 제거
action: create (new issue)
proposedLabels:
  - area:changelog-parser
  - type:bug
  - release:v0.16.0
proposedState: Backlog
idempotencyKey: memo-20260517-a4-parse-changelog-fix
schema_version: 1
---

## 시각화

```
Before (버그):                   After (수정):

CHANGELOG.md                     CHANGELOG.md
## v0.15.3 (2026-05-15)          ## v0.15.3 (2026-05-15)
- 진짜 첫 bullet                 - 진짜 첫 bullet

파서 결과:                       파서 결과:
[                                [
  "(2026-05-15)",  ← 오인         "진짜 첫 bullet"  ✅
  "진짜 첫 bullet"               ]
]
```

## AS-IS

`parseChangelogSection` (scripts/internal 어딘가, parsing CHANGELOG.md 섹션) 에서 `## v0.15.3 (2026-05-15)` 같은 헤더 라인의 날짜 부분을 첫 bullet으로 오인하는 false positive 발생.

영향:
- 첫 진짜 bullet이 누락 또는 잘못된 텍스트로 치환
- release manifest changelog 배열이 부정확
- 사소하지만 자동화된 manifest 생성 정확도 저하

v0.15.3 release manifest unresolved에 박제 (owner: human).

## TO-BE

`parseChangelogSection` 로직 보정:

1. 헤더 라인 (`## v...` 또는 `### v...`) 자체를 bullet 후보에서 제외
2. bullet 인식 정규식: `^[-*+]\s+` 만 — 헤더 라인의 `(2026-05-15)` 패턴 매칭 제거
3. 회귀 테스트 fixture 추가:
   - 입력: `## v0.15.3 (2026-05-15)\n\n- 실제 첫 bullet\n- 두 번째 bullet`
   - 기대: bullets = ["실제 첫 bullet", "두 번째 bullet"]

## 성공 검증

- [ ] 헤더 라인 날짜를 bullet으로 잡지 않음 (회귀 테스트 PASS)
- [ ] 진짜 첫 bullet이 인덱스 0에 위치
- [ ] 기존 정상 CHANGELOG 파싱 결과 변화 없음 (regression 0)
- [ ] v0.13.0 ~ v0.15.3 모든 섹션 round-trip 정확도 100%

## 담당 에이전트

- 설계: claude-opus-4-7 (2026-05-17)
- 구현: builder (정규식 한 줄 수정 + 회귀 테스트)
- 검수: tdd-writer
