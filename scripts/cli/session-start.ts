import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSessionBrief, type SessionBriefInput } from "./session-brief.ts";
import { loadHookMap } from "../internal/hook-map.ts";
import { getWorkingContext, type WorkingContext, type WorkingCycleContext } from "../internal/linear.ts";
import { findOpenCycleManifest } from "../internal/manifest-lookup.ts";
import { loadBacklogRawSummaries, renderPendingRawLines } from "../internal/backlog-raw-collector.ts";
import { markSessionStart } from "../internal/workflow-state.ts";
import { getActiveProfile } from "../internal/profile.ts";

export type SessionStartInput = SessionBriefInput & {
  rootDir?: string;
};

type ContextMap = {
  readOrder: string[];
};

const ORCHESTRATOR_REQUIRED_READ_ORDER = [
  "docs/architecture/01-document-roles.md",
  "docs/architecture/11-visualization-and-incident-response.md",
];

export function buildSessionStart(input: SessionStartInput): string {
  const rootDir = input.rootDir ?? ".";
  const contextMap = readContextMap(rootDir);
  validateReadOrder(rootDir, contextMap.readOrder);
  const orchestratorLoaded = validateOrchestratorReadOrder(contextMap.readOrder);
  const hooks = loadHookMap(join(rootDir, "workflows/hooks.yaml"));
  const brief = buildSessionBrief({ ...input, variant: "start" });
  const cycle = resolveCycle(input.context);
  const openCycle = findOpenCycleManifest(rootDir);
  const manifestLine = openCycle
    ? `- Cycle manifest: ${openCycle.cycle_name}${openCycle.release_version ? ` · ${openCycle.release_version}` : ""} · ${openCycle.included_issue_ids.length}개 이슈`
    : null;
  // POKIT-194: raw 백로그 정리/승격 대기 노출
  const rawSummaries = loadBacklogRawSummaries(rootDir);
  const pendingRawLines = renderPendingRawLines(rawSummaries);
  // POKIT-182: workflow-state.yaml 자동 갱신 (best-effort, fail-silent)
  try { markSessionStart(rootDir); } catch { /* ignore */ }
  return [
    brief.trimEnd(),
    ...(manifestLine ? [manifestLine] : []),
    ...pendingRawLines,
    "",
    `pokit:boot ok cycle=${cycle.name} hooks=${Object.keys(hooks).length ? "loaded" : "missing"} orchestrator=${orchestratorLoaded ? "loaded" : "missing"} read_order=${contextMap.readOrder.length} linear=api-key backlog_raw=${rawSummaries.length}`,
    "",
    "<!-- AGENT: output above verbatim, no summary, no interpretation -->",
  ].join("\n");
}

function resolveCycle(context: WorkingCycleContext | WorkingContext): WorkingCycleContext["cycle"] {
  if ("cycle" in context) {
    return context.cycle;
  }
  return context.selected.cycle;
}

function readContextMap(rootDir: string): ContextMap {
  const path = join(rootDir, "memory/context-map.yaml");
  if (!existsSync(path)) {
    throw new Error("Session start blocked: missing memory/context-map.yaml");
  }
  const content = readFileSync(path, "utf8");
  return {
    readOrder: readYamlStringList(content, "read_order"),
  };
}

function validateReadOrder(rootDir: string, readOrder: string[]): void {
  for (const path of readOrder) {
    if (!existsReadOrderPath(rootDir, path)) {
      throw new Error(`Session start blocked: missing read_order file ${path}`);
    }
  }
}

function existsReadOrderPath(rootDir: string, path: string): boolean {
  if (existsSync(join(rootDir, path))) {
    return true;
  }
  const profilePath = resolveProfileMemoryReadOrderPath(rootDir, path);
  return profilePath ? existsSync(join(rootDir, profilePath)) : false;
}

function resolveProfileMemoryReadOrderPath(rootDir: string, path: string): string | null {
  if (!path.startsWith("memory/")) {
    return null;
  }
  return join(getActiveProfile(rootDir).memoryDir, path.slice("memory/".length));
}

function validateOrchestratorReadOrder(readOrder: string[]): boolean {
  return ORCHESTRATOR_REQUIRED_READ_ORDER.every((path) => readOrder.includes(path));
}

function readYamlStringList(content: string, key: string): string[] {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start < 0) {
    return [];
  }
  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) {
      break;
    }
    const match = line.match(/^\s*-\s+(.+)$/);
    if (match) {
      values.push(match[1].trim());
    }
  }
  return values;
}

export async function main(): Promise<void> {
  const context = await getWorkingContext();
  console.log(buildSessionStart({ context }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
