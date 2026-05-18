import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMemoFile,
  applyFilter,
  buildCreateInput,
  buildUpdateInput,
  determineMode,
} from "../../scripts/cli/backlog-promote.ts";

const SAMPLE_MEMO = `---
id: bl-2026-05-17-100
created: 2026-05-17
status: refined
domain: tooling
size: M
title: "Test Memo Title"
target_version: v0.17.1
promoted_to: null
depends_on:
  - bl-2026-05-17-002
absorbs:
  - some-old-item
---

## AS-IS

테스트 AS-IS 본문.

## TO-BE

테스트 TO-BE 본문.

## 성공 검증

테스트 검증.

## 담당 에이전트

미정.
`;

const UPDATE_MEMO = `---
id: bl-2026-05-17-200
created: 2026-05-17
status: refined
domain: workflow
size: L
title: "Update Test Memo"
target_version: v0.17.2
registration_mode: update
promoted_to: POKIT-192
---

## 본문

업데이트 메모 본문.
`;

test("parseMemoFile: frontmatter + body 분리", () => {
  const memo = parseMemoFile("/test/path", "bl-2026-05-17-100.md", SAMPLE_MEMO);
  assert.equal(memo.frontmatter.id, "bl-2026-05-17-100");
  assert.equal(memo.frontmatter.title, "Test Memo Title");
  assert.equal(memo.frontmatter.status, "refined");
  assert.equal(memo.frontmatter.target_version, "v0.17.1");
  assert.equal(memo.frontmatter.size, "M");
  assert.equal(memo.frontmatter.promoted_to, null);
  assert.deepEqual(memo.frontmatter.depends_on, ["bl-2026-05-17-002"]);
  assert.deepEqual(memo.frontmatter.absorbs, ["some-old-item"]);
  assert.ok(memo.body.includes("## AS-IS"));
  assert.ok(memo.body.includes("## 담당 에이전트"));
});

test("parseMemoFile: 인라인 빈 배열 frontmatter를 배열로 파싱", () => {
  const memo = parseMemoFile("/test/path", "bl-inline-empty.md", `---
id: bl-2026-05-18-001
created: 2026-05-18
status: refined
domain: workflow
title: "Inline Empty Arrays"
target_version: v0.17.5
promoted_to: null
depends_on: []
absorbs: []
---

## AS-IS

테스트.
`);

  assert.deepEqual(memo.frontmatter.depends_on, []);
  assert.deepEqual(memo.frontmatter.absorbs, []);
  assert.doesNotThrow(() => buildCreateInput(memo, "pokit:criteria"));
});

test("parseMemoFile: frontmatter 누락 시 throw", () => {
  assert.throws(
    () => parseMemoFile("/test/path", "bad.md", "no frontmatter here"),
    /missing frontmatter/,
  );
});

test("parseMemoFile: 필수 키 누락 시 throw", () => {
  const bad = `---
title: "no id"
---

본문`;
  assert.throws(
    () => parseMemoFile("/test/path", "bad.md", bad),
    /missing required frontmatter/,
  );
});

test("applyFilter: target_version 필터", () => {
  const memos = [
    parseMemoFile("/p1", "m1.md", SAMPLE_MEMO),
    parseMemoFile("/p2", "m2.md", UPDATE_MEMO),
  ];
  const filtered = applyFilter(memos, { target: "v0.17.1" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].frontmatter.id, "bl-2026-05-17-100");
});

test("applyFilter: status 필터", () => {
  const memos = [parseMemoFile("/p1", "m1.md", SAMPLE_MEMO)];
  const refined = applyFilter(memos, { status: "refined" });
  const promoted = applyFilter(memos, { status: "promoted" });
  assert.equal(refined.length, 1);
  assert.equal(promoted.length, 0);
});

test("applyFilter: id 필터", () => {
  const memos = [
    parseMemoFile("/p1", "m1.md", SAMPLE_MEMO),
    parseMemoFile("/p2", "m2.md", UPDATE_MEMO),
  ];
  const filtered = applyFilter(memos, { ids: ["bl-2026-05-17-200"] });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].frontmatter.id, "bl-2026-05-17-200");
});

// POKIT-205: 기본 필터에서 promoted/dropped 자동 제외
const PROMOTED_MEMO = SAMPLE_MEMO.replace("status: refined", "status: promoted").replace(
  "bl-2026-05-17-100",
  "bl-2026-05-17-300",
);
const DROPPED_MEMO = SAMPLE_MEMO.replace("status: refined", "status: dropped").replace(
  "bl-2026-05-17-100",
  "bl-2026-05-17-301",
);

test("applyFilter: 빈 필터는 promoted/dropped 자동 제외 (중복등록 방지)", () => {
  const memos = [
    parseMemoFile("/p1", "m1.md", SAMPLE_MEMO),
    parseMemoFile("/p2", "m2.md", PROMOTED_MEMO),
    parseMemoFile("/p3", "m3.md", DROPPED_MEMO),
  ];
  const filtered = applyFilter(memos, {});
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].frontmatter.status, "refined");
});

test("applyFilter: --status all 명시 시 promoted/dropped 포함", () => {
  const memos = [
    parseMemoFile("/p1", "m1.md", SAMPLE_MEMO),
    parseMemoFile("/p2", "m2.md", PROMOTED_MEMO),
    parseMemoFile("/p3", "m3.md", DROPPED_MEMO),
  ];
  const filtered = applyFilter(memos, { status: "all" });
  assert.equal(filtered.length, 3);
});

test("applyFilter: ids 명시 시 promoted 도 포함 (사용자 명시 의도)", () => {
  const memos = [
    parseMemoFile("/p1", "m1.md", PROMOTED_MEMO),
  ];
  const filtered = applyFilter(memos, { ids: ["bl-2026-05-17-300"] });
  assert.equal(filtered.length, 1);
});

test("buildCreateInput: title에 target_version 접두사 + footer 포함", () => {
  const memo = parseMemoFile("/p1", "bl-test.md", SAMPLE_MEMO);
  const input = buildCreateInput(memo, "pokit:criteria");
  assert.equal(input.title, "[v0.17.1] Test Memo Title");
  assert.deepEqual(input.labels, ["pokit:criteria"]);
  assert.ok(input.rawDescription?.includes("## AS-IS"));
  assert.ok(input.rawDescription?.includes("**출처**: `bl-test.md`"));
  assert.ok(input.rawDescription?.includes("**target_version**: v0.17.1"));
  assert.ok(input.rawDescription?.includes("**depends_on**: bl-2026-05-17-002"));
});

test("buildUpdateInput: issueIdentifier = promoted_to + descriptionAppend", () => {
  const memo = parseMemoFile("/p1", "bl-test.md", UPDATE_MEMO);
  const input = buildUpdateInput(memo);
  assert.equal(input.issueIdentifier, "POKIT-192");
  assert.ok(input.descriptionAppend?.includes("bl-2026-05-17-200"));
  assert.ok(input.descriptionAppend?.includes("v0.17.2"));
});

test("buildUpdateInput: promoted_to 없으면 throw", () => {
  const memo = parseMemoFile("/p1", "bl-test.md", SAMPLE_MEMO);
  assert.throws(() => buildUpdateInput(memo), /requires promoted_to/);
});

test("determineMode: registration_mode=update면 update", () => {
  const memo = parseMemoFile("/p1", "bl-test.md", UPDATE_MEMO);
  assert.equal(determineMode(memo), "update");
});

test("determineMode: registration_mode 없으면 create (기본)", () => {
  const memo = parseMemoFile("/p1", "bl-test.md", SAMPLE_MEMO);
  assert.equal(determineMode(memo), "create");
});
