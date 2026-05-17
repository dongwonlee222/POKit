# v0.17.2 — Release INDEX

> released_at: 2026-05-17T15:34:25.563Z · cycle: n/a

## 📋 이슈 (계획)
_(manifest issues 비어 있음)_

## ✅ 완료
_(없음)_

## ⏭️ 미결 → 다음 cycle
- **pokit-159-retrieval-impl-bc** —  _(owner: POKIT-159)_

## 📝 Changelog
- POKIT-199 — C4 Phase 2 마이그레이션 완료. `artifacts/{prds,criteria,sprints}/` 39 파일을 `releases/v0.16.0/` 로 이관 (Linear workspace slug sanitize 동반). `artifacts/` 는 cycle 진행 중 scratch 영역으로 유지. `docs/architecture/15-folder-layout.md` 갱신.
- POKIT-192 — release dispatcher [4.5/8] manifest backfill. `scripts/internal/manifest-backfill.ts` 신규 — `collectCycleIssues`, `carryForwardUnresolved`, `snapshotWiringActual`, `escalateUnresolved`. `runManifestBackfill` (pure) + `backfillForRelease` (IO) + `findPreviousReleaseManifest`. release.ts [4.5/8] 단계 신규 (manifest 존재 + apply 모드 시 자동). `ReleaseUnresolved` 스키마 확장 (`cycle_count?`, `carried_from?`, `escalated_at?`, `routed_to?`, `absorbed_by?`).
- POKIT-182 — `memory/workflow-state.yaml` cycle 상태 단일 source. `scripts/internal/workflow-state.ts` — `WorkflowState` 타입 + `loadWorkflowState`/`saveWorkflowState` + `markSessionStart`/`markSessionClose`/`markReleaseStart`/`markReleaseComplete`. session-start/close 자동 갱신 wire-in.
- POKIT-159 — 장기기억 retrieval v1 stub + 설계 PRD. `docs/architecture/16-retrieval.md` (소스 4개 / API shape / 분할 a/b/c / 비-목표). `scripts/internal/retrieval.ts` — `retrieveContext` API + decision-log 어댑터 (단순 keyword count score).
- 159b/c: backlog-raw / session / release 어댑터 추가 + pokit start 통합 (후속 cycle).
- 192 후속: manifest-backfill 실 사용 시 fetchIssues hook 추가 (Linear cycle issues 자동 fetch).

## 📂 산출물
### Backlog (raw) (5)
- [bl-2026-05-17-003-pokit-192-redefine.md](./backlog-raw/bl-2026-05-17-003-pokit-192-redefine.md)
- [bl-2026-05-17-007-c4-phase2-and-m6.md](./backlog-raw/bl-2026-05-17-007-c4-phase2-and-m6.md)
- [bl-2026-05-17-008-linear-cli-assign-label-cumulative.md](./backlog-raw/bl-2026-05-17-008-linear-cli-assign-label-cumulative.md)
- [bl-2026-05-17-009-hook-whitelist-node-flags.md](./backlog-raw/bl-2026-05-17-009-hook-whitelist-node-flags.md)
- [bl-2026-05-17-010-regression-test-naming.md](./backlog-raw/bl-2026-05-17-010-regression-test-naming.md)

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
