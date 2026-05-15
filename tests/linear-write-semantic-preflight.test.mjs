import assert from "node:assert/strict";
import test from "node:test";

async function loadPreflightModule() {
  return import(`../scripts/linear-write-semantic-preflight.ts?cacheBust=${Date.now()}`);
}

test("validateLinearWriteSemanticPreflight passes Korean title with target version and release bundle", async () => {
  const { validateLinearWriteSemanticPreflight } = await loadPreflightModule();

  const result = validateLinearWriteSemanticPreflight({
    dryRun: {
      title: "v0.7.0 · 메시지 카탈로그와 훅 하네스",
      targetVersion: "v0.7.0",
      releaseBundle: "설계 지속성 / 의도 검정",
    },
    write: {
      title: "v0.7.0 · 메시지 카탈로그와 훅 하네스",
      description: [
        "## 배포 묶음",
        "",
        "Target version: `v0.7.0`",
        "Release bundle: 설계 지속성 / 의도 검정",
      ].join("\n"),
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("validateLinearWriteSemanticPreflight blocks English title and missing version bundle", async () => {
  const { validateLinearWriteSemanticPreflight } = await loadPreflightModule();

  const result = validateLinearWriteSemanticPreflight({
    dryRun: {
      title: "Message Catalog and Hook Harness",
    },
    write: {
      title: "Message Catalog and Hook Harness",
      description: "Creates message catalog.",
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Korean title/);
  assert.match(result.errors.join("\n"), /target version/);
  assert.match(result.errors.join("\n"), /release bundle/);
});

test("validateLinearWriteSemanticPreflight blocks payload drift between dry-run and write", async () => {
  const { validateLinearWriteSemanticPreflight } = await loadPreflightModule();

  const result = validateLinearWriteSemanticPreflight({
    dryRun: {
      title: "v0.7.0 · 메시지 카탈로그와 훅 하네스",
      targetVersion: "v0.7.0",
      releaseBundle: "설계 지속성 / 의도 검정",
    },
    write: {
      title: "v0.7.0 · 다른 제목",
      description: "Target version: `v0.7.0`\nRelease bundle: 설계 지속성 / 의도 검정",
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /dry-run title/);
});
