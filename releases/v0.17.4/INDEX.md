# v0.17.4 — Release INDEX

> released_at: 2026-05-17T18:15:33.423Z · cycle: n/a

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
- POKIT-211 — 백로그 lifecycle 관리. `./bin/pokit plan <ver>` planning gate CLI 신규 (verb 19→20). 직전 release manifest unresolved에서 carry-over 자동 감지 (owner=POKIT-XXX 필터) + Linear Team Backlog fresh 통합 표 + `--apply --issues` 비대화형 모드. 선택 항목 description 상단(`## AS-IS` 또는 다른 `##` 헤더 직전)에 `## 버전 v<X.Y.Z>` 라인 insert (carry-over는 `(carry-over from v<X.Y.Z-1>)` 표기). `pokit start` 출력에 `🎯 다음 target version: vX.Y.Z (N건: carry-over X / fresh Y)` 라인.
- POKIT-211 — `scripts/internal/version-line.ts` 신규 (`insertVersionLine`/`readVersionLine` — `## AS-IS` 외 다른 `##` 헤더 경계 인식, 하단 자유 형식 carry-over 노트 보존).
- POKIT-211 — `scripts/internal/workflow-state.ts` `markCycleStart(rootDir, targetVersion, now?)` 추가 (target_version set + state=active + last_release_version 보존).
- POKIT-211 — `scripts/internal/linear.ts` `IssueUpdateInput.descriptionFull?` 추가 (replace 모드, insert-at-top 지원) + `fetchIssueByIdentifier` export.
- POKIT-212 — 외부 콘텐츠 장기기억 ingest + retrieval 통합 (web/github/youtube) backlog 등록. v0.17.5 후속 명시 할당.
- v0.17.4 dogfood 7건: POKIT-159(carry-over) + POKIT-206/207/209/210/211/212 description에 `## 버전 v0.17.4` 라인 박힘.
- POKIT-211 자기-사용 검증 — `./bin/pokit plan 0.17.4 --apply` 로 v0.17.4 자체 배치 완료.
- 본 cycle = POKIT-211 단독 release. POKIT-206/207/209/210 + POKIT-212/159 = v0.17.5 carry-over.

## 📂 산출물
### Backlog (1)
- [POKIT-211-lifecycle.md](./backlog/POKIT-211-lifecycle.md)

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
