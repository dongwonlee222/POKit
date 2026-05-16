# 데이터 계약: PO Daily News Signal

## 입력 데이터

```yaml
daily_news_signal:
  enabled: true
  timezone: Asia/Seoul
  schedule_time: "09:00"
  date_window: previous_and_current_day
  keywords:
    - example keyword
```

## 저장 위치

```text
artifacts/profiles/{profile}/signal-watch/news/raw/YYYY-MM-DD.jsonl
artifacts/profiles/{profile}/signal-watch/news/digests/YYYY-MM-DD.md
```

## ID와 hash와 중복 제거 기준

1. canonical URL hash를 우선한다.
2. URL이 없으면 normalized title + source + published date hash를 쓴다.
3. 같은 hash는 duplicate count만 올리고 새 raw item으로 저장하지 않는다.

## 저작권 / 원문 저장 범위

- 기사 본문 전문은 저장하지 않는다.
- 제목, URL, 출처, 발행일, 짧은 요약, hash 중심으로 저장한다.
- 유료 기사 전문과 라이선스가 불명확한 전문 복제는 금지한다.

## 개인정보와 민감정보

- API key와 provider token은 artifact에 저장하지 않는다.
- 민감정보 패턴이 감지되면 digest 후보에서 제외한다.
- raw item 보존 기간은 기본 30일로 제한한다.
