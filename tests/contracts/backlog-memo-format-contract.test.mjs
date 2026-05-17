// backlog-memo-format-contract.test.mjs
// C9: backlog-memo 양식 시각화 섹션 계약 테스트
//
// 강제 (신규): ## 시각화 섹션 존재 + 본문 50자 이상 + 빈 코드블럭 아닐 것
// warn-only (기존): v0.15.x 메모 — 마이그레이션 강제 없음
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const ARTIFACTS_DIR = new URL("../../artifacts/backlog", import.meta.url).pathname;
const RELEASES_DIR = new URL("../../releases", import.meta.url).pathname;

// POKIT-204: memo 파일이 releases/v<X>/backlog/ 로 이관됨. 두 위치 모두 스캔.
function resolveBacklogDir(version) {
  const released = join(RELEASES_DIR, version, "backlog");
  if (existsSync(released)) return released;
  return join(ARTIFACTS_DIR, version);
}

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

/**
 * 파일 본문에서 ## 시각화 섹션 첫 펜스드 코드블럭 내용을 추출한다.
 * 없으면 null 반환.
 */
function extractVisualizationBody(content) {
  const vizMatch = content.match(/^## 시각화\s*\n/m);
  if (!vizMatch) return null;

  const afterViz = content.slice(vizMatch.index + vizMatch[0].length);
  // 첫 번째 펜스드 코드블럭 추출
  const fenceMatch = afterViz.match(/^```[^\n]*\n([\s\S]*?)^```/m);
  if (!fenceMatch) {
    // 코드블럭 없이 일반 텍스트인 경우 (섹션 다음 ## 까지 추출)
    const nextSectionMatch = afterViz.match(/^([\s\S]*?)(?=^##\s)/m);
    if (nextSectionMatch) return nextSectionMatch[1].trim();
    return afterViz.trim();
  }
  return fenceMatch[1]; // 코드블럭 내용 (trim 하지 않음 — 원문 보존)
}

/**
 * artifacts/backlog/{version} 디렉토리에서 md 파일 목록 반환 (README 제외)
 */
function collectMemos(versionDir) {
  if (!existsSync(versionDir)) return [];
  return readdirSync(versionDir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => join(versionDir, f));
}

// ── renderLocalBacklogMemo 단위 테스트 ───────────────────────────────────────

async function loadOutlineModule() {
  return import(`../../scripts/internal/backlog-outline.ts?cacheBust=${Date.now()}`);
}

test("renderLocalBacklogMemo: visualization 필드 없으면 throw", async () => {
  const { renderLocalBacklogMemo } = await loadOutlineModule();

  assert.throws(
    () =>
      renderLocalBacklogMemo({
        title: "테스트",
        summary: "요약",
        source: "chat",
        proposedLinearTitle: "[Backlog] 테스트",
        proposedLabels: [],
        proposedState: "Backlog",
        nonChanges: [],
        idempotencyKey: "memo-20260517-test",
        visualization: "",
      }),
    /visualization 필드가 비어있습니다/,
  );
});

test("renderLocalBacklogMemo: visualization 50자 미만이면 throw", async () => {
  const { renderLocalBacklogMemo } = await loadOutlineModule();

  assert.throws(
    () =>
      renderLocalBacklogMemo({
        title: "테스트",
        summary: "요약",
        source: "chat",
        proposedLinearTitle: "[Backlog] 테스트",
        proposedLabels: [],
        proposedState: "Backlog",
        nonChanges: [],
        idempotencyKey: "memo-20260517-test",
        visualization: "짧은 내용",
      }),
    /최소 50자 필요/,
  );
});

test("renderLocalBacklogMemo: 유효한 visualization이면 ## 시각화 섹션 포함", async () => {
  const { renderLocalBacklogMemo } = await loadOutlineModule();

  const vizContent =
    "Before:                     After:\n" +
    "┌──────────────┐            ┌──────────────┐\n" +
    "│ 텍스트만       │            │ ## 시각화     │\n" +
    "└──────────────┘            └──────────────┘";

  const memo = renderLocalBacklogMemo({
    title: "테스트 메모",
    summary: "요약 내용",
    source: "chat",
    proposedLinearTitle: "[Backlog] 테스트 메모",
    proposedLabels: ["area:test"],
    proposedState: "Backlog",
    nonChanges: ["외부 write 없음"],
    idempotencyKey: "memo-20260517-test-memo",
    visualization: vizContent,
  });

  assert.match(memo, /^## 시각화$/m, "## 시각화 섹션 존재");
  // 시각화가 제목 바로 다음, 요약 이전에 위치
  const vizIdx = memo.indexOf("## 시각화");
  const summaryIdx = memo.indexOf("## 요약");
  assert.ok(vizIdx < summaryIdx, "## 시각화가 ## 요약 앞에 위치");

  const vizBody = extractVisualizationBody(memo);
  assert.ok(vizBody !== null, "시각화 본문 추출 가능");
  assert.ok(vizBody.trim().length >= 50, `시각화 본문 50자 이상 (현재 ${vizBody.trim().length}자)`);
});

test("renderLocalBacklogMemo: 빈 코드블럭(``` 만 있는 경우) throw — visualization 빈 값 전달 시", async () => {
  const { renderLocalBacklogMemo } = await loadOutlineModule();

  // ``` ``` 패턴은 visualization="" 를 전달했을 때 throw로 차단
  assert.throws(() =>
    renderLocalBacklogMemo({
      title: "테스트",
      summary: "요약",
      source: "chat",
      proposedLinearTitle: "[Backlog] 테스트",
      proposedLabels: [],
      proposedState: "Backlog",
      nonChanges: [],
      idempotencyKey: "memo-20260517-test",
      visualization: "   ", // 공백만 있는 경우
    }),
  );
});

// ── artifact 전수 스캔 ────────────────────────────────────────────────────────

test("v0.16.0 메모 전수 스캔 — ## 시각화 섹션 강제", () => {
  const v016Dir = resolveBacklogDir("v0.16.0");
  const files = collectMemos(v016Dir);

  assert.ok(files.length > 0, `v0.16.0 메모 파일이 없습니다: ${v016Dir}`);

  const failures = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    const relPath = relative(ARTIFACTS_DIR, filePath);

    // 1. ## 시각화 섹션 존재 여부
    if (!/^## 시각화\s*$/m.test(content)) {
      failures.push(`[FAIL] ${relPath}: ## 시각화 섹션 없음`);
      continue;
    }

    // 2. 시각화 본문 추출 및 검증
    const vizBody = extractVisualizationBody(content);

    if (vizBody === null) {
      failures.push(`[FAIL] ${relPath}: ## 시각화 섹션 내용 추출 불가`);
      continue;
    }

    const trimmed = vizBody.trim();

    // 3. 빈 코드블럭 거부
    if (trimmed.length === 0) {
      failures.push(`[FAIL] ${relPath}: ## 시각화 빈 코드블럭`);
      continue;
    }

    // 4. 최소 50자
    if (trimmed.length < 50) {
      failures.push(
        `[FAIL] ${relPath}: ## 시각화 본문 ${trimmed.length}자 (최소 50자)`,
      );
    }
  }

  if (failures.length > 0) {
    const msg = ["v0.16.0 시각화 계약 위반:", ...failures].join("\n  ");
    assert.fail(msg);
  }
});

test("v0.15.2 메모 전수 스캔 — 시각화 누락 warn-only (block 아님)", () => {
  const v015Dir = resolveBacklogDir("v0.15.2");
  const files = collectMemos(v015Dir);

  if (files.length === 0) {
    // 디렉토리 없으면 통과
    return;
  }

  let missing = 0;
  let present = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    if (/^## 시각화\s*$/m.test(content)) {
      present++;
    } else {
      missing++;
      const relPath = relative(ARTIFACTS_DIR, filePath);
      // warn-only: console.warn으로 기록, 실패로 처리하지 않음
      console.warn(`[WARN] v0.15.2 시각화 누락: ${relPath}`);
    }
  }

  // warn-only — assert.fail 없음
  console.log(
    `v0.15.2 시각화 현황: ${present}/${files.length} 보유, ${missing}/${files.length} 누락 (warn-only)`,
  );
});
