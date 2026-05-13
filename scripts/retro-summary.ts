import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getWorkingCycleContext, type Issue, type WorkingCycleContext } from "./linear.ts";
import { profileArtifactPath } from "./profile.ts";

export type ArtifactReference = {
  path: string;
  issueId: string;
  artifactType: string;
  title: string;
  openQuestions: string[];
};

export type RetroDraftInput = {
  generatedAt?: string;
  context: WorkingCycleContext;
  rootDir?: string;
};

export function buildRetroDraft(input: RetroDraftInput): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const rootDir = input.rootDir ?? ".";
  const artifacts = discoverArtifactReferences(rootDir);
  const completedIssues = input.context.issues.filter(isCompletedIssue);
  const unfinishedIssues = input.context.issues.filter((issue) => !isCompletedIssue(issue));
  const questions = artifacts.flatMap((artifact) => artifact.openQuestions.map((question) => ({
    artifact,
    question,
  })));

  const lines = [
    "---",
    `cycle_id: ${input.context.cycle.id}`,
    `cycle_name: ${input.context.cycle.name}`,
    `generated_at: ${generatedAt}`,
    "status: draft",
    "external_writes: none",
    "---",
    "",
    `# Cycle Retro Draft: ${input.context.cycle.name}`,
    "",
    "## 1. Summary",
    "",
    `- Completed issues: ${completedIssues.length}`,
    `- Unfinished issues: ${unfinishedIssues.length}`,
    `- Generated artifacts found: ${artifacts.length}`,
    "- Linear/GitHub writes performed by this retro: none",
    "",
    "## 2. Completed Issues",
    "",
    ...renderIssueList(completedIssues),
    "",
    "## 3. Unfinished Issues",
    "",
    ...renderIssueList(unfinishedIssues),
    "",
    "## 4. Generated Artifacts",
    "",
    ...renderArtifactList(artifacts),
    "",
    "## 5. Remaining Questions",
    "",
    ...renderQuestionList(questions),
    "",
    "## 6. Decision-log Candidates",
    "",
    "- TODO: PO가 이번 cycle에서 확정한 범위, 정책, 우선순위 변경이 있으면 `memory/decision-log.md`에 기록할지 확인한다.",
    "- TODO: 완료된 task 중 다음 cycle 운영 규칙으로 남길 결정이 있는지 확인한다.",
    "",
    "## 7. Next Cycle Inputs",
    "",
    ...renderNextCycleInputs(unfinishedIssues),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

export function writeRetroDraft(input: RetroDraftInput): string {
  const rootDir = input.rootDir ?? ".";
  const cycleName = safePathSegment(input.context.cycle.name || input.context.cycle.id);
  const outputDir = join(rootDir, profileArtifactPath("sprints", cycleName));
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, "retro.md");
  writeFileSync(outputPath, buildRetroDraft(input), "utf8");
  return outputPath;
}

function discoverArtifactReferences(rootDir: string): ArtifactReference[] {
  const artifactDirs = [
    join(rootDir, profileArtifactPath("prds")),
    join(rootDir, profileArtifactPath("criteria")),
  ];
  const artifacts: ArtifactReference[] = [];
  for (const dir of artifactDirs) {
    if (!existsSync(dir)) {
      continue;
    }
    for (const filename of readdirSync(dir).filter((name) => name.endsWith(".md")).sort()) {
      const path = join(dir, filename);
      const content = readFileSync(path, "utf8");
      artifacts.push({
        path: path.startsWith(`${rootDir}/`) ? path.slice(rootDir.length + 1) : path,
        issueId: readFrontmatterValue(content, "linear_issue_id") ?? filename.replace(/\.md$/, ""),
        artifactType: readFrontmatterValue(content, "artifact_type") ?? "unknown",
        title: readMarkdownTitle(content) ?? filename,
        openQuestions: readSectionItems(content, "Open Questions"),
      });
    }
  }
  return artifacts;
}

function renderIssueList(issues: Issue[]): string[] {
  if (issues.length === 0) {
    return ["- 없음"];
  }
  return issues.map((issue) => `- ${issue.identifier} ${issue.title} (${issue.state ?? "unknown"})`);
}

function renderArtifactList(artifacts: ArtifactReference[]): string[] {
  if (artifacts.length === 0) {
    return ["- 없음"];
  }
  return artifacts.map((artifact) => `- ${artifact.issueId}: \`${artifact.path}\` (${artifact.artifactType})`);
}

function renderQuestionList(questions: Array<{ artifact: ArtifactReference; question: string }>): string[] {
  if (questions.length === 0) {
    return ["- 없음"];
  }
  return questions.map(({ artifact, question }) => `- ${artifact.issueId}: ${question}`);
}

function renderNextCycleInputs(issues: Issue[]): string[] {
  if (issues.length === 0) {
    return ["- 없음"];
  }
  return issues.map((issue) => `- ${issue.identifier}: 다음 cycle에서 계속 처리할지, scope를 줄일지 결정 필요.`);
}

function isCompletedIssue(issue: Issue): boolean {
  const normalized = issue.state?.trim().toLowerCase();
  return normalized === "done" || normalized === "completed" || normalized === "canceled" || normalized === "cancelled" || normalized === "duplicate";
}

function readFrontmatterValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

function readMarkdownTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function readSectionItems(content: string, sectionTitle: string): string[] {
  const section = content.match(new RegExp(`^## ${sectionTitle}\\n\\n([\\s\\S]*?)(\\n## |$)`, "m"))?.[1] ?? "";
  return section
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "") || "working-cycle";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const context = await getWorkingCycleContext();
  const outputPath = writeRetroDraft({ context });
  console.log(`Wrote ${outputPath}`);
}
