import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadModule() {
  return import(`../../scripts/internal/verb-dispatch.ts?cacheBust=${Date.now()}`);
}

test("isKnownVerb identifies all 16 verbs", async () => {
  const { isKnownVerb, listKnownVerbs } = await loadModule();
  const verbs = listKnownVerbs();
  assert.equal(verbs.length, 16);
  for (const v of ["start", "brief", "run", "close", "retro", "hotfix", "audit", "guard", "progress", "end", "safety", "role-check", "sweep", "retro-check", "next-action", "release"]) {
    assert.ok(isKnownVerb(v), `expected ${v} to be a known verb`);
  }
  assert.equal(isKnownVerb("nonsense"), false);
});

test("dispatchVerb rejects unknown verbs with ASCII error and artifact", async () => {
  const { dispatchVerb } = await loadModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-dispatch-unknown-"));
  await mkdir(join(tempDir, "memory/problem-reviews"), { recursive: true });

  const result = await dispatchVerb({ verb: "nonsense", args: [], rootDir: tempDir });

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /🚨 pokit:dispatcher FAILED/);
  assert.match(result.stderr, /1\) 문제:/);
  assert.ok(result.artifactPath);

  const content = await readFile(result.artifactPath, "utf8");
  assert.match(content, /Problem \/ Error Review/);
});

test("VERB_ROUTES maps verbs to correct script paths", async () => {
  const { VERB_ROUTES } = await loadModule();
  assert.equal(VERB_ROUTES.start.path, "scripts/cli/session-start.ts");
  assert.equal(VERB_ROUTES.run.path, "scripts/cli/sprint-runner.ts");
  assert.equal(VERB_ROUTES.brief.path, "scripts/cli/session-brief.ts");
  assert.equal(VERB_ROUTES.safety.path, "scripts/cli/public-safety-scan.ts");
});

test("dispatchVerb catches subprocess failure and renders ASCII with mapping", async () => {
  const { dispatchVerb } = await loadModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-dispatch-fail-"));
  await mkdir(join(tempDir, "scripts/cli"), { recursive: true });
  await mkdir(join(tempDir, "scripts/internal"), { recursive: true });
  await mkdir(join(tempDir, "memory/problem-reviews"), { recursive: true });

  await writeFile(
    join(tempDir, "scripts/cli/session-start.ts"),
    `throw new Error("Session start blocked: missing memory/context-map.yaml");\n`,
  );

  const result = await dispatchVerb({
    verb: "start",
    args: [],
    rootDir: tempDir,
    stdio: "pipe",
  });

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /🚨 pokit:start FAILED/);
  assert.match(result.stderr, /context-map\.yaml 없음/);
  assert.ok(result.artifactPath);
});

test("dispatchVerb falls back when no specific mapping matches", async () => {
  const { dispatchVerb } = await loadModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-dispatch-fallback-"));
  await mkdir(join(tempDir, "scripts/cli"), { recursive: true });
  await mkdir(join(tempDir, "memory/problem-reviews"), { recursive: true });

  await writeFile(
    join(tempDir, "scripts/cli/cycle-close.ts"),
    `throw new Error("totally unique failure shape");\n`,
  );

  const result = await dispatchVerb({
    verb: "close",
    args: [],
    rootDir: tempDir,
    stdio: "pipe",
  });

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /🚨 pokit:close FAILED/);
  assert.match(result.stderr, /알 수 없는 오류/);
});
