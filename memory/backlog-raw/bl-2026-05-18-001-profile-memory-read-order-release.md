---
id: bl-2026-05-18-001
created: 2026-05-18
status: promoted
domain: workflow+release
size: S
title: "프로필별 memory_dir read_order 해석 hotfix 버전 배포"
target_version: v0.17.5
promoted_to: POKIT-214
source: chat/session-start-profile-memory-path
depends_on: []
absorbs: []
---

## AS-IS

- `POKIT_PROFILE`과 `pokit.local.config.yaml`이 컴퓨터별 `memory_dir`를 가리키는데, 공유 파일인 `memory/context-map.yaml`은 `memory/resume-brief.md` 같은 canonical 경로만 가진다.
- 기존 `pokit start`는 read_order 경로를 그대로 검사해, 실제 파일이 `memory/profiles/pokit/resume-brief.md`에 있어도 누락으로 판단했다.
- 응급 처치로 공유 `context-map.yaml`에 프로필 경로를 직접 쓰면 다른 컴퓨터에서 다시 깨질 수 있다.
- 현재 로컬에는 `scripts/cli/session-start.ts`, `scripts/cli/session-brief.ts`, `tests/integration/session-start.test.mjs` 수정이 있으며, 버전 bump와 배포가 아직 남아 있다.
- `pokit` 전역 PATH가 없는 환경에서는 `pokit start`가 실패하므로, repo-local 실행 계약(`./bin/pokit start`)과 AGENTS 문구도 같이 정리해야 한다.

## TO-BE

- `memory/context-map.yaml`은 계속 `memory/resume-brief.md` 같은 canonical 경로를 유지한다.
- `pokit start`와 시작 브리프는 active profile의 `memory_dir`를 기준으로 canonical memory 경로를 해석한다.
- 컴퓨터마다 다른 `POKIT_PROFILE`/`memory_dir`를 써도 `pokit start`가 같은 방식으로 동작한다.
- 수정분을 hotfix 또는 다음 patch 버전으로 묶어 CHANGELOG, package version, release manifest까지 정리하고 배포한다.
- v0.17.5의 1순위 패치로 배포한다.

## 성공 검증

- `node --test tests/integration/session-start.test.mjs` 통과.
- `./bin/pokit start`에서 `pokit:boot ok` 확인.
- `memory/context-map.yaml`에 `memory/profiles/<profile>/...` 같은 로컬 프로필 고정 경로가 남지 않는다.
- release 전 `./bin/pokit safety` 또는 public safety scan을 통과한다.
- 버전 bump, CHANGELOG, release manifest, git commit/push/tag/release 여부가 명시적으로 결정된다.
- `package.json`, `CHANGELOG.md`, `releases/v0.17.5/manifest.yaml` 또는 release dispatcher 산출물이 v0.17.5를 가리킨다.

## 담당 에이전트

- build: main agent
- review: main agent
- release: 사용자 승인 후 main agent

## 비고

- Linear 등록 전 로컬 백로그 메모다.
- 외부 write 후보 idempotency key: `memo-20260518-profile-memory-read-order`
