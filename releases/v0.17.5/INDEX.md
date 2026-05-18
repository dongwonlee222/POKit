# v0.17.5 — Release INDEX

> released_at: 2026-05-18T04:47:55.496Z · cycle: n/a

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
- POKIT-214 — profile별 `memory_dir` 기반 session bootstrap. `memory/context-map.yaml`은 `memory/resume-brief.md` 같은 canonical path를 유지하고, `pokit start`/시작 브리프는 active profile의 `memory_dir` 아래 `resume-brief.md`를 우선 해석한다. Regression: `tests/integration/session-start.test.mjs`.
- POKIT-214 — `backlog-promote` frontmatter parser가 `depends_on: []`, `absorbs: []` 같은 inline empty array를 배열로 파싱하도록 수정. Linear 승격 중 `fm.depends_on.join is not a function` 오류 방지. Regression: `tests/internal/backlog-promote.test.mjs`.
- POKIT-215 — 회귀 테스트의 개인 절대경로 의존을 제거했다. Linear hook/CLI 테스트가 repo-relative 경로를 사용하고, `POKIT_PROFILE`이 설정된 로컬 환경에서도 임시 fixture가 독립적으로 통과한다.
- POKIT-215 — Codex plugin manifest 추가. `.codex-plugin/plugin.json`을 도입하고 `.claude-plugin/plugin.json`과 함께 `package.json` version sync contract를 둔다.
- POKIT-215 — `scripts/hooks/block-linear-api.sh`를 public repo script로 추가해 `.claude/` 로컬 훅과 테스트가 같은 차단 로직을 공유할 수 있게 했다.
- POKIT-215 — local skill trigger contract 강화. `AGENTS.md`에 repo-local `skills/*/SKILL.md` trigger 우선 규칙을 추가하고, `pokit-start`/`pokit-end`에 `POKit ...` trigger 문구를 보강했다.
- POKIT-215 — skill dispatcher trigger routing을 더 긴 phrase 우선으로 변경해 `Linear 백로그 등록`이 generic `backlog-memo`보다 `linear-issue-manager`로 라우팅되게 했다.
- POKIT-215 — local skill contract tests 추가. plugin manifest/version sync, 핵심 스킬 출력 계약, trigger matrix, 13개 skill manifest 목록을 검증한다.
- POKIT-215 — `backlog-memo`의 존재하지 않는 `linear-backlog-manager` 참조를 `linear-issue-manager`로 정정.
- POKIT-215 — `linear-issue-manager` 문서에서 `plan*`은 dry-run 생성, `apply*`는 승인 후 Linear write 경계임을 명확히 했다.
- POKIT-215 — `docs/_details/session-output-contract.md`, `docs/ONBOARDING.md`, `docs/architecture/15-folder-layout.md`에 Codex/Claude plugin manifest 경로를 반영했다.

## 📂 산출물
### Backlog (raw) (2)
- [bl-2026-05-18-001-profile-memory-read-order-release.md](./backlog-raw/bl-2026-05-18-001-profile-memory-read-order-release.md)
- [bl-2026-05-18-002-pokit-start-strict-output-contract.md](./backlog-raw/bl-2026-05-18-002-pokit-start-strict-output-contract.md)

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
