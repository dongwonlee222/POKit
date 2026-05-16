import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

export type CycleStepDef = {
  order: number;
  label: string;
  title: string;
  description: string;
  approvalBoundary: boolean;
};

type CycleStepsFile = {
  title: string;
  steps: CycleStepDef[];
};

function loadCycleSteps(): CycleStepsFile {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const jsonPath = join(__dirname, "../../docs/_details/cycle-steps.json");
  const raw = readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw) as CycleStepsFile;
}

const _data = loadCycleSteps();

export const CYCLE_STEPS: CycleStepDef[] = _data.steps;
export const CYCLE_PROGRESS_TITLE: string = _data.title;
export const CYCLE_STEP_TITLES: string[] = _data.steps.map((s) => s.title);
