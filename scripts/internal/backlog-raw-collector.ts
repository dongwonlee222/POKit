/**
 * POKIT-194: session-scope raw 백로그 집계.
 *
 * memory/backlog-raw/*.md 메모를 status·created 기준으로 분류해
 * pokit start (전 세션 잔여) / pokit end (이번 세션 신규) 출력에서 사용.
 *
 * 의도된 단순화: regex 기반 frontmatter 부분 파싱.
 * backlog-promote.ts 의 parseMemoFile 과 형식 일관.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type BacklogRawSummary = {
  id: string;
  filename: string;
  title: string;
  status: "raw" | "refined" | "promoted" | "dropped" | string;
  created: string;
  target_version: string | null;
  promoted_to: string | null;
};

const BACKLOG_RAW_DIR = "memory/backlog-raw";

function extractFrontmatterValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return null;
  const value = match[1].replace(/\s+#.*$/, "").trim();
  if (value === "null" || value === "") return null;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

export function loadBacklogRawSummaries(rootDir: string): BacklogRawSummary[] {
  const dir = join(rootDir, BACKLOG_RAW_DIR);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const summaries: BacklogRawSummary[] = [];
  for (const filename of entries) {
    if (!filename.startsWith("bl-") || !filename.endsWith(".md")) continue;
    const content = readFileSync(join(dir, filename), "utf8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    const id = extractFrontmatterValue(fm, "id");
    const title = extractFrontmatterValue(fm, "title");
    const status = extractFrontmatterValue(fm, "status");
    const created = extractFrontmatterValue(fm, "created");
    if (!id || !title || !status || !created) continue;
    summaries.push({
      id,
      filename,
      title,
      status,
      created,
      target_version: extractFrontmatterValue(fm, "target_version"),
      promoted_to: extractFrontmatterValue(fm, "promoted_to"),
    });
  }
  return summaries.sort((a, b) => a.id.localeCompare(b.id));
}

/** 정리/승격 대기 = status raw 또는 refined */
export function filterPendingRaw(summaries: BacklogRawSummary[]): BacklogRawSummary[] {
  return summaries.filter((s) => s.status === "raw" || s.status === "refined");
}

/** 오늘 또는 지정 날짜에 생성된 항목 (pokit end "이번 세션이 만든 raw") */
export function filterCreatedOn(summaries: BacklogRawSummary[], date: string): BacklogRawSummary[] {
  return summaries.filter((s) => s.created === date);
}

/** pokit start "정리/승격 대기 N건" 출력 라인 */
export function renderPendingRawLines(summaries: BacklogRawSummary[]): string[] {
  const pending = filterPendingRaw(summaries);
  if (pending.length === 0) return [];
  return [
    "",
    `📝 raw 백로그 (정리/승격 대기) ${pending.length}건`,
    ...pending.map((s) => {
      const ver = s.target_version ? ` [${s.target_version}]` : "";
      return `- ${s.id}${ver} ${s.title} (${s.status})`;
    }),
  ];
}

/** pokit end "이번 세션이 만든 raw N건" 출력 라인 */
export function renderTodayRawLines(summaries: BacklogRawSummary[], today: string): string[] {
  const today_items = filterCreatedOn(summaries, today);
  if (today_items.length === 0) return [];
  return [
    "",
    `📝 이번 세션이 만든 raw 백로그 ${today_items.length}건`,
    ...today_items.map((s) => {
      const promoted = s.promoted_to ? ` → ${s.promoted_to}` : "";
      const ver = s.target_version ? ` [${s.target_version}]` : "";
      return `- ${s.id}${ver} ${s.title} (${s.status}${promoted})`;
    }),
  ];
}
