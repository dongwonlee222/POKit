---
name: pokit-end
description: 포킷 세션 종료 브리프 생성 후 stdout을 verbatim 출력. "포킷 종료", "POKit 종료", "포킷 end", "/pokit-end" 트리거 시 발동. 사용자가 명시적으로 세션 종료를 요청할 때만 실행.
entry: pokit end
labels: []
trigger_phrases:
  - "포킷 종료"
  - "포킷 끝"
  - "포킷 마무리"
  - "POKit 종료"
  - "POKit 끝"
  - "POKit 마무리"
  - "포킷 end"
  - "POKit end"
  - "/pokit-end"
---

# pokit-end

## Trigger

사용자가 위 trigger_phrases 중 하나를 입력할 때만 발동. 일상 표현 "끝났어" 류 단독으로는 발동하지 않음.

## 절차

1. **컨텍스트 수집** — 현재 세션의 완료 항목·진행 이슈·관련 보고서 정리
2. **기대 가설 작성** — 이번 세션 변경으로 기대되는 효과 1~2문장
3. **추천 다음 행동 작성** — 다음 세션 즉시 시작 가능한 명령 1문장 (Cycle-first, 묶음 단위 우선)
4. Bash로 다음 실행:
   ```bash
   ./bin/pokit end --hypothesis "<기대 가설>" --next-action "<추천 다음 행동>"
   ```
   - `--write-resume-brief`는 사용자가 명시적으로 요청하거나 세션 종료 확정 시에만 추가
5. stdout 전체를 **그대로** assistant 텍스트 본문에 출력
6. 추가 멘트 0줄. 요약·해석 금지
7. sentinel `<!-- AGENT: output above verbatim, no summary, no interpretation -->`을 assistant 텍스트에도 포함

## Output

`./bin/pokit end` stdout 그대로. 가공 금지.

## 입력값 가이드

### 기대 가설
가정형으로 1~2문장. 예: "스킬 경유 시 verbatim 누락 0건, 다음 세션 시작 시 정형 포맷이 즉시 노출됨"

### 추천 다음 행동
다음 세션 즉시 시작 가능한 단일 명령. Cycle-first 원칙. 예: "POKIT-155 검증 마무리하고 commit/push 진행해줘"

## 금지

- stdout 가공·축약·재구성
- `--hypothesis`·`--next-action` 누락한 상태로 실행
- 사용자 확인 없이 `--write-resume-brief` 자동 추가

## 자기검증

- 첫 줄에 `🎉 POKit 종료 Brief` 가 있는가?
- `기대 가설`·`추천 다음 행동` 항목이 비어 있지 않은가?
- 마지막에 sentinel 코멘트가 있는가?
- 누락 시 즉시 재실행

## 트리거 제외

- 코드에서 "end" 함수·메서드 호출하는 프로그래밍 맥락
- 다른 도메인(work/hire/analyze/design/study) 세션
- 단순 "끝났어" 류 일상 표현 (POKit 세션 맥락 아닌 경우)
