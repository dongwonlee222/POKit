# v0.17.1 — Release INDEX

> released_at: 2026-05-17T15:17:10.430Z · cycle: n/a

## 📋 이슈 (계획)
_(manifest issues 비어 있음)_

## ✅ 완료
_(없음)_

## 📝 Changelog
- POKIT-198 (bl-011) — `backlog-promote` 스킬 + `pokit backlog-promote` CLI: memory/backlog-raw/*.md 메모를 Linear에 배치 승격. 자연어 진입 (Trigger Guard "Linear" 단어) → 파라미터 추출 (target/status/id) → dry-run → 사용자 승인 → apply → memo frontmatter 자동 갱신 + decision-log append. 사용자·LLM·sub-agent·hook 공통 진입점.
- POKIT-194 (bl-002) — session-scope raw 백로그 + pokit start/end 출력 보강. `memory/backlog-raw/` 디렉토리 + 4섹션 양식 + per-item .md. `backlog-raw-collector.ts` 함수 (loadBacklogRawSummaries / filterPendingRaw / filterCreatedOn / renderPendingRawLines / renderTodayRawLines). pokit start: 📝 raw 백로그 (정리/승격 대기) N건 / pokit end: 📝 이번 세션이 만든 raw 백로그.
- POKIT-195 (bl-004) — `linear.ts` CLI `create --apply` 지원. `IssueInput.rawDescription` 추가, applyCreateIssue 분기 처리, "미지원" throw 제거. dry-run → write 일관 흐름 확보, batch 등록 가능 상태.
- POKIT-196 (bl-005) — `decision-log.md ↔ decision-log.yaml` 자동 동기화. `appendDecisionLog(entry, yamlPath?, mdPath?)` md 옵션 추가, `appendDecisionLogMarkdown(raw, entry)` 헬퍼 신설. yaml + md 1:1 매핑 보장.
- POKIT-200 (bl-008) — `assign-label` 누적 보존 (add/replace 모드). 기본 'add' = 기존 라벨 + 신규 union. `fetchIssueLabelIds` 헬퍼. CLI `--mode` 옵션. 동반 버그 수정: applyPlan.issueId 가 label UUID 였던 것을 issue identifier 로 정정.
- POKIT-201 (bl-009) — `block-linear-api.sh` 화이트리스트 강화. node 옵션 플래그(`--experimental-strip-types` 등) 매칭. self-test 21/21 PASS. (.claude/ gitignored, 로컬 적용)
- POKIT-202 (bl-010) — 테스트 디렉토리 표준. `tests/_setup/` 공통 helper (mkTempDir/writeFixture/runLinearCli/runPokitVerb/writeBacklogMemo/readUtf8) + `tests/regression/v<ver>-<bug>.test.mjs` 명명 + `tests/README.md` 표준 문서.
- POKIT-193 (bl-001) — "박제" 어휘 맥락별 치환. release manifest 박제 / 결정 박제 / unresolved carry-forward 박제 → "기록". dry-run 박제 + 승인 → dry-run 미리보기 + 승인. 사용자 안내 맥락의 "진입" → "진행", "재발화" → "재언급". 16건 치환, 9 파일 (CHANGELOG, CLAUDE, AGENTS·없음, docs/_details/approval-flow, docs/architecture/13, scripts/cli/release, scripts/internal/{next-action-wizard,release-manifest}, skills/linear-issue-manager, .claude/hooks/show-active-rules — gitignored).
- POKIT-197 (bl-006) — dogfood historical 참조 정리. docs/OPERATING_MODEL: "dogfood validation" → "self-use validation". docs/PRD: "1주 dogfood" × 4 → "1주 자체 사용". README: dogfood/ 경로 예시 → artifacts/ 경로 (dead link 정정). docs/architecture/15-folder-layout 의 historical 명시 부분 유지.
- `memory/backlog-raw/` 디렉토리 신설: 11 raw 메모 + README.md 양식 (4섹션 의무: AS-IS/TO-BE/성공 검증/담당 에이전트). 모든 메모 status=promoted 완료.
- `releases/v0.16.0/manifest.yaml` unresolved 13건에 `absorbed_by` / `routed_to` 매핑 추가. 다음 pokit start 출력에서 라우팅 추적 가능.
- POKIT-199 (C4 Phase 2 + M6) — coreу 모듈 영향 (sprint-runner/cycle-close 경로 하드코딩) → v0.17.3 또는 v0.18 단독 cycle 이월. Linear description 에 분할 권장 (a/b/c) 박힘.
- POKIT-192 (release dispatcher [4.5/8] manifest backfill) — bl-002 collectUnresolved 재활용 + dispatcher 변경 + 신규 함수 4개 → v0.17.3 또는 v0.18 단독 cycle 이월. Linear description 에 분할 권장 박힘.
- Linear 신규 11건 발급 (POKIT-193~POKIT-202) + POKIT-192 description append.

## 📂 산출물
### Backlog (1)
- [WF15-manifest-backfill-pipeline.md](./backlog/WF15-manifest-backfill-pipeline.md)

### Backlog (raw) (6)
- [bl-2026-05-17-001-bagje-rename.md](./backlog-raw/bl-2026-05-17-001-bagje-rename.md)
- [bl-2026-05-17-002-session-scope-raw.md](./backlog-raw/bl-2026-05-17-002-session-scope-raw.md)
- [bl-2026-05-17-004-linear-cli-create-apply.md](./backlog-raw/bl-2026-05-17-004-linear-cli-create-apply.md)
- [bl-2026-05-17-005-decision-log-md-yaml-sync.md](./backlog-raw/bl-2026-05-17-005-decision-log-md-yaml-sync.md)
- [bl-2026-05-17-006-dogfood-references-cleanup.md](./backlog-raw/bl-2026-05-17-006-dogfood-references-cleanup.md)
- [bl-2026-05-17-011-backlog-raw-to-linear-batch-runner.md](./backlog-raw/bl-2026-05-17-011-backlog-raw-to-linear-batch-runner.md)

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
