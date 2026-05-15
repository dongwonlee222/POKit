export type PokitRunKind = "release" | "non_release" | "hotfix";

export type PokitRunIdentityInput = {
  kind: PokitRunKind;
  targetVersion?: string;
  runId?: string;
  sourceCycle?: string;
  resumeCycle?: string;
};

export type PokitRunMetadataInput = PokitRunIdentityInput & {
  title: string;
  linearCycleId: string;
  linearCycleName: string;
  cycleBundleId: string;
  issueIds: string[];
};

export function buildPokitRunId(input: PokitRunIdentityInput): string {
  if (input.kind === "release") {
    return `pokit:run:release:${requireField(input.targetVersion, "targetVersion")}`;
  }
  if (input.kind === "non_release") {
    return `pokit:run:non-release:${requireField(input.runId, "runId")}`;
  }

  const targetVersion = requireField(input.targetVersion, "targetVersion");
  const sourceCycle = requireField(input.sourceCycle, "sourceCycle");
  const resumeCycle = requireField(input.resumeCycle, "resumeCycle");
  return `pokit:run:hotfix:${targetVersion}:source=${sourceCycle}:resume=${resumeCycle}`;
}

export function renderPokitRunMetadata(input: PokitRunMetadataInput): string {
  return [
    "## POKit Circle 표시",
    `title: ${input.title}`,
    "",
    "## POKit Circle 변수",
    `pokitRunId: ${buildPokitRunId(input)}`,
    `pokitRunKind: ${input.kind}`,
    `linearCycleId: ${input.linearCycleId}`,
    `linearCycleName: ${input.linearCycleName}`,
    `cycleBundleId: ${input.cycleBundleId}`,
    `targetVersion: ${input.targetVersion ?? "none"}`,
    `runId: ${input.runId ?? "none"}`,
    `sourceCycle: ${input.sourceCycle ?? "none"}`,
    `resumeCycle: ${input.resumeCycle ?? "none"}`,
    `issueIds: ${input.issueIds.join(", ") || "none"}`,
    "",
  ].join("\n");
}

function requireField(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`POKit run identity requires ${field}.`);
  }
  return normalized;
}
