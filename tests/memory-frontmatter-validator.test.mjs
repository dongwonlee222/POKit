import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadValidatorModule() {
  return import(`../scripts/memory-frontmatter-validator.ts?cacheBust=${Date.now()}`);
}

test("validateMemoryFrontmatter accepts minimal POKit memory frontmatter", async () => {
  const { validateMemoryFrontmatter } = await loadValidatorModule();

  const result = validateMemoryFrontmatter(`---
id: mem-2026-05-15-cycle-1
kind: note
scope: private
source: POKIT-109
updated_at: 2026-05-15
---

# Memory note
`);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateMemoryFrontmatter reports missing required keys and public memory scope", async () => {
  const { validateMemoryFrontmatter } = await loadValidatorModule();

  const result = validateMemoryFrontmatter(`---
id: mem-2026-05-15-cycle-1
scope: public
---

# Memory note
`);

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /missing kind/);
  assert.match(result.errors.join("\n"), /missing source/);
  assert.match(result.errors.join("\n"), /missing updated_at/);
  assert.match(result.errors.join("\n"), /scope must be private or sanitized_example/);
});

test("validateMemoryDirectory reads memory notes without writing files", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-memory-validator-"));
  await mkdir(join(tempDir, "memory/notes"), { recursive: true });
  await writeFile(join(tempDir, "memory/notes/valid.md"), `---
id: mem-valid
kind: note
scope: private
source: POKIT-109
updated_at: 2026-05-15
---

# Valid
`);
  await writeFile(join(tempDir, "memory/notes/invalid.md"), "# No frontmatter\n");
  const { validateMemoryDirectory } = await loadValidatorModule();

  const report = validateMemoryDirectory(join(tempDir, "memory/notes"));

  assert.equal(report.files.length, 2);
  assert.equal(report.valid, false);
  assert.deepEqual(report.files.map((file) => file.relativePath).sort(), ["invalid.md", "valid.md"]);
  assert.match(report.files.find((file) => file.relativePath === "invalid.md").errors.join("\n"), /missing frontmatter/);
});
