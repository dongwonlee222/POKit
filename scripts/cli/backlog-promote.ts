/**
 * pokit backlog-promote (POKIT-198)
 *
 * memory/backlog-raw/*.md 메모를 Linear에 배치 승격하는 CLI.
 * 사용자·LLM·sub-agent·hook 공통 진입점.
 *
 * 사용:
 *   pokit backlog-promote --dry-run                          # 모든 refined 메모
 *   pokit backlog-promote --target v0.17.1 --dry-run
 *   pokit backlog-promote --id bl-2026-05-17-005,bl-2026-05-17-006 --apply --actor main_agent
 *   pokit backlog-promote --status refined --apply --actor main_agent
 *
 * 옵션:
 *   --dry-run                 미리보기 (기본)
 *   --apply                   실제 Linear write (사용자 승인 후)
 *   --actor <NAME>            --apply 시 필수
 *   --target <version>        target_version 필터 (예: v0.17.1)
 *   --status <status>         status 필터 (refined / raw / promoted / dropped / all)
 *                              ※ 기본(미지정)은 promoted/dropped 자동 제외 (POKIT-205 중복등록 방지)
 *   --id <bl-id>              메모 id 콤마 구분
 *   --label <name>            기본 라벨 (기본: pokit:criteria)
 *   --no-frontmatter-update   memo 갱신 스킵 (디버깅용)
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  applyCreateIssue,
  applyUpdateIssue,
  planCreateIssue,
  planUpdateIssue,
  type Issue,
  type IssueInput,
  type IssueUpdateInput,
} from "../internal/linear.ts";

const BACKLOG_RAW_DIR = "memory/backlog-raw";
const DEFAULT_LABEL = "pokit:criteria";

export type MemoFrontmatter = {
  id: string;
  created: string;
  status: "raw" | "refined" | "promoted" | "dropped";
  domain: string;
  size?: "S" | "M" | "L";
  title: string;
  target_version?: string | null;
  promoted_to?: string | null;
  registration_mode?: "create" | "update";
  depends_on?: string[];
  source?: string | string[];
  absorbs?: string[];
  related?: string[];
  bundle_decision?: string;
};

export type MemoFile = {
  path: string;
  filename: string;
  frontmatter: MemoFrontmatter;
  body: string;
};

export type PromoteFilter = {
  target?: string;
  status?: string;
  ids?: string[];
};

export function parseMemoFile(path: string, filename: string, content: string): MemoFile {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`memo missing frontmatter: ${filename}`);
  }
  const [, yaml, body] = match;
  const frontmatter = parseYaml(yaml) as MemoFrontmatter;
  if (!frontmatter.id || !frontmatter.title || !frontmatter.status) {
    throw new Error(`memo missing required frontmatter keys (id/title/status): ${filename}`);
  }
  return { path, filename, frontmatter, body: body.trim() };
}

function parseYaml(yaml: string): Record<string, unknown> {
  // 간단 YAML 파서 — backlog-raw frontmatter 양식에 한정
  const out: Record<string, unknown> = {};
  const lines = yaml.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (!m) { i++; continue; }
    const [, key, rest] = m;
    if (rest.trim() === "" || rest.trim() === "null") {
      // 리스트 또는 null
      const listItems: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-\s+/.test(lines[j])) {
        const itemLine = lines[j].replace(/^\s+-\s+/, "").trim();
        // 인라인 주석 제거
        const cleanItem = itemLine.replace(/\s+#.*$/, "").trim();
        listItems.push(stripQuotes(cleanItem));
        j++;
      }
      if (listItems.length > 0) {
        out[key] = listItems;
      } else {
        out[key] = null;
      }
      i = j;
      continue;
    }
    // 스칼라
    const value = rest.replace(/\s+#.*$/, "").trim();
    out[key] = value === "null" ? null : stripQuotes(value);
    i++;
  }
  return out;
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export async function loadMemos(rootDir: string): Promise<MemoFile[]> {
  const dir = join(rootDir, BACKLOG_RAW_DIR);
  const entries = await readdir(dir);
  const memos: MemoFile[] = [];
  for (const filename of entries) {
    if (!filename.startsWith("bl-") || !filename.endsWith(".md")) continue;
    const path = join(dir, filename);
    const content = await readFile(path, "utf8");
    memos.push(parseMemoFile(path, filename, content));
  }
  return memos.sort((a, b) => a.frontmatter.id.localeCompare(b.frontmatter.id));
}

// POKIT-205: 기본 안전장치 — 명시 필터 없을 때 promoted/dropped 자동 제외.
// `--status all` 또는 ids 명시 시에만 전체 노출.
const TERMINAL_STATUSES = new Set(["promoted", "dropped"]);

export function applyFilter(memos: MemoFile[], filter: PromoteFilter): MemoFile[] {
  const explicitAll = filter.status === "all";
  const hasExplicitFilter = !!filter.status || !!filter.ids || !!filter.target;
  return memos.filter((memo) => {
    const fm = memo.frontmatter;
    if (filter.ids && !filter.ids.includes(fm.id)) return false;
    if (filter.target && fm.target_version !== filter.target) return false;
    if (filter.status && filter.status !== "all" && fm.status !== filter.status) return false;
    if (!hasExplicitFilter && TERMINAL_STATUSES.has(fm.status)) return false;
    if (explicitAll) return true;
    return true;
  });
}

export function buildCreateInput(memo: MemoFile, label: string): IssueInput {
  const fm = memo.frontmatter;
  const versionPrefix = fm.target_version ? `[${fm.target_version}] ` : "";
  const title = `${versionPrefix}${fm.title}`;
  const footerLines: string[] = ["", "---", "", `**출처**: \`${memo.filename}\``];
  if (fm.target_version) footerLines.push(`**target_version**: ${fm.target_version}`);
  if (fm.size) footerLines.push(`**size**: ${fm.size}`);
  if (fm.depends_on && fm.depends_on.length > 0) {
    footerLines.push(`**depends_on**: ${fm.depends_on.join(", ")}`);
  }
  if (fm.absorbs && fm.absorbs.length > 0) {
    footerLines.push(`**absorbs**: ${fm.absorbs.join(", ")}`);
  }
  const rawDescription = `${memo.body}\n${footerLines.join("\n")}\n`;
  return {
    title,
    labels: [label],
    rawDescription,
  };
}

export function buildUpdateInput(memo: MemoFile): IssueUpdateInput {
  const fm = memo.frontmatter;
  if (!fm.promoted_to) {
    throw new Error(`update mode requires promoted_to in frontmatter: ${memo.filename}`);
  }
  const append = `## ${fm.id} (${fm.target_version ?? "no version"})\n\n${memo.body}\n`;
  return {
    issueIdentifier: fm.promoted_to,
    descriptionAppend: append,
  };
}

export function determineMode(memo: MemoFile): "create" | "update" {
  if (memo.frontmatter.registration_mode === "update") return "update";
  return "create";
}

export async function updateMemoFrontmatter(
  memo: MemoFile,
  changes: { status?: string; promoted_to?: string },
): Promise<void> {
  const content = await readFile(memo.path, "utf8");
  let updated = content;
  if (changes.status !== undefined) {
    updated = updated.replace(/^status:\s*\S+/m, `status: ${changes.status}`);
  }
  if (changes.promoted_to !== undefined) {
    if (/^promoted_to:/m.test(updated)) {
      updated = updated.replace(/^promoted_to:\s*\S+/m, `promoted_to: ${changes.promoted_to}`);
    } else {
      // frontmatter 끝(--- 줄) 앞에 추가
      updated = updated.replace(
        /^(---\n[\s\S]*?)(\n---)/,
        `$1\npromoted_to: ${changes.promoted_to}$2`,
      );
    }
  }
  await writeFile(memo.path, updated);
}

export type PromoteResult = {
  blId: string;
  mode: "create" | "update";
  issue?: Issue;
  skipped?: boolean;
  reason?: string;
};

function renderDryRunSummary(memos: MemoFile[], label: string): string {
  const lines: string[] = [];
  lines.push(`mode=dry-run items=${memos.length}`);
  lines.push("");
  for (let i = 0; i < memos.length; i++) {
    const memo = memos[i];
    const fm = memo.frontmatter;
    const mode = determineMode(memo);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`[${i + 1}/${memos.length}] ${fm.id} → ${mode.toUpperCase()}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (mode === "create") {
      lines.push(`제목  : [${fm.target_version ?? "no-ver"}] ${fm.title}`);
      lines.push(`라벨  : ${label}`);
      lines.push(`size  : ${fm.size ?? "(미정)"}`);
      lines.push(`status: ${fm.status}`);
    } else {
      lines.push(`대상  : ${fm.promoted_to}`);
      lines.push(`모드  : description append`);
      lines.push(`size  : ${fm.size ?? "(미정)"}`);
    }
    lines.push("");
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`dry-run complete. ${memos.length}건 등록 준비 OK.`);
  lines.push(`apply 진행: --apply --actor <NAME> 추가`);
  return lines.join("\n");
}

async function applyOne(
  memo: MemoFile,
  label: string,
  actor: string,
  updateFrontmatter: boolean,
): Promise<PromoteResult> {
  const mode = determineMode(memo);
  if (mode === "create") {
    if (memo.frontmatter.status === "promoted") {
      return { blId: memo.frontmatter.id, mode, skipped: true, reason: "already promoted" };
    }
    const input = buildCreateInput(memo, label);
    const plan = await planCreateIssue(input);
    const issue = await applyCreateIssue(plan, { approved: true, actor });
    if (updateFrontmatter) {
      await updateMemoFrontmatter(memo, { status: "promoted", promoted_to: issue.identifier });
    }
    return { blId: memo.frontmatter.id, mode, issue };
  }
  // update
  const input = buildUpdateInput(memo);
  const plan = await planUpdateIssue(input);
  const issue = await applyUpdateIssue(plan, { approved: true, actor });
  if (updateFrontmatter) {
    await updateMemoFrontmatter(memo, { status: "promoted" });
  }
  return { blId: memo.frontmatter.id, mode, issue };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      "dry-run": { type: "boolean", default: false },
      apply: { type: "boolean", default: false },
      actor: { type: "string" },
      target: { type: "string" },
      status: { type: "string" },
      id: { type: "string" },
      label: { type: "string" },
      "no-frontmatter-update": { type: "boolean", default: false },
    },
    strict: false,
  });

  const isApply = !!values["apply"];
  const isDryRun = !isApply || !!values["dry-run"];
  const label = (values["label"] as string | undefined) ?? DEFAULT_LABEL;
  const ids = values["id"]
    ? (values["id"] as string).split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const filter: PromoteFilter = {
    target: values["target"] as string | undefined,
    status: values["status"] as string | undefined,
    ids,
  };

  const rootDir = process.cwd();
  const memos = await loadMemos(rootDir);
  const filtered = applyFilter(memos, filter);

  if (filtered.length === 0) {
    console.warn("필터 조건에 매칭되는 메모가 없습니다.");
    console.warn(`scanned=${memos.length} filter=${JSON.stringify(filter)}`);
    return;
  }

  if (isDryRun) {
    console.log(renderDryRunSummary(filtered, label));
    return;
  }

  const actor = values["actor"] as string | undefined;
  if (!actor) {
    const err = new Error("--apply 시 --actor <NAME> 이 필수입니다.");
    (err as unknown as { exitCode: number }).exitCode = 2;
    throw err;
  }

  const updateFrontmatter = !values["no-frontmatter-update"];
  const results: PromoteResult[] = [];
  for (let i = 0; i < filtered.length; i++) {
    const memo = filtered[i];
    const result = await applyOne(memo, label, actor, updateFrontmatter);
    if (result.skipped) {
      console.log(`[${i + 1}/${filtered.length}] ${result.blId} → skipped (${result.reason})`);
    } else {
      console.log(
        `[${i + 1}/${filtered.length}] ${result.blId} → ${result.issue!.identifier} (${result.mode})`,
      );
    }
    results.push(result);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`apply complete. 처리된 항목 ${results.length}건.`);
  if (updateFrontmatter) {
    console.log(`memo frontmatter 자동 갱신 완료 (status, promoted_to).`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: Error & { exitCode?: number }) => {
    console.error(err.message);
    process.exit(err.exitCode ?? 1);
  });
}
