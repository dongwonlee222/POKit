# v0.15.2 — Release INDEX

> released_at: 2026-05-17T06:30:00Z · cycle: 2026-W20

## 📋 이슈 (계획)
- 🔄 **POKIT-171** — [v0.15.2] release dispatcher [4/8] — manifest 미존재 시 자동 생성 _(feature)_
- 🔄 **POKIT-172** — [v0.15.2] release dispatcher [6/8] retro-check --dry-run 고정 해제 + 실제 디스패치 _(fix)_
- 🔄 **POKIT-173** — [v0.15.2] 미결 인계 메커니즘 — manifest unresolved 섹션 + session-brief 카드 _(feature)_
- 🔄 **POKIT-174** — 백로그 라우팅 — Linear 명시 필수 (모호 표현은 backlog-memo 강제) _(chore)_
- 🔄 **POKIT-175** — releases/v<버전>/ 단위 묶음 도입 + artifacts/ 역할 재정의 + dogfood/ 제거 _(chore)_
- 🔄 **POKIT-176** — wiring_status.actual 실측 자동화 — wiring-probe.ts 신규 + retro-check 연동 _(feature)_
- 🔄 **POKIT-177** — linear-backlog-manager → linear-issue-manager (update 분기 추가) _(feature)_

## ✅ 완료
_(없음)_

## 🔄 진행 중 / 미완
- **POKIT-171** — [v0.15.2] release dispatcher [4/8] — manifest 미존재 시 자동 생성 _(state: Backlog)_
- **POKIT-172** — [v0.15.2] release dispatcher [6/8] retro-check --dry-run 고정 해제 + 실제 디스패치 _(state: Backlog)_
- **POKIT-173** — [v0.15.2] 미결 인계 메커니즘 — manifest unresolved 섹션 + session-brief 카드 _(state: Backlog)_
- **POKIT-174** — 백로그 라우팅 — Linear 명시 필수 (모호 표현은 backlog-memo 강제) _(state: Backlog)_
- **POKIT-175** — releases/v<버전>/ 단위 묶음 도입 + artifacts/ 역할 재정의 + dogfood/ 제거 _(state: Backlog)_
- **POKIT-176** — wiring_status.actual 실측 자동화 — wiring-probe.ts 신규 + retro-check 연동 _(state: Backlog)_
- **POKIT-177** — linear-backlog-manager → linear-issue-manager (update 분기 추가) _(state: Backlog)_

## ⏭️ 미결 → 다음 cycle
- **artifacts-migration** —  _(owner: human)_
- **pokit-159-retrieval-impl** —  _(owner: POKIT-159)_
- **wiring-intended-auto-extract** —  _(owner: human)_

## 📝 Changelog
- POKIT-171 (M2) — release dispatcher [4/8] manifest 자동 생성 (buildReleaseManifest)
- POKIT-172 (M3) — retro-check dry-run 고정 해제 + [y/N] 프롬프트 + TTY escape
- POKIT-173 (M4) — ReleaseManifest unresolved 필드 + session-brief 카드
- POKIT-174 (M5) — 백로그 라우팅 Linear 명시 필수
- POKIT-175 (M6) — releases/v<버전>/manifest.yaml 단일 폴더 묶음
- POKIT-176 (M7) — wiring-probe.ts (countProductionHits + scanWiring)
- POKIT-177 (M10) — linear-issue-manager SKILL + planUpdateIssue / applyUpdateIssue

## 📂 산출물
### Backlog (9)
- [M10-linear-issue-manager-update.md](./backlog/M10-linear-issue-manager-update.md)
- [M2-manifest-auto-generate.md](./backlog/M2-manifest-auto-generate.md)
- [M3-retro-check-dry-run-lift.md](./backlog/M3-retro-check-dry-run-lift.md)
- [M4-unresolved-carry-forward.md](./backlog/M4-unresolved-carry-forward.md)
- [M5-backlog-routing-linear-explicit.md](./backlog/M5-backlog-routing-linear-explicit.md)
- [M6-releases-folder-restructure.md](./backlog/M6-releases-folder-restructure.md)
- [M7-wiring-status-actual-probe.md](./backlog/M7-wiring-status-actual-probe.md)
- [M8-pokit-170-defer-record.md](./backlog/M8-pokit-170-defer-record.md)
- [M9-location-memory-retrieval-wiring.md](./backlog/M9-location-memory-retrieval-wiring.md)

## 🔗 메타
- [manifest.yaml](./manifest.yaml)
