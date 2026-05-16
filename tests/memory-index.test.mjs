import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadIndexModule() {
  return import(`../scripts/internal/memory-index.ts?cacheBust=${Date.now()}`);
}

test("buildMemoryIndex creates a unified index from private memory notes", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-memory-index-"));
  await mkdir(join(tempDir, "memory/notes"), { recursive: true });
  await writeFile(join(tempDir, "memory/notes/cycle-1.md"), `---
id: mem-cycle-1
kind: note
scope: private
source: POKIT-109
updated_at: 2026-05-15
---

# Cycle 1 memory
`);
  const { buildMemoryIndex, renderMemoryIndexYaml } = await loadIndexModule();

  const index = buildMemoryIndex(join(tempDir, "memory/notes"));
  const yaml = renderMemoryIndexYaml(index);

  assert.equal(index.generated, true);
  assert.equal(index.entries.length, 1);
  assert.deepEqual(index.entries[0], {
    id: "mem-cycle-1",
    kind: "note",
    scope: "private",
    source: "POKIT-109",
    updated_at: "2026-05-15",
    path: "cycle-1.md",
  });
  assert.match(yaml, /generated: true/);
  assert.match(yaml, /path: cycle-1\.md/);
});
