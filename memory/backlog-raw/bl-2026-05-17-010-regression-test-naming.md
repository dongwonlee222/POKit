---
id: bl-2026-05-17-010
created: 2026-05-17
status: promoted
domain: tooling+tests
size: M
title: "regression 테스트 명명 표준화 + _setup/ 공통 helper + tests/ci/ 분리"
target_version: v0.17.2
promoted_to: POKIT-202
source: v0.16-unresolved/tests-regression-naming-helpers
---

## AS-IS

- regression 테스트 파일명이 들쭉날쭉 — `v<ver>-<bug>.test.mjs` 표준 미정착
- 공통 setup 코드 중복 — `_setup/` helper 부재
- ci 전용 테스트와 일반 unit 테스트 경계 불명확

## TO-BE

### 명명 표준

```
tests/regression/v0.16.0-title-yaml-parse.test.mjs
tests/regression/v0.16.0-frontmatter-keys.test.mjs
tests/regression/v0.17.1-bagje-residue.test.mjs
```

### 디렉토리 구조

```
tests/
├── unit/           ─ 모듈 단위
├── integration/    ─ CLI / dispatcher
├── regression/     ─ 회귀 (v<ver>-<bug>)
├── ci/             ─ CI 전용 (긴 실행)
└── _setup/         ─ 공통 helper (fixtures, mock, factories)
```

### 흡수 작업

- 기존 회귀 테스트 명명 재정비 (1회 일괄)
- 중복 setup 추출 → _setup/

## 성공 검증

- 회귀 테스트 100% `v<ver>-<bug>.test.mjs` 패턴
- `tests/_setup/` 존재 + 최소 3개 모듈 재사용
- `tests/ci/` 분리 + CI 워크플로우 경로 갱신
- 전체 테스트 실행 결과 기존과 동일 (회귀 0)

## 담당 에이전트

미정 (tests/ 정리)

## 비고

- WF11 후속 — 본 작업으로 종결
- 본 작업 진행 중 새 표준이 명세 문서에 반영 (docs/architecture/?)
