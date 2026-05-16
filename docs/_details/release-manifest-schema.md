# Release Manifest Schema

위치: `<artifactsDir>/releases/<version>.yaml`

```yaml
version: string             # 예: "v0.13.0" (vX.Y.Z 형식)
released_at: ISO8601        # 예: "2026-04-15T12:00:00Z"
included_issue_ids:         # 이 release에 포함된 이슈 식별자 목록
  - POKIT-XXX
  - POKIT-YYY
cycle_refs:                 # 연결된 cycle 이름 목록
  - "POKit Cycle 8"
changelog_summary: string   # 한 줄 변경 요약
```

## 규칙

- `version`은 vX.Y.Z 형식을 따른다.
- `included_issue_ids`는 이 release에 포함된 이슈 식별자를 모두 나열한다.
- `cycle_refs`는 이 release와 연결된 cycle manifest의 `cycle_name`과 일치해야 한다.
- artifact frontmatter에 release 정보를 박지 않는다.
- 과거 데이터 retrofit 없음 — 새 release부터 기록 시작.
