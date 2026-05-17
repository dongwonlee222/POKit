// POKIT-205 T1 — Flow state 매핑 헬퍼
//
// Internal 10단계 (cycle-steps.json) ↔ Display 5단계 매핑 + advance API.
// workflow-state.yaml 의 flow_step_internal / flow_step_display / flow_issue 필드를
// 단일 source 로 관리한다.

import { CYCLE_STEPS, CYCLE_STEP_TITLES } from "./cycle-steps.ts";
import {
  loadWorkflowState,
  saveWorkflowState,
  type WorkflowState,
} from "./workflow-state.ts";

// ─── 5단계 정의 (Display layer) ──────────────────────────────────────────

export type DisplayStepId = "idle" | "idea" | "linear" | "build" | "test" | "release";

export const DISPLAY_STEPS: { order: number; id: DisplayStepId; label: string }[] = [
  { order: 0, id: "idle", label: "Idle" },
  { order: 1, id: "idea", label: "Idea" },
  { order: 2, id: "linear", label: "Linear" },
  { order: 3, id: "build", label: "Build" },
  { order: 4, id: "test", label: "Test" },
  { order: 5, id: "release", label: "Release" },
];

// ─── 5 ↔ 10 매핑 ────────────────────────────────────────────────────────

// internal 1..10 → display 0..5
const INTERNAL_TO_DISPLAY: Record<number, number> = {
  1: 1, 2: 1, 3: 1,   // 시작/기준/Issue묶음 → Idea
  4: 2,                // Gate → Linear
  5: 3,                // 구현 → Build
  6: 4, 7: 4,          // 검증/증거 → Test
  8: 5, 9: 5, 10: 5,   // dry-run/승인/반영 → Release
};

// display 1..5 → internal entry step (해당 display 단계의 첫 internal step)
const DISPLAY_TO_INTERNAL_ENTRY: Record<number, number> = {
  1: 1,   // Idea entry = 시작
  2: 4,   // Linear entry = Gate
  3: 5,   // Build entry = 구현
  4: 6,   // Test entry = 검증
  5: 8,   // Release entry = dry-run
};

export function displayStepFromInternal(internalStep: number): number {
  if (internalStep < 1 || internalStep > 10) return 0;
  return INTERNAL_TO_DISPLAY[internalStep] ?? 0;
}

export function internalEntryFromDisplay(displayStep: number): number {
  return DISPLAY_TO_INTERNAL_ENTRY[displayStep] ?? 0;
}

export function internalStepLabel(internalStep: number): string {
  if (internalStep < 1 || internalStep > CYCLE_STEP_TITLES.length) return "";
  return CYCLE_STEP_TITLES[internalStep - 1];
}

export function displayStepLabel(displayStep: number): string {
  return DISPLAY_STEPS[displayStep]?.label ?? "Idle";
}

export function displayStepId(displayStep: number): DisplayStepId {
  return DISPLAY_STEPS[displayStep]?.id ?? "idle";
}

// ─── Flow state 읽기/쓰기 ──────────────────────────────────────────────

export type FlowState = {
  internalStep: number;
  displayStep: number;
  internalLabel: string;
  displayLabel: string;
  displayId: DisplayStepId;
  issue: string | null;
};

export function getFlowState(rootDir = process.cwd()): FlowState {
  const ws = loadWorkflowState(rootDir);
  const internal = ws?.flow_step_internal ?? 0;
  const display = ws?.flow_step_display ?? displayStepFromInternal(internal);
  return {
    internalStep: internal,
    displayStep: display,
    internalLabel: internalStepLabel(internal),
    displayLabel: displayStepLabel(display),
    displayId: displayStepId(display),
    issue: ws?.flow_issue ?? null,
  };
}

export type AdvanceInput =
  | { kind: "internal"; step: number; issue?: string | null }
  | { kind: "display"; step: number | DisplayStepId; issue?: string | null };

function resolveAdvanceTarget(input: AdvanceInput): { internal: number; display: number } {
  if (input.kind === "internal") {
    const internal = clampInt(input.step, 1, 10);
    return { internal, display: displayStepFromInternal(internal) };
  }
  // display
  let displayNum: number;
  if (typeof input.step === "number") {
    displayNum = clampInt(input.step, 0, 5);
  } else {
    const found = DISPLAY_STEPS.find((s) => s.id === input.step);
    if (!found) throw new Error(`unknown display step id: ${input.step}`);
    displayNum = found.order;
  }
  const internal = displayNum === 0 ? 0 : internalEntryFromDisplay(displayNum);
  return { internal, display: displayNum };
}

export function advanceFlow(input: AdvanceInput, rootDir = process.cwd()): FlowState {
  const { internal, display } = resolveAdvanceTarget(input);
  const existing = loadWorkflowState(rootDir);
  const base: WorkflowState = existing ?? {
    schema_version: 1,
    current_cycle_id: null,
    current_cycle_name: null,
    target_version: null,
    last_release_version: null,
    state: "active",
    updated_at: new Date().toISOString(),
  };
  const issueValue = input.issue !== undefined ? input.issue : base.flow_issue ?? null;
  const next: WorkflowState = {
    ...base,
    flow_step_internal: internal,
    flow_step_display: display,
    flow_issue: issueValue,
    updated_at: new Date().toISOString(),
  };
  saveWorkflowState(next, rootDir);
  return {
    internalStep: internal,
    displayStep: display,
    internalLabel: internalStepLabel(internal),
    displayLabel: displayStepLabel(display),
    displayId: displayStepId(display),
    issue: issueValue,
  };
}

export function resetFlow(rootDir = process.cwd()): FlowState {
  return advanceFlow({ kind: "display", step: 0, issue: null }, rootDir);
}

// ─── 유틸 ────────────────────────────────────────────────────────────────

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

// 미사용 import 경고 회피 (확장용)
void CYCLE_STEPS;
