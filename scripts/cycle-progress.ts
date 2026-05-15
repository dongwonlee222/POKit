import { renderProgressBar } from "./render/ascii.ts";

export type CycleProgressStep = {
  id: string;
  title: string;
  state: "done" | "current" | "pending" | "approval";
};

export const DEFAULT_CYCLE_PROGRESS_STEPS = [
  "시작 브리프",
  "Cycle 기준 확인",
  "Issue 묶음/우선순위 확인",
  "작업 Gate 확인",
  "로컬 구현/문서/산출물 작성",
  "테스트/검증",
  "완료 증거 정리",
  "외부 write dry-run",
  "사용자 승인",
  "외부 반영/close",
];

export function buildCycleProgress(currentStep: number, titles: string[] = DEFAULT_CYCLE_PROGRESS_STEPS): CycleProgressStep[] {
  return titles.map((title, index) => {
    const stepNumber = index + 1;
    return {
      id: String(stepNumber),
      title,
      state: stepNumber < currentStep
        ? "done"
        : stepNumber === currentStep
          ? "current"
          : "pending",
    };
  });
}

export function renderCycleProgress(input: {
  currentStep: number;
  title?: string;
  steps?: string[];
}): string[] {
  const title = input.title ?? "POKit 진행도";
  const stepTitles = input.steps ?? DEFAULT_CYCLE_PROGRESS_STEPS;
  const currentStep = clamp(input.currentStep, 1, stepTitles.length);
  const steps = buildCycleProgress(currentStep, stepTitles);
  const currentTitle = stepTitles[currentStep - 1];
  return [
    title,
    `${renderProgressBar({ current: currentStep, total: stepTitles.length, width: stepTitles.length })} · 현재: ${currentTitle}`,
    "",
    ...steps.map((step, index) => `${index + 1}. ${step.title.padEnd(18, " ")} ${formatStepState(step)}`),
  ];
}

function formatStepState(step: CycleProgressStep): string {
  if (step.state === "done") {
    return "✅";
  }
  if (step.state === "current") {
    return step.title.includes("승인") ? "▶ 승인 필요" : "▶ 진행 중";
  }
  return "⏳";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
