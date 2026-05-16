import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSessionBrief, type SessionBriefInput } from "./session-brief.ts";
import { loadHookMap } from "../internal/hook-map.ts";
import { getWorkingContext, type WorkingContext, type WorkingCycleContext } from "../internal/linear.ts";

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
  return [
    brief.trimEnd(),
    "",
    `pokit:boot ok cycle=${cycle.name} hooks=${Object.keys(hooks).length ? "loaded" : "missing"} orchestrator=${orchestratorLoaded ? "loaded" : "missing"} read_order=${contextMap.readOrder.length}`,
    "",
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
    if (!existsSync(join(rootDir, path))) {
      throw new Error(`Session start blocked: missing read_order file ${path}`);
    }
  }
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
