import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.POKIT_PROFILE = "";

async function loadWorkingNotesValidator() {
  return import(`../../scripts/internal/working-notes-validator.ts?cacheBust=${Date.now()}`);
}

async function loadCycleCloseModule() {
  return import(`../../scripts/cli/cycle-close.ts?cacheBust=${Date.now()}`);
}

function makeNote(issue, status, content = "") {
  return `---
issue: ${issue}
status: ${status}
updated_at: 2026-05-17
---

# ${issue} 작업 노트

${content}
`;
}

// --- Validator tests ---

test("validateWorkingNoteFrontmatter accepts valid wip note", async () => {
  const { validateWorkingNoteFrontmatter } = await loadWorkingNotesValidator();

  const result = validateWorkingNoteFrontmatter(makeNote("POKIT-115", "wip"));
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateWorkingNoteFrontmatter accepts all valid statuses", async () => {
  const { validateWorkingNoteFrontmatter } = await loadWorkingNotesValidator();

  for (const status of ["wip", "blocked", "done", "abandoned"]) {
    const result = validateWorkingNoteFrontmatter(makeNote("POKIT-1", status));
    assert.equal(result.valid, true, `status=${status} should be valid`);
  }
});

test("validateWorkingNoteFrontmatter rejects invalid status", async () => {
  const { validateWorkingNoteFrontmatter } = await loadWorkingNotesValidator();

  const result = validateWorkingNoteFrontmatter(makeNote("POKIT-1", "in-progress"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /status must be one of/);
});

test("validateWorkingNoteFrontmatter rejects missing required fields", async () => {
  const { validateWorkingNoteFrontmatter } = await loadWorkingNotesValidator();

  const result = validateWorkingNoteFrontmatter("---\nissue: POKIT-1\n---\n\n# note\n");
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /missing status/);
  assert.match(result.errors.join("\n"), /missing updated_at/);
});

test("validateWorkingNoteFrontmatter rejects missing frontmatter", async () => {
  const { validateWorkingNoteFrontmatter } = await loadWorkingNotesValidator();

  const result = validateWorkingNoteFrontmatter("# No frontmatter\n");
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /missing frontmatter/);
});

test("validateWorkingNoteDirectory reports per-file results", async () => {
  const { validateWorkingNoteDirectory } = await loadWorkingNotesValidator();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-wn-validator-"));
  const notesDir = join(tempDir, "working-notes");
  await mkdir(notesDir, { recursive: true });
  await writeFile(join(notesDir, "pokit-1.md"), makeNote("POKIT-1", "wip"));
  await writeFile(join(notesDir, "pokit-2.md"), "# No frontmatter\n");

  const report = validateWorkingNoteDirectory(notesDir);

  assert.equal(report.valid, false);
  assert.equal(report.files.length, 2);
  const invalid = report.files.find((f) => f.relativePath === "pokit-2.md");
  assert.ok(invalid);
  assert.match(invalid.errors.join("\n"), /missing frontmatter/);
});

// --- Archive tests ---

test("archiveDoneWorkingNotes moves only status=done notes", async () => {
  const { archiveDoneWorkingNotes } = await loadCycleCloseModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-wn-archive-"));
  const notesDir = join(tempDir, "artifacts", "working-notes");
  await mkdir(notesDir, { recursive: true });

  await writeFile(join(notesDir, "pokit-100.md"), makeNote("POKIT-100", "done", "## 완료 요약\n- 완료"));
  await writeFile(join(notesDir, "pokit-101.md"), makeNote("POKIT-101", "wip"));
  await writeFile(join(notesDir, "pokit-102.md"), makeNote("POKIT-102", "blocked"));
  await writeFile(join(notesDir, "pokit-103.md"), makeNote("POKIT-103", "abandoned"));

  const result = archiveDoneWorkingNotes("Cycle 3", tempDir);

  assert.deepEqual(result.moved, ["pokit-100.md"]);
  assert.equal(result.skipped.length, 3);

  // done note moved to archive
  const archivePath = join(tempDir, "artifacts", "working-notes", "_archive", "Cycle-3", "pokit-100.md");
  assert.ok(existsSync(archivePath), "done note should be in archive");

  // non-done notes remain in place
  assert.ok(existsSync(join(notesDir, "pokit-101.md")));
  assert.ok(existsSync(join(notesDir, "pokit-102.md")));
  assert.ok(existsSync(join(notesDir, "pokit-103.md")));

  // done note removed from working-notes root
  assert.equal(existsSync(join(notesDir, "pokit-100.md")), false);
});

test("archiveDoneWorkingNotes is idempotent — skips already-archived files", async () => {
  const { archiveDoneWorkingNotes } = await loadCycleCloseModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-wn-idempotent-"));
  const notesDir = join(tempDir, "artifacts", "working-notes");
  const archiveDir = join(notesDir, "_archive", "Cycle-3");
  await mkdir(notesDir, { recursive: true });
  await mkdir(archiveDir, { recursive: true });

  // Pre-place file in archive (simulates re-run)
  await writeFile(join(archiveDir, "pokit-100.md"), makeNote("POKIT-100", "done"));
  // Place same-named done note in working-notes
  await writeFile(join(notesDir, "pokit-100.md"), makeNote("POKIT-100", "done"));

  const result = archiveDoneWorkingNotes("Cycle 3", tempDir);

  // Should skip since dest already exists
  assert.equal(result.moved.length, 0);
  assert.deepEqual(result.skipped, ["pokit-100.md"]);
});

test("archiveDoneWorkingNotes returns empty result when no working-notes dir exists", async () => {
  const { archiveDoneWorkingNotes } = await loadCycleCloseModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-wn-nodir-"));

  const result = archiveDoneWorkingNotes("Cycle 3", tempDir);

  assert.deepEqual(result.moved, []);
  assert.deepEqual(result.skipped, []);
});

test("archiveDoneWorkingNotes does not move _archive subdirectory entries", async () => {
  const { archiveDoneWorkingNotes } = await loadCycleCloseModule();
  const tempDir = await mkdtemp(join(tmpdir(), "pokit-wn-no-subdir-"));
  const notesDir = join(tempDir, "artifacts", "working-notes");
  const prevArchive = join(notesDir, "_archive", "Cycle-2");
  await mkdir(prevArchive, { recursive: true });
  await writeFile(join(prevArchive, "pokit-50.md"), makeNote("POKIT-50", "done"));
  await writeFile(join(notesDir, "pokit-200.md"), makeNote("POKIT-200", "done"));

  const result = archiveDoneWorkingNotes("Cycle 3", tempDir);

  // Only the root-level note should be moved
  assert.deepEqual(result.moved, ["pokit-200.md"]);
  // Previous archive should be untouched
  assert.ok(existsSync(join(prevArchive, "pokit-50.md")));
});
