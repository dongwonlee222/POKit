import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// POKIT-124: AGENTS.md size regression guard.
// v0.8.0 slimmed AGENTS.md from 92 to ~35 lines by moving detail to docs/_details/.
// v0.10.0 added Core Principle (LLM 명확성 박제, ~4 lines). Ceiling raised to 45.
// v0.13.0 POKIT-157: 단계 정의 규칙 섹션 추가 (~3 lines). Ceiling raised to 50.
// This test prevents future regressions that re-bloat the main-agent context.

const AGENTS_MD_MAX_LINES = 50;

test("AGENTS.md stays under main-agent context line budget", async () => {
  const content = await readFile("AGENTS.md", "utf8");
  const lines = content.split("\n").length;

  assert.ok(
    lines <= AGENTS_MD_MAX_LINES,
    `AGENTS.md has ${lines} lines, exceeds the ${AGENTS_MD_MAX_LINES}-line ceiling. ` +
    `Move detail to docs/_details/*.md and keep AGENTS.md as an index.`,
  );
});

test("AGENTS.md does not embed full node CLI commands", async () => {
  const content = await readFile("AGENTS.md", "utf8");

  assert.doesNotMatch(
    content,
    /node --experimental-strip-types scripts\//,
    "AGENTS.md should expose pokit verbs only. Full node commands belong in docs/_details/cli-internals.md.",
  );
});

test("AGENTS.md links to detail policy files", async () => {
  const content = await readFile("AGENTS.md", "utf8");

  const requiredLinks = [
    "docs/_details/approval-flow.md",
    "docs/_details/cycle-flow.md",
    "docs/_details/release-flow.md",
    "docs/_details/subagent-contract.md",
    "docs/_details/memory-contract.md",
    "docs/_details/completion-report.md",
    "docs/_details/cli-internals.md",
  ];

  for (const link of requiredLinks) {
    assert.match(
      content,
      new RegExp(link.replace(/\//g, "\\/").replace(/\./g, "\\.")),
      `AGENTS.md must link to ${link}`,
    );
  }
});
