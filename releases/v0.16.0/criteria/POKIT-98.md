---
linear_issue_id: POKIT-98
cycle_id: team-backlog
artifact_type: acceptance_criteria
status: draft
skill_used: acceptance-criteria-author
content_hash: 3187b341b6b53dc05eb45f5f871a1c84d309952d4107b19c610bfa7e5e588741
---

# Acceptance Criteria Draft: 문서·PDF 산출물 source-of-truth 정책 정리

## Scenario

## 목적

Backlog Idea, Cycle 구체화 문서, PDF/DOCX/문서 사이트 같은 산출물의 원본과 렌더링 결과를 구분해 문서 제작 흐름이 무거워지지 않게 한다.

## 사용자 결과

사용자는 무엇이 공식 원본인지, 무엇이 보고/공유용 파생물인지 헷갈리지 않고, 필요한 시점에만 PDF나 문서를 만들 수 있다.

## 대략 범위

* Backlog Idea 단계의 canonical source는 JSON으로 정의
* 사람이 보는 preview는 chat-rendered card로 정의
* Linear 등록 시 JSON 내용을 issue body로 변환
* Cycle 구체화 단계에서는 Markdown 문서를 canonical draft로 둠
* PDF/DOCX는 공유나 보고가 필요할 때만 생성하는 derived artifact로 정의
* 도구 선택 기준 정리: Linear issue, Markdown, PDF, DOCX, docs site
* 후보 도구 조사 반영: GitHub Issue Forms, Backstage Templates, Quarto, Pandoc, WeasyPrint, MkDocs/mdBook

## 하지 않을 것

* Backlog 단계에서 PDF를 만들지 않는다.
* PDF/DOCX를 source of truth로 삼지 않는다.
* 모든 산출물을 여러 포맷으로 강제 렌더링하지 않는다.

## Rough 성공 기준

* JSON, Markdown, Linear issue, PDF/DOCX의 역할이 분리된다.
* Cycle 구체화 이후에만 보고용 PDF/DOCX 생성 판단을 한다.
* 문서 제작 도구 선택 기준이 POKit 운영 문서에 반영된다.
* 사용자가 요청하면 POKit이 source artifact에서 보고용 산출물을 생성할 수 있다.

## Criteria

- Given TODO
- When TODO
- Then TODO

## Edge Cases

- TODO: edge case를 정리한다.

## Open Questions

- TODO: PO 확인 질문을 정리한다.

## Source Context

- Linear issue: POKIT-98
- Linear URL: https://linear.app/example/issue/POKIT-98/문서pdf-산출물-source-of-truth-정책-정리
- Labels: pokit:criteria, docs
