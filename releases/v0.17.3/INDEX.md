# v0.17.3 — Release INDEX

> released_at: 2026-05-17T17:30:03.153Z · cycle: n/a

## 📋 이슈 (계획)
_(manifest issues 비어 있음)_

## ✅ 완료
_(없음)_

## ⏭️ 미결 → 다음 cycle
- **artifacts-migration** —  _(owner: agent)_
- **pokit-159-retrieval-impl** —  _(owner: POKIT-159)_
- **wiring-intended-auto-extract** —  _(owner: agent)_
- **build-release-manifest-carry-forward** —  _(owner: agent)_
- **parse-changelog-section-date-line** —  _(owner: agent)_

## 📝 Changelog
- POKIT-203 — release artifact migration + INDEX.md 자동 생성. `scripts/internal/release-artifacts-migrate.ts` (artifacts + backlog-raw → releases/v<X>/). release.ts [4.7/8] [4.8/8] 신규.
- POKIT-205 — flow-state T1-T4. `workflow-state.yaml` 5↔10 매핑 + advance API + `./bin/pokit advance <step> [--issue ID]` + `.claude/hooks/flow-gate.sh` (PreToolUse Edit|Write 차단, build 미진입 시 exit 2). renderFlowProgress (5단계 선형 ASCII). escape hatch: `POKIT_FLOW_BYPASS=1`.
- POKIT-182 — `memory/workflow-state.yaml` cycle 상태 단일 source. `scripts/internal/workflow-state.ts` (`markSessionStart`/`markSessionClose`/`markReleaseStart`/`markReleaseComplete`).
- POKIT-159 — 장기기억 retrieval v1 stub. `docs/architecture/16-retrieval.md` (소스 4개 / API shape / 분할 a/b/c). `scripts/internal/retrieval.ts` decision-log 어댑터 (단순 keyword count score). **159b/c (어댑터 3개 + start 통합) 은 v0.17.4 carry-over** (POKIT-211 설계 후 명시 할당).
- POKIT-208 — `scripts/cli/release.ts` 마지막에 `markReleaseComplete(rootDir, version)` wire-in. v0.17.2 release 후 `workflow-state.yaml.last_release_version: null` 잔존 버그 정정. dry-run skip. regression: `tests/regression/v0.17.3-mark-release-complete.test.mjs` (2 케이스).
- POKIT-204 — `backlog-promote` 기본 필터에 `promoted/dropped` 자동 제외 추가.
- POKIT-192 — backfill 후속: `routed_to` 항목 제외 + prev manifest walk-back 검색. v0.17.2 manifest unresolved parser 확장.
- v0.17.2 unresolved 1건(POKIT-159 159b/c) → v0.17.4 carry-over.
- 신규 메타 백로그 5건 → v0.17.4 carry-over: POKIT-206 / POKIT-207 / POKIT-209 / POKIT-210 / POKIT-211.
- 세션 발굴: `pokit start` 후 작업 중 발견된 메타 이슈 묶음(workflow-state 자동 갱신 누락, resume-brief stale, active-rules hook 단계 추적 누락, "박제" 어휘 잔존, immutable 검색 컨벤션, lifecycle 관리).

## 📂 산출물
_(이관된 산출물 없음)_

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
