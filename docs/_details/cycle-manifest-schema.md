# Cycle Manifest Schema

위치: `<artifactsDir>/cycles/<cycle-name>.yaml`

```yaml
cycle_name: string          # Linear cycle 이름과 일치 (예: "POKit Cycle 8")
started_at: ISO8601         # 예: "2026-04-01T00:00:00Z"
closed_at: ISO8601 | null   # null이면 진행 중
release_version: string | null  # 예: "v0.13.0", 없으면 null
included_issue_ids:         # 이 cycle에 포함된 이슈 식별자 목록
  - POKIT-XXX
  - POKIT-YYY
notes: string               # 선택. 자유 형식 메모
```

## 규칙

- `cycle_name`은 Linear cycle 이름과 동일하게 유지한다.
- `closed_at`이 null이면 현재 진행 중인 cycle로 간주한다.
- `release_version`은 이 cycle이 특정 release와 연결될 때 기록한다.
- `included_issue_ids`는 artifact frontmatter에 박지 않고 이 파일에서만 관리한다.
- 과거 데이터 retrofit 없음 — 새 cycle부터 기록 시작.
