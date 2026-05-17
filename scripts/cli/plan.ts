#!/usr/bin/env node
// POKIT-211 T3 — `./bin/pokit plan <ver>` planning gate CLI.
//
// 사용:
//   ./bin/pokit plan 0.17.4                          # dry-run
//   ./bin/pokit plan 0.17.4 --apply --issues POKIT-206,POKIT-209
//
// 동작:
//   1) parse args
//   2) workflow-state load → target_version ≠ ver 이면 markCycleStart
//   3) carry-over: 직전 release manifest unresolved에서 POKIT-XXX owner 추출
//   4) fresh: Linear Team Backlog Todo 이슈 fetch
//   5) renderPlanTable → stdout
//   6) --apply: 선택 항목 description에 ## 버전 라인 insert (T4에서 wire)

import {
  parsePlanArgs,
  readCarryOverFromManifest,
  renderPlanTable,
  type PlanIssue,
} from "../internal/plan-render.ts";
import {
  loadWorkflowState,
  markCycleStart,
} from "../internal/workflow-state.ts";
import { loadDotEnvOnce } from "../internal/profile.ts";

async function fetchFreshIssues(): Promise<PlanIssue[]> {
  // Linear API 호출. .env 로드 후 LINEAR_API_KEY 없으면 빈 배열.
  loadDotEnvOnce();
  if (!process.env.LINEAR_API_KEY) {
    console.warn("  ⚠ LINEAR_API_KEY 미설정 — fresh 목록 fetch skip");
    return [];
  }
  try {
    const { getWorkingContext } = await import("../internal/linear.ts");
    const ctx = await getWorkingContext();
    const todos = (ctx.backlogIssues ?? []).filter((i: any) =>
      ["Todo", "Backlog"].includes(i.state),
    );
    return todos.map((i: any) => ({
      id: i.identifier,
      title: i.title,
      priority: i.priority ?? undefined,
    }));
  } catch (err: any) {
    console.warn(`  ⚠ Linear fetch 실패: ${err.message}`);
    return [];
  }
}

async function main() {
  let opts;
  try {
    opts = parsePlanArgs(process.argv);
  } catch (err: any) {
    console.error(err.message);
    process.exit(err.exitCode ?? 1);
  }

  console.log(`🎯 pokit plan v${opts.version}${opts.dryRun ? " (dry-run)" : ""}`);

  // [1] workflow-state cycle-start (idempotent)
  const state = loadWorkflowState(opts.rootDir);
  if (state?.target_version !== opts.version) {
    if (state?.target_version && state.target_version !== opts.version) {
      console.log(
        `  ⚠ target_version 전환: ${state.target_version} → ${opts.version}`,
      );
    }
    markCycleStart(opts.rootDir, opts.version);
    console.log(`  ✓ cycle-start: target_version=${opts.version}, state=active`);
  } else {
    console.log(`  ✓ target_version=${opts.version} 이미 active`);
  }

  // [2] carry-over from prev release manifest
  const prevVersion = state?.last_release_version ?? null;
  const carryOverIds = readCarryOverFromManifest(opts.rootDir, prevVersion);
  const carryOver: PlanIssue[] = carryOverIds.map((c) => ({
    id: c.issueId,
    title: c.note.slice(0, 80),
  }));

  // [3] fresh from Linear Team Backlog
  console.log("");
  console.log("📡 Linear fetch 중...");
  const fresh = await fetchFreshIssues();
  // carry-over에 이미 있는 id 제거
  const carrySet = new Set(carryOver.map((c) => c.id));
  const freshFiltered = fresh.filter((f) => !carrySet.has(f.id));

  // [4] render
  console.log("");
  console.log(renderPlanTable(carryOver, freshFiltered, opts.version, prevVersion));

  // [5] apply (T4에서 본격 구현)
  if (opts.apply) {
    console.log("");
    if (opts.issues.length === 0) {
      if (!process.stdin.isTTY) {
        console.error(
          "  ✗ TTY 없음 + --issues 미지정. 비대화형 환경에서는 --issues POKIT-X,POKIT-Y 필수.",
        );
        process.exit(2);
      }
      console.error("  (T4 미구현 — 대화형 prompt 후속 cycle)");
      process.exit(1);
    }
    console.log(`  📝 apply 대상: ${opts.issues.join(", ")}`);
    console.log("  (T4 미구현 — Linear description update wire 후속)");
  } else {
    console.log("");
    console.log("📌 다음 단계:");
    console.log(
      `   ./bin/pokit plan ${opts.version} --apply --issues POKIT-X,POKIT-Y,...`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
