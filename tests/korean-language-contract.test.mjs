import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const USER_FACING_MARKDOWN = [
  "docs/source-registry.md",
  "docs/signal-watch-workflow.md",
  "examples/signal-watch/discovery-brief-sample.md",
  "examples/signal-watch/backlog-candidate-dry-run.md",
];

test("POKit user-facing Markdown artifacts are Korean-first", async () => {
  for (const path of USER_FACING_MARKDOWN) {
    const content = await readFile(path, "utf8");
    const koreanCount = (content.match(/[가-힣]/g) ?? []).length;
    const englishCount = (content.match(/[A-Za-z]/g) ?? []).length;

    assert.match(content, /한국어|목적|흐름|점검|사용자 확인|승인|증거|추천|실제 영향/, path);
    assert.ok(koreanCount > 0, `${path} must contain Korean user-facing copy`);
    assert.ok(koreanCount / Math.max(koreanCount + englishCount, 1) >= 0.2, `${path} must be Korean-first enough for user review`);
  }
});
