// POKIT-205 T1 — flow-state 매핑/advance 단위 테스트
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadModule() {
  return import(`../../scripts/internal/flow-state.ts?cacheBust=${Date.now()}`);
}

function tempRoot() {
  return mkdtempSync(join(tmpdir(), "pokit-flow-"));
}

test("displayStepFromInternal: 1-3 → 1 (Idea)", async () => {
  const { displayStepFromInternal } = await loadModule();
  assert.equal(displayStepFromInternal(1), 1);
  assert.equal(displayStepFromInternal(2), 1);
  assert.equal(displayStepFromInternal(3), 1);
});

test("displayStepFromInternal: 4 → 2 (Linear), 5 → 3 (Build)", async () => {
  const { displayStepFromInternal } = await loadModule();
  assert.equal(displayStepFromInternal(4), 2);
  assert.equal(displayStepFromInternal(5), 3);
});

test("displayStepFromInternal: 6-7 → 4 (Test), 8-10 → 5 (Release)", async () => {
  const { displayStepFromInternal } = await loadModule();
  assert.equal(displayStepFromInternal(6), 4);
  assert.equal(displayStepFromInternal(7), 4);
  assert.equal(displayStepFromInternal(8), 5);
  assert.equal(displayStepFromInternal(9), 5);
  assert.equal(displayStepFromInternal(10), 5);
});

test("displayStepFromInternal: out-of-range → 0", async () => {
  const { displayStepFromInternal } = await loadModule();
  assert.equal(displayStepFromInternal(0), 0);
  assert.equal(displayStepFromInternal(11), 0);
  assert.equal(displayStepFromInternal(-1), 0);
});

test("internalEntryFromDisplay: 1 → 1, 2 → 4, 3 → 5", async () => {
  const { internalEntryFromDisplay } = await loadModule();
  assert.equal(internalEntryFromDisplay(1), 1);
  assert.equal(internalEntryFromDisplay(2), 4);
  assert.equal(internalEntryFromDisplay(3), 5);
  assert.equal(internalEntryFromDisplay(4), 6);
  assert.equal(internalEntryFromDisplay(5), 8);
});

test("displayStepLabel: 0→Idle, 1→Idea, 2→Linear, 3→Build, 4→Test, 5→Release", async () => {
  const { displayStepLabel } = await loadModule();
  assert.equal(displayStepLabel(0), "Idle");
  assert.equal(displayStepLabel(1), "Idea");
  assert.equal(displayStepLabel(2), "Linear");
  assert.equal(displayStepLabel(3), "Build");
  assert.equal(displayStepLabel(4), "Test");
  assert.equal(displayStepLabel(5), "Release");
});

test("internalStepLabel: 1 → '시작 브리프'", async () => {
  const { internalStepLabel } = await loadModule();
  assert.equal(internalStepLabel(1), "시작 브리프");
  assert.equal(internalStepLabel(4), "작업 Gate 확인");
  assert.equal(internalStepLabel(5), "로컬 구현/문서/산출물 작성");
});

test("getFlowState: 빈 state → 0/Idle", async () => {
  const { getFlowState } = await loadModule();
  const root = tempRoot();
  try {
    const fs = getFlowState(root);
    assert.equal(fs.internalStep, 0);
    assert.equal(fs.displayStep, 0);
    assert.equal(fs.displayId, "idle");
    assert.equal(fs.issue, null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("advanceFlow: kind=display id 'linear' → internal 4, display 2", async () => {
  const { advanceFlow, getFlowState } = await loadModule();
  const root = tempRoot();
  try {
    const result = advanceFlow({ kind: "display", step: "linear", issue: "POKIT-205" }, root);
    assert.equal(result.internalStep, 4);
    assert.equal(result.displayStep, 2);
    assert.equal(result.displayId, "linear");
    assert.equal(result.issue, "POKIT-205");
    const reloaded = getFlowState(root);
    assert.equal(reloaded.internalStep, 4);
    assert.equal(reloaded.issue, "POKIT-205");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("advanceFlow: kind=internal 5 → display 3 (Build)", async () => {
  const { advanceFlow } = await loadModule();
  const root = tempRoot();
  try {
    const result = advanceFlow({ kind: "internal", step: 5, issue: "POKIT-205" }, root);
    assert.equal(result.internalStep, 5);
    assert.equal(result.displayStep, 3);
    assert.equal(result.displayId, "build");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("advanceFlow: issue 미지정 시 기존 issue 보존", async () => {
  const { advanceFlow } = await loadModule();
  const root = tempRoot();
  try {
    advanceFlow({ kind: "display", step: "linear", issue: "POKIT-205" }, root);
    const next = advanceFlow({ kind: "display", step: "build" }, root);
    assert.equal(next.issue, "POKIT-205");
    assert.equal(next.displayId, "build");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("advanceFlow: kind=display unknown id throws", async () => {
  const { advanceFlow } = await loadModule();
  const root = tempRoot();
  try {
    assert.throws(
      () => advanceFlow({ kind: "display", step: "bogus" }, root),
      /unknown display step id/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resetFlow: 0/Idle 로 복귀 + issue null", async () => {
  const { advanceFlow, resetFlow } = await loadModule();
  const root = tempRoot();
  try {
    advanceFlow({ kind: "internal", step: 5, issue: "POKIT-205" }, root);
    const reset = resetFlow(root);
    assert.equal(reset.internalStep, 0);
    assert.equal(reset.displayStep, 0);
    assert.equal(reset.issue, null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("advanceFlow: clamp internal out-of-range", async () => {
  const { advanceFlow } = await loadModule();
  const root = tempRoot();
  try {
    const a = advanceFlow({ kind: "internal", step: 100 }, root);
    assert.equal(a.internalStep, 10);
    const b = advanceFlow({ kind: "internal", step: -5 }, root);
    assert.equal(b.internalStep, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
