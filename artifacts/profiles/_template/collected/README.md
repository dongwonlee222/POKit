# collected/

외부에서 수집한 데이터를 보관하는 디렉토리입니다.

| 하위 디렉토리 | 용도 | git 추적 |
|---|---|---|
| `raw/` | 원본 그대로 보관 | 기본 제외 (`.public.*` 예외) |
| `digest/` | 정제·익명화 처리된 파생물 | 기본 제외 (`.public.*` 예외) |
| `examples/` | 공개 가능한 sanitized 예시 | 추적됨 |

모든 파일은 동일 디렉토리에 `.meta.yaml` sidecar를 필수로 가져야 합니다.

## 관련 문서

- 메타데이터 스키마: [`docs/_details/collected-meta-schema.md`](../../../../docs/_details/collected-meta-schema.md)
- 수집 데이터 정책: [`docs/_details/collected-data-policy.md`](../../../../docs/_details/collected-data-policy.md)
