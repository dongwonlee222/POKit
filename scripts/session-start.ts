import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSessionBrief, type SessionBriefInput } from "./session-brief.ts";
import { loadHookMap } from "./hook-map.ts";
import { getWorkingContext, type WorkingContext, type WorkingCycleContext } from "./linear.ts";

export type SessionStartInput = SessionBriefInput & {
  rootDir?: string;
};

type ContextMap = {
  readOrder: string[];
};

export function buildSessionStart(input: SessionStartInput): string {
  const rootDir = input.rootDir ?? ".";
  const contextMap = readContextMap(rootDir);
  validateReadOrder(rootDir, contextMap.readOrder);
  const hooks = loadHookMap(join(rootDir, "workflows/hooks.yaml"));
  const brief = buildSessionBrief(input);
  const cycle = resolveCycle(input.context);
  return [
    brief.trimEnd(),
    "",
    `pokit:boot ok cycle=${cycle.name} hooks=${Object.keys(hooks).length ? "loaded" : "missing"} read_order=${contextMap.readOrder.length}`,
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

async function main(): Promise<void> {
  const context = await getWorkingContext();
  console.log(buildSessionStart({ context }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
