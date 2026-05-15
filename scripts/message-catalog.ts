import { readFileSync } from "node:fs";

export type MessageSurface =
  | "session_start"
  | "resume_compaction"
  | "stage_progress"
  | "backlog_intake"
  | "backlog_outline"
  | "definition_gate"
  | "local_work_done"
  | "verification"
  | "completion_report"
  | "external_write"
  | "decision_choice"
  | "error_incident"
  | "linear_backlog_create";

export type CatalogMessage = {
  id: string;
  surface: string;
  text: string;
  emoji?: string;
};

export type MessageCatalog = {
  messages: Record<string, CatalogMessage>;
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const ALLOWED_SURFACES = new Set<MessageSurface>([
  "session_start",
  "resume_compaction",
  "stage_progress",
  "backlog_intake",
  "backlog_outline",
  "definition_gate",
  "local_work_done",
  "verification",
  "completion_report",
  "external_write",
  "decision_choice",
  "error_incident",
  "linear_backlog_create",
]);

export function loadMessageCatalog(path = "workflows/messages.yaml"): MessageCatalog {
  return parseMessageCatalog(readFileSync(path, "utf8"));
}

export function parseMessageCatalog(content: string): MessageCatalog {
  const messages: Record<string, CatalogMessage> = {};
  let current: CatalogMessage | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#") || line.trim() === "messages:") {
      continue;
    }

    const idMatch = line.match(/^  ([a-z0-9_.-]+):$/i);
    if (idMatch) {
      current = {
        id: idMatch[1],
        surface: "",
        text: "",
      };
      messages[current.id] = current;
      continue;
    }

    if (!current) {
      continue;
    }

    const fieldMatch = line.match(/^    ([a-z_]+):\s*(.*)$/i);
    if (!fieldMatch) {
      continue;
    }
    const [, key, rawValue] = fieldMatch;
    const value = unquoteYamlScalar(rawValue.trim());
    if (key === "surface") {
      current.surface = value;
    } else if (key === "text") {
      current.text = value;
    } else if (key === "emoji") {
      current.emoji = value;
    }
  }

  return { messages };
}

export function validateMessageCatalog(catalog: MessageCatalog): ValidationResult {
  const errors: string[] = [];
  for (const message of Object.values(catalog.messages)) {
    if (!message.surface || !ALLOWED_SURFACES.has(message.surface as MessageSurface)) {
      errors.push(`${message.id}: unknown surface ${message.surface || "(missing)"}`);
    }
    if (!message.text) {
      errors.push(`${message.id}: missing text`);
    } else if (!hasKorean(message.text) && !isTemplateOnly(message.text)) {
      errors.push(`${message.id}: Korean user-facing text is required`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function getMessage(catalog: MessageCatalog, id: string): CatalogMessage {
  const message = catalog.messages[id];
  if (!message) {
    throw new Error(`Message catalog entry not found: ${id}`);
  }
  return message;
}

export function renderMessage(catalog: MessageCatalog, id: string, variables: Record<string, string> = {}): string {
  const message = getMessage(catalog, id);
  return message.text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => variables[key] ?? match);
}

function unquoteYamlScalar(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function hasKorean(value: string): boolean {
  return /[가-힣]/.test(value);
}

function isTemplateOnly(value: string): boolean {
  return value.trim() === "{targetVersion} · {title}";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateMessageCatalog(loadMessageCatalog(process.argv[2] ?? "workflows/messages.yaml"));
  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  }
}
