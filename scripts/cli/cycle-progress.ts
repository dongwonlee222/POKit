import { renderProgressBar } from "../internal/render/ascii.ts";
import { CYCLE_STEPS, CYCLE_STEP_TITLES, CYCLE_PROGRESS_TITLE } from "../internal/cycle-steps.ts";
import { getFlowState, type FlowState } from "../internal/flow-state.ts";

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

// ─── POKIT-205 T2: Flow Progress (Display 5단계) ─────────────────────────

export const FLOW_DISPLAY_LABELS = ["Idea", "Linear", "Build", "Test", "Release"] as const;

/**
 * 5단계 선형 트랙 ASCII 렌더링.
 *   ●━━●━━▶━━○━━○  3/5  현재: Build (POKIT-205)
 *   Idea  Linear  Build  Test  Release
 */
export function renderFlowProgress(
  state: FlowState,
  opts?: { withLabels?: boolean },
): string[] {
  const total = FLOW_DISPLAY_LABELS.length;
  const current = state.displayStep;
  const dots = Array.from({ length: total }, (_, i) => {
    const stepN = i + 1;
    if (stepN < current) return "●";
    if (stepN === current) return "▶";
    return "○";
  });
  const track = dots.join("━━");
  const issueLabel = state.issue ? ` (${state.issue})` : "";
  const currentLabel = current === 0 ? "Idle" : state.displayLabel;
  const summary = `POKit Flow:  ${track}  ${current}/${total}  현재: ${currentLabel}${issueLabel}`;
  const lines = [summary];
  if (opts?.withLabels !== false) {
    // 라벨 정렬 — 도트 위치에 라벨 가운데 정렬
    const labelLine = "             " + FLOW_DISPLAY_LABELS.map((l) => l.padEnd(4)).join("  ");
    lines.push(labelLine);
  }
  if (current === 0) {
    lines.push("⚠ flow 미시작 — './bin/pokit advance idea --issue POKIT-XXX' 로 시작");
  }
  return lines;
}

// ─── CLI 진입점 ─────────────────────────────────────────────────────────

const __isCli = process.argv[1]?.endsWith("cycle-progress.ts");
if (__isCli) {
  const args = process.argv.slice(2);
  const cycleMode = args.includes("--cycle");
  if (cycleMode) {
    const stepArg = args.find((a) => /^\d+$/.test(a));
    const step = stepArg ? Number(stepArg) : 1;
    console.log(renderCycleProgress({ currentStep: step }).join("\n"));
  } else {
    // default: flow display 5단계
    const state = getFlowState();
    console.log(renderFlowProgress(state).join("\n"));
  }
}
