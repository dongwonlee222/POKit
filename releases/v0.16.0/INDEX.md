# v0.16.0 — Release INDEX

> released_at: 2026-05-17T11:38:53.387Z · cycle: n/a

## 📋 이슈 (계획)
- ✅ **POKIT-187** — WF10 — block-linear-api.sh hook 엔드포인트 단일 앵커 _(feature)_
- ✅ **POKIT-188** — WF11 — tests/ 카테고리 정리 + dispatcher _(feature)_
- ✅ **POKIT-189** — WF12 — scripts/internal/linear.ts CLI 진입점 _(feature)_
- ✅ **POKIT-190** — WF13 — linear.ts CLI decision-log append 버그 수정 _(fix)_
- ✅ **POKIT-178** — A2 — buildReleaseManifest wiring intended 자동 추출 _(feature)_
- ✅ **POKIT-179** — A4 — parseChangelogSection 헤더 false positive 제거 _(fix)_
- ✅ **POKIT-175** — B1 — dogfood 제거 + folder-layout 갱신 _(feature)_
- 🔄 **POKIT-181** — C4 Phase 1 — frontmatter 표준 모듈 _(feature)_
- ✅ **POKIT-185** — C8 — dry-run 3섹션 표준 _(feature)_
- ✅ **POKIT-186** — C9 — backlog-memo 시각화 강제 _(feature)_

## ✅ 완료
- **POKIT-187** — WF10 — block-linear-api.sh hook 엔드포인트 단일 앵커
- **POKIT-188** — WF11 — tests/ 카테고리 정리 + dispatcher
- **POKIT-189** — WF12 — scripts/internal/linear.ts CLI 진입점
- **POKIT-190** — WF13 — linear.ts CLI decision-log append 버그 수정
- **POKIT-178** — A2 — buildReleaseManifest wiring intended 자동 추출
- **POKIT-179** — A4 — parseChangelogSection 헤더 false positive 제거
- **POKIT-175** — B1 — dogfood 제거 + folder-layout 갱신
- **POKIT-185** — C8 — dry-run 3섹션 표준
- **POKIT-186** — C9 — backlog-memo 시각화 강제

## 🔄 진행 중 / 미완
- **POKIT-181** — C4 Phase 1 — frontmatter 표준 모듈 _(state: In Progress)_

## ⏭️ 미결 → 다음 cycle
- **artifacts-migration** —  _(owner: agent)_
- **pokit-159-retrieval-impl** —  _(owner: POKIT-159)_
- **c4-phase2-full-migration** —  _(owner: agent)_
- **wf15-manifest-backfill** —  _(owner: POKIT-192)_
- **dogfood-references-cleanup** —  _(owner: agent)_
- **backlog-key-deduplication** —  _(owner: agent)_
- **title-yaml-quoting** —  _(owner: agent)_
- **decision-log-md-sync** —  _(owner: agent)_
- **assign-label-cumulative** —  _(owner: agent)_
- **cli-create-apply-support** —  _(owner: agent)_
- **hook-whitelist-node-flags** —  _(owner: agent)_
- **artifact-frontmatter-section-order** —  _(owner: agent)_
- **tests-regression-naming-helpers** —  _(owner: agent)_

## 📝 Changelog
- POKIT-187 (WF10) — `block-linear-api.sh` hook: 엔드포인트 단일 앵커 `api\.linear\.app` + 명령어 시작 화이트리스트 + suffix-chain 차단. urllib/fetch/axios/gh/wget/httpx 6 클라이언트 우회 차단. 회귀 테스트 13/13 PASS.
- POKIT-189 (WF12) — `scripts/internal/linear.ts` CLI 진입점: subcommand 3종(create/update/assign-label) + `--format json|pretty` + `--actor` 강제 + 파일 입력 검증(512KB + realpath). node --experimental-strip-types로 tsx 의존 제거.
- POKIT-181 (C4 Phase 1) — `scripts/internal/artifact-frontmatter.ts` 산출물 frontmatter 표준 모듈: 10 kinds(decision-log/manifest/brief/memo/prd/criteria/linear-desc/retro/analysis/workflow-state) + parseFrontmatter/renderFrontmatter/validateKind/scanArtifacts/migrateFile. 20건 마이그레이션 + warn-only contract test 26/26 PASS. (Phase 2 전수 마이그레이션은 별도)
- POKIT-178 (A2) — `buildReleaseManifest` wiring intended 자동 추출: `extractIntendedWiring(prdContent, changelogSection)` 백틱 식별자 + 마커 기반. v0.15.3 fixture 2건 추출 검증.
- POKIT-185 (C8) — `scripts/internal/dry-run-format.ts` 헬퍼 + `renderDryRunPlan(target, change, approval)` 3섹션 표준(대상/변경/승인). linear.ts CLI `--format pretty` 옵션.
- POKIT-186 (C9) — `backlog-memo` 스킬에 `## 시각화` 섹션 강제 + 시각화 가이드(Before/After, 80자, 이모지 마커). renderLocalBacklogMemo에 visualization 필드 추가.
- POKIT-191 (WF11) — tests/ 카테고리 분리(contracts/15 + hooks/3 + internal/20 + integration/22) + `_dispatcher.test.mjs` + package.json scripts 4종 신규(test:contracts/hooks/internal/integration). 433 tests PASS.
- POKIT-179 (A4) — `parseChangelogSection` 헤더 라인 `## v0.15.3 - 2026-05-17`의 후미 `- 2026-05-17`이 첫 bullet으로 오인되던 false positive 제거.
- POKIT-190 (WF13) — linear.ts CLI `appendDecisionLog` 버그: `fs.appendFile`이 `latest_decision_at` 라인 뒤에 entry를 박아 `decisions:` 배열 밖에 위치하던 dangling 문제. hand-rolled YAML 파싱 + writeFile 전체 재작성으로 해소. 기존 dangling 2건 자동 흡수 정리. 회귀 14/14 PASS.
- POKIT-175 (B1) — `dogfood/` 디렉토리 전체 제거(9 파일) + `docs/architecture/15-folder-layout.md` 갱신(폴더 수 14→13) + `.gitignore`/`role-map.yaml`/`OPERATING_MODEL.md` 동기화.
- v0.16.0 1차 병렬 그룹 10건 완료. 2차/3차/4차(C3·C5·C6·C7·P1·A1·A3) 후속 cycle.
- linear.ts CLI dogfood로 본 release의 모든 Linear update 1줄 명령 처리.
- artifact-frontmatter Phase 2(전수 마이그레이션 + warn→block 전환): C5/C7이 frontmatter 소비 시작 시점 도달 후 진행.

## 📂 산출물
### PRDs (3)
- [POKIT-144.md](./prds/POKIT-144.md)
- [POKIT-155.md](./prds/POKIT-155.md)
- [POKIT-92.md](./prds/POKIT-92.md)

### Criteria (28)
- [POKIT-115.md](./criteria/POKIT-115.md)
- [POKIT-116.md](./criteria/POKIT-116.md)
- [POKIT-117.md](./criteria/POKIT-117.md)
- [POKIT-118.md](./criteria/POKIT-118.md)
- [POKIT-119.md](./criteria/POKIT-119.md)
- [POKIT-122.md](./criteria/POKIT-122.md)
- [POKIT-123.md](./criteria/POKIT-123.md)
- [POKIT-124.md](./criteria/POKIT-124.md)
- [POKIT-125.md](./criteria/POKIT-125.md)
- [POKIT-130.md](./criteria/POKIT-130.md)
- [POKIT-131.md](./criteria/POKIT-131.md)
- [POKIT-132.md](./criteria/POKIT-132.md)
- [POKIT-134.md](./criteria/POKIT-134.md)
- [POKIT-136.md](./criteria/POKIT-136.md)
- [POKIT-137.md](./criteria/POKIT-137.md)
- [POKIT-138.md](./criteria/POKIT-138.md)
- [POKIT-139.md](./criteria/POKIT-139.md)
- [POKIT-140.md](./criteria/POKIT-140.md)
- [POKIT-141.md](./criteria/POKIT-141.md)
- [POKIT-142.md](./criteria/POKIT-142.md)
- [POKIT-143.md](./criteria/POKIT-143.md)
- [POKIT-145.md](./criteria/POKIT-145.md)
- [POKIT-146.md](./criteria/POKIT-146.md)
- [POKIT-94.md](./criteria/POKIT-94.md)
- [POKIT-95.md](./criteria/POKIT-95.md)
- [POKIT-96.md](./criteria/POKIT-96.md)
- [POKIT-97.md](./criteria/POKIT-97.md)
- [POKIT-98.md](./criteria/POKIT-98.md)

### Backlog (17)
- [A1-pokit-159-retrieval-memo.md](./backlog/A1-pokit-159-retrieval-memo.md)
- [A2-wiring-intended-auto-extract.md](./backlog/A2-wiring-intended-auto-extract.md)
- [A3-carry-forward-on-pokit-173.md](./backlog/A3-carry-forward-on-pokit-173.md)
- [A4-parse-changelog-fix.md](./backlog/A4-parse-changelog-fix.md)
- [B1-pokit-175-dogfood-cleanup.md](./backlog/B1-pokit-175-dogfood-cleanup.md)
- [C3-skill-tail-standard.md](./backlog/C3-skill-tail-standard.md)
- [C4-artifact-frontmatter-standard.md](./backlog/C4-artifact-frontmatter-standard.md)
- [C5-workflow-state-machine.md](./backlog/C5-workflow-state-machine.md)
- [C6-progress-card.md](./backlog/C6-progress-card.md)
- [C7-artifact-sync-skill.md](./backlog/C7-artifact-sync-skill.md)
- [C8-dry-run-format-unified.md](./backlog/C8-dry-run-format-unified.md)
- [C9-backlog-memo-visualization.md](./backlog/C9-backlog-memo-visualization.md)
- [P1-pokit-167-scope-refine.md](./backlog/P1-pokit-167-scope-refine.md)
- [WF10-hook-bypass-fix.md](./backlog/WF10-hook-bypass-fix.md)
- [WF11-tests-consolidation.md](./backlog/WF11-tests-consolidation.md)
- [WF12-linear-ts-cli.md](./backlog/WF12-linear-ts-cli.md)
- [WF13-decision-log-cli-bug.md](./backlog/WF13-decision-log-cli-bug.md)

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
