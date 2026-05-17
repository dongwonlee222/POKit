---
id: bl-2026-05-17-004
created: 2026-05-17
status: promoted
domain: tooling
size: S
title: "linear.ts CLI create --apply 지원 (description 객체 vs raw 불일치 해결)"
target_version: v0.17.1
promoted_to: POKIT-195
source: v0.16-unresolved/cli-create-apply-support
---

## AS-IS

- `linear.ts` CLI `create` 명령이 `--apply` 플래그 미지원
- description 구조: 객체 형식 vs raw string 불일치 → apply 시 직렬화 실패
- bl-001/002/003 Linear write 진입 시 차단 가능성

## TO-BE

- `create --apply` 플래그 추가
- description 입력 → raw string 단일 경로로 정규화
- dry-run 미리보기 결과 그대로 apply 가능

## 성공 검증

- `linear.ts create --apply` 1회 실행 → Linear 신규 이슈 생성 확인
- dry-run 출력 description ↔ apply 후 Linear description 동일
- bl-001/002/003 등록 절차에서 본 명령 사용 PASS

## 담당 에이전트

미정 (scripts/internal/linear.ts 수정)

## 비고

- v0.17.1 진입 우선순위 — bl-001/002/003 Linear write 위해 필요
