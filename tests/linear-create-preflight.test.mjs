import assert from "node:assert/strict";
import test from "node:test";

async function loadPreflightModule() {
  return import(`../scripts/linear-create-preflight.ts?cacheBust=${Date.now()}`);
}

test("classifyLinearCreatePreflight groups absent candidates into CREATE and SKIP", async () => {
  const { classifyLinearCreatePreflight } = await loadPreflightModule();

  const result = classifyLinearCreatePreflight({
    idempotencyKey: "linear-preflight-test",
    candidates: [
      {
        identifier: "candidate-news",
        title: "BBC RSS source example",
        linearState: "absent",
        evidence: [],
      },
      {
        identifier: "candidate-release",
        title: "v0.4.1 release notes",
        linearState: "absent",
        evidence: [
          { type: "changelog_tag", strength: "strong", path: "CHANGELOG.md", detail: "v0.4.1 exists and tag exists" },
        ],
      },
    ],
  });

  assert.equal(result.groups.CREATE.length, 1);
  assert.equal(result.groups.SKIP.length, 1);
  assert.equal(result.groups.CREATE[0].identifier, "candidate-news");
  assert.equal(result.groups.SKIP[0].identifier, "candidate-release");
  assert.equal(result.groups.SKIP[0].localEvidence, "complete");
  assert.match(result.groups.SKIP[0].reason, /완료 증거/);
});

test("classifyLinearCreatePreflight does not mutate open or done Linear issues in MVP", async () => {
  const { classifyLinearCreatePreflight } = await loadPreflightModule();

  const result = classifyLinearCreatePreflight({
    idempotencyKey: "linear-preflight-test",
    candidates: [
      {
        identifier: "POKIT-1",
        title: "Already tracked",
        linearState: "open",
        evidence: [
          { type: "direct_path", strength: "strong", path: "scripts/example.ts", detail: "code exists" },
        ],
      },
      {
        identifier: "POKIT-2",
        title: "Already done",
        linearState: "done",
        evidence: [],
      },
    ],
  });

  assert.equal(result.groups.CREATE.length, 0);
  assert.equal(result.groups.SKIP.length, 0);
  assert.equal(result.groups.NOOP.length, 2);
  assert.match(result.groups.NOOP[0].reason, /MVP/);
});

test("renderLinearCreatePreflightAscii shows action groups, evidence, and idempotency", async () => {
  const { classifyLinearCreatePreflight, renderLinearCreatePreflightAscii } = await loadPreflightModule();

  const preflight = classifyLinearCreatePreflight({
    idempotencyKey: "linear:create-preflight:test",
    projectName: "POKit",
    candidates: [
      {
        identifier: "candidate-create",
        title: "새 Backlog 후보",
        linearState: "absent",
        evidence: [],
      },
      {
        identifier: "candidate-skip",
        title: "이미 완료된 후보",
        linearState: "absent",
        evidence: [
          { type: "direct_path", strength: "strong", path: "docs/done.md", detail: "direct file match" },
        ],
      },
    ],
  });

  const ascii = renderLinearCreatePreflightAscii(preflight);

  assert.match(ascii, /Linear Backlog 등록 사전 확인/);
  assert.match(ascii, /\[████████░░\] 80%/);
  assert.match(ascii, /⏳ 실제 Linear write는 승인 대기/);
  assert.match(ascii, /Linear Create Preflight/);
  assert.match(ascii, /CREATE\s+\(1\)/);
  assert.match(ascii, /SKIP\s+\(1\)/);
  assert.match(ascii, /docs\/done\.md/);
  assert.match(ascii, /idempotency: linear:create-preflight:test/);
  assert.match(ascii, /write_target: Linear Backlog/);
});
