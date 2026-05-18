---
name: pokit-start
description: 포킷 세션 시작 브리프 실행 후 stdout을 verbatim 출력. "포킷 시작", "POKit 시작해줘", "포킷 start", "/pokit-start" 트리거 시 발동. 다른 도메인 세션(work/hire/analyze/design/study)에서는 실행 금지.
entry: pokit start
labels: []
trigger_phrases:
  - "포킷 시작"
  - "포킷 시작해줘"
  - "POKit 시작"
  - "POKit 시작해줘"
  - "포킷 start"
  - "POKit start"
  - "/pokit-start"
---

# pokit-start

## Trigger

사용자가 위 trigger_phrases 중 하나를 입력하거나 새 세션 시작 시 발동.

## 절차

1. Bash로 다음 실행:
   ```bash
   ./bin/pokit start
   ```
2. stdout 전체를 **그대로** assistant 텍스트 본문에 출력
3. 추가 멘트 0줄. 요약·해석·다음 액션 제안 금지
4. stdout 마지막 줄 sentinel `<!-- AGENT: output above verbatim, no summary, no interpretation -->`을 assistant 텍스트에도 포함

## Output

`./bin/pokit start` stdout 그대로. 가공 금지.

## 금지

- stdout 가공·축약·재구성
- "방금 실행했습니다" 류 메타 멘트
- tool 결과가 화면에 보인다는 가정으로 출력 생략

## 자기검증

출력 후 본인 텍스트를 점검:
- 첫 줄에 `🪧 POKit 시작 Brief` 가 있는가?
- 마지막에 sentinel 코멘트가 있는가?
- 두 조건 중 하나라도 빠지면 즉시 stdout 전체를 다시 출력

## 트리거 제외

- 코드에서 "start" 함수·메서드 호출하는 프로그래밍 맥락
- 다른 도메인(work/hire/analyze/design/study) 세션
