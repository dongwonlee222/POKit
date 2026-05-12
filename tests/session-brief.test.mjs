import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadBriefModule() {
  return import(`../scripts/session-brief.ts?cacheBust=${Date.now()}`);
}

test("buildSessionBrief renders compact dashboard with nudge", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-brief-"));
  await mkdir(join(tempDir, "artifacts/sprints/Cycle-1"), { recursive: true });
  await writeFile(join(tempDir, "artifacts/sprints/Cycle-1/2026-05-12-run-summary.md"), "summary");
  await writeFile(join(tempDir, "artifacts/sprints/Cycle-1/retro.md"), "retro");
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-12T09:00:00+09:00"),
    rootDir: tempDir,
    context: {
      source: "linear_active",
      cycle: { id: "cycle-1", name: "Cycle 1" },
      issues: [
        { id: "issue-21", identifier: "EVM-21", title: "Team optional", description: "env", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-25", identifier: "EVM-25", title: "Brief", description: "dashboard", labels: ["pokit:prd"], state: "In Progress" },
        { id: "issue-20", identifier: "EVM-20", title: "LLM-first", description: "docs", labels: ["pokit:criteria"], state: "Todo" },
        { id: "issue-19", identifier: "EVM-19", title: "Release", description: "done", labels: ["pokit:prd"], state: "Done" },
        { id: "issue-18", identifier: "EVM-18", title: "Clean check", description: "done", labels: ["pokit:criteria"], state: "Done" },
        { id: "issue-unlabeled", identifier: "EVM-26", title: "No label", description: "needs label", labels: [], state: "Todo" },
      ],
    },
  });

  assert.match(brief, /# POKit Brief/);
  assert.match(brief, /📌 현재: Todo 3 · 진행 1 · 완료 2/);
  assert.match(brief, /⚠️ 주의: 라벨 필요 1 · 확인 필요 0 · 승인 대기 1/);
  assert.match(brief, /🧺 다음 후보: EVM-20, EVM-21, EVM-26/);
  assert.match(brief, /💬 실행: “다음 cycle에 EVM-20, EVM-21, EVM-26 담고 POKit 돌려줘”/);
  assert.match(brief, /✅ 최근 완료: EVM-19, EVM-18/);
  assert.match(brief, /Run Summary: artifacts\/sprints\/Cycle-1\/2026-05-12-run-summary\.md/);
  assert.match(brief, /Retro: artifacts\/sprints\/Cycle-1\/retro\.md/);
});
