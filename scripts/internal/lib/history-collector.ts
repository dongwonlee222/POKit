import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type MarkdownArtifact = {
  path: string;
  title: string;
  artifactType: string;
  issueId: string;
};

export function discoverMarkdownArtifacts(rootDir: string, relativeDirs: string[]): MarkdownArtifact[] {
  const artifacts: MarkdownArtifact[] = [];
  for (const relativeDir of relativeDirs) {
    const dir = join(rootDir, relativeDir);
    if (!existsSync(dir)) {
      continue;
    }
    for (const filename of readdirSync(dir).filter((name) => name.endsWith(".md")).sort()) {
      const path = join(relativeDir, filename);
      const content = readFileSync(join(rootDir, path), "utf8");
      artifacts.push({
        path,
        title: readMarkdownTitle(content) ?? filename.replace(/\.md$/, ""),
        artifactType: readFrontmatterValue(content, "artifact_type") ?? inferArtifactType(relativeDir),
        issueId: readFrontmatterValue(content, "linear_issue_id") ?? filename.replace(/\.md$/, ""),
      });
    }
  }
  return artifacts;
}

export function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "") || "working-cycle";
}

export function readFrontmatterValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

export function readMarkdownTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function inferArtifactType(relativeDir: string): string {
  if (relativeDir.includes("prds")) {
    return "prd";
  }
  if (relativeDir.includes("criteria")) {
    return "acceptance_criteria";
  }
  if (relativeDir.includes("sprints")) {
    return "sprint";
  }
  return "unknown";
}
