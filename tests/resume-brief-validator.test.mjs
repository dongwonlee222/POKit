import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadValidatorModule() {
  return import(`../scripts/resume-brief-validator.ts?cacheBust=${Date.now()}`);
}

const validResumeBrief = [
  "# Resume Brief",
  "",
  "## 어디서 멈췄나",
  "Cycle 2 기준 완료 1건, 남은 Todo 2건. 남은 묶음: POKIT-135, POKIT-134.",
  "",
  "## 다음에 무엇을 하나",
  "Cycle 2 남은 Todo 전체를 우선순위대로 묶어서 완료까지 진행해줘",
  "",
  "## 차단된 것",
  "없음",
  "",
  "## 참조",
  "- `node --experimental-strip-types scripts/session-brief.ts`",
  "- `artifacts/profiles/pokit/criteria/POKIT-135.md`",
  "",
].join("\n");

test("validateResumeBriefContract accepts compact artifact-linked handoff", async () => {
  const { validateResumeBriefContract } = await loadValidatorModule();

  assert.deepEqual(validateResumeBriefContract(validResumeBrief), { valid: true, reasons: [] });
});

test("validateResumeBriefContract rejects missing sections, issue-only next action, and no artifact link", async () => {
  const { validateResumeBriefContract } = await loadValidatorModule();

  const result = validateResumeBriefContract([
    "# Resume Brief",
    "",
    "## 어디서 멈췄나",
    "POKIT-135만 진행했다.",
    "",
    "## 다음에 무엇을 하나",
    "POKIT-135 구현 계속해줘",
    "",
    "## 참조",
    "- `node --experimental-strip-types scripts/session-brief.ts`",
  ].join("\n"));

  assert.equal(result.valid, false);
  assert.match(result.reasons.join("\n"), /missing ## 차단된 것/);
  assert.match(result.reasons.join("\n"), /invalid next action/);
  assert.match(result.reasons.join("\n"), /missing artifact link/);
});

test("validateResumeBriefContract rejects long raw context blocks", async () => {
  const { validateResumeBriefContract } = await loadValidatorModule();

  const result = validateResumeBriefContract(`${validResumeBrief}\n\n## 원문\n${"긴 원문 ".repeat(500)}`);

  assert.equal(result.valid, false);
  assert.match(result.reasons.join("\n"), /raw context/);
});

test("resume brief fixture documents the stable handoff format", async () => {
  const fixture = await readFile("tests/fixtures/resume-brief.expected.md", "utf8");
  const { validateResumeBriefContract } = await loadValidatorModule();

  assert.deepEqual(validateResumeBriefContract(fixture), { valid: true, reasons: [] });
});
