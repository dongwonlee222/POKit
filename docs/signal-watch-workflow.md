# PO Signal Watch Workflow

이 workflow는 관찰한 외부 신호 하나를 제품 판단으로 바꾸기 위한 최소 흐름이다. 목적은 모니터링 대시보드를 만드는 것이 아니라, PO가 놓치기 쉬운 신호를 백로그 판단으로 연결하는 것이다.

## 흐름

```text
외부 출처 목록
-> Raw Signal
-> Signal Summary
-> Discovery 깊이 판단
-> Discovery Brief
-> Backlog Candidate dry-run
-> 사용자 승인 후에만 Linear write
```

## Signal Summary

Signal Summary는 출처 항목을 가장 작게 해석한 제품 판단 메모다.

필수 항목:

- 확인한 출처와 날짜
- 원문 관찰 내용
- POKit에 중요한 이유
- 영향받는 제품 영역
- confidence
- 추천 다음 액션

## Discovery 깊이 판단

아래 조건이면 Light Discovery를 쓴다.

- 신호가 좁고 이미 이해 가능하다.
- 후보 하나 또는 문서 수정 하나로 충분하다.
- 외부 의존성이나 제품 정체성 판단이 크지 않다.

아래 조건이면 Full Discovery Brief를 쓴다.

- parent-level flow를 바꾼다.
- 사용자-facing 동작이 바뀐다.
- 외부 의존성, 제품 정체성, release policy에 영향을 준다.
- 여러 issue로 나눠야 하는 큰 묶음이다.

모든 신호를 Full Discovery로 보내지 않는다. 기본값은 PO가 결정을 내릴 수 있는 가장 가벼운 경로다.

## Backlog Candidate dry-run

Signal Watch에서 만든 후보는 아래 항목을 포함해야 한다.

- 후보 title과 parent/child 형태
- Signal Summary에서 온 증거
- 사용한 Discovery 깊이
- 기대효과
- 바꾸지 않을 것
- idempotencyKey
- 사용자 확인 block

Signal Watch는 사용자 승인 없이 Linear issue를 만들면 안 된다. dry-run이 기본 정지선이다.
