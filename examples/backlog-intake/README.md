# Backlog Intake Examples

이 폴더는 공개 repo에 둘 수 있는 sanitized Backlog Intake 예시다.

- `backlog-idea-card-sample.md`: Raw idea를 가벼운 Backlog Idea Card로 정리한 예시
- `linear-create-preflight-sample.md`: 신규 Linear issue 생성 전 CREATE/SKIP dry-run 예시

실제 사용자별 Backlog Idea JSON, evidence snapshot, preflight 결과는 `artifacts/` 아래 ignored path에 저장한다.

## Cycle 7 산출물 매핑

리뷰 문서에서는 원래 `Cycle 6: Intake + Preflight 기반`으로 표현했지만, 기존 Cycle 6이 이미 완료되어 실제 실행은 새 `Cycle 7: Backlog Intake & Linear Preflight Foundation`에서 진행했다.

| 이슈 | 산출물 | 공개 경로 |
|---|---|---|
| POKIT-93 | Backlog Idea Card 계약/예시 | `scripts/backlog-idea-card.ts`, `tests/backlog-idea-card.test.mjs`, `examples/backlog-intake/backlog-idea-card-sample.md` |
| POKIT-99 | Linear CREATE/SKIP Preflight 계약/예시 | `scripts/linear-create-preflight.ts`, `tests/linear-create-preflight.test.mjs`, `examples/backlog-intake/linear-create-preflight-sample.md` |

Cycle 7에서는 뉴스 수집을 구현하지 않고, 뉴스 source 등록 문장을 intake 예시 입력으로만 사용한다. 실제 BBC RSS dogfood는 다음 Cycle 후보로 남긴다.
