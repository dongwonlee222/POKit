---
id: bl-2026-05-17-002
created: 2026-05-17
status: promoted
domain: workflow+tooling
size: L
title: "session-scope raw 백로그 저장소 + pokit start/end 출력 보강"
target_version: v0.17.1
promoted_to: POKIT-194
absorbs:
  - v0.16-unresolved/title-yaml-quoting
  - v0.16-unresolved/backlog-key-deduplication
  - v0.16-unresolved/artifact-frontmatter-section-order
---

## AS-IS

- 세션 중 떠오른 raw 아이디어(잡생각·잠정 백로그)가 저장 위치 없음 → 휘발
- Linear는 정식 이슈 추적용 — raw 단계 진입 부적합 (사용자 발화: "Linear는 이슈 등록으로 변경")
- pokit end 출력 "어디서 멈췄나" = Linear pending ID 나열 1줄, 정확도 낮음
- pokit start 출력 "이전 릴리스 미결 N건"은 있지만 "전 세션 미해결 / 신규 raw" 분리 없음
- 다음 세션 cold-start 시 "전 세션이 뭘 남겼나" 정확히 안 보임
- v0.16 미결 중 양식 관련 3건이 새 raw 양식 정의로 자연 흡수 가능

## TO-BE

### 저장소 구조

```
memory/backlog-raw/
├── README.md                          ─ 양식 + 승격 기준
└── bl-YYYY-MM-DD-NNN-<slug>.md        ─ per-item, frontmatter
```

### Frontmatter 양식

```yaml
---
id: bl-YYYY-MM-DD-NNN
created: YYYY-MM-DD
status: raw | refined | promoted | dropped
domain: workflow | tooling | docs | ...
title: "..."
target_version: v0.17.x | null
promoted_to: POKIT-xxx | null
absorbs: []        # v0.16 미결 등 흡수 항목
---
```

### 본문 4섹션 의무 (활성 행동 규칙)

1. AS-IS
2. TO-BE
3. 성공 검증
4. 담당 에이전트

### pokit end 출력 보강

```
✅ 이번 세션 완료 — Linear ID 정확히
⏳ 이번 세션 미해결 — Linear pending 분리
📝 이번 세션이 만든 raw — backlog-raw/ 신규 파일 목록
💬 다음 세션이 할 한 줄
```

### pokit start 출력 보강

```
📝 전 세션이 남긴 raw (정리/승격 대기) N건
⏳ 전 세션이 안 끝낸 것 M건
📋 Linear 남은 이슈 (Top 3)
💬 추천 다음 행동
```

### resume-brief.md 갱신

- 두 목록(pending Linear / new raw)을 ID 단위로 기록
- 기존 형식 유지 (호환성)

### 흡수되는 v0.16 미결

- **title YAML 따옴표 강제** — 새 양식 정의 시 자동 반영
- **frontmatter 신/구 키 중복 정리** — 새 양식이 단일 기준
- **renderLocalBacklogMemo 섹션 순서** — 새 양식과 정렬

## 성공 검증

- memory/backlog-raw/ 디렉토리 + README.md + 양식 1장 존재
- 세션 1회 굴려서 신규 bl-* 파일 생성 → pokit end 출력에 표시
- 다음 세션 pokit start 출력 "전 세션 남긴 raw N건" 정확히 노출
- frontmatter 파싱 PASS (title YAML 따옴표 강제 포함)
- 기존 resume-brief.md 호환성 깨지지 않음
- collectUnresolved(scope="session") 함수 1개 (bl-003에서 재활용 가능 구조)
- Rule of three 준수 — 추상화는 bl-003에서 평가 (Phase 1은 세션 전용)

## 담당 에이전트

미정 (스킬 신규 + scripts/cli/session-* 수정 + 양식 문서)

## 비고

- advisor 권고: 디렉토리 1개 + 파일 N개 (sessions/<id>/ 평면화 X)
- "박제" 어휘는 bl-001 완료 후 본 문서도 갱신
- bl-003 (POKIT-192 재정의) 의존 = 본 작업 완료 후 진입
