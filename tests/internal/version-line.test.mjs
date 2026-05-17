import assert from "node:assert/strict";
import test from "node:test";

// POKIT-211 T1 — version-line.ts 단위 테스트
// description ## 버전 라인 insert/update/read

const { insertVersionLine, readVersionLine } = await import(
  "../../scripts/internal/version-line.ts"
);

test("insertVersionLine: 신규 description에 ## 버전 삽입 (## AS-IS 위)", () => {
  const desc = `## AS-IS

현재 문제 설명.

## TO-BE

해결안.

## 성공 검증

- 검증 1

## 담당 에이전트

- 모델: claude-sonnet-4-6
`;
  const result = insertVersionLine(desc, "0.17.4");
  assert.match(result, /## 버전\n\nv0\.17\.4\n\n## AS-IS/);
  // 4섹션 표준 보존
  assert.match(result, /## AS-IS[\s\S]*## TO-BE[\s\S]*## 성공 검증[\s\S]*## 담당 에이전트/);
});

test("insertVersionLine: 기존 ## 버전 라인 있으면 update", () => {
  const desc = `## 버전

v0.17.3

## AS-IS

내용.
`;
  const result = insertVersionLine(desc, "0.17.4");
  assert.match(result, /## 버전\n\nv0\.17\.4\n\n## AS-IS/);
  // 이전 버전 값 사라짐
  assert.doesNotMatch(result, /v0\.17\.3/);
});

test("insertVersionLine: carry-over 표기 형식", () => {
  const desc = `## AS-IS

내용.
`;
  const result = insertVersionLine(desc, "0.17.4", "0.17.3");
  assert.match(
    result,
    /## 버전\n\nv0\.17\.4 \(carry-over from v0\.17\.3\)\n\n## AS-IS/,
  );
});

test("insertVersionLine: 하단 자유 형식 carry-over 노트 보존 (POKIT-159 패턴)", () => {
  const desc = `## AS-IS

내용.

## 담당 에이전트

- 모델: claude-opus-4-7

---

## 버전

* v0.17.2 unresolved → **carry-over** (next: v0.17.4)
* 사유: 별도 cycle 진행
`;
  const result = insertVersionLine(desc, "0.17.4", "0.17.3");
  // 상단에 ## 버전 라인 삽입됨
  assert.match(
    result,
    /^## 버전\n\nv0\.17\.4 \(carry-over from v0\.17\.3\)\n\n## AS-IS/,
  );
  // 하단 자유 형식 노트 보존
  assert.match(result, /\* v0\.17\.2 unresolved → \*\*carry-over\*\*/);
  assert.match(result, /\* 사유: 별도 cycle 진행/);
});

test("insertVersionLine: idempotent (같은 값 두 번 호출)", () => {
  const desc = `## AS-IS

내용.
`;
  const once = insertVersionLine(desc, "0.17.4");
  const twice = insertVersionLine(once, "0.17.4");
  assert.equal(once, twice);
});

test("readVersionLine: ## 버전 라인 파싱", () => {
  const desc = `## 버전

v0.17.4

## AS-IS

내용.
`;
  const result = readVersionLine(desc);
  assert.equal(result.version, "0.17.4");
  assert.equal(result.carryOverFrom, null);
});

test("readVersionLine: carry-over 형식 파싱", () => {
  const desc = `## 버전

v0.17.4 (carry-over from v0.17.3)

## AS-IS

내용.
`;
  const result = readVersionLine(desc);
  assert.equal(result.version, "0.17.4");
  assert.equal(result.carryOverFrom, "0.17.3");
});

test("readVersionLine: ## 버전 라인 없으면 null", () => {
  const desc = `## AS-IS

내용.
`;
  const result = readVersionLine(desc);
  assert.equal(result.version, null);
  assert.equal(result.carryOverFrom, null);
});

test("readVersionLine: 하단 자유 형식은 무시 (상단 ## 버전만 인식)", () => {
  const desc = `## AS-IS

내용.

---

## 버전

* v0.17.2 unresolved → carry-over
`;
  const result = readVersionLine(desc);
  // 상단(첫 줄 또는 ## AS-IS 위)에만 인식. 하단 자유 형식은 무시.
  assert.equal(result.version, null);
});
