#!/usr/bin/env node
// POKIT-205 T3 — `./bin/pokit advance <step> [--issue ID]`
//
// 단계 advance (명시 명령). Edit/Write 이벤트 트리거 금지 — 게이트 회로 단락 회피.
//
// 사용:
//   ./bin/pokit advance idea --issue POKIT-205
//   ./bin/pokit advance linear --issue POKIT-205
//   ./bin/pokit advance build
//   ./bin/pokit advance 5             # internal step
//   ./bin/pokit advance --reset       # idle 복귀
//   ./bin/pokit advance               # 현재 상태 출력만

import { advanceFlow, resetFlow, getFlowState, DISPLAY_STEPS } from "../internal/flow-state.ts";
import { renderFlowProgress } from "./cycle-progress.ts";

const args = process.argv.slice(2);

function usage(): never {
  console.error(
    [
      "usage: pokit advance <step> [--issue POKIT-XXX]",
      "       pokit advance --reset",
      "",
      "<step>: idea | linear | build | test | release | 1..10 (internal)",
    ].join("\n"),
  );
  process.exit(2);
}

function findArg(name: string): string | undefined {
  const i = args.findIndex((a) => a === name);
  if (i < 0) return undefined;
  return args[i + 1];
}

const wantReset = args.includes("--reset");
const issue = findArg("--issue");
const stepArg = args.find((a) => !a.startsWith("--") && a !== "--reset");

try {
  if (wantReset) {
    const r = resetFlow();
    console.log("✓ flow reset → idle");
    console.log(renderFlowProgress(r).join("\n"));
    process.exit(0);
  }

  if (!stepArg) {
    // 현재 상태만 출력
    const s = getFlowState();
    console.log(renderFlowProgress(s).join("\n"));
    process.exit(0);
  }

  let result;
  if (/^\d+$/.test(stepArg)) {
    const n = Number(stepArg);
    if (n < 1 || n > 10) {
      console.error(`error: internal step out of range (1-10): ${n}`);
      process.exit(2);
    }
    result = advanceFlow({ kind: "internal", step: n, issue });
  } else {
    const id = stepArg.toLowerCase();
    const known = DISPLAY_STEPS.find((s) => s.id === id);
    if (!known) {
      console.error(`error: unknown step '${stepArg}'`);
      usage();
    }
    result = advanceFlow({ kind: "display", step: id as any, issue });
  }

  console.log(`✓ advance → ${result.displayLabel} (internal ${result.internalStep})${result.issue ? ` · ${result.issue}` : ""}`);
  console.log(renderFlowProgress(result).join("\n"));
} catch (err: any) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
