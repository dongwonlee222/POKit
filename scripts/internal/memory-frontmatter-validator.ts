import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type MemoryFrontmatter = {
  id?: string;
  kind?: string;
  scope?: string;
  source?: string;
  updated_at?: string;
  [key: string]: string | undefined;
};

export type MemoryValidationResult = {
  valid: boolean;
  frontmatter: MemoryFrontmatter;
  errors: string[];
};

export type MemoryDirectoryReport = {
  valid: boolean;
  files: Array<{
    relativePath: string;
    valid: boolean;
    errors: string[];
  }>;
};

const REQUIRED_KEYS = ["id", "kind", "scope", "source", "updated_at"];
const ALLOWED_SCOPES = ["private", "sanitized_example"];

export function validateMemoryFrontmatter(content: string): MemoryValidationResult {
  const parsed = parseMemoryFrontmatter(content);
  const errors: string[] = [];
  if (!parsed.hasFrontmatter) {
    errors.push("missing frontmatter");
  }
  for (const key of REQUIRED_KEYS) {
    if (!parsed.frontmatter[key]) {
      errors.push(`missing ${key}`);
    }
  }
  if (parsed.frontmatter.scope && !ALLOWED_SCOPES.includes(parsed.frontmatter.scope)) {
    errors.push("scope must be private or sanitized_example");
  }
  return {
    valid: errors.length === 0,
    frontmatter: parsed.frontmatter,
    errors,
  };
}

export function validateMemoryDirectory(notesDir: string): MemoryDirectoryReport {
  const files = listMarkdownFiles(notesDir).map((relativePath) => {
    const result = validateMemoryFrontmatter(readFileSync(join(notesDir, relativePath), "utf8"));
    return {
      relativePath,
      valid: result.valid,
      errors: result.errors,
    };
  });
  return {
    valid: files.every((file) => file.valid),
    files,
  };
}

export function parseMemoryFrontmatter(content: string): { hasFrontmatter: boolean; frontmatter: MemoryFrontmatter } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return { hasFrontmatter: false, frontmatter: {} };
  }
  const frontmatter: MemoryFrontmatter = {};
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
  const notesDir = process.argv[2] ?? "memory/notes";
  const report = validateMemoryDirectory(notesDir);
  console.log(`Memory frontmatter: ${report.valid ? "passed" : "failed"}`);
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
