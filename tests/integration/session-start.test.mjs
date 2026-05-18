import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.POKIT_PROFILE = "";

async function loadSessionStartModule() {
  return import(`../../scripts/cli/session-start.ts?cacheBust=${Date.now()}`);
}

const context = {
  source: "linear_upcoming",
  cycle: {
    id: "cycle-1",
    name: "POKit Operating Cycle 1: Memory MVP Foundation",
    number: 8,
  },
  issues: [
    { id: "issue-128", identifier: "POKIT-128", title: "Session Bootstrap Contract", description: "boot", labels: ["pokit:criteria"], state: "Todo" },
  ],
};

test("buildSessionStart renders brief with boot signature after reading context map", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-session-start-"));
  await mkdir(join(tempDir, "memory"), { recursive: true });
  await mkdir(join(tempDir, "docs/architecture"), { recursive: true });
  await mkdir(join(tempDir, "workflows"), { recursive: true });
  await writeFile(join(tempDir, "memory/resume-brief.md"), "# Resume Brief\n");
  await writeFile(join(tempDir, "memory/current-cycle.yaml"), "cycle:\n  id: cycle-1\n");
  await writeFile(join(tempDir, "docs/architecture/01-document-roles.md"), "# Document Roles\n");
  await writeFile(join(tempDir, "docs/architecture/11-visualization-and-incident-response.md"), "# Stage Visualization And Incident Response\n");
  await writeFile(join(tempDir, "workflows/hooks.yaml"), "hooks:\n  session_start:\n    - read_context_map\n");
  await writeFile(join(tempDir, "memory/context-map.yaml"), [
    "read_order:",
    "  - memory/resume-brief.md",
    "  - memory/current-cycle.yaml",
    "  - docs/architecture/01-document-roles.md",
    "  - docs/architecture/11-visualization-and-incident-response.md",
    "",
  ].join("\n"));
  const { buildSessionStart } = await loadSessionStartModule();

  const output = buildSessionStart({
    rootDir: tempDir,
    now: new Date("2026-05-15T09:00:00+09:00"),
    context,
  });

  assert.match(output, /🪧 POKit 시작 Brief/);
  assert.match(output, /· Team POKIT/);
  assert.match(output, /- 마지막 스프린트 배포 버전: v\d+\.\d+\.\d+/);
  assert.match(output, /- 다음 스프린트 target version: /);
  assert.match(output, /📋 Linear 우선순위 Top 3/);
  assert.match(output, /1\. POKIT-128 Session Bootstrap Contract · (Urgent|High|Medium|Low|No priority)/);
  assert.match(output, /💬 추천 다음 행동: /);
  assert.doesNotMatch(output, /# POKit Brief/);
  assert.doesNotMatch(output, /Profile: default/);
  assert.match(output, /pokit:boot ok cycle=POKit Operating Cycle 1: Memory MVP Foundation hooks=loaded orchestrator=loaded read_order=4 linear=api-key/);
});

test("buildSessionStart resolves canonical memory read_order through active profile memory_dir", async () => {
  const previousProfile = process.env.POKIT_PROFILE;
  process.env.POKIT_PROFILE = "pokit";
  try {
    const tempDir = await mkdtemp(join(tmpdir(), "pokit-session-start-profile-"));
    await mkdir(join(tempDir, "memory/profiles/pokit"), { recursive: true });
    await mkdir(join(tempDir, "docs/architecture"), { recursive: true });
    await mkdir(join(tempDir, "workflows"), { recursive: true });
    await writeFile(join(tempDir, "pokit.local.config.yaml"), [
      "profiles:",
      "  pokit:",
      "    linear_team_key: PA",
      "    memory_dir: memory/profiles/pokit",
      "",
    ].join("\n"));
    await writeFile(join(tempDir, "memory/profiles/pokit/resume-brief.md"), [
      "# Resume Brief",
      "",
      "## 어디서 멈췄나",
      "프로필 메모리에서 멈춤",
      "",
      "## 다음에 무엇을 하나",
      "프로필 다음 액션",
      "",
      "## 차단된 것",
      "없음",
      "",
      "## 참조",
      "- `docs/OPERATING_MODEL.md`",
      "",
    ].join("\n"));
    await writeFile(join(tempDir, "memory/current-cycle.yaml"), "cycle:\n  id: cycle-1\n");
    await writeFile(join(tempDir, "docs/architecture/01-document-roles.md"), "# Document Roles\n");
    await writeFile(join(tempDir, "docs/architecture/11-visualization-and-incident-response.md"), "# Stage Visualization And Incident Response\n");
    await writeFile(join(tempDir, "workflows/hooks.yaml"), "hooks:\n  session_start:\n    - read_context_map\n");
    await writeFile(join(tempDir, "memory/context-map.yaml"), [
      "read_order:",
      "  - memory/resume-brief.md",
      "  - memory/current-cycle.yaml",
      "  - docs/architecture/01-document-roles.md",
      "  - docs/architecture/11-visualization-and-incident-response.md",
      "",
    ].join("\n"));
    const { buildSessionStart } = await loadSessionStartModule();

    const output = buildSessionStart({
      rootDir: tempDir,
      now: new Date("2026-05-15T09:00:00+09:00"),
      context,
    });

    assert.match(output, /💬 추천 다음 행동: 프로필 다음 액션/);
    assert.match(output, /pokit:boot ok .*read_order=4/);
  } finally {
    process.env.POKIT_PROFILE = previousProfile ?? "";
  }
});

test("buildSessionStart fails loudly when read_order files are missing", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-session-start-missing-"));
  await mkdir(join(tempDir, "memory"), { recursive: true });
  await writeFile(join(tempDir, "memory/context-map.yaml"), [
    "read_order:",
    "  - memory/missing.md",
    "",
  ].join("\n"));
  const { buildSessionStart } = await loadSessionStartModule();

  assert.throws(
    () => buildSessionStart({ rootDir: tempDir, context }),
    /Session start blocked: missing read_order file memory\/missing\.md/,
  );
});
