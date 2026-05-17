---
linear_issue_id: POKIT-94
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 2d185ca00e485977ebd4689df9a9cf71021767150a504720d8a1b91560a7c905
---

# Acceptance Criteria Draft: PO Daily News Signal provider 선택형 뼈대 설계

## Scenario

## 목적

PO Daily News Signal에서 사용자는 뉴스 소스만 편하게 추가하고, POKit은 내부에서 API/RSS/공개 페이지 수집 방식을 골라 안정적으로 뉴스를 가져오는 뼈대를 설계한다.

## 사용자 결과

사용자는 API/RSS/크롤링 같은 구현 방식을 몰라도, 뉴스 소스를 등록하는 것만으로 실제 뉴스 수집 연결까지 완료되고 하루 뉴스 개수, 요약 방식, 전달 채널만 선택해 PO/PM용 AI 뉴스 요약을 받을 수 있다.

## 대략 범위

* 공통 provider interface 정의: `fetchNews({ keywords, dateWindow, timezone })`
* API provider 방식 정의: 공식 News/Search API, API key, quota, 비용, rate limit 처리
* 공개 수집 방식 정의: RSS, sitemap, 허용된 공개 HTML 페이지, CSS selector 기반 title/url/date 추출
* 무료로 시작 가능한 provider 예시 프로파일 정의
* 사용자-facing 뉴스 소스 추가/목록/수정/끄기 명령어 UX 정의
* 뉴스 소스 등록 즉시 실제 수집 연결까지 이어지는 activation flow 정의
* Slack, Telegram, local digest 전달 채널 선택지 정의
* 뉴스 목록 저장, dedupe index, digest 저장 경로 정의
* 두 방식의 output을 공통 `news_item`으로 normalize
* `provider_mode`, `fallback_mode`, `daily_limit`, `summary_mode`, `delivery_channels` 설정 초안
* 실제 provider 연결 전 fixture provider로 E2E 검증

## 사용자-facing 명령어 UX

사용자는 provider mode를 몰라도 된다. POKit은 자연어를 source config draft로 변환하고 저장 전 카드로 확인한다.

예시:

```text
AI PM 뉴스에 Hacker News 추가해줘. 하루 10개, 요약만, 링크 저장, Slack 말고 로컬 digest로.
```

명령어 후보:

* `뉴스 소스 추가해줘`
* `뉴스 소스 목록 보여줘`
* `뉴스 소스 수정해줘`
* `뉴스 소스 끄기`
* `오늘 AI 뉴스 요약해줘`

등록이 승인되면 POKit은 즉시 연결 확인과 첫 dry-run fetch를 수행한다.

## 등록 후 activation flow

원칙: 사용자가 뉴스 소스를 등록하면 기본 `local_digest` 수집까지 연결된 상태가 되어야 한다.

흐름:

 1. 사용자 자연어 명령 수신
 2. source draft 생성
 3. adapter 자동 추론
 4. 무료/공개 source 제약 확인
 5. 저장 전 카드 확인
 6. source config 저장
 7. 연결 확인 또는 첫 dry-run fetch 실행
 8. dedupe index 갱신
 9. digest preview 생성
10. 등록 완료 메시지 출력

기본 활성화:

* `enabled: true`
* `delivery_channels: ["local_digest"]`
* `run_initial_check: true`
* Slack/Telegram 같은 외부 전달은 명시 설정과 별도 승인 필요

완료 메시지 예시:

```text
Hacker News AI가 등록됐습니다. local digest 수집은 켜졌고, 첫 연결 확인에서 10개 후보를 찾았습니다. Slack/Telegram 발송은 아직 꺼져 있습니다.
```

차단/보류 케이스:

* API key 또는 secret이 필요한데 아직 등록되지 않음
* source 약관상 수집이 허용되지 않음
* robots.txt 또는 rate limit 정책상 public page 수집이 부적절함
* Slack/Telegram 발송 설정이 없거나 승인되지 않음

## PO/PM AI 뉴스 예시 프로파일

대상: PO, PM, product lead

목적: AI 뉴스 중 제품 의사결정, 경쟁 구도, 가격/정책 변화, 사용자 기대치 변화에 영향을 줄 신호만 추린다.

카테고리:

* 제품 출시: 경쟁 제품, 기능 기대치, roadmap 압력
* 가격/패키징: 무료/유료 tier, seat pricing, usage pricing 변화
* 업무 도입: 실제 업무 흐름에 AI가 어디까지 들어왔는지
* 플랫폼 정책: API 정책, 모델 제한, 데이터 사용 조건 변화
* 규제/리스크: 개인정보, 저작권, 보안, 설명 가능성 요구
* 시장 신호: 투자, 인수, 파트너십, enterprise adoption

Digest 섹션 예시:

* 오늘의 제품 신호
* 경쟁/플랫폼 변화
* 정책/리스크 변화
* 우리 backlog에 줄 수 있는 영향
* 관찰만 할 항목

## 무료 provider 예시

* BBC News RSS: 키 없이 가능한 공개 RSS 예시. RSS item의 title/link/pubDate/summary 중심으로 normalize.
* GNews API Free: 개발/테스트 무료 API. 일일 요청 수와 지연 제한을 config에 명시.
* NewsAPI Developer: 개발/테스트 무료 API. 운영/상업 사용은 유료 플랜 검토 필요.
* The Guardian Open Platform Developer: 비상업 무료 API 예시.
* Hacker News public page: AI 제품/개발자 반응/초기 채택 신호를 공개 페이지 기반으로 확인하는 예시.

## Source config 초안

사용자에게 보이는 필드:

```json
{
  "name": "Hacker News AI",
  "topic": "PO/PM AI News",
  "url": "https://news.ycombinator.com/",
  "keywords": ["AI", "agent", "product", "pricing"],
  "daily_limit": 10,
  "summary_mode": "short",
  "delivery_channels": ["local_digest"],
  "enabled": true
}
```

내부 필드 예시:

```json
{
  "adapter_mode": "public_page",
  "adapter_name": "hacker_news_public_page",
  "respect_robots_txt": true,
  "rate_limit": "conservative",
  "selector_profile": "configured_per_source",
  "requires_secret": false
}
```

## 저장과 중복 제거

뉴스 목록은 저장해야 같은 링크나 같은 제목의 반복 뉴스를 제거하고, digest 품질과 히스토리를 추적할 수 있다.

저장 경로:

* raw 목록: `artifacts/profiles/{profile}/signal-watch/news/raw/YYYY-MM-DD.jsonl`
* dedupe index: `artifacts/profiles/{profile}/signal-watch/news/dedupe-index.json`
* digest: `artifacts/profiles/{profile}/signal-watch/news/digests/YYYY-MM-DD.md`

저장 필드:

* `news_item_id`
* `canonical_url`
* `normalized_title`
* `source`
* `published_at`
* `first_seen_at`
* `last_seen_at`
* `seen_count`

중복 제거 기준:

1. `canonical_url`
2. `normalized_title + source`
3. `url_hash`

기본 보존 기간 후보: 90일

## 전달 채널

* `local_digest`: 기본값. 외부 write 없음.
* `slack`: Slack webhook/token 설정과 사용자 승인 후 사용.
* `telegram`: Telegram bot token/chat id 설정과 사용자 승인 후 사용.

Slack/Telegram 자동 발송은 기본값으로 켜지 않는다.

## 제외 범위 / 안전 원칙

* paywall 우회 없음
* 로그인/세션 우회 없음
* CAPTCHA 또는 anti-bot 회피 없음
* rate limit 우회 없음
* 기사 본문 전문 저장 없음
* Linear issue 자동 생성 없음
* 단일 provider 결과를 사실로 단정하지 않음
* Slack/Telegram 외부 발송은 별도 승인 또는 명시 설정 필요

## 성공 기준

* API 방식과 공개 수집 방식의 역할/장단점/선택 기준이 문서화된다.
* provider 선택 config 초안이 있다.
* 무료 provider 예시가 개발/테스트용, 비상업용, 공개 RSS용으로 구분되어 있다.
* 사용자는 provider mode를 몰라도 뉴스 소스를 자연어 명령으로 추가할 수 있다.
* 뉴스 소스 등록이 성공하면 기본 local digest 수집은 즉시 활성화된다.
* 등록 직후 첫 dry-run fetch 또는 연결 확인 결과가 표시된다.
* 뉴스 개수, 요약 길이, 전달 채널을 source별로 설정할 수 있다.
* 뉴스 목록 저장과 중복 제거 기준이 명확히 정의된다.
* 사이트별 selector는 설정으로 분리하는 원칙이 있다.
* 모든 provider는 같은 `news_item` 계약으로 normalize된다.
* 실제 provider 연결 전에도 fixture provider로 E2E가 검증 가능하다.

## 열린 질문

* 첫 실제 수집 예시는 BBC RSS로 둘지, Hacker News 같은 공개 페이지로 둘지?
* Slack/Telegram 전달은 등록 시 선택 가능하게 하되 실제 발송은 별도 승인으로 둘지?
* dedupe index 보존 기간은 30일, 90일, 영구 중 무엇이 적절한가?

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-94
- Linear URL: https://linear.app/example/issue/POKIT-94/po-daily-news-signal-provider-선택형-뼈대-설계
- Labels: pokit:criteria, Improvement
