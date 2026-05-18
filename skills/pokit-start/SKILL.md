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

### Codex — Linear MCP/Connector 우선

1. Linear MCP/Connector 도구가 있으면 먼저 `list_teams`로 연결을 확인한다.
2. Linear MCP/Connector가 없거나 인증 실패하면 `./bin/pokit start`를 실행하지 말고, 아래 문구만 출력한다:
   ```text
   Linear MCP/Connector가 연결되어 있지 않아 POKit 시작 브리프를 만들 수 없습니다.
   Codex에서 Linear app을 연결한 뒤 새 세션에서 다시 "포킷 시작"을 실행하세요.
   ```
3. 연결되어 있으면 `list_issues`로 POKit 팀의 비보관 이슈를 읽고, 결과를 compact JSON으로 만든다:
   ```json
   {"teamName":"POKit","issues":[...]}
   ```
4. Bash로 MCP 결과를 주입해 다음 실행:
   ```bash
   POKIT_LINEAR_CONTEXT_JSON='<compact-json>' ./bin/pokit start
   ```
   이때 `pokit:boot ok ... linear=mcp ...`가 나와야 한다.
5. stdout 전체를 **그대로** assistant 텍스트 본문에 출력한다.
6. 추가 멘트 0줄. 요약·해석·다음 액션 제안 금지.
7. stdout 마지막 줄 sentinel `<!-- AGENT: output above verbatim, no summary, no interpretation -->`을 assistant 텍스트에도 포함한다.

### Claude Code / Terminal — API key fallback

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
