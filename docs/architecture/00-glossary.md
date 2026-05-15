# POKit Glossary

이 문서는 POKit 운영/아키텍처 문서에서 쓰는 용어의 단일 기준이다. Linear 용어와 POKit 운영 용어가 섞이면 실행 단위, 추적 단위, 배포 단위가 흐려지므로 이 문서를 먼저 따른다.

## Linear Weekly Cycle

Linear의 주간 추적 컨테이너다. 월요일에 시작하며, 한 주 동안 진행된 POKit Version Run, 배포, 보류, follow-up, 회고 후보를 모아 본다.

Linear Weekly Cycle은 실행 루프 자체가 아니다. 주간 planning/tracking/review의 기준 단위이며, POKit의 실제 실행은 Version Run이 담당한다.

## POKit Version Run

버전 또는 명시적 `runId`를 기준으로 실행되는 POKit 작업 루프다. 시간 단위가 아니라 scope/version 단위다.

Version Run은 다음 흐름을 가진다.

```text
Backlog selection
-> definition / implementation / documentation
-> verification
-> release or non-release decision
-> close
```

Public release로 나가는 Version Run은 `targetVersion`을 가진다. 배포와 무관한 실행은 SemVer를 올리지 않고 `runId`로 닫을 수 있다.

## Backlog Issue

Linear에 등록된 실행 후보 작업이다. 새 durable work는 먼저 Backlog Issue가 되어야 하며, chat-only intent만으로 durable project file을 바꾸면 안 된다.

Backlog Issue는 최소한 문제, 기대 결과, 완료 조건, source/evidence, label, 중복 확인 결과를 가져야 한다.

## Backlog Idea Card

Raw idea를 Linear Backlog Issue로 만들기 전에 정리하는 로컬 카드다. 사용자 결과, 가설, 성공 신호, 측정 계획, 토큰 예산, 난이도, 우선순위, stop condition을 담는다.

## Cycle Bundle

하나의 POKit Version Run에서 실제로 처리할 이슈 묶음이다. Linear Weekly Cycle 안에 속할 수 있지만, Linear Weekly Cycle 자체와 같지 않다.

## Release Bundle

특정 `targetVersion`으로 public release에 들어갈 변경 묶음이다. Release Bundle은 배포 단위이며, Cycle Bundle은 실행 단위다.

Release Bundle은 포함 이슈, release scope, targetVersion, CHANGELOG 후보, release gate 상태를 명확히 가져야 한다.

## Non-release Run

Public release 없이 닫는 Version Run이다. 예시는 로컬 초안 문서, 승인 받을 문서, private artifact, Linear 정리, git에 올리지 않는 조사/분석 산출물이다.

Non-release Run도 close 조건을 가져야 한다. 산출물 위치, 승인 대기 여부, 외부 write 여부, git에 올리지 않는 이유를 남긴다.

## External Write

Linear, GitHub, public release, tag, push, canonical decision log, release-facing CHANGELOG처럼 repo 밖 또는 공개 상태를 바꾸는 작업이다.

External write는 dry-run, 사용자 승인, idempotency key 없이 실행하지 않는다.

## Dry-run

실제 외부 상태를 바꾸기 전에 보여주는 실행 전 계획이다. 대상 ID, 예상 write, non-change, evidence, idempotency key, 승인 경계를 포함한다.

## Idempotency Key

같은 외부 write가 중복 실행되는 것을 막기 위한 안정 키다. Linear Backlog 생성, Cycle 생성, issue update, release 관련 write에는 visible idempotency key가 필요하다.

## Operationally Complete

선택된 작업면의 이슈가 Done이거나 명시적 carry-over note를 가진 상태다. Release Bundle이 필요한 작업은 release gate 전까지 완전 완료로 보지 않는다.

## Release Pending

구현, 검증, commit 등은 끝났지만 public release boundary가 아직 승인/실행되지 않은 상태다. 이 상태에서는 다음 Backlog 추천보다 release gate 진행 여부를 먼저 다룬다.
