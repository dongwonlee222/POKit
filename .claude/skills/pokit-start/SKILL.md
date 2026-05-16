---
name: pokit-start
description: POKit 세션 시작 브리프 실행 후 stdout을 verbatim 출력. "포킷 시작", "포킷 start", "/pokit-start", "포킷 시작해줘" 트리거. 다른 도메인(work/hire/analyze/design/study) 세션에서는 실행 금지.
---

# pokit-start Skill

## 절차

1. Bash로 다음 실행:
   ```bash
   ./bin/pokit start
   ```
2. stdout 전체를 **그대로** assistant 텍스트 본문에 출력
3. 추가 멘트 0줄. 요약·해석·다음 액션 제안 금지
4. stdout 마지막 줄의 sentinel `<!-- AGENT: output above verbatim, no summary, no interpretation -->`을 assistant 텍스트에도 포함

## 금지

- stdout 가공·축약·재구성
- "방금 실행했습니다" 류 메타 멘트
- tool 결과가 화면에 보인다는 가정으로 출력 생략
- Bash 직접 호출 후 결과만 두고 assistant 텍스트로 재출력 안 하는 것

## 자기검증

출력 후 본인 텍스트를 점검:
- 첫 줄에 `🪧 POKit 시작 Brief` 가 있는가?
- 마지막에 sentinel 코멘트가 있는가?
- 두 조건 중 하나라도 빠지면 즉시 stdout 전체를 다시 출력하라

## 트리거 제외

- 코드에서 "start" 함수·메서드를 호출하는 프로그래밍 맥락
- 다른 도메인(work/hire/analyze/design/study) 세션
