export type TokenBudgetBucket = "unknown" | "small" | "medium" | "large";
export type PriorityBucket = "unscored" | "low" | "medium" | "high";

export type BacklogIdeaPriority = {
  impact: number | null;
  confidence: number | null;
  ease: number | null;
  total: number | null;
  bucket: PriorityBucket;
  reason: string;
};

export type BacklogIdeaCard = {
  kind: "backlog_idea_card";
  status: "draft" | "confirmed" | "registered";
  source: string;
  raw_idea: string;
  title: string;
  why: string;
  user_outcome: string;
  hypothesis: string;
  success_signal: string;
  measurement_plan: string;
  token_budget: {
    bucket: TokenBudgetBucket;
    reason: string;
  };
  priority: BacklogIdeaPriority;
  difficulty: "unknown" | "S" | "M" | "L";
  progress_steps: string[];
  stop_conditions: string[];
};

export type BacklogIdeaCardInput = {
  rawIdea: string;
  title?: string;
  source?: string;
  why?: string;
  userOutcome?: string;
  hypothesis?: string;
  successSignal?: string;
  measurementPlan?: string;
  tokenBudget?: TokenBudgetBucket;
  tokenBudgetReason?: string;
  difficulty?: "unknown" | "S" | "M" | "L";
};

const PROGRESS_STEPS = [
  "Raw Idea",
  "Backlog Idea Card",
  "방향 확인",
  "Local JSON 저장",
  "Linear Backlog 등록",
  "Cycle 구체화",
];

const STOP_CONDITIONS = [
  "목적 불명확",
  "사용자 결과 없음",
  "범위 과대",
  "중복 가능성",
  "비용/법적/개인정보 위험",
  "외부 write 포함",
];

export function buildBacklogIdeaCard(input: BacklogIdeaCardInput): BacklogIdeaCard {
  const rawIdea = input.rawIdea.trim();
  const card: BacklogIdeaCard = {
    kind: "backlog_idea_card",
    status: "draft",
    source: input.source ?? "chat",
    raw_idea: rawIdea,
    title: input.title?.trim() || summarizeTitle(rawIdea),
    why: input.why?.trim() ?? "",
    user_outcome: input.userOutcome?.trim() ?? "",
    hypothesis: input.hypothesis?.trim() ?? "",
    success_signal: input.successSignal?.trim() ?? "",
    measurement_plan: input.measurementPlan?.trim() ?? "",
    token_budget: {
      bucket: input.tokenBudget ?? "unknown",
      reason: input.tokenBudgetReason?.trim() ?? "",
    },
    priority: {
      impact: null,
      confidence: null,
      ease: null,
      total: null,
      bucket: "unscored",
      reason: "priority score not calculated yet",
    },
    difficulty: input.difficulty ?? "unknown",
    progress_steps: [...PROGRESS_STEPS],
    stop_conditions: [...STOP_CONDITIONS],
  };
  return card;
}

export function scoreBacklogIdeaCard(card: BacklogIdeaCard): BacklogIdeaPriority {
  const impact = clampScore(1 + filled(card.raw_idea) + filled(card.title) + filled(card.why) + filled(card.user_outcome) + filled(card.hypothesis));
  const confidence = clampScore(1 + filled(card.success_signal) + filled(card.measurement_plan) + filled(card.raw_idea));
  const ease = clampScore(
    card.difficulty === "S" ? 5
      : card.difficulty === "M" ? 3
        : card.difficulty === "L" ? 2
          : 3,
  );
  const total = impact * confidence * ease;
  const bucket: PriorityBucket = total >= 45 ? "high" : total >= 24 ? "medium" : "low";
  const reasonParts = [
    card.hypothesis ? "hypothesis" : "",
    card.success_signal ? "success_signal" : "",
    card.measurement_plan ? "measurement_plan" : "",
    card.user_outcome ? "user_outcome" : "",
  ].filter(Boolean);

  return {
    impact,
    confidence,
    ease,
    total,
    bucket,
    reason: reasonParts.length
      ? `score based on ${reasonParts.join(", ")}`
      : "score based on raw idea only; needs refinement",
  };
}

export function renderBacklogIdeaCardMarkdown(card: BacklogIdeaCard): string {
  return [
    "# Backlog Idea Card",
    "",
    `## 제목`,
    card.title,
    "",
    "## 진행",
    card.progress_steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
    "",
    "## Raw Idea",
    card.raw_idea || "-",
    "",
    "## 사용자 결과",
    card.user_outcome || "-",
    "",
    "## 가설",
    card.hypothesis || "-",
    "",
    "## 성공 신호",
    card.success_signal || "-",
    "",
    "## 측정 계획",
    card.measurement_plan || "-",
    "",
    "## 토큰 예산",
    `${card.token_budget.bucket}${card.token_budget.reason ? ` — ${card.token_budget.reason}` : ""}`,
    "",
    "## 우선순위",
    `bucket: ${card.priority.bucket}`,
    `score: ${card.priority.total ?? "unscored"}`,
    `reason: ${card.priority.reason}`,
    "",
    "## 등록 전 Stop Condition",
    card.stop_conditions.map((condition) => `- ${condition}`).join("\n"),
    "",
  ].join("\n");
}

function summarizeTitle(rawIdea: string): string {
  const normalized = rawIdea.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Untitled Backlog Idea";
  }
  return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
}

function filled(value: string): number {
  return value.trim() ? 1 : 0;
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, value));
}
