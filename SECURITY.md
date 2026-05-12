# Security

POKit is a repo-native AI workspace. It can read Linear data and, after explicit approval, apply selected Linear or GitHub writes. Treat API keys and generated artifacts as sensitive by default.

## API Keys

- Store secrets only in local `.env`.
- Never commit `.env`, API keys, access tokens, cookies, or exported session data.
- Use a Linear personal API key only for the workspace you intend POKit to access.
- Rotate the key immediately if it appears in chat, logs, screenshots, commits, or shared documents.

## Rotate a Linear API Key

1. Open Linear settings.
2. Go to Security & access.
3. Under Personal API keys, revoke the exposed key.
4. Create a new personal API key.
5. Update local `.env`:

```bash
LINEAR_API_KEY=lin_api_...
```

6. Run a read-only check before any write:

```bash
node --experimental-strip-types scripts/sprint-runner.ts
```

## Generated Artifacts

Generated PRDs, criteria, run summaries, and memory files may contain private project context.

- Keep public examples under `examples/`.
- Keep local generated outputs under `artifacts/`.
- Review generated files before committing them.
- Do not put customer data, credentials, contracts, or private implementation details in the public upstream repo.
- If your team wants to version memory or artifacts, do it in a private/team fork after reviewing the content.
- Before pushing to a public GitHub repo, check `git status --short` and inspect every untracked artifact.

## External Writes

POKit must not write to Linear or GitHub silently. Every external write requires:

1. A dry-run plan.
2. A visible idempotency key.
3. Explicit user approval.
4. A refusal path when approval or plan details are missing.
