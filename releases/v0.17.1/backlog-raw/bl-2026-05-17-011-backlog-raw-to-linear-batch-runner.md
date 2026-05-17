---
id: bl-2026-05-17-011
created: 2026-05-17
status: promoted
domain: tooling
size: M
title: "backlog-promote 스킬 + CLI — raw 메모 Linear 배치 승격 (자연어 진입)"
target_version: v0.17.1
promoted_to: POKIT-198
depends_on:
  - bl-2026-05-17-004    # CLI create --apply 안정화 후
related:
  - bl-2026-05-17-002    # raw 저장소 본체 (메모 양식 제공)
---

## AS-IS

- 2026-05-17 부트스트랩 등록 시 일회용 스크립트 `_seed-bl-2026-05-17-bootstrap.ts` 작성 (250줄)
- 다음 batch (bl-005·006 v0.17.1 / bl-003·007·008·009·010 v0.17.2) 등록 시 동일 패턴 반복 = batch당 60-90분 추가 비용
- memo 파일 파싱 / LinearBacklogDescriptionInput 매핑 / 발급 후 promoted_to·status 갱신을 매번 LLM이 수동 처리
- decision-log append 누락 위험
- sub-agent(work-agents/secretary 등)가 raw memo 정리 후 Linear 승격까지 가는 시나리오 차단 — 스크립트 못 만듦

## TO-BE

### Layer 1 — 자연어 진입 (사용자가 보는 면)

```
"Linear에 v0.17.1 다 등록해줘"
"리니어 대량 등록"
"백로그 일괄 승격"
"bl-005, 006 Linear에 올려"
```

### Layer 2 — 스킬 `backlog-promote`

위치: `skills/backlog-promote/SKILL.md`

```yaml
trigger:
  - "리니어 대량 등록"
  - "리니어 일괄 등록"
  - "백로그 일괄 승격"
  - "Linear에 여러 개 등록"
  - "Linear batch register"
  - "promote multiple memos"

trigger_guard: "Linear" 단어 필수 (모호 발화는 backlog-memo로 라우팅)

절차:
  1. 자연어 → 파라미터 추출 (target / status / id / mode)
  2. CLI --dry-run 호출
  3. 사용자에게 N건 미리보기 출력
  4. 사용자 승인 발화 ("apply" / "진행" / "ㄱㄱ") 대기
  5. CLI --apply 호출
  6. 결과 보고 (발급 ID + 갱신 파일 + decision-log)
```

### Layer 3 — CLI `pokit backlog promote`

```bash
./bin/pokit backlog promote [options]

옵션:
  --dry-run                       미리보기 (기본)
  --apply                         실제 Linear write
  --target <version>              target_version 필터 (예: v0.17.1)
  --status <status>               status 필터 (refined / raw)
  --id <bl-id>                    단일 메모 지정 (콤마 구분)
  --mode create|update            create=신규 / update=기존 issue append
  --parallel                      의존 없는 그룹 병렬 등록 (기본 ON)
  --no-frontmatter-update         memo 갱신 스킵 (디버깅용)
```

### Layer 4 — 함수 (기존 재사용)

- `memory/backlog-raw/*.md` 스캔 + frontmatter 파싱
- 4섹션 본문 → `LinearBacklogDescriptionInput` 매핑
- `planCreateIssue` / `planUpdateIssue` (linear.ts)
- `applyCreateIssue` / `applyUpdateIssue` (사용자 승인 게이트 통과 후)
- memo frontmatter 자동 갱신: `promoted_to: POKIT-XXX`, `status: promoted`
- `decision-log.md` + `decision-log.yaml` 자동 append

### 호출 주체 (모두 허용)

| 주체 | 진입 |
|---|---|
| 👤 사용자 | 자연어 → 스킬 |
| 🤖 메인 LLM | 스킬 (사용자 발화 받아) |
| 🤖 sub-agent (work-agents 등) | CLI 직접 |
| ⚙️ 자동화 hook | CLI (사전 위임 범위 내, dry-run까지) |

### 승인 게이트 (공통)

- apply 전 dry-run 결과 → **사용자 승인 필수**
- 사전 위임은 "특정 cycle + 특정 status" 범위만 허용
- 자동 apply 절대 금지

### 의존성 그래프 처리

- 의존 없는 메모 그룹 = 병렬 (Promise.all)
- 의존 있는 메모 (`depends_on` 필드) = 직렬 (전제 발급 후 후속)
- bl-003 같은 update 모드 = create 그룹 완료 후 진행

## 성공 검증

- 일회용 `_seed-bl-2026-05-17-bootstrap.ts` 삭제
- bl-005·006 등록 = `backlog-promote` 스킬 1회 호출 + 1회 승인으로 완료
- v0.17.2 진입 시 bl-007·008·009·010 batch 등록 = 동일 패턴
- bl-003 (update mode) = 같은 스킬로 처리
- memo 자동 갱신 — LLM 수동 편집 0회
- decision-log append 누락 0
- batch당 소요 시간 30분 이내 (현재 ~2시간)
- sub-agent(예: work-agents/secretary)가 CLI 호출 → dry-run 결과를 메인 LLM에 리포트 시나리오 검증

## 담당 에이전트

미정 (`scripts/cli/backlog-promote.ts` + `./bin/pokit` verb-dispatch + `skills/backlog-promote/SKILL.md`)

## 비고

### bl-002와 분담

- bl-002 = "raw 저장소 자체 + pokit start/end 출력 보강"
- bl-011 = "raw → Linear 승격 도구" (저장소 위의 운영 도구)

### bl-004 의존 사유

bl-004의 `create --apply` CLI가 안정화된 후 본 러너의 apply 단계가 그 CLI 경유. 미정화 시 일회용 스크립트 회귀.

### v0.17.2 → v0.17.1 끌어올림 사유

- ROI 즉시 발현: bl-005·006 등록부터 본 러너 사용
- 그렇지 않으면 일회용 스크립트 또 작성 = 사용자 발화 "다음부터는 배치러너 만들어야겠네" 지연

### ROI 추정 (6개월 / 12 batch 기준)

| 항목 | 값 |
|---|---|
| 구현 비용 (1회) | 8시간 |
| batch당 절약 | 1.5시간 |
| 6개월 누적 절약 | 18시간 |
| 순이익 (6개월) | +10시간 |
| 1년 순이익 | +28시간 + 정성 개선 |

### 자기 부트스트랩

본 메모(bl-011) 자체가 bl-011 도구로 Linear 등록되는 첫 케이스 = self-bootstrap. 다음 batch에 포함.
