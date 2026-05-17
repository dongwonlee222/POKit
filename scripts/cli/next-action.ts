import { runNextActionWizard, writeNextAction } from "../internal/next-action-wizard.ts";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const resumeIdx = args.indexOf("--resume");
  const resumeVersion = resumeIdx >= 0 ? args[resumeIdx + 1] : undefined;

  if (!process.stdin.isTTY) {
    process.stderr.write(
      "pokit next-action: TTY が必要です. Run interactively.\n",
    );
    process.exit(1);
  }

  const input = await runNextActionWizard({
    stdin: process.stdin,
    stdout: process.stdout,
    resumeVersion,
  });

  const path = await writeNextAction(input);
  process.stdout.write(`\n✅ next-action 저장됨: ${path}\n`);
  process.stdout.write(
    `  target_version: ${input.target_version}\n` +
    `  issues: ${input.issues.join(", ") || "(없음)"}\n` +
    `  intent: ${input.intent}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
