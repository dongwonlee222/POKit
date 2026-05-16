import { renderProgressBar } from "../internal/render/ascii.ts";
import { CYCLE_STEPS, CYCLE_STEP_TITLES, CYCLE_PROGRESS_TITLE } from "../internal/cycle-steps.ts";

export type CycleProgressStep = {
  id: string;
  title: string;
  state: "done" | "current" | "pending" | "approval";
  approvalBoundary: boolean;
};

export function buildCycleProgress(currentStep: number, titles: string[] = CYCLE_STEP_TITLES): CycleProgressStep[] {
  return titles.map((title, index) => {
    const stepNumber = index + 1;
    const def = CYCLE_STEPS[index];
    return {
      id: String(stepNumber),
      title,
      approvalBoundary: def?.approvalBoundary ?? false,
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
  const title = input.title ?? CYCLE_PROGRESS_TITLE;
  const stepTitles = input.steps ?? CYCLE_STEP_TITLES;
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
    return step.approvalBoundary ? "▶ 승인 필요" : "▶ 진행 중";
  }
  return "⏳";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
