export type SubagentPayload = {
  role: string;
  summary_ko: string;
  artifact_links: Array<{
    path: string;
    purpose: string;
  }>;
  decisions_needed: Array<{
    question_ko: string;
    owner: "main_agent";
  }>;
  external_write_request: "none" | "dry_run_only";
  message_catalog_ids: string[];
};

export type SubagentPayloadValidationResult = {
  ok: boolean;
  errors: string[];
};

const ALLOWED_KEYS = new Set([
  "role",
  "summary_ko",
  "artifact_links",
  "decisions_needed",
  "external_write_request",
  "message_catalog_ids",
]);

export function validateSubagentPayload(payload: unknown): SubagentPayloadValidationResult {
  const errors: string[] = [];
  if (!isRecord(payload)) {
    return { ok: false, errors: ["Subagent payload must be an object."] };
  }

  for (const key of Object.keys(payload)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors.push(`Subagent payload has unexpected key: ${key}.`);
    }
  }

  if (typeof payload.role !== "string" || !payload.role.trim()) {
    errors.push("Subagent payload requires role.");
  }
  if (typeof payload.summary_ko !== "string" || !/[가-힣]/.test(payload.summary_ko)) {
    errors.push("Subagent payload requires Korean summary_ko.");
  }
  if (!Array.isArray(payload.artifact_links)) {
    errors.push("Subagent payload requires artifact_links array.");
  } else {
    for (const link of payload.artifact_links) {
      if (!isRecord(link) || typeof link.path !== "string" || typeof link.purpose !== "string") {
        errors.push("Subagent artifact_links entries require path and purpose.");
      }
    }
  }
  if (!Array.isArray(payload.decisions_needed)) {
    errors.push("Subagent payload requires decisions_needed array.");
  } else {
    for (const decision of payload.decisions_needed) {
      if (!isRecord(decision) || typeof decision.question_ko !== "string" || decision.owner !== "main_agent") {
        errors.push("Subagent decisions_needed entries require question_ko and owner=main_agent.");
      }
    }
  }
  if (payload.external_write_request !== "none" && payload.external_write_request !== "dry_run_only") {
    errors.push("Subagent external_write_request must be none or dry_run_only.");
  }
  if (!Array.isArray(payload.message_catalog_ids) || !payload.message_catalog_ids.every((id) => typeof id === "string")) {
    errors.push("Subagent payload requires message_catalog_ids string array.");
  }
  if ("raw_context" in payload || "context" in payload || "full_text" in payload) {
    errors.push("Subagent payload must not include raw context or long original text.");
  }

  return { ok: errors.length === 0, errors };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  const input = Buffer.concat(chunks).toString("utf8").trim();
  const result = validateSubagentPayload(input ? JSON.parse(input) : {});
  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  }
}
