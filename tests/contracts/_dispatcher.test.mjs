// tests/contracts/_dispatcher.test.mjs
// Contract test dispatcher — 모든 contract 테스트를 단일 진입점으로 실행
// Usage: node --experimental-strip-types --test tests/contracts/_dispatcher.test.mjs
//
// 이 파일은 개별 contract 파일을 import하는 대신
// node --test runner가 glob으로 실행하는 방식을 사용합니다.
// CI에서는 `npm run test:contracts`로 실행하세요.

import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("contracts/ 카테고리 구조 확인", () => {
  const files = readdirSync(__dirname).filter(
    (f) => f.endsWith(".test.mjs") && !f.startsWith("_"),
  );

  assert.ok(files.length >= 10, `contract 파일이 10개 이상이어야 함. 현재: ${files.length}개`);

  const contractFiles = [
    "agent-rules.test.mjs",
    "archive-guardrail.test.mjs",
    "artifact-frontmatter-contract.test.mjs",
    "backlog-memo-format-contract.test.mjs",
    "dry-run-format-contract.test.mjs",
    "external-write-guard.test.mjs",
    "folder-layout-contract.test.mjs",
    "hooks-contract.test.mjs",
    "korean-language-contract.test.mjs",
    "subagent-payload-check.test.mjs",
  ];

  for (const expected of contractFiles) {
    assert.ok(
      files.includes(expected),
      `필수 contract 파일 누락: ${expected}`,
    );
  }
});

test("contracts/ 파일이 tests/ 루트에 없어야 함 (중복 차단)", () => {
  const testsRoot = join(__dirname, "..");
  const rootFiles = readdirSync(testsRoot).filter((f) => f.endsWith(".test.mjs"));

  assert.equal(
    rootFiles.length,
    0,
    `tests/ 루트에 .test.mjs 파일이 없어야 함. 발견: ${rootFiles.join(", ")}`,
  );
});
