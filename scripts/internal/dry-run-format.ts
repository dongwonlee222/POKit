/**
 * dry-run-format.ts — 공통 dry-run 출력 헬퍼
 *
 * 모든 dry-run plan 출력을 3섹션(대상/변경/승인) 형식으로 통일한다.
 * 순수 함수 — I/O 없음, 외부 의존성 없음.
 */

export type DryRunTarget = {
  kind: "create-issue" | "update-issue" | "close-cycle" | "release" | "artifact-sync" | string;
  identifier: string;
  currentState?: string;
};

export type DryRunChange = {
  body: string; // kind별 표준 본문 (markdown)
};

export type DryRunApproval = {
  idempotencyKey: string;
  expectedImpact: string;
  rollback: "auto" | "manual" | "impossible";
  rollbackGuide?: string;
};

/**
 * 3섹션 dry-run plan 문자열을 렌더링한다.
 *
 * @throws {Error} change.body 가 비어 있거나 공백만 있을 때
 * @throws {Error} rollback === "manual" 인데 rollbackGuide 가 없을 때
 */
export function renderDryRunPlan(
  target: DryRunTarget,
  change: DryRunChange,
  approval: DryRunApproval,
): string {
  if (!change.body || change.body.trim().length === 0) {
    throw new Error("DryRunChange.body 가 비어 있습니다. 변경 내용을 반드시 기술하세요.");
  }

  if (approval.rollback === "manual" && !approval.rollbackGuide) {
    throw new Error(
      "rollback === 'manual' 일 때 rollbackGuide 가 필요합니다.",
    );
  }

  const stateSection = target.currentState
    ? `- 현재 상태: ${target.currentState}`
    : `- 현재 상태: (미조회)`;

  const rollbackSection = buildRollbackLine(approval);

  return [
    `[dry-run plan]`,
    ``,
    `## 1. 대상 (Target)`,
    `- 종류: ${target.kind}`,
    `- 식별자: ${target.identifier}`,
    stateSection,
    ``,
    `## 2. 변경 (Change)`,
    change.body.trimEnd(),
    ``,
    `## 3. 승인 (Approval)`,
    `- idempotencyKey: ${approval.idempotencyKey}`,
    `- 예상 영향: ${approval.expectedImpact}`,
    rollbackSection,
    ``,
    `▶ 진행하시려면 'y' 또는 '진행', 수정하시려면 발화.`,
  ].join("\n");
}

function buildRollbackLine(approval: DryRunApproval): string {
  switch (approval.rollback) {
    case "auto":
      return `- 되돌리기: auto`;
    case "manual":
      return `- 되돌리기: manual (${approval.rollbackGuide})`;
    case "impossible":
      return `- 되돌리기: impossible`;
    default: {
      const _exhaustive: never = approval.rollback;
      return `- 되돌리기: ${_exhaustive}`;
    }
  }
}
