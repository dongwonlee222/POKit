# backlog-raw

Linear 등록 이전 단계의 raw 백로그 메모.

## 파일 명명

```
bl-YYYY-MM-DD-NNN-<slug>.md
```

## 양식 (frontmatter)

```yaml
---
id: bl-YYYY-MM-DD-NNN
created: YYYY-MM-DD
status: raw | refined | promoted | dropped
domain: workflow | tooling | docs | tests | security | ...
title: "..."
target_version: v0.x.y | null
promoted_to: POKIT-xxx | null    # Linear 이슈 발급 후 채움
source: <v0.16-unresolved/...> | null
depends_on: []                    # 다른 bl-* id
absorbs: []                       # 이 메모로 흡수되는 v0.16 미결 등
---
```

## 본문 4섹션 (의무)

1. **AS-IS** — 현재 문제·상태
2. **TO-BE** — 도달하려는 상태
3. **성공 검증** — 완료 판정 기준
4. **담당 에이전트** — 미정 가능, 설계 후 확정

## 상태 흐름

```
raw → refined → promoted → (완료 후 archive)
            └→ dropped
```

- **raw**: 떠올린 상태, AS-IS만 있을 수 있음
- **refined**: 4섹션 채워짐, Linear 승격 가능
- **promoted**: Linear 이슈 발급됨 (`promoted_to` 채워짐)
- **dropped**: 불필요로 판정 (파일 유지 — 히스토리)

## pokit start / end 노출

- **start**: `status: raw | refined` 항목을 "정리/승격 대기"로 노출
- **end**: 이번 세션 신규 생성 파일을 "이번 세션이 만든 raw"로 노출

## 승격 (Linear 등록)

사용자가 명시적으로 "Linear" 단어 포함 발화 시에만 진행.

1. dry-run 미리보기 → 승인
2. linear.ts CLI `create --apply` 호출
3. 발급된 POKIT-xxx 를 `promoted_to` 에 기록
4. status → `promoted`
