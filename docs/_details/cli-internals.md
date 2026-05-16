# CLI Internals

`bin/pokit` verb는 `node --experimental-strip-types scripts/...` 위에 얹은 얇은 래퍼다.
이 문서는 디버깅·CI·파워유저를 위해 내부 매핑을 보존한다.

일상 사용에서는 `AGENTS.md`의 verb만 사용한다.
`node` 직접 명령어는 래퍼가 고장났거나 비인터랙티브 환경(CI)에서만 사용한다.

## Verb → Script Map

| Verb | Internal command |
|---|---|
| `pokit start` | `node --experimental-strip-types scripts/cli/session-start.ts` |
| `pokit brief --detail <type>` | `node --experimental-strip-types scripts/internal/session-brief.ts --detail <type>` |
| `pokit run [args]` | `node --experimental-strip-types scripts/cli/sprint-runner.ts [args]` |
| `pokit close [args]` | `node --experimental-strip-types scripts/cli/cycle-close.ts [args]` |
| `pokit retro [args]` | `node --experimental-strip-types scripts/cli/retro-summary.ts [args]` |
| `pokit hotfix [args]` | `node --experimental-strip-types scripts/cli/hotfix-cycle-plan.ts [args]` |
| `pokit audit [args]` | `node --experimental-strip-types scripts/ci/release-md-audit.ts [args]` |
| `pokit guard [args]` | `node --experimental-strip-types scripts/ci/cycle-guard.ts [args]` |
| `pokit progress [args]` | `node --experimental-strip-types scripts/cli/cycle-progress.ts [args]` |
| `pokit end [args]` | `node --experimental-strip-types scripts/cli/session-close.ts [args]` |
| `pokit safety` | `node --experimental-strip-types scripts/ci/public-safety-scan.ts` |

verb 추가·변경 시 이 테이블과 `bin/pokit`, `package.json` scripts를 동시에 갱신한다.

## npm scripts (package.json)

`package.json`의 scripts 필드에 동일한 node 명령어가 보존되어 있어 npm으로도 호출 가능하다.

```bash
npm run start    # = pokit start
npm run brief    # = pokit brief
npm run run      # = pokit run
npm run close    # = pokit close
npm run retro    # = pokit retro
npm run hotfix   # = pokit hotfix
npm run audit    # = pokit audit
npm run guard    # = pokit guard
npm run progress # = pokit progress
npm run end      # = pokit end
npm run safety   # = pokit safety
```

인자 전달 시 npm `--` 구분자를 사용한다.

```bash
npm run audit -- --target-version=v0.8.0
```

## When to use direct node commands

1. **bin/pokit wrapper 디버깅**: shell wrapper 자체에 버그가 있을 때 직접 호출로 분리하여 원인을 좁힌다.
2. **CI 파이프라인**: GitHub Actions 등에서 verb 추상화 없이 특정 스크립트만 직접 호출한다.
3. **파워유저의 인자 세밀 조정**: shell escape 이슈 회피나 추가 Node 플래그 삽입이 필요할 때.

## CI에서 직접 호출 예시

```yaml
# .github/workflows/release.yml
- name: Public safety scan
  run: node --experimental-strip-types scripts/ci/public-safety-scan.ts

- name: Release MD audit
  run: node --experimental-strip-types scripts/ci/release-md-audit.ts --target-version=${{ github.ref_name }}

- name: Cycle guard
  run: node --experimental-strip-types scripts/ci/cycle-guard.ts
```

## 회귀 방지

- `AGENTS.md`에서는 verb만 노출하고 풀 커맨드는 노출하지 않는다 (POKIT-124 회귀 테스트).
- 이 문서가 풀 커맨드의 single source of truth다.
- verb 추가·변경 시 이 문서도 반드시 갱신한다.
