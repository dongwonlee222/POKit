---
id: bl-2026-05-17-005
created: 2026-05-17
status: promoted
domain: tooling+docs
size: M
title: "decision-log.md ↔ decision-log.yaml 동기화 (linear.ts CLI append 보강)"
target_version: v0.17.1
promoted_to: POKIT-196
source: v0.16-unresolved/decision-log-md-sync
---

## AS-IS

- `linear.ts` CLI가 decision 확정 시 `decision-log.yaml`만 append
- `decision-log.md` 동기화 부재 → 사람 가독 / LLM 가독 양식이 불일치
- 검색 시 yaml 인덱스에는 있고 md 본문에는 없는 항목 발생

## TO-BE

- decision append 시 yaml + md 동시 갱신
- md 본문 형식: 일자 / 결정 / 사유 / 출처 (yaml 항목과 1:1 매핑)
- 기존 항목 중 md에만 있고 yaml에 없는 것 / 반대 케이스 backfill 1회 실행

## 성공 검증

- decision-log.yaml entries == decision-log.md 결정 수 일치
- 신규 결정 1건 append → 두 파일 동시 갱신 확인
- backfill 후 양쪽 entries count 동일

## 담당 에이전트

미정 (scripts/internal/linear.ts 또는 별도 sync 스크립트)

## 비고

- bl-002의 collectUnresolved에서 decision-log를 source로 사용 → 양쪽 일관성 전제
