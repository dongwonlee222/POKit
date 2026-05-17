import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadBacklogRawSummaries,
  filterPendingRaw,
  filterCreatedOn,
  renderPendingRawLines,
  renderTodayRawLines,
} from "../../scripts/internal/backlog-raw-collector.ts";

function setupTempBacklog() {
  const root = mkdtempSync(join(tmpdir(), "blraw-test-"));
  mkdirSync(join(root, "memory/backlog-raw"), { recursive: true });
  return root;
}

function writeMemo(root, filename, frontmatter) {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${v === null ? "null" : v}`)
    .join("\n");
  writeFileSync(
    join(root, "memory/backlog-raw", filename),
    `---\n${fm}\n---\n\n## AS-IS\n본문\n`,
    "utf8",
  );
}

test("loadBacklogRawSummaries: 비어있는 디렉토리 = []", () => {
  const root = setupTempBacklog();
  assert.deepEqual(loadBacklogRawSummaries(root), []);
});

test("loadBacklogRawSummaries: 디렉토리 자체가 없으면 = []", () => {
  const root = mkdtempSync(join(tmpdir(), "blraw-noexist-"));
  assert.deepEqual(loadBacklogRawSummaries(root), []);
});

test("loadBacklogRawSummaries: bl-*.md 파일만 읽음, id 순 정렬", () => {
  const root = setupTempBacklog();
  writeMemo(root, "bl-2026-05-17-002-b.md", {
    id: "bl-2026-05-17-002",
    created: "2026-05-17",
    status: "refined",
    title: '"B title"',
    target_version: "v0.17.1",
  });
  writeMemo(root, "bl-2026-05-17-001-a.md", {
    id: "bl-2026-05-17-001",
    created: "2026-05-17",
    status: "raw",
    title: '"A title"',
    target_version: null,
  });
  writeMemo(root, "README.md", { id: "skip-me", created: "x", status: "x", title: '"x"' });

  const summaries = loadBacklogRawSummaries(root);
  assert.equal(summaries.length, 2);
  assert.equal(summaries[0].id, "bl-2026-05-17-001");
  assert.equal(summaries[1].id, "bl-2026-05-17-002");
  assert.equal(summaries[0].target_version, null);
  assert.equal(summaries[1].target_version, "v0.17.1");
});

test("filterPendingRaw: status raw + refined만", () => {
  const summaries = [
    { id: "1", status: "raw", filename: "", title: "", created: "", target_version: null, promoted_to: null },
    { id: "2", status: "refined", filename: "", title: "", created: "", target_version: null, promoted_to: null },
    { id: "3", status: "promoted", filename: "", title: "", created: "", target_version: null, promoted_to: "POKIT-1" },
    { id: "4", status: "dropped", filename: "", title: "", created: "", target_version: null, promoted_to: null },
  ];
  const pending = filterPendingRaw(summaries);
  assert.equal(pending.length, 2);
  assert.deepEqual(pending.map((s) => s.id), ["1", "2"]);
});

test("filterCreatedOn: 지정 날짜만", () => {
  const summaries = [
    { id: "1", status: "raw", filename: "", title: "", created: "2026-05-17", target_version: null, promoted_to: null },
    { id: "2", status: "raw", filename: "", title: "", created: "2026-05-18", target_version: null, promoted_to: null },
    { id: "3", status: "raw", filename: "", title: "", created: "2026-05-17", target_version: null, promoted_to: null },
  ];
  const today = filterCreatedOn(summaries, "2026-05-17");
  assert.equal(today.length, 2);
  assert.deepEqual(today.map((s) => s.id), ["1", "3"]);
});

test("renderPendingRawLines: pending 0이면 빈 배열", () => {
  const lines = renderPendingRawLines([]);
  assert.deepEqual(lines, []);
});

test("renderPendingRawLines: pending N건 헤더 + 항목 행", () => {
  const summaries = [
    {
      id: "bl-X",
      status: "refined",
      filename: "bl-X.md",
      title: "test",
      created: "2026-05-17",
      target_version: "v0.17.1",
      promoted_to: null,
    },
  ];
  const lines = renderPendingRawLines(summaries);
  assert.ok(lines.some((l) => l.includes("📝 raw 백로그")));
  assert.ok(lines.some((l) => l.includes("bl-X") && l.includes("v0.17.1")));
});

test("renderTodayRawLines: 오늘 날짜 항목 노출, promoted_to 표시", () => {
  const summaries = [
    {
      id: "bl-Y",
      status: "promoted",
      filename: "bl-Y.md",
      title: "today item",
      created: "2026-05-17",
      target_version: "v0.17.1",
      promoted_to: "POKIT-200",
    },
    {
      id: "bl-Z",
      status: "raw",
      filename: "bl-Z.md",
      title: "other day",
      created: "2026-05-16",
      target_version: null,
      promoted_to: null,
    },
  ];
  const lines = renderTodayRawLines(summaries, "2026-05-17");
  assert.ok(lines.some((l) => l.includes("이번 세션이 만든 raw")));
  assert.ok(lines.some((l) => l.includes("bl-Y") && l.includes("→ POKIT-200")));
  assert.ok(!lines.some((l) => l.includes("bl-Z")), "다른 날짜 항목 미노출");
});
