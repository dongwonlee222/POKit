# Collected Data Policy

## 1. 수집 원칙 (Collection Principles)

- `collected/` 하위에는 외부에서 가져온 원본 데이터만 저장한다. 직접 생성한 콘텐츠는 `examples/` 또는 artifact에 저장한다.
- 수집 즉시 sidecar `.meta.yaml`을 작성한다. 사후 작성 금지.
- `sensitivity: high` 또는 `contains_pii: true` 파일은 반드시 수집 전 담당자 승인을 받는다.
- `critical` 파일은 저장 자체를 지양하며, 불가피한 경우 시스템 외부 별도 보안 저장소를 사용한다.

## 2. 디렉토리 구조

```
artifacts/profiles/{profile}/collected/
  raw/        # 원본 그대로. 변환 없음.
  digest/     # 정제·집계·익명화 처리된 파생물.
  examples/   # 공개 허용 예시 — git tracked.
```

- `raw/` 와 `digest/` 는 기본적으로 git에서 제외된다 (`.gitignore`).
- `examples/` 는 git tracked이며 공개 가능한 sanitized 데이터만 포함한다.

## 3. Redaction 규칙

파일을 `raw/` → `digest/` 로 승격할 때 아래를 충족해야 한다:

1. 이름, 이메일, 전화번호, 주소 등 직접 식별자 제거 또는 마스킹.
2. 조합으로 재식별 가능한 간접 식별자 제거 (나이+직위+지역 등).
3. `contains_pii` 를 `true` → `false` 로 변경할 수 있는 경우에만 `digest/`에 저장.
4. 마스킹 방식: `[REDACTED]`, 해시(SHA-256 truncated), 또는 가명.

## 4. Retention 정책

- `retention_until` 날짜가 지난 파일은 즉시 삭제한다.
- 보존 연장이 필요한 경우 `retention_until`을 갱신하고 이유를 commit message에 기록한다.
- 기본 보존 기간 권고:

| Sensitivity | 권고 보존 기간 |
|---|---|
| `low` | 2년 이하 |
| `medium` | 1년 이하 |
| `high` | 6개월 이하 |
| `critical` | 저장 금지 (가능하면) |

## 5. Public 승격 경로 (.public. 파일)

`raw/` 또는 `digest/` 의 파일을 git에 커밋하려면 `.public.` 네임 패턴을 사용한다.
예: `velocity-data.public.csv`

승격 요건:
1. `sensitivity: low` 이어야 한다.
2. `contains_pii: false` 이어야 한다.
3. `license` 가 공개 배포를 허용해야 한다 (예: `CC-BY-4.0`, `public-domain`).
4. 해당 파일의 `.meta.yaml` 도 함께 `.public.` 명명으로 커밋한다.

`examples/` 디렉토리는 git tracked이므로 `.public.` 패턴 없이도 커밋 가능하다.
단, `examples/`에 저장하는 파일도 위 승격 요건을 모두 충족해야 한다.

## 6. Artifact 참조 규칙

artifact (PRD, analysis, sprint output)가 `collected/` 파일을 참조할 경우 frontmatter의
`sources` 필드에 참조 경로를 명시한다. 스키마는 `docs/_details/collected-meta-schema.md` 참조.

## 7. 위반 처리

- sidecar 없는 파일 발견 시: 즉시 사용 중단 → `.meta.yaml` 작성 또는 삭제.
- 승격 요건 미충족 `.public.` 파일 발견 시: PR 리뷰에서 차단.
- `critical` 파일이 repo에 커밋된 경우: 즉시 `git filter-repo` 또는 BFG로 히스토리 삭제.
