import assert from "node:assert/strict";
import test from "node:test";

// POKIT-211 T5 — pokit start 🎯 라인 회귀 테스트.
// description에 ## 버전 라인 있는 이슈 카운트 + carry-over/fresh 분리.

const { readVersionLine } = await import(
  "../../scripts/internal/version-line.ts"
);

test("readVersionLine: ## 목표 헤딩 description (POKIT-159 패턴)", () => {
  const desc = `## 버전

v0.17.4 (carry-over from v0.17.3)

## 목표

장기기억 retrieval 메커니즘 설계
`;
  const result = readVersionLine(desc);
  assert.equal(result.version, "0.17.4");
  assert.equal(result.carryOverFrom, "0.17.3");
});

test("readVersionLine: ## 버전이 첫 헤더 아니면 null", () => {
  const desc = `## 목표

기존 내용.

## 버전

v0.17.4
`;
  const result = readVersionLine(desc);
  assert.equal(result.version, null);
});

test("readVersionLine: 다양한 description 패턴 회귀", () => {
  const desc1 = `## 버전\n\nv0.17.4\n\n## AS-IS\n\n내용\n`;
  const desc2 = `## 버전\n\nv0.17.4 (carry-over from v0.17.3)\n\n## AS-IS\n\n내용\n`;
  const desc3 = `## AS-IS\n\n버전 없음\n`;
  assert.equal(readVersionLine(desc1).version, "0.17.4");
  assert.equal(readVersionLine(desc1).carryOverFrom, null);
  assert.equal(readVersionLine(desc2).version, "0.17.4");
  assert.equal(readVersionLine(desc2).carryOverFrom, "0.17.3");
  assert.equal(readVersionLine(desc3).version, null);
});
