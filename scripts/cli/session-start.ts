import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSessionBrief, type SessionBriefInput } from "../internal/session-brief.ts";
import { loadHookMap } from "../internal/hook-map.ts";
import { getWorkingContext, type WorkingContext, type WorkingCycleContext } from "../internal/linear.ts";
import { slugifyProblemTitle, writeProblemReviewMemo, type ProblemErrorReviewInput } from "../internal/problem-error-review.ts";

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

export function resolveBootError(err: unknown): { title: string; problem: string; cause: string; prevention: string } {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("missing memory/context-map.yaml")) {
    return {
      title: "session-start: context-map.yaml 없음",
      problem: "pokit start가 memory/context-map.yaml을 찾지 못해 부팅을 중단했습니다.",
      cause: "memory/context-map.yaml 파일이 존재하지 않습니다.",
      prevention: "memory/context-map.yaml 파일을 생성하거나 예시 파일을 복사하세요: cp memory/context-map.yaml.example memory/context-map.yaml",
    };
  }

  const missingFile = msg.match(/missing read_order file (.+)/);
  if (missingFile) {
    return {
      title: "session-start: read_order 파일 없음",
      problem: `pokit start가 read_order에 지정된 파일(${missingFile[1]})을 찾지 못해 부팅을 중단했습니다.`,
      cause: `context-map.yaml read_order에 등록된 ${missingFile[1]} 파일이 존재하지 않습니다.`,
      prevention: `해당 파일을 생성하거나 memory/context-map.yaml의 read_order 항목에서 제거하세요.`,
    };
  }

  if (msg.includes("LINEAR_API_KEY") || msg.includes("401") || msg.includes("fetch")) {
    return {
      title: "session-start: Linear API 연결 실패",
      problem: "pokit start가 Linear API에 연결하지 못해 부팅을 중단했습니다.",
      cause: "LINEAR_API_KEY가 없거나 만료됐거나 네트워크 오류입니다.",
      prevention: "LINEAR_API_KEY 환경변수를 확인하고 네트워크 상태를 점검하세요.",
    };
  }

  return {
    title: "session-start: 알 수 없는 오류",
    problem: `pokit start가 예상치 못한 오류로 중단됐습니다: ${msg}`,
    cause: msg,
    prevention: "오류 메시지를 확인하고 관련 설정 파일과 의존성을 점검하세요.",
  };
}

export function renderBootErrorAscii(review: ProblemErrorReviewInput): string {
  return [
    `🚨 pokit:boot FAILED — ${review.title}`,
    `${"─".repeat(50)}`,
    `1) 문제: ${review.problem}`,
    `2) 원인: ${review.cause}`,
    `3) 해결: ${review.prevention}`,
  ].join("\n");
}

async function main(): Promise<void> {
  try {
    const context = await getWorkingContext();
    console.log(buildSessionStart({ context }));
  } catch (err) {
    const review: ProblemErrorReviewInput = {
      ...resolveBootError(err),
      occurredAt: new Date().toISOString().slice(0, 10),
      actor: "pokit start",
      command: "pokit start",
    };
    console.error(renderBootErrorAscii(review));
    const artifactPath = writeProblemReviewMemo({
      rootDir: ".",
      slug: slugifyProblemTitle(review.title),
      review,
    });
    console.error(`\nartifact: ${artifactPath}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
