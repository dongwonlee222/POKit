---
cycle_id: team-backlog
cycle_name: Team Backlog
source: team_backlog
generated_at: 2026-05-17T15:24:36.372Z
status: draft
---

# Run Summary: Team Backlog

## 1. AI가 하지 않은 것

- Linear/GitHub 외부 write를 실행하지 않음.
- 산출물 파일을 생성하거나 기존 파일을 덮어쓰지 않음.
- 라벨/댓글/status 변경은 승인 대기 plan으로만 정리함.

## 2. 생성 가능

- POKIT-169: `artifacts/prds/POKIT-169.md`
- POKIT-168: `artifacts/prds/POKIT-168.md`
- POKIT-167: `artifacts/prds/POKIT-167.md`
- POKIT-166: `artifacts/criteria/POKIT-166.md`
- POKIT-164: `artifacts/prds/POKIT-164.md`
- POKIT-161: `artifacts/prds/POKIT-161.md`
- POKIT-159: `artifacts/prds/POKIT-159.md`
- POKIT-130: `artifacts/criteria/POKIT-130.md`
- POKIT-125: `artifacts/criteria/POKIT-125.md`
- POKIT-123: `artifacts/criteria/POKIT-123.md`
- POKIT-122: `artifacts/criteria/POKIT-122.md`
- POKIT-98: `artifacts/criteria/POKIT-98.md`
- POKIT-97: `artifacts/criteria/POKIT-97.md`
- POKIT-96: `artifacts/criteria/POKIT-96.md`
- POKIT-95: `artifacts/criteria/POKIT-95.md`
- POKIT-94: `artifacts/criteria/POKIT-94.md`

## 3. 확인 필요

- 없음

## 4. 라벨 필요

- POKIT-202 [v0.17.2] regression 테스트 명명 표준화 + _setup/ 공통 helper + tests/ci/ 분리
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-201 [v0.17.2] block-linear-api.sh 화이트리스트 node 플래그 매칭 보강
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-200 [v0.17.2] linear.ts CLI assign-label 누적 보존 (덮어쓰기 → append)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-199 [v0.17.2] C4 Phase 2 전수 마이그레이션 + M6 (artifacts/ → releases/v*/) 묶음 처리
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-198 [v0.17.1] backlog-promote 스킬 + CLI — raw 메모 Linear 배치 승격 (자연어 진입)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-197 [v0.17.1] dogfood historical 참조 정리 (docs/PRD.md, docs/DESIGN.md 등)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-196 [v0.17.1] decision-log.md ↔ decision-log.yaml 동기화 (linear.ts CLI append 보강)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-195 [v0.17.1] linear.ts CLI create --apply 지원 (description 객체 vs raw 불일치 해결)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-194 [v0.17.1] session-scope raw 백로그 저장소 + pokit start/end 출력 보강
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-193 [v0.17.1] "박제" 어휘 맥락별 치환 (기록 / dry-run 미리보기 등)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-192 [v0.17.0] release dispatcher [4.5/8] manifest backfill 자동화 — carry-forward 영구 루프 차단
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-184 [v0.16.0] artifact-sync 스킬 — PRD/AC 생성 시 Linear description 자동 link
  - AI 제안: `pokit:criteria`
  - 이유: 기대 동작을 acceptance criteria로 먼저 좁힐 수 있음.
- POKIT-183 [v0.16.0] 진행률 카드 — session-brief에 cycle 진행 상태 통합
  - AI 제안: `pokit:criteria`
  - 이유: 기대 동작을 acceptance criteria로 먼저 좁힐 수 있음.
- POKIT-182 [v0.16.0] workflow-state.yaml 상태 머신 + 자동 갱신 hook
  - AI 제안: `pokit:criteria`
  - 이유: 기대 동작을 acceptance criteria로 먼저 좁힐 수 있음.
- POKIT-180 [v0.16.0] 스킬 끝맺음 표준 — 모든 스킬에 '다음 액션 안내' 추가
  - AI 제안: `pokit:criteria`
  - 이유: 기대 동작을 acceptance criteria로 먼저 좁힐 수 있음.
- POKIT-177 linear-backlog-manager → linear-issue-manager (update 분기 추가)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-176 wiring_status.actual 실측 자동화 — wiring-probe.ts 신규 + retro-check 연동
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-174 백로그 라우팅 — Linear 명시 필수 (모호 표현은 backlog-memo 강제)
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-173 [v0.15.2] 미결 인계 메커니즘 — manifest unresolved 섹션 + session-brief 카드
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-172 [v0.15.2] release dispatcher [6/8] retro-check --dry-run 고정 해제 + 실제 디스패치
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-171 [v0.15.2] release dispatcher [4/8] — manifest 미존재 시 자동 생성
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-162 POKIT-119 seed notes 공개 승격 경로 명확화
  - AI 제안: `pokit:prd`
  - 이유: 문제/목표/범위를 PRD draft로 먼저 정리하는 편이 안전함.
- POKIT-160 POKIT-118 Collected Sweep 리포트 (v0.15.0 후속)
  - AI 제안: `pokit:criteria`
  - 이유: 기대 동작을 acceptance criteria로 먼저 좁힐 수 있음.

## 5. 승인 대기

- Suggest pokit:prd for POKIT-202
  - idempotencyKey: `linear:comment:POKIT-202:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-202`
- Suggest pokit:prd for POKIT-201
  - idempotencyKey: `linear:comment:POKIT-201:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-201`
- Suggest pokit:prd for POKIT-200
  - idempotencyKey: `linear:comment:POKIT-200:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-200`
- Suggest pokit:prd for POKIT-199
  - idempotencyKey: `linear:comment:POKIT-199:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-199`
- Suggest pokit:prd for POKIT-198
  - idempotencyKey: `linear:comment:POKIT-198:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-198`
- Suggest pokit:prd for POKIT-197
  - idempotencyKey: `linear:comment:POKIT-197:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-197`
- Suggest pokit:prd for POKIT-196
  - idempotencyKey: `linear:comment:POKIT-196:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-196`
- Suggest pokit:prd for POKIT-195
  - idempotencyKey: `linear:comment:POKIT-195:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-195`
- Suggest pokit:prd for POKIT-194
  - idempotencyKey: `linear:comment:POKIT-194:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-194`
- Suggest pokit:prd for POKIT-193
  - idempotencyKey: `linear:comment:POKIT-193:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-193`
- Suggest pokit:prd for POKIT-192
  - idempotencyKey: `linear:comment:POKIT-192:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-192`
- Suggest pokit:criteria for POKIT-184
  - idempotencyKey: `linear:comment:POKIT-184:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-184`
- Suggest pokit:criteria for POKIT-183
  - idempotencyKey: `linear:comment:POKIT-183:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-183`
- Suggest pokit:criteria for POKIT-182
  - idempotencyKey: `linear:comment:POKIT-182:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-182`
- Suggest pokit:criteria for POKIT-180
  - idempotencyKey: `linear:comment:POKIT-180:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-180`
- Suggest pokit:prd for POKIT-177
  - idempotencyKey: `linear:comment:POKIT-177:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-177`
- Suggest pokit:prd for POKIT-176
  - idempotencyKey: `linear:comment:POKIT-176:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-176`
- Suggest pokit:prd for POKIT-174
  - idempotencyKey: `linear:comment:POKIT-174:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-174`
- Suggest pokit:prd for POKIT-173
  - idempotencyKey: `linear:comment:POKIT-173:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-173`
- Suggest pokit:prd for POKIT-172
  - idempotencyKey: `linear:comment:POKIT-172:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-172`
- Suggest pokit:prd for POKIT-171
  - idempotencyKey: `linear:comment:POKIT-171:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-171`
- Suggest pokit:prd for POKIT-162
  - idempotencyKey: `linear:comment:POKIT-162:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-162`
- Suggest pokit:criteria for POKIT-160
  - idempotencyKey: `linear:comment:POKIT-160:label-suggestion`
  - writes:
    - type: `comment_issue`
      target: `POKIT-160`

## 6. 실패

- 없음

## 7. Artifact Write Result

- write-artifacts 실행 안 함

## 8. 다음 추천 행동

"POKIT-202는 pokit:prd로 진행하자"
