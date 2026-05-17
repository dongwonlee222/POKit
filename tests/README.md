# tests/ — 테스트 디렉토리 표준 (POKIT-202)

## 디렉토리

| 디렉토리 | 용도 |
|---|---|
| `tests/internal/` | 모듈 단위 unit 테스트 (scripts/internal/* 대상) |
| `tests/integration/` | CLI · dispatcher · 통합 흐름 |
| `tests/contracts/` | 정책 계약 검사 (AGENTS.md 크기 등) |
| `tests/regression/` | 버그 회귀 (`v<ver>-<bug>.test.mjs`) |
| `tests/hooks/` | hook 동작 검증 |
| `tests/ci/` | CI 전용 (긴 실행, 옵션) |
| `tests/_setup/` | 공통 helper (fixtures, mock, factories) |
| `tests/fixtures/` | 정적 픽스처 데이터 |

## 회귀 테스트 명명 표준

```
tests/regression/v<version>-<bug-slug>.test.mjs
```

예:
- `tests/regression/v0.16.0-title-yaml-parse.test.mjs`
- `tests/regression/v0.17.1-bagje-residue.test.mjs`

원칙:
- 버그가 발견된 **버전**을 파일명에 박는다.
- slug 은 영문 kebab-case + 핵심 키워드 1~3개.
- 한 파일 = 하나의 회귀 사례. 분할 가독성 우선.

## 공통 helper 사용

```js
import { mkTempDir, writeFixture, runLinearCli, runPokitVerb, writeBacklogMemo, readUtf8 }
  from "../_setup/index.mjs";
```

helper 신규 추가 시:
- `tests/_setup/index.mjs` 에 추가
- README 의 helper 목록 갱신
- 새 helper 의 단위 테스트(필요 시) 같이 추가

## 실행

```bash
# 전체
node --test --experimental-strip-types tests/**/*.test.mjs

# 특정 디렉토리
node --test --experimental-strip-types tests/internal/*.test.mjs

# CI 전용 (긴 실행 — 일반 개발 시 생략 가능)
node --test --experimental-strip-types tests/ci/*.test.mjs
```

## 신규 추가 시 체크리스트

- [ ] 회귀 = `tests/regression/v<ver>-<bug>.test.mjs`
- [ ] unit = `tests/internal/<module>.test.mjs`
- [ ] integration = `tests/integration/<flow>.test.mjs`
- [ ] 공통 setup → `_setup/index.mjs` 헬퍼 사용
- [ ] 임시 디렉토리는 `mkTempDir()` 사용 (수동 mkdtempSync 지양)
