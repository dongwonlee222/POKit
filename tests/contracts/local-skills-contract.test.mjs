import assert from "node:assert/strict";
import { lstat, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

function frontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, "SKILL.md must start with YAML frontmatter");
  return match[1];
}

function fieldValue(front, key) {
  const match = front.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function listValues(front, key) {
  const lines = front.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start < 0) return [];
  const values = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s*-\s+"?(.+?)"?\s*$/);
    if (match) values.push(match[1]);
  }
  return values;
}

test("AGENTS requires local POKit skill trigger phrases to override generic replies", async () => {
  const agents = await readFile("AGENTS.md", "utf8");

  assert.match(agents, /Local Skill Trigger Contract/);
  assert.match(agents, /skills\/\*\/SKILL\.md/);
  assert.match(agents, /trigger_phrases/);
  assert.match(agents, /follow that skill before generic reasoning/);
});

test("all local POKit skills declare usable metadata and at least one routing signal", async () => {
  const entries = await readdir("skills", { withFileTypes: true });
  const skillDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  assert.ok(skillDirs.length >= 10, "expected local POKit skills to be present");

  for (const dir of skillDirs) {
    const file = join("skills", dir, "SKILL.md");
    const content = await readFile(file, "utf8");
    const front = frontmatter(content);
    const triggers = listValues(front, "trigger_phrases");
    const labels = fieldValue(front, "labels");

    assert.equal(fieldValue(front, "name"), dir, `${file} name must match its directory`);
    assert.ok(fieldValue(front, "description").length > 20, `${file} needs a useful description`);
    assert.ok(fieldValue(front, "entry"), `${file} needs an entry`);
    assert.ok(triggers.length > 0 || /\[[^\]]+\]/.test(labels), `${file} needs trigger_phrases or labels`);
  }
});

test("critical conversational skills keep strict trigger and output contracts", async () => {
  const pokitStart = await readFile("skills/pokit-start/SKILL.md", "utf8");
  const backlogMemo = await readFile("skills/backlog-memo/SKILL.md", "utf8");
  const linearIssueManager = await readFile("skills/linear-issue-manager/SKILL.md", "utf8");

  assert.match(pokitStart, /포킷 시작/);
  assert.match(pokitStart, /POKit 시작해줘/);
  assert.match(pokitStart, /stdout 전체를 \*\*그대로\*\*/);
  assert.match(pokitStart, /추가 멘트 0줄/);
  assert.match(pokitStart, /AGENT: output above verbatim/);

  assert.match(backlogMemo, /백로그/);
  assert.match(backlogMemo, /External Write Rule — ABSOLUTE/);
  assert.match(backlogMemo, /Linear에 아직 등록되지 않았습니다/);
  assert.doesNotMatch(backlogMemo, /linear-backlog-manager/);
  assert.match(backlogMemo, /linear-issue-manager/);

  assert.match(linearIssueManager, /plan\*.*dry-run/s);
  assert.match(linearIssueManager, /apply\*.*write/s);
  assert.match(linearIssueManager, /사용자 승인 없이 `apply\*` 호출 금지/);
});

test("Claude and Codex plugin manifests exist and stay version-synced to package.json", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const claudePlugin = JSON.parse(await readFile(".claude-plugin/plugin.json", "utf8"));
  const codexPlugin = JSON.parse(await readFile(".codex-plugin/plugin.json", "utf8"));

  for (const [name, plugin] of [
    [".claude-plugin", claudePlugin],
    [".codex-plugin", codexPlugin],
  ]) {
    assert.equal(plugin.name, packageJson.name, `${name} name should match package.json`);
    assert.equal(plugin.version, packageJson.version, `${name} version should match package.json`);
    assert.match(plugin.description, /POKit/);
    assert.match(plugin.repository, /POKit/);
    assert.ok(Array.isArray(plugin.keywords), `${name} keywords must be an array`);
  }
});

test("Codex plugin wiring exposes POKit through a repo marketplace", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const rootCodexPlugin = JSON.parse(await readFile(".codex-plugin/plugin.json", "utf8"));
  const packagedCodexPlugin = JSON.parse(await readFile("plugins/pokit/.codex-plugin/plugin.json", "utf8"));
  const marketplace = JSON.parse(await readFile(".agents/plugins/marketplace.json", "utf8"));
  const packagedSkills = await lstat("plugins/pokit/skills");

  assert.equal(rootCodexPlugin.skills, "./skills/");
  assert.equal(packagedCodexPlugin.name, packageJson.name);
  assert.equal(packagedCodexPlugin.version, packageJson.version);
  assert.equal(packagedCodexPlugin.skills, "./skills/");
  assert.ok(packagedSkills.isDirectory() || packagedSkills.isSymbolicLink(), "packaged plugin must expose skills/");

  const pokitEntry = marketplace.plugins.find((plugin) => plugin.name === "pokit");
  assert.ok(pokitEntry, "repo marketplace must include pokit");
  assert.deepEqual(pokitEntry.source, { source: "local", path: "./plugins/pokit" });
  assert.equal(pokitEntry.policy.installation, "AVAILABLE");
  assert.equal(pokitEntry.policy.authentication, "ON_INSTALL");
  assert.equal(pokitEntry.category, "Productivity");
});
