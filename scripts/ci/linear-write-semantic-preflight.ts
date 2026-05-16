export type LinearWriteSemanticPayload = {
  title: string;
  description?: string;
};

export type LinearWriteSemanticDryRun = {
  title: string;
  targetVersion?: string;
  releaseBundle?: string;
};

export type LinearWriteSemanticPreflightInput = {
  dryRun: LinearWriteSemanticDryRun;
  write: LinearWriteSemanticPayload;
};

export type LinearWriteSemanticPreflightResult = {
  ok: boolean;
  errors: string[];
};

export function validateLinearWriteSemanticPreflight(
  input: LinearWriteSemanticPreflightInput,
): LinearWriteSemanticPreflightResult {
  const errors: string[] = [];
  const title = input.write.title.trim();
  const description = input.write.description ?? "";

  if (!/[가-힣]/.test(title)) {
    errors.push("Linear write requires a Korean title for user-facing issues.");
  }
  if (input.dryRun.title.trim() !== title) {
    errors.push("Linear write title must match the dry-run title.");
  }
  const targetVersion = input.dryRun.targetVersion ?? extractTargetVersion(description);
  if (!targetVersion) {
    errors.push("Linear write requires a target version for release bundle candidates.");
  } else if (!title.includes(targetVersion)) {
    errors.push("Linear write title must include the target version.");
  }
  const releaseBundle = input.dryRun.releaseBundle ?? extractReleaseBundle(description);
  if (!releaseBundle) {
    errors.push("Linear write requires a release bundle.");
  }
  if (/\bCycle\b/.test(title) && /release bundle/i.test(title)) {
    errors.push("Linear write must not mix Cycle and release bundle terms in the title.");
  }

  return { ok: errors.length === 0, errors };
}

function extractTargetVersion(description: string): string | undefined {
  return description.match(/Target version:\s*`?(v\d+\.\d+\.\d+)`?/i)?.[1];
}

function extractReleaseBundle(description: string): string | undefined {
  return description.match(/Release bundle:\s*(.+)$/im)?.[1]?.trim();
}

