---
id: M5
title: 백로그 라우팅 — Linear 명시 필수 (모호 표현은 backlog-memo 강제)
proposedLabels: [pokit:gap, routing, skill]
proposedState: Backlog
idempotencyKey: memo-20260517-m5-backlog-routing-linear-explicit
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
---

## AS-IS

사용자가 POKit 도메인에서 "백로그 등록해줘" / "백로그 추가해줘" 류 모호 표현을 사용하면 `linear-backlog-manager`가 발동되어 Linear에 바로 등록 절차로 진입한다. dry-run plan을 보여주긴 하지만 사용자 입장에선 "Linear 등록이 바로 됨"으로 인지된다.

원인:
- `linear-backlog-manager` SKILL trigger_phrases: "Linear 백로그 등록", "Linear에 이슈 만들어줘", "Linear에 올려줘", "실제로 등록해줘", "Linear에 넣어줘"
- `backlog-memo` SKILL trigger_phrases: "백로그 메모", "backlog memo", "/backlog-memo", "백로그 아이디어 정리", "일단 메모만"
- "백로그 등록해줘" 같은 모호 표현은 어느 쪽 trigger와도 정확히 매치되지 않음 → LLM 자율 판단에 따라 어느 쪽이든 진입 가능
- `backlog-router` SKILL은 라벨 기반 라우팅이라 신규 백로그(라벨 없음)엔 무력
- `backlog-memo` SKILL Step 5에 "OK 등록해" 표현으로 linear-backlog-manager 위임을 허용 — 이 표현 자체도 일상 표현과 겹쳐 모호함

결과:
- 모호 표현이 Linear write 절차로 흘러가 dry-run 단계가 건너뛰어지는 인상
- 봇/자동 채널 환경에서는 더 위험 (사용자 의도 검증 단계 약화)
- 글로벌 nexus의 `backlog-add` 스킬과는 별개 — 본 결함은 POKit 내부 라우팅 결함

## TO-BE

규약 (3겹 강제):
1. **모든 모호 표현은 `backlog-memo`로 강제 진입.** 예: "백로그 등록", "백로그 추가", "백로그 만들어", "백로그 올려"는 전부 `backlog-memo`.
2. **`linear-backlog-manager` 진입 조건: trigger 표현에 반드시 `Linear` / `linear` 단어 포함.** 허용 예: "Linear 백로그 등록", "Linear에 올려", "Linear에 만들어줘". 거부 예: "OK 등록해", "등록해", "올려줘", "응 좋아", "그래".
3. **거부된 표현은 `backlog-memo` 상태 유지 + Linear 명시 안내 메시지 재출력.**

구현 항목:
- `skills/backlog-memo/SKILL.md` trigger_phrases 확장:
  - 추가: `"백로그 등록"`, `"백로그 추가"`, `"백로그 만들어"`, `"백로그 올려"`, `"백로그 등록해줘"`, `"백로그 추가해줘"`
- `skills/linear-backlog-manager/SKILL.md` 진입 조건 강화:
  - SKILL 본문 Step 1 직전에 "Trigger Guard" 섹션 추가: "사용자 발화에 `Linear` 또는 `linear` 단어가 없으면 즉시 거부하고 backlog-memo 안내 메시지 출력 후 종료"
  - trigger_phrases 축소: "OK 등록해"·"실제로 등록해줘" 류 제거. `Linear` 명시된 표현만 유지
- `skills/backlog-memo/SKILL.md` Step 5 메시지 변경:
  - 기존: "OK 등록해 또는 linear-backlog-manager로 넘겨"
  - 신규: "Linear에 올리려면 'Linear 백로그 등록' 또는 'Linear에 올려'라고 명시해주세요. 그 외 응답은 메모로 유지됩니다."
- `workspace/pokit/CLAUDE.md` "도메인 라우팅 규약" 섹션 추가 (한 줄):
  - "백로그 관련 모호 표현은 backlog-memo 우선. linear-backlog-manager는 사용자 발화에 'Linear' 명시가 있을 때만 진입."
- (선택) `.claude/hooks/PreSkillInvocation` 훅: cwd가 POKit이고 skill이 linear-backlog-manager인데 직전 사용자 발화에 `Linear` 단어 없으면 차단

글로벌 nexus(`~/.claude/`)는 일절 수정하지 않는다.

**한계 명시** (best-effort):
- 본 변경은 SKILL.md trigger_phrases 및 CLAUDE.md 규약 = **LLM이 읽고 따르는 지시 기반**. 코드 강제가 아님
- 일관성 ~95% 수준. 5% 잔존 가능성 (특히 새 모델·새 세션)
- 100% 차단이 필요하면 후속 백로그로 `.claude/hooks/PreSkillInvocation` 훅 추가 (cwd=POKit 도메인 && skill=linear-backlog-manager && 직전 발화에 `Linear` 단어 없음 → 차단)
- 글로벌 nexus의 `backlog-add`는 ~/.nexus8/backlog.json에 그대로 살아있음. POKit cwd 외 다른 디렉토리에서는 평소처럼 발동 (의도된 격리)

## 성공 검증

- [ ] "백로그 등록해줘" 입력 시 `backlog-memo` 발동 (linear-backlog-manager 발동 0회)
- [ ] "백로그 추가해줘" 입력 시 `backlog-memo` 발동
- [ ] "OK 등록해" / "등록해" 입력 시 linear-backlog-manager 발동 안 됨 → backlog-memo 상태 유지 + 안내 메시지
- [ ] "Linear 백로그 등록" 입력 시에만 linear-backlog-manager 발동
- [ ] `backlog-memo` SKILL trigger_phrases에 위 신규 표현 6개 모두 등재 확인 (`grep` 통과)
- [ ] `linear-backlog-manager` SKILL trigger_phrases에서 "OK 등록해" 류 표현 0건 (`grep` 통과)
- [ ] `workspace/pokit/CLAUDE.md`에 라우팅 규약 1줄 추가 확인
- [ ] 글로벌 `~/.claude/` 하위 파일 git diff 0건 (POKit 외 비수정 확인)
- [ ] 회귀: 기존 명시 표현("Linear에 올려" 등)으로의 정상 진입 1회 이상 통과

## 담당 에이전트

- 설계: claude-opus-4-7 (메인 PO 세션)
- 구현: claude-sonnet-4-6 (SKILL.md 3건 + CLAUDE.md 1줄 편집 — 단순 편집)
- 검수: claude-opus-4-7 (회귀 시나리오 dry-run 직접 확인)
