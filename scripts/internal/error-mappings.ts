import type { ProblemErrorReviewInput } from "./problem-error-review.ts";

export type VerbErrorReview = Pick<ProblemErrorReviewInput, "title" | "problem" | "cause" | "prevention">;

export type VerbErrorMapper = (message: string) => VerbErrorReview | null;

export function mapSessionStartError(message: string): VerbErrorReview | null {
  if (message.includes("missing memory/context-map.yaml")) {
    return {
      title: "session-start: context-map.yaml 없음",
      problem: "pokit start가 memory/context-map.yaml을 찾지 못해 부팅을 중단했습니다.",
      cause: "memory/context-map.yaml 파일이 존재하지 않습니다.",
      prevention: "memory/context-map.yaml 파일을 생성하거나 예시 파일을 복사하세요: cp memory/context-map.yaml.example memory/context-map.yaml",
    };
  }
  const missingFile = message.match(/missing read_order file (.+)/);
  if (missingFile) {
    return {
      title: "session-start: read_order 파일 없음",
      problem: `pokit start가 read_order에 지정된 파일(${missingFile[1]})을 찾지 못해 부팅을 중단했습니다.`,
      cause: `context-map.yaml read_order에 등록된 ${missingFile[1]} 파일이 존재하지 않습니다.`,
      prevention: "해당 파일을 생성하거나 memory/context-map.yaml의 read_order 항목에서 제거하세요.",
    };
  }
  if (message.includes("LINEAR_API_KEY") || message.includes("401") || message.includes("fetch")) {
    return {
      title: "session-start: Linear API 연결 실패",
      problem: "pokit start가 Linear API에 연결하지 못해 부팅을 중단했습니다.",
      cause: `LINEAR_API_KEY가 없거나 만료됐거나 네트워크 오류입니다. (${message})`,
      prevention: "LINEAR_API_KEY 환경변수를 확인하고 네트워크 상태를 점검하세요.",
    };
  }
  return null;
}

export function mapSprintRunnerError(message: string): VerbErrorReview | null {
  if (message.includes("LINEAR_API_KEY") || message.includes("401") || message.includes("fetch")) {
    return {
      title: "sprint-runner: Linear API 연결 실패",
      problem: "pokit run이 Linear API에 연결하지 못해 sprint runner를 중단했습니다.",
      cause: `LINEAR_API_KEY가 없거나 만료됐거나 네트워크 오류입니다. (${message})`,
      prevention: "LINEAR_API_KEY 환경변수를 확인하고 네트워크 상태를 점검하세요.",
    };
  }
  return null;
}

const VERB_MAPPERS: Record<string, VerbErrorMapper> = {
  start: mapSessionStartError,
  run: mapSprintRunnerError,
};

export function fallbackVerbError(verb: string, message: string): VerbErrorReview {
  return {
    title: `${verb}: 알 수 없는 오류`,
    problem: `pokit ${verb} 실행 중 예상치 못한 오류로 중단됐습니다: ${message}`,
    cause: message,
    prevention: "오류 메시지를 확인하고 관련 설정 파일과 의존성을 점검하세요.",
  };
}

export function resolveVerbError(verb: string, message: string): VerbErrorReview {
  const mapper = VERB_MAPPERS[verb];
  if (mapper) {
    const result = mapper(message);
    if (result) return result;
  }
  return fallbackVerbError(verb, message);
}

export function renderVerbErrorAscii(verb: string, review: VerbErrorReview): string {
  return [
    `🚨 pokit:${verb} FAILED — ${review.title}`,
    "─".repeat(50),
    `1) 문제: ${review.problem}`,
    `2) 원인: ${review.cause}`,
    `3) 해결: ${review.prevention}`,
  ].join("\n");
}
