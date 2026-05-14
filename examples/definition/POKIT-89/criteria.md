# 완료 기준: PO Daily News Signal

## Given / When / Then

- Given 키워드와 실행 시간이 설정되어 있을 때, When daily run이 실행되면, Then 전일/당일 뉴스 후보가 수집된다.
- Given 같은 URL이 이미 저장되어 있을 때, When 같은 뉴스가 다시 들어오면, Then 새 item을 만들지 않고 duplicate count를 올린다.
- Given relevance score가 높은 item이 있을 때, When digest를 생성하면, Then Backlog Candidate dry-run에 포함된다.

## 외부 변경 경계

- Linear issue는 사용자 승인 없이 생성하지 않는다.
- provider API key가 필요한 경우 dry-run에서 blocked 상태로 표시한다.

## 완료 증거

- fixture 기반 end-to-end 실행 결과
- dedupe 테스트
- digest sample
- Linear sub-issue dry-run sample
