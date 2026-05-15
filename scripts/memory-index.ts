import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMemoryFrontmatter, validateMemoryFrontmatter } from "./memory-frontmatter-validator.ts";

export type MemoryIndexEntry = {
  id: string;
  kind: string;
  scope: string;
  source: string;
  updated_at: string;
  path: string;
};

export type MemoryIndex = {
  generated: true;
  entries: MemoryIndexEntry[];
};

export function buildMemoryIndex(notesDir: string): MemoryIndex {
  const entries = listMarkdownFiles(notesDir).flatMap((relativePath) => {
    const content = readFileSync(join(notesDir, relativePath), "utf8");
    const validation = validateMemoryFrontmatter(content);
    if (!validation.valid) {
      return [];
    }
    const frontmatter = parseMemoryFrontmatter(content).frontmatter;
    return [{
      id: frontmatter.id!,
      kind: frontmatter.kind!,
      scope: frontmatter.scope!,
      source: frontmatter.source!,
      updated_at: frontmatter.updated_at!,
      path: relativePath,
    }];
  });
  return {
    generated: true,
    entries,
  };
}

export function renderMemoryIndexYaml(index: MemoryIndex): string {
  return [
    "generated: true",
    "entries:",
    ...index.entries.flatMap((entry) => [
      `  - id: ${entry.id}`,
      `    kind: ${entry.kind}`,
      `    scope: ${entry.scope}`,
      `    source: ${entry.source}`,
      `    updated_at: ${entry.updated_at}`,
      `    path: ${entry.path}`,
    ]),
    "",
  ].join("\n");
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
  console.log(renderMemoryIndexYaml(buildMemoryIndex(notesDir)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
