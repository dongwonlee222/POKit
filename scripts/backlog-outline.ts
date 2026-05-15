export type BacklogTitleStatus =
  | "definition_needed"
  | "ready"
  | "approval_pending"
  | "release_bound"
  | "non_release"
  | "incident_follow_up";

export type ReleaseKind = "normal" | "hotfix" | "none";

export type BacklogTitleInput = {
  status: BacklogTitleStatus;
  scope: string;
  action: string;
  targetVersion?: string;
};

export type LinearBacklogDescriptionInput = {
  purpose: string;
  userVisibleChange: string;
  doneCondition: string;
  scope: string;
  outOfScope: string;
  evidence: string[];
  release: {
    kind: ReleaseKind;
    targetVersion?: string;
    runId?: string;
  };
  linearVariables: {
    state: string;
    labels: string[];
    source: "chat" | "problem_review" | "retro" | "signal" | "linear" | string;
    idempotencyKey: string;
  };
};

export type LocalBacklogMemoInput = {
  title: string;
  summary: string;
  source: string;
  proposedLinearTitle: string;
  proposedLabels: string[];
  proposedState: string;
  nonChanges: string[];
  idempotencyKey: string;
};

export type SubIssueTaskChecklistInput = {
  subIssueId: string;
  tasks: Array<{
    id: string;
    title: string;
    doneGate: string;
  }>;
};

export function buildBacklogTitle(input: BacklogTitleInput): string {
  const status = titleStatusLabel(input.status, input.targetVersion);
  const scope = normalizeInline(input.scope);
  const action = normalizeInline(input.action);
  return `[${status}] ${scope} - ${action}`;
}

export function renderLinearBacklogDescription(input: LinearBacklogDescriptionInput): string {
  return [
    "## 목적",
    fallback(input.purpose),
    "",
    "## 사용자에게 보이는 변화",
    fallback(input.userVisibleChange),
    "",
    "## 완료 조건",
    fallback(input.doneCondition),
    "",
    "## 범위",
    fallback(input.scope),
    "",
    "## 제외 범위",
    fallback(input.outOfScope),
    "",
    "## 증거 / 출처",
    renderList(input.evidence),
    "",
    "## 배포 여부",
    `releaseKind: ${input.release.kind}`,
    `targetVersion: ${input.release.targetVersion ?? "none"}`,
    `runId: ${input.release.runId ?? "none"}`,
    "",
    "## Linear 변수",
    `state: ${input.linearVariables.state}`,
    `labels: ${input.linearVariables.labels.join(", ") || "none"}`,
    `source: ${input.linearVariables.source}`,
    "",
    "## idempotency key",
    input.linearVariables.idempotencyKey,
    "",
  ].join("\n");
}

export function renderLocalBacklogMemo(input: LocalBacklogMemoInput): string {
  return [
    `# Backlog Memo: ${input.title}`,
    "",
    "## 요약",
    fallback(input.summary),
    "",
    "## 출처",
    fallback(input.source),
    "",
    "## 제안 Linear 형태",
    `title: ${input.proposedLinearTitle}`,
    `state: ${input.proposedState}`,
    `labels: ${input.proposedLabels.join(", ") || "none"}`,
    "",
    "## 바꾸지 않을 것",
    renderList(input.nonChanges),
    "",
    "## idempotency key",
    input.idempotencyKey,
    "",
  ].join("\n");
}

export function renderSubIssueTaskChecklist(input: SubIssueTaskChecklistInput): string {
  return [
    "## Task Checklist",
    "",
    `subIssueId: ${normalizeInline(input.subIssueId)}`,
    "",
    ...renderTaskLines(input.tasks),
    "",
  ].join("\n");
}

function titleStatusLabel(status: BacklogTitleStatus, targetVersion?: string): string {
  if (status === "definition_needed") {
    return "정의필요";
  }
  if (status === "ready") {
    return "준비완료";
  }
  if (status === "approval_pending") {
    return "승인대기";
  }
  if (status === "release_bound") {
    return `배포대상 ${targetVersion ?? "버전미정"}`;
  }
  if (status === "non_release") {
    return "비배포";
  }
  return "장애후속";
}

function normalizeInline(value: string): string {
  return value.replace(/\s+/g, " ").trim() || "미정";
}

function fallback(value: string): string {
  return value.trim() || "-";
}

function renderList(values: string[]): string {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return "-";
  }
  return normalized.map((value) => `- ${value}`).join("\n");
}

function renderTaskLines(tasks: SubIssueTaskChecklistInput["tasks"]): string[] {
  const normalized = tasks
    .map((task) => ({
      id: normalizeInline(task.id),
      title: normalizeInline(task.title),
      doneGate: normalizeInline(task.doneGate),
    }))
    .filter((task) => task.id !== "미정" || task.title !== "미정" || task.doneGate !== "미정");

  if (normalized.length === 0) {
    return ["- [ ] task:todo · 작업 정의 필요 · doneGate: 미정"];
  }

  return normalized.map((task) => `- [ ] ${task.id} · ${task.title} · doneGate: ${task.doneGate}`);
}
