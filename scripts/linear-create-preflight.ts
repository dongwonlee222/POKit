import { renderPreflightStatusBlock } from "./render/ascii.ts";

export type LinearState = "absent" | "open" | "done";
export type LocalEvidenceState = "none" | "partial" | "complete";
export type EvidenceStrength = "weak" | "medium" | "strong";
export type PreflightAction = "CREATE" | "SKIP" | "NOOP";

export type PreflightEvidence = {
  type: "changelog_tag" | "direct_path" | "medium_signal" | "weak_signal";
  strength: EvidenceStrength;
  path?: string;
  detail: string;
};

export type PreflightCandidate = {
  identifier: string;
  title: string;
  linearState: LinearState;
  evidence: PreflightEvidence[];
};

export type ClassifiedPreflightCandidate = PreflightCandidate & {
  action: PreflightAction;
  localEvidence: LocalEvidenceState;
  reason: string;
};

export type LinearCreatePreflightInput = {
  idempotencyKey: string;
  projectName?: string;
  candidates: PreflightCandidate[];
};

export type LinearCreatePreflight = {
  idempotencyKey: string;
  projectName: string;
  groups: Record<PreflightAction, ClassifiedPreflightCandidate[]>;
};

export function classifyLinearCreatePreflight(input: LinearCreatePreflightInput): LinearCreatePreflight {
  const groups: Record<PreflightAction, ClassifiedPreflightCandidate[]> = {
    CREATE: [],
    SKIP: [],
    NOOP: [],
  };

  for (const candidate of input.candidates) {
    const localEvidence = classifyLocalEvidence(candidate.evidence);
    const classified = classifyCandidate(candidate, localEvidence);
    groups[classified.action].push(classified);
  }

  return {
    idempotencyKey: input.idempotencyKey,
    projectName: input.projectName ?? "POKit",
    groups,
  };
}

export function renderLinearCreatePreflightAscii(preflight: LinearCreatePreflight): string {
  const lines = [
    ...renderPreflightStatusBlock({
      title: "Linear Backlog 등록 사전 확인",
      percent: 80,
      items: [
        { state: "done", label: "로컬 후보/증거 분류 완료" },
        { state: "done", label: "Linear issue 생성 payload 준비 완료" },
        { state: "done", label: "idempotency key 확인 완료" },
        { state: "pending", label: "실제 Linear write는 승인 대기" },
      ],
    }),
    "",
    `Linear Create Preflight  (project: ${preflight.projectName})`,
    "┌─────────────────────────────────────────────────────────────────────┐",
  ];

  for (const action of ["CREATE", "SKIP", "NOOP"] as const) {
    const items = preflight.groups[action];
    lines.push(`│  ▸ ${action.padEnd(6)} (${items.length})`);
    if (items.length === 0) {
      lines.push("│    - 없음");
      continue;
    }
    items.forEach((item, index) => {
      lines.push(`│    ${String(index + 1).padStart(2, "0")}  ${item.title}`);
      lines.push(`│        id: ${item.identifier}   linear: ${item.linearState}   evidence: ${item.localEvidence}`);
      lines.push(`│        action: ${item.reason}`);
      for (const evidence of item.evidence) {
        const location = evidence.path ? `${evidence.path} — ` : "";
        lines.push(`│          + ${location}${evidence.detail}`);
      }
    });
  }

  lines.push("└─────────────────────────────────────────────────────────────────────┘");
  lines.push("gates remaining: [user_approval]");
  lines.push("write_target: Linear Backlog");
  lines.push(`idempotency: ${preflight.idempotencyKey}`);
  return lines.join("\n");
}

export function classifyLocalEvidence(evidence: PreflightEvidence[]): LocalEvidenceState {
  const strongCount = evidence.filter((item) => item.strength === "strong").length;
  const mediumCount = evidence.filter((item) => item.strength === "medium").length;
  const weakCount = evidence.filter((item) => item.strength === "weak").length;

  if (strongCount >= 1 || mediumCount >= 2) {
    return "complete";
  }
  if (mediumCount >= 1 || weakCount >= 2) {
    return "partial";
  }
  return "none";
}

function classifyCandidate(
  candidate: PreflightCandidate,
  localEvidence: LocalEvidenceState,
): ClassifiedPreflightCandidate {
  if (candidate.linearState !== "absent") {
    return {
      ...candidate,
      localEvidence,
      action: "NOOP",
      reason: "MVP는 Linear absent 후보의 create/skip만 다룸",
    };
  }

  if (localEvidence === "complete") {
    return {
      ...candidate,
      localEvidence,
      action: "SKIP",
      reason: "완료 증거가 있어 신규 Linear create를 막음",
    };
  }

  return {
    ...candidate,
    localEvidence,
    action: "CREATE",
    reason: localEvidence === "partial"
      ? "부분 증거만 있어 create 후보로 유지"
      : "완료 증거 없음",
  };
}
