---
id: bl-2026-05-17-003
created: 2026-05-17
status: promoted
domain: workflow+tooling
size: L
title: "POKIT-192 재정의 — release-scope manifest backfill (bl-002 추상화 재활용)"
target_version: v0.17.2
registration_mode: update            # POKIT-192 description append 완료
promoted_to: POKIT-192
depends_on:
  - bl-2026-05-17-002
---

## AS-IS

- POKIT-192 (WF15) release dispatcher [4.5/8] manifest backfill 자동화 미구현
- manifest.yaml unresolved 수동 작성 → 누락·오타·carry-forward 누수
- bl-002 (session-scope 미결 집계)와 본질적으로 같은 패턴(scope만 다름)
- bl-002·POKIT-192 따로 구현 시 동일 로직 중복 + 시간 경과 후 drift 위험

## TO-BE

### 공통 추상화 (bl-002 완료 후 Rule of three 평가)

```ts
collectUnresolved({
  scope: "session" | "release",
  sources: ["linear-pending", "backlog-raw", "decision-log"],
  filters: { since, until, status }
}) → UnresolvedDigest
```

bl-002에서 세션 전용으로 먼저 구현 → bl-003에서 같은 패턴 등장 시 함수 추출.
(Phase 1 = 추상화 X, Phase 2 = 두 번째 사용처 보고 추출)

### release dispatcher [4.5/8] 단계 추가

`scripts/cli/release.ts` 8단계 흐름에 4.5 단계 신규:

1. 버전 검증
2. safety scan
3. tag/push
4. manifest 생성 (기존)
4.5. **manifest backfill (신규)** ← 본 작업
5. cycle close
6. retro-check
7. next-action wizard
8. resume-brief 기록

### 4.5 단계 동작

- Linear cycle issues 자동 수집 (state=완료/미완 분리)
- backlog-raw/ 중 promoted_to=null & target_version=현재 cycle = 누락 후보 알림
- carry-forward 처리 — 이전 manifest unresolved 항목 자동 이월
- wiring.actual probe — 코드/문서 실제 상태와 비교
- owner=human N cycle 카운트 정책 — 인간 담당 항목이 N cycle 이상 미해결 시 escalation

## 성공 검증

- `./bin/pokit release v0.17.2` 실행 시 4.5/8 단계 진입 + manifest unresolved 자동 채움
- v0.17.2 manifest 자동 생성 결과에 v0.17.1 carry-forward 항목 포함
- wiring.actual probe 결과 manifest YAML에 반영
- bl-002의 collectUnresolved 사용 (중복 구현 0)
- owner=human N cycle 카운트 발현 시나리오 1건 검증

## 담당 에이전트

미정 (release dispatcher 영역 — 큰 PR, 신중)

## 비고

- 본 작업은 bl-002 완료 후 진입 (의존성 명시)
- POKIT-192 Linear description에 본 bl-003 의존 명시 필요
- v0.17.2 메인 라인
