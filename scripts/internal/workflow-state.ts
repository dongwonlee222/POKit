/**
 * POKIT-182: workflow-state.yaml — cycle 상태 단일 source.
 *
 * memory/workflow-state.yaml 에 현재 cycle/version/active issues 를
 * 단일 위치에 저장. pokit start / brief / release dispatcher 가 모두 참조.
 *
 * 자동 갱신:
 * - session-start: 진입 시 last_session_at 갱신
 * - session-close: closed_at + completed/pending 갱신
 * - release: target_version 변경 + state 'releasing' 전환
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export type WorkflowStateKind = "active" | "releasing" | "idle";

export type WorkflowState = {
  schema_version: 1;
  /** 현재 cycle id (Linear cycle UUID 또는 "Team Backlog") */
  current_cycle_id: string | null;
  /** 현재 cycle 이름 */
  current_cycle_name: string | null;
  /** 다음 release target version (예: "v0.17.2") */
  target_version: string | null;
  /** 마지막 release 버전 */
  last_release_version: string | null;
  /** 운영 상태 */
  state: WorkflowStateKind;
  /** 마지막 갱신 시각 (ISO) */
  updated_at: string;
  /** 마지막 세션 시작 시각 */
  last_session_at?: string;
  /** 마지막 세션 종료 시각 */
  last_session_closed_at?: string;
  /** active issue id 목록 (cycle 안) */
  active_issue_ids?: string[];
  /** POKIT-205: 내부 10단계 현재 위치 (1-10) */
  flow_step_internal?: number;
  /** POKIT-205: display 5단계 현재 위치 (1-5) — flow_step_internal 에서 자동 계산 */
  flow_step_display?: number;
  /** POKIT-205: 현재 작업 중인 Linear issue id (예: "POKIT-205") */
  flow_issue?: string | null;
};

const WORKFLOW_STATE_PATH = "memory/workflow-state.yaml";

export function workflowStatePath(rootDir = process.cwd()): string {
  return join(rootDir, WORKFLOW_STATE_PATH);
}

export function renderWorkflowState(state: WorkflowState): string {
  const lines: string[] = [
    "---",
    "kind: workflow-state",
    `schema_version: ${state.schema_version}`,
    "---",
    `current_cycle_id: ${yamlScalar(state.current_cycle_id)}`,
    `current_cycle_name: ${yamlScalar(state.current_cycle_name)}`,
    `target_version: ${yamlScalar(state.target_version)}`,
    `last_release_version: ${yamlScalar(state.last_release_version)}`,
    `state: ${state.state}`,
    `updated_at: "${state.updated_at}"`,
  ];
  if (state.last_session_at) lines.push(`last_session_at: "${state.last_session_at}"`);
  if (state.last_session_closed_at) {
    lines.push(`last_session_closed_at: "${state.last_session_closed_at}"`);
  }
  if (state.active_issue_ids && state.active_issue_ids.length > 0) {
    lines.push("active_issue_ids:");
    for (const id of state.active_issue_ids) {
      lines.push(`  - ${id}`);
    }
  }
  if (state.flow_step_internal !== undefined) {
    lines.push(`flow_step_internal: ${state.flow_step_internal}`);
  }
  if (state.flow_step_display !== undefined) {
    lines.push(`flow_step_display: ${state.flow_step_display}`);
  }
  if (state.flow_issue !== undefined && state.flow_issue !== null) {
    lines.push(`flow_issue: ${yamlScalar(state.flow_issue)}`);
  }
  return lines.join("\n") + "\n";
}

function yamlScalar(value: string | null): string {
  if (value === null) return "null";
  if (/^[A-Za-z][A-Za-z0-9._-]*$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

export function parseWorkflowState(raw: string): WorkflowState {
  const lines = raw.split(/\r?\n/);
  const out: Partial<WorkflowState> = { schema_version: 1, state: "idle" };
  let inActiveIds = false;
  const activeIds: string[] = [];
  for (const line of lines) {
    if (inActiveIds) {
      const m = line.match(/^\s+-\s+(.+)$/);
      if (m) {
        activeIds.push(m[1].trim());
        continue;
      } else if (line.trim() === "") {
        continue;
      } else {
        inActiveIds = false;
      }
    }
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rest] = m;
    const value = rest.trim().replace(/^"(.*)"$/, "$1");
    switch (key) {
      case "current_cycle_id":
      case "current_cycle_name":
      case "target_version":
      case "last_release_version":
        (out as any)[key] = value === "null" || value === "" ? null : value;
        break;
      case "state":
        (out as any)[key] = (value as WorkflowStateKind) || "idle";
        break;
      case "updated_at":
      case "last_session_at":
      case "last_session_closed_at":
        (out as any)[key] = value;
        break;
      case "active_issue_ids":
        inActiveIds = true;
        break;
      case "schema_version":
        out.schema_version = Number(value) as 1;
        break;
      case "flow_step_internal":
      case "flow_step_display":
        (out as any)[key] = value === "" || value === "null" ? undefined : Number(value);
        break;
      case "flow_issue":
        (out as any)[key] = value === "null" || value === "" ? null : value;
        break;
    }
  }
  if (activeIds.length > 0) out.active_issue_ids = activeIds;
  if (out.updated_at === undefined) out.updated_at = new Date().toISOString();
  return out as WorkflowState;
}

export function loadWorkflowState(rootDir = process.cwd()): WorkflowState | null {
  const p = workflowStatePath(rootDir);
  if (!existsSync(p)) return null;
  return parseWorkflowState(readFileSync(p, "utf8"));
}

export function saveWorkflowState(state: WorkflowState, rootDir = process.cwd()): string {
  const p = workflowStatePath(rootDir);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, renderWorkflowState(state), "utf8");
  return p;
}

/** session-start 시 호출: last_session_at 갱신 + state='active'. */
export function markSessionStart(rootDir = process.cwd(), now: Date = new Date()): WorkflowState {
  const existing = loadWorkflowState(rootDir);
  const next: WorkflowState = {
    schema_version: 1,
    current_cycle_id: existing?.current_cycle_id ?? null,
    current_cycle_name: existing?.current_cycle_name ?? null,
    target_version: existing?.target_version ?? null,
    last_release_version: existing?.last_release_version ?? null,
    state: "active",
    updated_at: now.toISOString(),
    last_session_at: now.toISOString(),
    last_session_closed_at: existing?.last_session_closed_at,
    active_issue_ids: existing?.active_issue_ids,
    flow_step_internal: existing?.flow_step_internal,
    flow_step_display: existing?.flow_step_display,
    flow_issue: existing?.flow_issue,
  };
  saveWorkflowState(next, rootDir);
  return next;
}

/** session-close 시 호출: last_session_closed_at 갱신. */
export function markSessionClose(rootDir = process.cwd(), now: Date = new Date()): WorkflowState {
  const existing = loadWorkflowState(rootDir);
  if (!existing) {
    return markSessionStart(rootDir, now);
  }
  const next: WorkflowState = {
    ...existing,
    state: "idle",
    updated_at: now.toISOString(),
    last_session_closed_at: now.toISOString(),
  };
  saveWorkflowState(next, rootDir);
  return next;
}

/** release 진입 시 호출: state='releasing' + target_version 갱신. */
/** cycle 진입 시 호출: target_version 설정 + state='active'. */
export function markCycleStart(
  rootDir: string,
  targetVersion: string,
  now: Date = new Date(),
): WorkflowState {
  const existing = loadWorkflowState(rootDir);
  const next: WorkflowState = {
    schema_version: 1,
    current_cycle_id: existing?.current_cycle_id ?? null,
    current_cycle_name: existing?.current_cycle_name ?? null,
    target_version: targetVersion,
    last_release_version: existing?.last_release_version ?? null,
    state: "active",
    updated_at: now.toISOString(),
    last_session_at: existing?.last_session_at,
    last_session_closed_at: existing?.last_session_closed_at,
    active_issue_ids: existing?.active_issue_ids,
  };
  saveWorkflowState(next, rootDir);
  return next;
}

export function markReleaseStart(
  rootDir: string,
  targetVersion: string,
  now: Date = new Date(),
): WorkflowState {
  const existing = loadWorkflowState(rootDir);
  const next: WorkflowState = {
    schema_version: 1,
    current_cycle_id: existing?.current_cycle_id ?? null,
    current_cycle_name: existing?.current_cycle_name ?? null,
    target_version: targetVersion,
    last_release_version: existing?.last_release_version ?? null,
    state: "releasing",
    updated_at: now.toISOString(),
    last_session_at: existing?.last_session_at,
    last_session_closed_at: existing?.last_session_closed_at,
    active_issue_ids: existing?.active_issue_ids,
  };
  saveWorkflowState(next, rootDir);
  return next;
}

/** release 완료 시 호출: last_release_version 갱신 + state='idle'. */
export function markReleaseComplete(
  rootDir: string,
  releasedVersion: string,
  now: Date = new Date(),
): WorkflowState {
  const existing = loadWorkflowState(rootDir);
  const next: WorkflowState = {
    schema_version: 1,
    current_cycle_id: existing?.current_cycle_id ?? null,
    current_cycle_name: existing?.current_cycle_name ?? null,
    target_version: null,
    last_release_version: releasedVersion,
    state: "idle",
    updated_at: now.toISOString(),
    last_session_at: existing?.last_session_at,
    last_session_closed_at: existing?.last_session_closed_at,
    active_issue_ids: existing?.active_issue_ids,
  };
  saveWorkflowState(next, rootDir);
  return next;
}
