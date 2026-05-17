---
id: M3
title: "[v0.15.2] release dispatcher [6/8] retro-check --dry-run 고정 해제 + 실제 디스패치"
proposedLabels: [area:release-dispatcher, type:bug, release:v0.15.2]
proposedState: Backlog
idempotencyKey: memo-20260517-m3-retro-check-dry-run-lift
source: 사용자 PO 결정 + 메인 세션 분석 (2026-05-17)
---

## AS-IS

`scripts/cli/release.ts:119` — [6/8] 단계에서 `retro-check.ts`를 항상 `--dry-run` 플래그와 함께 호출한다:

```
run("node", ["--experimental-strip-types", "scripts/cli/retro-check.ts", "--dry-run"], { ...opts, allowFail: true });
```

`retro-check.ts` 자체는 `--apply` 플래그를 지원하고 실제 Linear 이슈 등록 경로(`applyCreateIssue`)도 구현되어 있으나, dispatcher가 `--dry-run`을 고정 전달하므로 plan 출력만 하고 실제 등록이 0건 발생한다.

결과: v0.14.0 structural gap 3건(wiring_status.gaps에 기록됨)이 release dispatcher 실행 후에도 pokit:gap 이슈로 등록되지 않았다. gap이 추적되지 않아 다음 세션에서 동일 문제 재발 위험이 있다.

`external-write/guard.ts`의 `assertExternalWriteAllowed`는 `approved=true` + `actor="main_agent"`를 동시에 요구한다. 현재 retro-check는 dispatcher 경유 시 이 조건을 충족시키는 신호를 받지 못한다.

## TO-BE

`scripts/cli/release.ts` [6/8] 단계를 두 단계로 분리한다:

1. `--dry-run` 모드로 retro-check 실행 → plan(갭 목록 + 등록 예정 이슈 제목) stdout 출력
2. plan이 1건 이상일 때 `y/N` 프롬프트 표시 → 사용자가 `y` 입력 시 `--apply` 모드로 재실행

`--apply` 재실행 시 `assertExternalWriteAllowed` 통과 조건:
- `actor: "main_agent"` — dispatcher에서 env 또는 인자로 전달
- `approved: true` — 사용자 `y` 입력을 근거로 설정

자동 cron/봇 환경에서의 TTY 분기(무인 승인 경로)는 이번 scope 밖이다. 프롬프트 응답 불가 환경에서는 사용자가 `--no-retro-check` 플래그로 skip한다.

**TTY escape 동작 명시** (M1 폐기 결정과 정합):
- dispatcher가 프롬프트 표시 직전 `process.stdin.isTTY` 검사
- TTY 없음 → 자동 skip + stderr WARN: `"[6/8] TTY 없음 — retro-check apply skip. plan만 출력됨"`
- TTY 있음 → 정상 프롬프트
- 결과: 봇/CI 환경에서 무한 대기 0건 보장

plan이 0건(갭 없음)이면 프롬프트 없이 `✓ 갭 없음` 메시지 출력 후 진행한다.

## 성공 검증

- [ ] `./bin/pokit release <VERSION>` 실행 시 [6/8] 단계에서 retro-check plan이 먼저 출력된다
- [ ] plan에 갭이 있으면 `[y/N]` 프롬프트가 표시된다
- [ ] `y` 입력 시 `--apply` 모드로 재실행되어 Linear에 pokit:gap 이슈가 실제 등록된다
- [ ] `assertExternalWriteAllowed` 호출 시 `approved=true`, `actor="main_agent"` 조건이 충족된다 (guard.ts 예외 없음)
- [ ] v0.14.0 manifest의 structural gap 3건이 이 변경 후 dispatcher 실행 시 pokit:gap 이슈로 자동 디스패치된다
- [ ] `--no-retro-check` 플래그 전달 시 기존과 동일하게 [6/8] 전체 skip된다
- [ ] plan이 0건이면 프롬프트 없이 진행된다 (무한 대기 없음)
- [ ] TTY 없음 환경에서 자동 skip + WARN 출력 (봇/CI 무한 대기 0건)

## 담당 에이전트

- 설계: claude-sonnet-4-6 (2026-05-17 메인 세션)
- 구현: claude-sonnet-4-6
- 검수: 사용자 (PO) — Linear 등록 결과 확인 및 v0.14.0 gap 3건 디스패치 검증
