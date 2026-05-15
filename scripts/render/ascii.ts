export type ProgressBarInput = {
  current: number;
  total: number;
  label?: string;
  width?: number;
};

export type StatusBlockRow = {
  label: string;
  value: string;
};

export function renderProgressBar(input: ProgressBarInput): string {
  const total = Math.max(input.total, 1);
  const current = clamp(input.current, 0, total);
  const width = Math.max(input.width ?? 10, 1);
  const filled = Math.round((current / total) * width);
  const bar = `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
  const progress = `[${bar}] ${current}/${total}`;
  return input.label ? `${input.label} ${progress}` : progress;
}

export function renderStatusBlock(input: {
  title: string;
  rows: StatusBlockRow[];
}): string[] {
  return [
    input.title,
    ...input.rows.map((row) => `- ${row.label}: ${row.value}`),
  ];
}

export function renderProblemReview(input: {
  problem: string;
  options: string[];
  recommendation: string;
}): string[] {
  return [
    "문제 검토",
    `- 문제: ${input.problem}`,
    ...input.options.map((option, index) => `- 선택지 ${index + 1}: ${option}`),
    `- 추천: ${input.recommendation}`,
  ];
}

export function renderApprovalRequest(input: {
  action: string;
  impact: string;
  confirmRequired: boolean;
}): string[] {
  return [
    input.confirmRequired ? "승인 필요" : "승인 불필요",
    `- 작업: ${input.action}`,
    `- 영향: ${input.impact}`,
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
