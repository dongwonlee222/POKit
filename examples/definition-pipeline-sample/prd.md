# PRD 초안: PO Daily News Signal

## 배경

PO가 매일 보는 외부 뉴스를 제품 판단과 Backlog 후보로 연결하기 위한 첫 입력층이다.

## 목표

사용자가 선택한 키워드에 대해 전일/당일 뉴스를 매일 수집하고, 중복 없이 저장한 뒤 중요한 항목만 Signal Summary와 Backlog Candidate dry-run으로 연결한다.

## 1차 범위

- 키워드와 실행 시간 설정
- 전일/당일 뉴스 수집
- URL 또는 제목/출처/발행일 기반 중복 제거
- 로컬 digest 생성
- Linear write 전 dry-run

## 제외 범위

- GitHub changelog 수집
- 경쟁사 사이트 직접 크롤링
- Slack/email/push 알림
- Linear 자동 생성

## 외부 의존성 / 비용 / 한도

- 공개 예시는 fixture provider 기준이다.
- 실제 provider는 비용, quota, rate limit, 약관 확인 후 별도 승인한다.
- API key가 필요한 경우 Linear dry-run에서 `blocked_by_external`로 표시한다.

## Rollback / 비활성화 계획

- `daily_news_signal.enabled: false`로 비활성화한다.
- provider 장애 시 실제 수집을 멈추고 fixture/digest 검증만 유지한다.
- Linear write는 사용자 승인 전 dry-run에서 멈춘다.

## 성공 기준

- 하루 digest가 생성된다.
- 같은 URL 뉴스가 중복 저장되지 않는다.
- 높은 relevance item만 Backlog Candidate dry-run에 표시된다.
