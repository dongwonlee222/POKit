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

export type VisualStatusState = "done" | "pending" | "blocked" | "warning" | "info";

export type PreflightStatusItem = {
  state: VisualStatusState;
  label: string;
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

export function renderPercentBar(input: {
  percent: number;
  width?: number;
}): string {
  const percent = clamp(Math.round(input.percent), 0, 100);
  const width = Math.max(input.width ?? 10, 1);
  const filled = Math.round((percent / 100) * width);
  const bar = `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
  return `[${bar}] ${percent}%`;
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

export function renderPreflightStatusBlock(input: {
  title: string;
  percent: number;
  items: PreflightStatusItem[];
  width?: number;
}): string[] {
  return [
    input.title,
    renderPercentBar({ percent: input.percent, width: input.width }),
    "",
    ...input.items.map((item) => `${statusEmoji(item.state)} ${item.label}`),
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

export function renderDecisionChoiceBlock(input: {
  reason: string;
  recommended: string;
  recommendedReason: string;
  alternative: string;
  alternativeTradeoff: string;
}): string[] {
  return [
    "사용자 확인",
    "",
    `🤔 선택이 필요한 이유: ${input.reason}`,
    "",
    `✅ 추천안 A: ${input.recommended}`,
    `이유: ${input.recommendedReason}`,
    "",
    `↩️ 대안 B: ${input.alternative}`,
    `차이: ${input.alternativeTradeoff}`,
    "",
    "A/B로 선택해 주세요.",
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

function statusEmoji(state: VisualStatusState): string {
  if (state === "done") {
    return "✅";
  }
  if (state === "pending") {
    return "⏳";
  }
  if (state === "blocked") {
    return "🚨";
  }
  if (state === "warning") {
    return "⚠️";
  }
  return "ℹ️";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
