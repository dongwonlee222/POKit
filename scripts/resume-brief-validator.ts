export type ResumeBriefValidationResult = {
  valid: boolean;
  reasons: string[];
};

export const REQUIRED_RESUME_SECTIONS = [
  "## 어디서 멈췄나",
  "## 다음에 무엇을 하나",
  "## 차단된 것",
  "## 참조",
];

export function validateResumeBriefContract(content: string): ResumeBriefValidationResult {
  const reasons: string[] = [];
  for (const section of REQUIRED_RESUME_SECTIONS) {
    if (!content.includes(section)) {
      reasons.push(`missing ${section}`);
    }
  }
  if (Buffer.byteLength(content, "utf8") > 2048) {
    reasons.push("resume brief exceeds 2048 bytes");
  }
  const nextAction = readSection(content, "## 다음에 무엇을 하나").split(/\r?\n/).find((line) => line.trim())?.trim();
  if (!nextAction) {
    reasons.push("missing Cycle-level next action");
  } else {
    const nextActionCheck = validateNextAction(nextAction);
    if (!nextActionCheck.valid) {
      reasons.push(`invalid next action: ${nextActionCheck.reason}`);
    }
  }
  const references = readSection(content, "## 참조");
  if (!/artifacts\/|docs\/|templates\/|workflows\//.test(references)) {
    reasons.push("missing artifact link in references");
  }
  if (hasRawContext(content)) {
    reasons.push("resume brief must not include raw context or long original text");
  }
  return {
    valid: reasons.length === 0,
    reasons,
  };
}

export function validateNextAction(
  nextAction: string,
  options: { explicitIssueSelection?: boolean } = {},
): { valid: boolean; reason: string | null } {
  if (/커밋해줘|Done 처리해줘|테스트 돌려줘/.test(nextAction)) {
    return {
      valid: false,
      reason: "mechanical next action",
    };
  }
  if (!options.explicitIssueSelection && /\b[A-Z]+-\d+\b/.test(nextAction) && !/\bCycle\s+\d+\b/i.test(nextAction)) {
    return {
      valid: false,
      reason: "issue-only next action without explicit selection",
    };
  }
  if (options.explicitIssueSelection) {
    return {
      valid: true,
      reason: null,
    };
  }
  if (!/\bCycle\s+\d+\b|Operating Cycle\s+\d+|Team Backlog/.test(nextAction)) {
    return {
      valid: false,
      reason: "missing Cycle-level next action",
    };
  }
  return {
    valid: true,
    reason: null,
  };
}

function readSection(content: string, heading: string): string {
  const start = content.indexOf(heading);
  if (start === -1) {
    return "";
  }
  const rest = content.slice(start + heading.length);
  const nextHeading = rest.search(/\n## /);
  return nextHeading === -1 ? rest.trim() : rest.slice(0, nextHeading).trim();
}

function hasRawContext(content: string): boolean {
  if (/^##\s*(원문|Raw Context|Full Context|Transcript)/im.test(content)) {
    return true;
  }
  return content.split(/\r?\n/).some((line) => line.length > 500);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: node --experimental-strip-types scripts/resume-brief-validator.ts <path>");
    process.exitCode = 1;
  } else {
    const { readFileSync } = await import("node:fs");
    const result = validateResumeBriefContract(readFileSync(path, "utf8"));
    if (!result.valid) {
      console.error(result.reasons.join("\n"));
      process.exitCode = 1;
    }
  }
}
