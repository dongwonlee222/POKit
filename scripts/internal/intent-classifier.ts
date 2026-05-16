/**
 * intent-classifier.ts
 * 사용자 입력 텍스트를 research / build / ambiguous 중 하나로 분류한다.
 * 키워드 기반 단순 분류.
 */

export type IntentType = "research" | "build" | "ambiguous";

const RESEARCH_KEYWORDS = [
  "어디",
  "뭐야",
  "찾아줘",
  "보여줘",
  "알려줘",
  "확인해줘",
  "조회",
  "탐색",
  "정리해줘",
  "뭐가",
  "어떻게 되",
  "어떻게 생",
  "역할",
  "위치",
  "경로",
  "뭔지",
  "인지",
];

const BUILD_KEYWORDS = [
  "만들어줘",
  "구현",
  "수정",
  "추가",
  "배포",
  "삭제",
  "변경",
  "작성",
  "생성",
  "설치",
  "migrate",
  "리팩터",
  "리팩토링",
  "해줘",
];

/**
 * 텍스트에서 키워드 매칭 점수를 계산한다.
 */
function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

/**
 * 사용자 입력 텍스트를 분류한다.
 * - research: 읽기 전용 탐색 (승인 게이트 생략)
 * - build: 외부 write / 파일 변경 포함 (승인 게이트 필수)
 * - ambiguous: 판단 불가 (메인 에이전트가 1줄 질문해야 함)
 */
export function classifyIntent(text: string): IntentType {
  const researchScore = countMatches(text, RESEARCH_KEYWORDS);
  const buildScore = countMatches(text, BUILD_KEYWORDS);

  if (buildScore > 0 && researchScore === 0) return "build";
  if (researchScore > 0 && buildScore === 0) return "research";
  if (buildScore > researchScore) return "build";
  if (researchScore > buildScore) return "research";

  return "ambiguous";
}
