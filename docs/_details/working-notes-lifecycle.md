# Working Notes Lifecycle

## 개요

Working Notes는 이슈 단위 작업 메모다. 세션 간 컨텍스트를 보존하고 작업 이력을 추적한다.
장기기억(memory/notes)과 분리된 단기 작업 메모로, Cycle 종료 시 자동 아카이브된다.

## 경로 규칙

```
artifacts/profiles/{profile}/working-notes/{issue}.md
```

- 1 이슈 = 1 노트
- 파일명은 Linear 이슈 식별자 소문자 사용 (예: `pokit-115.md`)
- 기본 프로필(POKIT_PROFILE 미설정)은 `artifacts/working-notes/{issue}.md`

## Frontmatter 스키마

```yaml
---
issue: POKIT-000
status: wip
updated_at: YYYY-MM-DD
---
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `issue` | 필수 | Linear 이슈 식별자 |
| `status` | 필수 | `wip` \| `blocked` \| `done` \| `abandoned` |
| `updated_at` | 필수 | 마지막 수정일 (YYYY-MM-DD) |

## Status 정의

| status | 의미 |
|---|---|
| `wip` | 진행 중 |
| `blocked` | 차단됨 — 차단 원인을 본문에 기록 |
| `done` | 완료 — 상단 완료 요약 섹션 필수 |
| `abandoned` | 포기 — 이유를 본문에 기록 |

## Done 시 완료 요약 규칙

`status: done`으로 변경 시 노트 상단(frontmatter 바로 아래)에 완료 요약을 추가한다.

```markdown
## 완료 요약

- 수행한 것: ...
- 생성된 아티팩트: ...
- 후속 조치: ...
```

완료 요약 없이 status=done으로만 변경하는 것은 허용하지 않는다.

## Cycle Close 시 아카이브

Cycle close 실행 시 자동으로 다음 이동이 발생한다.

- `status: done` 노트 → `working-notes/_archive/{cycle-name}/` 로 이동
- `status: wip`, `blocked`, `abandoned` 노트 → 그대로 유지

아카이브 경로 예시:
```
artifacts/working-notes/_archive/Cycle-3/pokit-115.md
```

아카이브는 멱등성을 보장한다. 이미 이동된 파일은 재이동하지 않는다.

## 장기기억 승격

장기기억 승격(`memory/notes/`)은 수동으로 진행한다. 자동화하지 않는다.
승격 대상은 Cycle retro 또는 수동 판단에 따라 결정한다.

## 노트 생성

템플릿 경로: `templates/working-notes/_template.md`

새 작업 노트 생성 시 템플릿을 복사해 사용한다.

## 검증

```bash
node --experimental-strip-types scripts/internal/working-notes-validator.ts artifacts/working-notes
```
