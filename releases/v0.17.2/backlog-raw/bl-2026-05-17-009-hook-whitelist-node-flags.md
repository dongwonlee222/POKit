---
id: bl-2026-05-17-009
created: 2026-05-17
status: promoted
domain: tooling+security
size: M
title: "block-linear-api.sh 화이트리스트 node 플래그 매칭 보강"
target_version: v0.17.2
promoted_to: POKIT-201
source: v0.16-unresolved/hook-whitelist-node-flags
---

## AS-IS

- `block-linear-api.sh` 화이트리스트가 `node --experimental-strip-types` 플래그 미매칭
- defense-in-depth 차원에서 허용된 명령이 우회되거나 차단되는 케이스 발생
- hook 신뢰성 ↓

## TO-BE

- 플래그 포함 형태 정규식 매칭 강화
  - `node` + 옵션 플래그(여러 개 가능) + 스크립트 경로 패턴
- 화이트리스트 항목 단위 테스트 (allow/deny 케이스 표)
- hook 실행 결과 로그(차단 사유) 명확화

## 성공 검증

- `node --experimental-strip-types scripts/cli/release.ts` PASS
- 비허용 명령 (`curl api.linear.app` 등) 정상 차단
- 화이트리스트 테스트 매트릭스 PASS 100%

## 담당 에이전트

미정 (scripts/hooks/block-linear-api.sh + 테스트)

## 비고

- 보안 영역 — 변경 신중, 회귀 테스트 우선
