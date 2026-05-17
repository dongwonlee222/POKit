# 16. 장기기억 retrieval 메커니즘 (POKIT-159)

> 상태: **설계 v1 + 최소 stub** — v0.17.2.
> 본격 구현은 후속 cycle (159b/c).

## 0. 문제

LLM cold-start 시 과거 결정·맥락 회상 부족. 매 세션마다 같은 결정·메모 다시 탐색.

## 1. North Star

```
사용자 발화 "Y 문제 어떻게 처리했더라"
   ↓
LLM 이 5초 안에 관련 decision-log + backlog memo + 이전 세션 gist 회상
   ↓
"2026-05-17 결정으로 X 했음. POKIT-194 참고. resume-brief 에 박힘"
```

LLM 헷갈리지 않는 구조 = retrieval 도 단일 진입점 + 일관된 출력.

## 2. 소스 (4개)

| 소스 | 위치 | 라벨 |
|---|---|---|
| 결정 | `memory/decision-log.{md,yaml}` | `decision` |
| raw 백로그 | `memory/backlog-raw/*.md` | `backlog-raw` |
| 이전 세션 박스 | `memory/resume-brief.md` + 미래 sessions/ | `session` |
| 릴리스 | `releases/v*/manifest.yaml` + CHANGELOG | `release` |

## 3. API (안)

```ts
// scripts/internal/retrieval.ts
export type RetrievalQuery = {
  keywords: string[];          // 키워드 N개 OR 매칭
  scope?: ("decision" | "backlog-raw" | "session" | "release")[];
  since?: string;              // ISO 날짜 — 이 이후 자료만
  limit?: number;              // 기본 10
};

export type RetrievalHit = {
  source: "decision" | "backlog-raw" | "session" | "release";
  id: string;                  // dec-..., bl-..., session-..., v0.17.1
  title: string;
  excerpt: string;             // 매칭 부분 ±200자
  path: string;                // 파일 경로
  ts: string;                  // ISO timestamp
  score: number;               // 단순 키워드 점수
};

export function retrieveContext(query: RetrievalQuery): RetrievalHit[];
```

## 4. 분할 (159a/b/c)

### 159a — 설계 PRD 확정 (본 문서 = v1)

- 소스 4개 합의
- API shape 합의
- 점수 산식 (단순 키워드 매칭부터)
- 후속 단계 명시

### 159b — 구현

- `scripts/internal/retrieval.ts` 본체
- 각 소스 어댑터 4개 (decision/backlog-raw/session/release)
- 키워드 매칭 + score (TF 단순 합)
- 단위 테스트

### 159c — pokit start 통합

- 진입 시 자동 매칭 (직전 세션 gist + 미해결 키워드 기반)
- 출력: `🧠 회상 N건 (출처별)`

## 5. 비 목표 (out of scope)

- 벡터 임베딩 (LLM 비용 ↑↑, 단순 매칭으로 충분 추정)
- 외부 인덱서 (Algolia 등)
- 실시간 인덱싱 (필요 시 후속 검토)
- 자연어 질의 파싱 (키워드 N개로 시작)

## 6. 위험 / 결정 필요

- 점수 산식 — 단순 keyword count 충분? 또는 BM25?
- 소스 확장 — Linear 이슈 description 본문 포함?
- TTL — 1년 전 결정도 회상 대상?

→ 159b 진입 전 위 3건 결정 필요.

## 7. 최소 stub

`scripts/internal/retrieval.ts` 에 API skeleton + 한 소스(decision-log)만 구현 = stub.
호출 가능하나 실용성 낮음. 159b 에서 본격 확장.
