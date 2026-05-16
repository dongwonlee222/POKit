# PO Signal Watch 외부 출처 목록

PO Signal Watch의 외부 출처 목록은 제품 판단에 영향을 줄 수 있는 신호만 가볍게 보관하는 기준 문서다. 뉴스 저장소가 아니며, 우선순위, 백로그 형태, 이해관계자 공유 판단을 바꿀 수 있을 때만 출처로 유지한다.

## 출처 유형

| 유형 | 볼 것 | 유지 기준 |
|---|---|---|
| 경쟁 제품 변경 기록 | workflow 변화, 가격 변화, AI/productivity 기능 | POKit 포지셔닝이나 백로그 품질 판단에 영향을 줄 때 |
| 사용자 커뮤니티 | 반복되는 불편, 우회 방법, 사용자가 실제 쓰는 표현 | 최소 한 가지 제품 판단을 바꿀 수 있을 때 |
| 내부 Linear/GitHub 활동 | 반복 label, 막힌 작업, 반복 review comment | backlog -> cycle -> execution 흐름의 마찰을 드러낼 때 |
| 표준/플랫폼 문서 | 정책 변화, API 변화, 생태계 제약 | POKit workflow를 막거나 단순화할 수 있을 때 |

## 입력 형식

```yaml
source:
  name: "<출처 이름>"
  type: "competitor changelog | user community | internal Linear/GitHub activity | platform doc"
  url_or_location: "<링크 또는 로컬 경로>"
  cadence: "weekly | cycle-start | release-watch | ad hoc"
  watch_keywords:
    - "<키워드>"
  keep_if: "<이 출처가 바꿀 수 있는 제품 판단>"
```

## 운영 원칙

- 고객 개인정보, 인증정보, 민감한 내부 원문은 저장하지 않는다.
- 흥미롭다는 이유만으로 신호를 모으지 않는다.
- 오래된 링크 여러 개보다 실제 판단에 도움이 되는 신호 하나를 우선한다.
- 신호에서 Linear 후보를 만들 때도 사용자 승인 전에는 Backlog Candidate dry-run에서 멈춘다.
