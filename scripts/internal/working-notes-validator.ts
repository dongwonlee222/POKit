import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type WorkingNoteStatus = "wip" | "blocked" | "done" | "abandoned";

export type WorkingNoteFrontmatter = {
  issue?: string;
  status?: string;
  updated_at?: string;
  [key: string]: string | undefined;
};

export type WorkingNoteValidationResult = {
  valid: boolean;
  frontmatter: WorkingNoteFrontmatter;
  errors: string[];
};

export type WorkingNoteDirectoryReport = {
  valid: boolean;
  files: Array<{
    relativePath: string;
    valid: boolean;
    errors: string[];
    frontmatter: WorkingNoteFrontmatter;
  }>;
};

const REQUIRED_KEYS = ["issue", "status", "updated_at"];
const ALLOWED_STATUSES: WorkingNoteStatus[] = ["wip", "blocked", "done", "abandoned"];

export function validateWorkingNoteFrontmatter(content: string): WorkingNoteValidationResult {
  const parsed = parseWorkingNoteFrontmatter(content);
  const errors: string[] = [];
  if (!parsed.hasFrontmatter) {
    errors.push("missing frontmatter");
  }
  for (const key of REQUIRED_KEYS) {
    if (!parsed.frontmatter[key]) {
      errors.push(`missing ${key}`);
    }
  }
  if (parsed.frontmatter.status && !ALLOWED_STATUSES.includes(parsed.frontmatter.status as WorkingNoteStatus)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }
  return {
    valid: errors.length === 0,
    frontmatter: parsed.frontmatter,
    errors,
  };
}

export function validateWorkingNoteDirectory(notesDir: string): WorkingNoteDirectoryReport {
  const files = listMarkdownFiles(notesDir).map((relativePath) => {
    const result = validateWorkingNoteFrontmatter(readFileSync(join(notesDir, relativePath), "utf8"));
    return {
      relativePath,
      valid: result.valid,
      errors: result.errors,
      frontmatter: result.frontmatter,
    };
  });
  return {
    valid: files.every((file) => file.valid),
    files,
  };
}

export function parseWorkingNoteFrontmatter(content: string): { hasFrontmatter: boolean; frontmatter: WorkingNoteFrontmatter } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return { hasFrontmatter: false, frontmatter: {} };
  }
  const frontmatter: WorkingNoteFrontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const parsed = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!parsed) {
      continue;
    }
    frontmatter[parsed[1]] = parsed[2].trim();
  }
  return { hasFrontmatter: true, frontmatter };
}

function listMarkdownFiles(notesDir: string): string[] {
  if (!existsSync(notesDir)) {
    return [];
  }
  return readdirSync(notesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
}

async function main(): Promise<void> {
  const notesDir = process.argv[2] ?? "artifacts/working-notes";
  const report = validateWorkingNoteDirectory(notesDir);
  console.log(`Working notes frontmatter: ${report.valid ? "passed" : "failed"}`);
  for (const file of report.files) {
    console.log(`- ${file.relativePath} · ${file.valid ? "passed" : `failed · ${file.errors.join(", ")}`}`);
  }
  if (!report.valid) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
