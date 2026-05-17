---
linear_issue_id: POKIT-155
cycle_id: team-backlog
artifact_type: prd
status: draft
skill_used: prd-author
content_hash: b016906113d48e8f59d877a84aa12bd7d1be4dd7ecc962d6096b680eb899cb1e
---

# PRD Draft: POKit start/end 브리프 포맷 개편 + 스킬화

## Problem

## 목적

start/end 출력을 정형화하고, Bash tool 경유 시 Claude가 stdout을 요약·생략하는 문제를 스킬 경유로 해소한다.

## 배경

2026-05-16 세션에서 `./bin/pokit start` stdout이 assistant 텍스트로 재출력되지 않고 누락. 근본 원인은 Bash tool 경로 + 글로벌 규칙의 한계. 스킬은 호출 직후 명령이 적재되어 누락 확률이 낮음 (Nexus current-context/save 패턴 검증됨).

## 범위

1. `scripts/cli/session-brief.ts` — start 변형 출력 포맷 개편 (헤더 `🪧 POKit 시작 Brief`, 스프린트 라인 추가, Profile/진행도바 제거)
2. `scripts/cli/session-close.ts` — end 출력 블록 신설 + `--hypothesis` 플래그 추가
3. `workspace/pokit/.claude/skills/pokit-start`, `pokit-end` 신설 (verbatim 출력 강제)
4. 버전 출처: `git describe --tags --abbrev=0` (현재 v0.11.0)

## 출력 사양

### start

```
🪧 POKit 시작 Brief
📅 YYYY. MM. DD. 요일 · Team POKIT

- 스프린트(배포 버전): vX.Y.Z
- 💬 추천 다음 행동: <resume-brief.md의 next-action>

📋 Linear 우선순위 Top 3
1. <ISSUE> <title> · <priority>
2. ...
3. ...
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
```

## 인수 조건

* 트리거 "포킷 시작/종료"로 스킬 자동 호출
* bash stdout이 assistant 텍스트에 verbatim 출력 (요약·생략 0건)
* end가 기록한 next-action·hypothesis가 다음 start에서 노출
* 기존 테스트 PASS

## 리스크

* 기존 start/end 출력 변경으로 외부 참조·테스트 영향 가능 → PRD 단계에서 영향도 스캔 필수

## 절차

POKit native: Linear 백로그 → `./bin/pokit run` PRD → cycle 배정 → 구현 → close

## Goal

- TODO: 목표를 PO가 확인한다.

## Non-Goals

- TODO: 제외 범위를 PO가 확인한다.

## User Scenario

- TODO: 대표 사용자 시나리오를 작성한다.

## Requirements

- TODO: 구현 요구사항을 정리한다.

## Acceptance Notes

- TODO: 검증 관점 메모를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-155
- Linear URL: https://linear.app/example/issue/POKIT-155/pokit-startend-브리프-포맷-개편-스킬화
- Labels: pokit:prd, Improvement
