import { loadMessageCatalog, validateMessageCatalog } from "./message-catalog.ts";

const path = process.argv[2] ?? "workflows/messages.yaml";
const result = validateMessageCatalog(loadMessageCatalog(path));

if (result.ok) {
  console.log(`Message catalog check passed: ${path}`);
} else {
  console.error(`Message catalog check failed: ${path}`);
  console.error(result.errors.join("\n"));
  process.exitCode = 1;
}

