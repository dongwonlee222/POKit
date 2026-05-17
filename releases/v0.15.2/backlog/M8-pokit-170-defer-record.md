---
id: M8
title: POKIT-170 보류 박제 — 텔레그램/자동화 채널 지원 결정 보류 사유 기록
proposedLabels: [pokit:decision, deferred]
proposedState: Backlog
idempotencyKey: memo-20260517-m8-pokit-170-defer-record
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
---

## AS-IS

POKIT-170 "next-action wizard 강제 → optional 전환 + .gitignore 정리 (v0.15.2 hotfix)"가 Linear에 활성 상태로 존재하며, `memory/resume-brief.md`의 "다음에 무엇을 하나"에도 추천 다음 행동으로 박제되어 있다.

그러나 분석 결과 본 이슈의 명분이 약함이 확인됨:
- 명분: "텔레그램 봇/CI 같은 자동화 환경에서도 wizard 작동" → next-action wizard `process.stdin.isTTY` 강제 우회
- 실태:
  - 포킷 PRD `docs/PRD.md:237` 명시 "자동 cron / 알림"은 미래에 다시 볼 것 (out of scope)
  - `docs/OPERATING_MODEL.md:11` 명시 "Still out of scope: ... automatic cron"
  - `CHANGELOG.md:582` 명시 "Automatic cron." (out of scope 항목)
  - 텔레그램 봇은 글로벌 nexus(`~/.claude`) 인프라이며 POKit 코드에는 텔레그램 관련 파일 0건
  - POKit 내 `TTY` 참조 1건뿐 (`scripts/cli/next-action.ts:8`) — 외부 자동화 지원 의도 없음
- 결정: 텔레그램/자동화 채널 지원 자체를 v0.15.2 스코프에서 제외. POKIT-170의 본래 의도는 PRD와 정합하지 않으므로 보류 상태로 전환.

박제되지 않은 부수 결정:
- 글로벌 텔레그램 봇 존재 자체에 대한 유지/폐기 검토는 별도 사안 (글로벌 영역, POKit 백로그 아님)
- next-action wizard UX 자체의 개선(예: 질문 단순화)은 별도 백로그 — 본 보류와 무관

## TO-BE

박제 항목:
- Linear POKIT-170 상태를 "Cancelled" 또는 "Backlog (Deferred)"로 전환. description 하단에 보류 사유 4섹션 append:
  ```
  ## 보류 결정 (2026-05-17)
  - 사유: PRD/OPERATING_MODEL/CHANGELOG 3중 박제된 "automatic cron out of scope"와 불일치
  - 근거: docs/PRD.md:237, docs/OPERATING_MODEL.md:11, CHANGELOG.md:582
  - 향후 재개 조건: PRD에서 automatic cron이 in-scope로 전환되거나, 글로벌 텔레그램 봇/포킷 연동이 정식 요구사항으로 합의될 때
  ```
- `memory/decision-log.md` + `memory/decision-log.yaml`에 결정 기록 append:
  - decision: "POKIT-170 보류 — 자동화 채널 지원은 PRD out-of-scope"
  - alternatives considered: ["원안 진행 (TTY 분기 구현)", "축소안 (--skip-wizard 옵션)", "보류"]
  - chosen: 보류
  - reasoning: PRD 정합 + M2/M4가 stale brief 부작용을 우회 해결
- `memory/resume-brief.md`의 "다음에 무엇을 하나" 라인에서 POKIT-170 추천 제거 → v0.15.2 hotfix 묶음으로 교체

연쇄 효과:
- v0.15.2 백로그에서 M1 항목 제외 확정 (이미 메인 세션에서 합의)
- POKIT-170가 다음 세션 start brief에서 "추천 다음 행동"으로 더 이상 노출되지 않음

## 성공 검증

- [ ] Linear POKIT-170 상태가 "Cancelled" 또는 "Backlog (Deferred)"로 전환 확인
- [ ] POKIT-170 description에 "## 보류 결정 (2026-05-17)" 섹션 append 확인 (사유·근거·재개 조건 3줄 포함)
- [ ] `memory/decision-log.md`에 보류 결정 timestamped section append (alternatives + chosen + reasoning 포함)
- [ ] `memory/decision-log.yaml`에 매칭 index entry append
- [ ] `memory/resume-brief.md`의 "다음에 무엇을 하나" 라인에서 POKIT-170 문자열 0건 (`grep` 통과)
- [ ] 다음 `./bin/pokit start` 실행 시 brief의 "💬 추천 다음 행동"에 POKIT-170 미등장 확인

## 처리 보류 + 추적 채널

본 메모는 **v0.15.2 hotfix에서 Linear 등록하지 않는다.** linear-backlog-manager가 create 전용이라 단발 update를 위해 우회하는 것은 라우팅 표준을 무너뜨린다.

대신 **M10 (linear-issue-manager update 분기) 완성 후 첫 사용 케이스로 처리**한다. 보류 상태는 3채널로 박제하여 추적 가능 상태를 유지:

1. **v0.15.2 release manifest `unresolved:`** (M4 산출물)
   - `{ id: "pokit-170-defer-update", note: "POKIT-170 Cancelled 전환 + 보류 사유 description append", owner: "M10" }`
   - 다음 세션 start brief에 "🪧 이전 릴리스 미결 N건" 카드로 자동 노출
2. **M10 본문 acceptance 섹션** (첫 사용 케이스로 명시됨)
3. **memory/decision-log.md/yaml** — "M8 보류 결정 — M10 SKILL 완성 대기" timestamped entry

## 담당 에이전트

- 설계: claude-opus-4-7 (메인 PO 세션)
- 구현: claude-sonnet-4-6 + claude-opus-4-7 (M10 SKILL 완성 후 첫 사용 케이스로 처리)
- 검수: claude-opus-4-7 + 사용자 PO (다음 세션 start brief에 POKIT-170 미등장 + Cancelled 상태 + description append 확인)
