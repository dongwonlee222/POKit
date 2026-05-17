# v0.15.3 — Release INDEX

> released_at: 2026-05-17T06:42:20.564Z · cycle: n/a

## 📋 이슈 (계획)
_(manifest issues 비어 있음)_

## ✅ 완료
_(없음)_

## ⏭️ 미결 → 다음 cycle
- **artifacts-migration** —  _(owner: human)_
- **pokit-159-retrieval-impl** —  _(owner: POKIT-159)_
- **wiring-intended-auto-extract** —  _(owner: human)_
- **build-release-manifest-carry-forward** —  _(owner: human)_
- **parse-changelog-section-date-line** —  _(owner: human)_

## 📝 Changelog
- `scripts/cli/session-brief.ts` `buildUnresolvedCard` — 옛 경로 `memory/releases/v<X>.yaml` 하드코딩을 `releaseManifestPath()` 헬퍼 경유로 교체. POKIT-175(M6) 마이그레이션 직후 unresolved 카드 미렌더 버그 해소. (commit 408090e)
- 회귀 가드 (POKIT-173 회귀 방지) — 동일 클래스의 미래 버그 차단 (commit 07ed02c)
- `tests/session-brief.test.mjs` — `buildSessionBrief` start variant의 unresolved 카드 렌더 회귀 테스트 1건 신설.
- `docs/architecture/15-folder-layout.md` — `releases/` 항목 옆 manifest 경로 가드 문구.
- semver PATCH 자리(hotfix) 활용 운영 방침 첫 적용 — 작은 fix도 release manifest에 박제해 추적 채널 단일화.
- `./bin/pokit release 0.15.3` dispatcher [4/8]가 manifest를 자동 생성 — POKIT-171(M2) buildReleaseManifest dogfood 검증.

## 📂 산출물
_(이관된 산출물 없음)_

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
