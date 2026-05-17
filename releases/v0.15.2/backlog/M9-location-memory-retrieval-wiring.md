---
id: M9
title: 위치기억 retrieval 연결 — session-brief에서 memory/index.yaml 자동 참조
proposedLabels: [pokit:gap, memory, bitrot]
proposedState: Backlog
idempotencyKey: memo-20260517-m9-location-memory-retrieval-wiring
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17) — POKIT-159 본체 추적
---

## AS-IS

위치기억(Location memory) 인프라가 모듈·파일은 완성됐지만 활용 호출은 0건인 bitrot 상태.

확인된 상태 (3단계 분리):
- ① 생성 모듈: `scripts/internal/memory-index.ts` 존재 (2026-05-16 갱신). `buildMemoryIndex(notesDir)` export
- ② 첫 index 생성: `memory/index.yaml` 존재 (2026-05-17 00:05 생성, 4개 노트 등록, source POKIT-119)
- ③ **활용 (retrieval / 세션 초입 자동 참조): 미완**
  - `grep "memory-index\|buildMemoryIndex"` → `memory-index.ts` 자기 자신 외 호출 0건
  - `scripts/cli/session-brief.ts` / `session-start.ts` 모두 `memory/index.yaml` 참조 없음

박제된 설계 의도 (활용 미완):
- `memory/notes/pokit-memory-mvp-design-decision.md:27` — "wiki-query와 memory/index.yaml을 병렬 검색 → LLM이 양쪽 결과 통합"
- `memory/notes/pokit-memory-mvp-design-decision.md:28` — "세션 초입에 resume-brief.md 읽은 후 memory/index.yaml에서 관련 note 자동 추출"
- `docs/_details/memory-contract.md:11` — "Location memory is a generated memory/index.yaml"

담당 이슈: **POKIT-159 "장기기억 retrieval 메커니즘 설계"** — Linear Team Backlog 상태, `memory/resume-brief.md` 미결 묶음에 포함됨.

부수 발견:
- 본 케이스는 M7(`wiring_status.actual` 실측 부재)이 왜 필요한지의 살아있는 예시. retro-check가 actual을 실측한다면 "memory-index.yaml 생성됐지만 호출 0건"이 bitrot으로 자동 분류됐어야 함. 현재는 사람이 일일이 발견해야 함.

## TO-BE

본 메모는 **별도 cycle용 박제**다. v0.15.2 hotfix 스코프에는 포함하지 않는다. 사유:
- retrieval 알고리즘 설계 (어떤 쿼리·어떤 점수·어떤 컷오프) 자체가 큰 작업
- v0.15.2는 release dispatcher + dogfood 재구조화에 집중. hotfix 스코프 보존 필요

설계 항목 (별도 cycle 진입 시):
- retrieval 함수 신규: `scripts/internal/memory-retrieve.ts`
  - input: 현재 세션 컨텍스트 (resume-brief의 next action 텍스트, active issue ids)
  - output: 관련 노트 top-K (default K=3) — `MemoryIndexEntry[]` + score
  - 매칭 기준: source(issue id) 일치 우선 + 키워드 매칭(title/path) fallback
- `scripts/cli/session-brief.ts` start variant에 신규 카드 렌더:
  - "🧠 관련 위치기억" 섹션
  - retrieval 호출 결과 top-3 표시 (path + 한 줄 요약)
  - 결과 0건이면 카드 자체 생략 (소음 방지)
- `scripts/internal/memory-index.ts` 갱신:
  - `MemoryIndexEntry`에 `title`, `summary_excerpt` 필드 추가 (renderer가 한 줄 요약 표시 가능하도록)
- (선택) `wiki-query`와의 병렬 검색 통합 — 본 메모는 위치기억 단독으로 한정. 통합은 후속 백로그

연쇄 효과:
- POKIT-159 closure
- M7의 실측 logic이 본 retrieval 호출 흔적을 actual로 인식하도록 probe 등록 필요 (M7과 약한 결합)
- `releases/v<N>/manifest.yaml` `wiring_status.intended`에 `memory_index_retrieval` 항목 추가

## 성공 검증

- [ ] `scripts/internal/memory-retrieve.ts` 신규 파일 존재 + export 함수 1개
- [ ] `session-brief.ts` start variant 출력에 "🧠 관련 위치기억" 섹션 등장 (관련 결과 있을 때)
- [ ] `grep "buildMemoryIndex\|memoryRetrieve"` 호출 흔적 ≥ 2건 (CLI + retrieval 자체)
- [ ] POKIT-159 Linear 상태 Done 전환
- [ ] retrieval 단위 테스트: 동일 issue id source 노트 우선 반환 케이스 1건 통과
- [ ] retrieval 단위 테스트: 결과 0건일 때 빈 배열 반환 + 카드 미렌더 케이스 1건 통과
- [ ] 회귀: 기존 session-brief 출력 포맷 변경 없음 (관련 결과 0건일 때)
- [ ] release manifest `wiring_status.intended`에 `memory_index_retrieval` 등재 (다음 release부터)

## 담당 에이전트

- 설계: claude-opus-4-7 (별도 cycle 진입 시 / 본 메모 작성은 메인 PO 세션)
- 구현: claude-sonnet-4-6 (retrieval 함수 + session-brief 카드 — 모듈 단순)
- 검수: claude-opus-4-7 (retrieval 품질 평가 — R@K 측정 가능 시 추가)

본 메모는 박제용이며 v0.15.2 hotfix에는 포함되지 않는다. 별도 cycle로 분리 진행.

## 처리 보류 + 추적 채널

본 메모는 **v0.15.2에서 Linear 등록하지 않는다.** POKIT-159가 이미 Linear에 존재하므로 신규 등록은 중복이고, POKIT-159 description에 본 메모 link를 append하는 작업은 update 경로(M10 미완성)가 필요하다.

**M10 완성 후 첫 사용 케이스로 처리** — POKIT-159 description에 본 메모 파일 link append. 보류 상태 3채널 박제:

1. **v0.15.2 release manifest `unresolved:`** (M4 산출물)
   - `{ id: "pokit-159-memo-link", note: "POKIT-159 description에 M9 메모 link append", owner: "M10" }`
   - 다음 세션 start brief 카드로 자동 노출
2. **M10 본문 acceptance 섹션** (첫 사용 케이스로 명시됨)
3. **memory/decision-log.md/yaml** — "M9 처리 보류 — M10 SKILL 완성 대기" timestamped entry

retrieval 알고리즘 구현 자체는 M10·M8/M9 처리와 별개로 **POKIT-159 본체 cycle**에서 진행. 본 메모는 그 cycle 진입 시 참조용.
