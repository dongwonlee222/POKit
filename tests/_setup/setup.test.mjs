import test from "node:test";
import assert from "node:assert/strict";
import { mkTempDir, writeFixture, repoPath, writeBacklogMemo, readUtf8 }
  from "./index.mjs";
import { join } from "node:path";
import { existsSync } from "node:fs";

test("mkTempDir: 임시 디렉토리 생성 + prefix 적용", () => {
  const dir = mkTempDir("p202-");
  assert.ok(existsSync(dir));
  assert.ok(dir.includes("p202-"));
});

test("writeFixture: 디렉토리 자동 생성 + 내용 작성", () => {
  const dir = mkTempDir();
  const path = writeFixture(join(dir, "nested/path/file.txt"), "hello");
  assert.equal(readUtf8(path), "hello");
});

test("repoPath: repo 루트 기준 절대 경로 반환", () => {
  const path = repoPath("scripts/internal/linear.ts");
  assert.ok(existsSync(path), `repo path should exist: ${path}`);
});

test("writeBacklogMemo: frontmatter + body 작성", () => {
  const dir = mkTempDir();
  const path = writeBacklogMemo(dir, "bl-test.md", {
    id: "bl-test-001",
    title: '"test memo"',
    status: "raw",
    created: "2026-05-18",
  });
  const content = readUtf8(path);
  assert.ok(content.includes("id: bl-test-001"));
  assert.ok(content.includes("## AS-IS"));
});
