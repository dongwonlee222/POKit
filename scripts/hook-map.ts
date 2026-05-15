import { readFileSync } from "node:fs";

export type HookEnforcement = "policy" | "script" | "ci-required";
export type HookGateSeverity = "blocker" | "warning";

export type HookGate = {
  id: string;
  severity: HookGateSeverity;
  requires: string[];
};

export type HookDefinition = {
  name: string;
  steps: string[];
  enforcement: HookEnforcement;
  runner?: string;
  gates: HookGate[];
};

export type HookMap = Record<string, HookDefinition>;

export function loadHookMap(path = "workflows/hooks.yaml"): HookMap {
  return parseHookMap(readFileSync(path, "utf8"));
}

export function parseHookMap(content: string): HookMap {
  const hooks: HookMap = {};
  let currentHook: HookDefinition | null = null;
  let currentGate: HookGate | null = null;
  let inGates = false;
  let inRequires = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#") || line.trim() === "hooks:") {
      continue;
    }

    const hookMatch = line.match(/^  ([a-z_]+):$/);
    if (hookMatch) {
      currentHook = {
        name: hookMatch[1],
        steps: [],
        enforcement: "policy",
        gates: [],
      };
      hooks[currentHook.name] = currentHook;
      currentGate = null;
      inGates = false;
      inRequires = false;
      continue;
    }

    if (!currentHook) {
      continue;
    }

    const stepMatch = line.match(/^    - ([a-z0-9_/-]+)$/i);
    if (stepMatch && !inGates) {
      currentHook.steps.push(stepMatch[1]);
      continue;
    }

    const enforcementMatch = line.match(/^    enforcement:\s*(policy|script|ci-required)$/);
    if (enforcementMatch) {
      currentHook.enforcement = enforcementMatch[1] as HookEnforcement;
      continue;
    }

    const runnerMatch = line.match(/^    runner:\s*(.+)$/);
    if (runnerMatch) {
      currentHook.runner = runnerMatch[1].trim();
      continue;
    }

    if (line.match(/^    gates:$/)) {
      inGates = true;
      inRequires = false;
      continue;
    }

    const gateMatch = line.match(/^      - id:\s*([a-z0-9_-]+)$/i);
    if (gateMatch && inGates) {
      currentGate = {
        id: gateMatch[1],
        severity: "blocker",
        requires: [],
      };
      currentHook.gates.push(currentGate);
      inRequires = false;
      continue;
    }

    if (!currentGate) {
      continue;
    }

    const severityMatch = line.match(/^        severity:\s*(blocker|warning)$/);
    if (severityMatch) {
      currentGate.severity = severityMatch[1] as HookGateSeverity;
      continue;
    }

    if (line.match(/^        requires:$/)) {
      inRequires = true;
      continue;
    }

    const requireMatch = line.match(/^          - ([a-z0-9_-]+)$/i);
    if (requireMatch && inRequires) {
      currentGate.requires.push(requireMatch[1]);
    }
  }

  return hooks;
}

export function renderHookMap(map: HookMap): string {
  const lines = [
    "# POKit Hook Map",
    "",
    "읽는 법",
    "- policy: 규칙은 있지만 자동 실행은 아님",
    "- script: 강제됨; 연결된 script가 실제로 검사함",
    "- ci-required: CI required check로 막음",
    "",
  ];

  for (const hook of Object.values(map)) {
    lines.push(`[${hook.name}] ${hookDescription(hook.name)}`);
    lines.push(`  enforcement: ${hook.enforcement}${hook.enforcement === "script" ? " (강제됨)" : ""}`);
    if (hook.runner) {
      lines.push(`  runner: ${hook.runner}`);
    }
    if (hook.gates.length) {
      lines.push("  gates:");
      for (const gate of hook.gates) {
        const requires = gate.requires.length ? ` requires: ${gate.requires.join(", ")}` : "";
        lines.push(`    - ${gate.id} [${gate.severity}] ${gateDescription(gate.id)}${requires}`);
      }
    } else {
      lines.push("  steps:");
      for (const step of hook.steps) {
        lines.push(`    - ${step}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function hookDescription(name: string): string {
  const descriptions: Record<string, string> = {
    session_start: "세션 시작 브리프",
    preflight_labels: "Linear label 쓰기 전 확인",
    before_each_issue: "각 이슈 처리 전 맥락 확인",
    before_implementation: "durable file 변경 전 Cycle 귀속 확인",
    after_artifact: "산출물 생성 후 품질 확인",
    before_user_facing_artifact: "사용자-facing 문서 작성 전 확인",
    before_external_write: "Linear/GitHub write 전 승인 경계",
    before_public_release: "release 전 필수 점검",
    after_run: "실행 후 로컬 handoff 갱신",
    after_completion_report: "완료 보고 품질 확인",
    after_cycle_complete: "Cycle 완전 완료 후 마무리",
    on_error: "오류 발생 시 Problem/Error Review 출력과 메모 작성",
  };
  return descriptions[name] ?? "";
}

function gateDescription(id: string): string {
  const descriptions: Record<string, string> = {
    release_md_audit: "release 문서와 changelog 확인",
    public_safety_scan: "private Linear/메모리 정보 유출 방지",
    full_tests: "전체 테스트",
    git_diff_check: "diff whitespace 오류 확인",
    git_status_check: "현재 branch와 미배포 커밋 확인",
    ignored_evidence_scan: "release에 안 들어가는 artifact만 증거로 삼는지 확인",
  };
  return descriptions[id] ?? "";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(renderHookMap(loadHookMap()));
}
