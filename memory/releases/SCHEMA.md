# Release Manifest Schema (memory/releases/v<VERSION>.yaml)

POKIT-167 G1/T2 산출물. `./bin/pokit release <version>` 명령의 [4/8] 단계가 생성·갱신하는 단일 파일.

읽는 법
- 한 릴리스당 yaml 파일 1개. 경로: `memory/releases/v<semver>.yaml` (예: `memory/releases/v0.16.0.yaml`).
- 이 파일은 단일 소스. CHANGELOG.md, Linear cycle, GitHub release는 모두 이 manifest로부터 합성되거나 이 manifest로 동기화된다.
- writer는 `scripts/internal/release-manifest.ts`. 직접 손으로 yaml을 편집하지 말 것 — parseReleaseManifest → 수정 → renderReleaseManifest 경로를 쓸 것.

## Key 트리 (안정 순서)

```
version            string  required  semver (예: "0.16.0", "v" 접두사 없음)
released_at        string  required  ISO 8601 UTC (예: "2026-05-17T12:34:56Z"); 백필 시 cycle 종료일 사용 가능
cycle_id           string  required  Linear cycle 이름 (예: "2026-W20"); 무관 시 "n/a"
issues             list    required  []도 허용. 각 항목:
  - id             string  required  Linear key (예: "POKIT-167")
    title          string  required
    state          string  required  "Done" | "Canceled" 등 Linear state name
    type           string  required  "feature" | "fix" | "chore"
changelog          list    required  CHANGELOG.md의 해당 버전 섹션 bullet 문자열 배열. 빈 배열 허용
artifacts          map     required
  code_paths       list    required  변경된 코드 경로 string[] (repo 상대)
  doc_paths        list    required  변경된 문서 경로 string[]
  skills           list    required  추가/변경된 skill 이름 string[]
wiring_status      map     required  T7(이전 버전 점검)이 사용·갱신
  intended         list    required  release 시점에 "연결 의도"된 wiring id string[]
  actual           list    required  실측된 wiring id string[]
  gaps             list    required  []도 허용. 각 항목:
    - category     string  required  "structural" | "partial" | "bitrot"
      note         string  required  사람이 읽는 한 줄 설명
retro              map     optional  retro 스킬 산출물과 동기화. 없으면 키 자체를 생략
  kept             list              string[]
  problem          list              string[]
  try              list              string[]
github_release_url string  optional  release publish 후 채움. 미발행 시 키 생략
git_tag            string  optional  태그 push 후 채움 (예: "v0.16.0"). 미태그 시 키 생략
```

## 직렬화 규칙

- key 순서는 위 트리의 등장 순서를 그대로 따른다 (writer가 보장).
- 빈 list는 `[]`로 인라인 표기.
- string은 가능한 한 quote 없이, 특수문자(`:`, `#`, leading `-`, leading `[`, leading `{`, 또는 leading 공백)·빈 문자열·yaml 예약어(true/false/null/yes/no)일 때만 double-quote.
- 모든 줄 들여쓰기는 space 2칸.
- 파일 끝에 trailing newline 1개.

## 사용 흐름

1. release 명령 [4/8] 단계 — Linear cycle + CHANGELOG에서 manifest 초안을 생성하고 `writeReleaseManifest`로 저장.
2. [7/8] github release 발행 후 `github_release_url`, `git_tag`을 채워 다시 저장 (idempotent).
3. T7(이전 버전 점검) — `parseReleaseManifest`로 읽어 `wiring_status.gaps`를 추가·갱신하고, gaps 기반으로 `pokit:gap` Linear 이슈를 등록.
4. T10(백필) — 기존 버전들에 대해 이 schema에 맞는 파일을 생성.

## 검증 규칙 (parseReleaseManifest)

- `version`: `/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/` 형식 강제.
- `released_at`: `Date.parse` 가능 + `Z` 또는 `±HH:MM` 종결.
- 필수 키 누락 시 `Error("release manifest: missing field <key>")`.
- `issues[*].type` 화이트리스트 강제.
- `wiring_status.gaps[*].category` 화이트리스트 강제.
- 알 수 없는 top-level 키는 무시하지 않고 경고 없이 보존하지 않는다 (round-trip 안정성을 위해 정의된 키만 통과).
