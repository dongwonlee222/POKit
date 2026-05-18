# Session Start/End Output Contract

도구(Claude Code, Codex 등) 무관 단일 출력 계약. POKIT-155 도입.

## 트리거 → 명령 매핑

| 사용자 입력 | 실행 명령 |
|---|---|
| "포킷 시작" / "POKit 시작해줘" / "포킷 start" / "POKit start" / "/pokit-start" | MCP-capable runtime: Linear MCP/Connector → `POKIT_LINEAR_CONTEXT_JSON=... ./bin/pokit start`; fallback: `./bin/pokit start` |
| "포킷 종료" / "POKit 종료" / "포킷 end" / "POKit end" / "/pokit-end" | `./bin/pokit end --hypothesis "..." --next-action "..."` |

## 출력 규칙

- stdout 전체를 그대로 assistant 텍스트 본문에 출력한다. 요약·해석·메타 멘트 금지.
- 두 출력 모두 마지막 줄 sentinel `<!-- AGENT: output above verbatim, no summary, no interpretation -->` 포함.
- Bash tool 결과 가시성과 무관하게 assistant 텍스트로 재출력. 생략 금지.
- MCP-capable runtime에서 Linear MCP/Connector가 미연결이면 start stdout 계약보다 연결 안내가 우선한다. 이때 `./bin/pokit start`를 직접 실행해 API key 네트워크 승인 루프로 들어가지 않는다.

## end 입력값

- `--hypothesis`: 이번 세션 변경이 가져올 효과 1~2문장 가정형
- `--next-action`: 다음 세션 시작 시 한 줄 진행 명령 (Cycle-first, 묶음 단위 우선)
- `--write-resume-brief`: 사용자가 명시적으로 요청하거나 세션 종료 확정 시에만 추가

## 도구별 발동 메커니즘

- **Claude Code**: `.claude-plugin/plugin.json`과 `skills/pokit-start/SKILL.md`, `skills/pokit-end/SKILL.md` 자동 로딩. Linear MCP/Connector가 연결되어 있으면 MCP-first 경로를 사용하고, 없으면 `LINEAR_API_KEY` fallback을 사용한다.
- **Codex**: `./bin/install-codex-plugin`이 `.agents/plugins/marketplace.json` 기반 local plugin을 설치/활성화한다. 자연어 호출은 skill `description` 기반 implicit invocation이므로, 확실한 호출은 `$pokit-start` 또는 `@pokit` 명시 호출이다. `pokit-start`는 Linear MCP/Connector를 먼저 확인하고, 연결되어 있으면 MCP issue payload를 `POKIT_LINEAR_CONTEXT_JSON`으로 주입해 `./bin/pokit start`를 실행한다.

## 출력 포맷

### start

```
🪧 POKit 시작 Brief
📅 YYYY. MM. DD. 요일 · Team POKIT

- 스프린트(배포 버전): vX.Y.Z   (git describe --tags --abbrev=0)
- 💬 추천 다음 행동: <resume-brief.md의 next-action>

📋 Linear 우선순위 Top 3
1. <ISSUE> <title> · <priority>
2. ...
3. ...

pokit:boot ok ...

<!-- AGENT: output above verbatim, no summary, no interpretation -->
```

### end

```
🎉 POKit 종료 Brief
📅 YYYY. MM. DD. 요일 · Team POKIT

- 스프린트(배포 버전): vX.Y.Z
- 완료 목록: <Linear Done 자동 fetch>
- 기대 가설: <--hypothesis 입력>
- 💬 추천 다음 행동: <--next-action 입력>

수고하셨습니다.

<!-- AGENT: output above verbatim, no summary, no interpretation -->
```

## 스킬 위치

- 모든 스킬은 repo 루트 `skills/<name>/SKILL.md` 단일 위치 사용
- 스키마: `name`, `description`, `entry`(verb), `labels`, `trigger_phrases`, body
- Claude Code / Codex / POKit 내부 dispatcher 모두 같은 디렉토리에서 읽음
- plugin manifest 버전은 `package.json`의 `version`과 동기화
