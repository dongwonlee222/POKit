import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// POKIT-167 G1/T2 — release manifest schema, parser, writer.
// 단일 소스: releases/v<VERSION>/manifest.yaml. (POKIT-175 M6 — 구 memory/releases/v<X>.yaml에서 이동)
// 손으로 yaml을 편집하지 말 것. parseReleaseManifest → 수정 → renderReleaseManifest 또는 writeReleaseManifest 사용.

export type ReleaseIssueType = "feature" | "fix" | "chore";
export type WiringGapCategory = "structural" | "partial" | "bitrot";

export type ReleaseIssue = {
  id: string;
  title: string;
  state: string;
  type: ReleaseIssueType;
};

export type ReleaseArtifacts = {
  code_paths: string[];
  doc_paths: string[];
  skills: string[];
};

export type WiringGap = {
  category: WiringGapCategory;
  note: string;
};

export type WiringStatus = {
  intended: string[];
  actual: string[];
  gaps: WiringGap[];
};

export type ReleaseRetro = {
  kept: string[];
  problem: string[];
  try: string[];
};

// POKIT-173 (M4) — 미결 인계 박제용. 다음 release 시작 시 brief 카드로 노출.
export type ReleaseUnresolved = {
  id: string;
  note: string;
  owner: string; // "human" | "<verb-name>" | "<Linear-issue-id>"
};

export type ReleaseManifest = {
  version: string;
  released_at: string;
  cycle_id: string;
  issues: ReleaseIssue[];
  changelog: string[];
  artifacts: ReleaseArtifacts;
  wiring_status: WiringStatus;
  unresolved?: ReleaseUnresolved[];
  retro?: ReleaseRetro;
  github_release_url?: string;
  git_tag?: string;
};

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const ISO_8601_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const ISSUE_TYPES: ReadonlySet<ReleaseIssueType> = new Set([
  "feature",
  "fix",
  "chore",
]);
const GAP_CATEGORIES: ReadonlySet<WiringGapCategory> = new Set([
  "structural",
  "partial",
  "bitrot",
]);

const YAML_RESERVED = new Set([
  "true",
  "false",
  "null",
  "yes",
  "no",
  "True",
  "False",
  "Null",
  "Yes",
  "No",
  "TRUE",
  "FALSE",
  "NULL",
  "YES",
  "NO",
  "~",
]);

function fail(field: string, detail?: string): never {
  const tail = detail ? `: ${detail}` : "";
  throw new Error(`release manifest: ${field}${tail}`);
}

function needString(value: unknown, field: string): string {
  if (typeof value !== "string") fail(field, "expected string");
  return value;
}

function needStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) fail(field, "expected list");
  return value.map((entry, idx) => {
    if (typeof entry !== "string") fail(`${field}[${idx}]`, "expected string");
    return entry;
  });
}

function validateSemver(version: string): void {
  if (!SEMVER_RE.test(version)) {
    fail("version", `invalid semver "${version}"`);
  }
}

function validateIso8601(value: string): void {
  if (!ISO_8601_RE.test(value) || Number.isNaN(Date.parse(value))) {
    fail("released_at", `invalid ISO 8601 timestamp "${value}"`);
  }
}

// ---------- yaml writer ----------

function needsQuote(value: string): boolean {
  if (value === "") return true;
  if (YAML_RESERVED.has(value)) return true;
  if (/^[\s]/.test(value) || /[\s]$/.test(value)) return true;
  if (/^[-?:&*!|>'"%@`]/.test(value)) return true;
  if (/^[\[\{]/.test(value)) return true;
  if (/[:#]/.test(value)) return true;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return true;
  return false;
}

function quote(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function scalar(value: string): string {
  return needsQuote(value) ? quote(value) : value;
}

function emitStringList(lines: string[], key: string, items: string[], indent: number): void {
  const pad = " ".repeat(indent);
  if (items.length === 0) {
    lines.push(`${pad}${key}: []`);
    return;
  }
  lines.push(`${pad}${key}:`);
  const childPad = " ".repeat(indent + 2);
  for (const item of items) {
    lines.push(`${childPad}- ${scalar(item)}`);
  }
}

export function renderReleaseManifest(manifest: ReleaseManifest): string {
  validateManifest(manifest);

  const lines: string[] = [];
  lines.push(`version: ${scalar(manifest.version)}`);
  lines.push(`released_at: ${scalar(manifest.released_at)}`);
  lines.push(`cycle_id: ${scalar(manifest.cycle_id)}`);

  if (manifest.issues.length === 0) {
    lines.push("issues: []");
  } else {
    lines.push("issues:");
    for (const issue of manifest.issues) {
      lines.push(`  - id: ${scalar(issue.id)}`);
      lines.push(`    title: ${scalar(issue.title)}`);
      lines.push(`    state: ${scalar(issue.state)}`);
      lines.push(`    type: ${scalar(issue.type)}`);
    }
  }

  emitStringList(lines, "changelog", manifest.changelog, 0);

  lines.push("artifacts:");
  emitStringList(lines, "code_paths", manifest.artifacts.code_paths, 2);
  emitStringList(lines, "doc_paths", manifest.artifacts.doc_paths, 2);
  emitStringList(lines, "skills", manifest.artifacts.skills, 2);

  lines.push("wiring_status:");
  emitStringList(lines, "intended", manifest.wiring_status.intended, 2);
  emitStringList(lines, "actual", manifest.wiring_status.actual, 2);
  if (manifest.wiring_status.gaps.length === 0) {
    lines.push("  gaps: []");
  } else {
    lines.push("  gaps:");
    for (const gap of manifest.wiring_status.gaps) {
      lines.push(`    - category: ${scalar(gap.category)}`);
      lines.push(`      note: ${scalar(gap.note)}`);
    }
  }

  if (manifest.unresolved !== undefined) {
    if (manifest.unresolved.length === 0) {
      lines.push("unresolved: []");
    } else {
      lines.push("unresolved:");
      for (const item of manifest.unresolved) {
        lines.push(`  - id: ${scalar(item.id)}`);
        lines.push(`    note: ${scalar(item.note)}`);
        lines.push(`    owner: ${scalar(item.owner)}`);
      }
    }
  }

  if (manifest.retro) {
    lines.push("retro:");
    emitStringList(lines, "kept", manifest.retro.kept, 2);
    emitStringList(lines, "problem", manifest.retro.problem, 2);
    emitStringList(lines, "try", manifest.retro.try, 2);
  }

  if (manifest.github_release_url !== undefined) {
    lines.push(`github_release_url: ${scalar(manifest.github_release_url)}`);
  }
  if (manifest.git_tag !== undefined) {
    lines.push(`git_tag: ${scalar(manifest.git_tag)}`);
  }

  return lines.join("\n") + "\n";
}

function validateManifest(manifest: ReleaseManifest): void {
  validateSemver(manifest.version);
  validateIso8601(manifest.released_at);
  if (typeof manifest.cycle_id !== "string" || manifest.cycle_id.length === 0) {
    fail("cycle_id", "expected non-empty string");
  }
  for (let i = 0; i < manifest.issues.length; i++) {
    const issue = manifest.issues[i];
    if (!issue.id) fail(`issues[${i}].id`, "expected non-empty string");
    if (!issue.title) fail(`issues[${i}].title`, "expected non-empty string");
    if (!issue.state) fail(`issues[${i}].state`, "expected non-empty string");
    if (!ISSUE_TYPES.has(issue.type)) {
      fail(`issues[${i}].type`, `invalid type "${issue.type}"`);
    }
  }
  for (let i = 0; i < manifest.wiring_status.gaps.length; i++) {
    const gap = manifest.wiring_status.gaps[i];
    if (!GAP_CATEGORIES.has(gap.category)) {
      fail(`wiring_status.gaps[${i}].category`, `invalid category "${gap.category}"`);
    }
    if (!gap.note) fail(`wiring_status.gaps[${i}].note`, "expected non-empty string");
  }
}

// ---------- yaml parser ----------

type Line = { indent: number; text: string; lineNo: number };

function tokenize(yaml: string): Line[] {
  const out: Line[] = [];
  const raw = yaml.split(/\r?\n/);
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^( *)(.*)$/);
    const indent = match ? match[1].length : 0;
    const text = match ? match[2] : line;
    out.push({ indent, text, lineNo: i + 1 });
  }
  return out;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const inner = trimmed.slice(1, -1);
    return trimmed.startsWith('"')
      ? inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\")
      : inner;
  }
  return trimmed;
}

function parseInlineList(value: string, field: string): string[] {
  const trimmed = value.trim();
  if (trimmed === "[]") return [];
  if (!(trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    fail(field, "expected inline empty list or block list");
  }
  // We only emit `[]` ourselves; reject non-empty inline lists to keep the
  // parser simple and the writer the single source of formatting.
  fail(field, "non-empty inline lists are not supported; use block form");
}

type ParseContext = {
  lines: Line[];
  idx: number;
};

function peek(ctx: ParseContext): Line | undefined {
  return ctx.lines[ctx.idx];
}

function consume(ctx: ParseContext): Line {
  return ctx.lines[ctx.idx++];
}

function readStringList(ctx: ParseContext, parentIndent: number, field: string, inlineRest: string): string[] {
  if (inlineRest.trim().length > 0) {
    return parseInlineList(inlineRest, field);
  }
  const items: string[] = [];
  while (ctx.idx < ctx.lines.length) {
    const line = peek(ctx)!;
    if (line.indent <= parentIndent) break;
    if (!line.text.startsWith("- ")) break;
    consume(ctx);
    items.push(unquote(line.text.slice(2)));
  }
  return items;
}

function readIssues(ctx: ParseContext, parentIndent: number, inlineRest: string): ReleaseIssue[] {
  if (inlineRest.trim() === "[]") return [];
  if (inlineRest.trim().length > 0) {
    fail("issues", "non-empty inline lists are not supported; use block form");
  }
  const issues: ReleaseIssue[] = [];
  while (ctx.idx < ctx.lines.length) {
    const line = peek(ctx)!;
    if (line.indent <= parentIndent) break;
    const itemHeader = line.text.match(/^- id:\s*(.+)$/);
    if (!itemHeader) break;
    consume(ctx);
    const issue: Partial<ReleaseIssue> = { id: unquote(itemHeader[1]) };
    const childIndent = line.indent + 2;
    while (ctx.idx < ctx.lines.length) {
      const inner = peek(ctx)!;
      if (inner.indent < childIndent) break;
      if (inner.indent === childIndent && inner.text.startsWith("- ")) break;
      consume(ctx);
      const kv = inner.text.match(/^([a-z_]+):\s*(.*)$/);
      if (!kv) fail("issues", `unparseable line ${inner.lineNo}: ${inner.text}`);
      const key = kv[1];
      const value = unquote(kv[2]);
      if (key === "title" || key === "state") {
        (issue as Record<string, string>)[key] = value;
      } else if (key === "type") {
        if (!ISSUE_TYPES.has(value as ReleaseIssueType)) {
          fail("issues[].type", `invalid type "${value}"`);
        }
        issue.type = value as ReleaseIssueType;
      } else {
        fail("issues", `unknown key "${key}"`);
      }
    }
    if (!issue.id) fail("issues", "missing id");
    if (!issue.title) fail("issues", "missing title");
    if (!issue.state) fail("issues", "missing state");
    if (!issue.type) fail("issues", "missing type");
    issues.push(issue as ReleaseIssue);
  }
  return issues;
}

function readGaps(ctx: ParseContext, parentIndent: number, inlineRest: string): WiringGap[] {
  if (inlineRest.trim() === "[]") return [];
  if (inlineRest.trim().length > 0) {
    fail("wiring_status.gaps", "non-empty inline lists are not supported; use block form");
  }
  const gaps: WiringGap[] = [];
  while (ctx.idx < ctx.lines.length) {
    const line = peek(ctx)!;
    if (line.indent <= parentIndent) break;
    const header = line.text.match(/^- category:\s*(.+)$/);
    if (!header) break;
    consume(ctx);
    const category = unquote(header[1]) as WiringGapCategory;
    if (!GAP_CATEGORIES.has(category)) {
      fail("wiring_status.gaps[].category", `invalid category "${category}"`);
    }
    const childIndent = line.indent + 2;
    let note = "";
    while (ctx.idx < ctx.lines.length) {
      const inner = peek(ctx)!;
      if (inner.indent < childIndent) break;
      if (inner.indent === childIndent && inner.text.startsWith("- ")) break;
      consume(ctx);
      const kv = inner.text.match(/^([a-z_]+):\s*(.*)$/);
      if (!kv) fail("wiring_status.gaps", `unparseable line: ${inner.text}`);
      if (kv[1] === "note") note = unquote(kv[2]);
      else fail("wiring_status.gaps", `unknown key "${kv[1]}"`);
    }
    if (!note) fail("wiring_status.gaps[].note", "expected non-empty string");
    gaps.push({ category, note });
  }
  return gaps;
}

export function parseReleaseManifest(yaml: string): ReleaseManifest {
  const ctx: ParseContext = { lines: tokenize(yaml), idx: 0 };

  const seen = new Set<string>();
  let version: string | undefined;
  let released_at: string | undefined;
  let cycle_id: string | undefined;
  let issues: ReleaseIssue[] | undefined;
  let changelog: string[] | undefined;
  let artifacts: ReleaseArtifacts | undefined;
  let wiring_status: WiringStatus | undefined;
  let unresolved: ReleaseUnresolved[] | undefined;
  let retro: ReleaseRetro | undefined;
  let github_release_url: string | undefined;
  let git_tag: string | undefined;

  while (ctx.idx < ctx.lines.length) {
    const line = peek(ctx)!;
    if (line.indent !== 0) {
      fail("top-level", `unexpected indented line ${line.lineNo}: ${line.text}`);
    }
    consume(ctx);
    const kv = line.text.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) fail("top-level", `unparseable line ${line.lineNo}: ${line.text}`);
    const key = kv[1];
    const rest = kv[2];

    if (seen.has(key)) fail(key, "duplicate key");
    seen.add(key);

    switch (key) {
      case "version":
        version = unquote(rest);
        break;
      case "released_at":
        released_at = unquote(rest);
        break;
      case "cycle_id":
        cycle_id = unquote(rest);
        break;
      case "issues":
        issues = readIssues(ctx, 0, rest);
        break;
      case "changelog":
        changelog = readStringList(ctx, 0, "changelog", rest);
        break;
      case "artifacts": {
        if (rest.trim().length > 0) fail("artifacts", "expected block map");
        const map = readMapOfStringLists(ctx, 0, "artifacts", ["code_paths", "doc_paths", "skills"]);
        artifacts = {
          code_paths: map.code_paths ?? fail("artifacts.code_paths", "missing"),
          doc_paths: map.doc_paths ?? fail("artifacts.doc_paths", "missing"),
          skills: map.skills ?? fail("artifacts.skills", "missing"),
        };
        break;
      }
      case "wiring_status": {
        if (rest.trim().length > 0) fail("wiring_status", "expected block map");
        wiring_status = readWiringStatus(ctx, 0);
        break;
      }
      case "unresolved": {
        unresolved = readUnresolved(ctx, 0, rest);
        break;
      }
      case "retro": {
        if (rest.trim().length > 0) fail("retro", "expected block map");
        const map = readMapOfStringLists(ctx, 0, "retro", ["kept", "problem", "try"]);
        retro = {
          kept: map.kept ?? [],
          problem: map.problem ?? [],
          try: map.try ?? [],
        };
        break;
      }
      case "github_release_url":
        github_release_url = unquote(rest);
        break;
      case "git_tag":
        git_tag = unquote(rest);
        break;
      default:
        fail("top-level", `unknown key "${key}"`);
    }
  }

  if (version === undefined) fail("version", "missing field");
  if (released_at === undefined) fail("released_at", "missing field");
  if (cycle_id === undefined) fail("cycle_id", "missing field");
  if (issues === undefined) fail("issues", "missing field");
  if (changelog === undefined) fail("changelog", "missing field");
  if (artifacts === undefined) fail("artifacts", "missing field");
  if (wiring_status === undefined) fail("wiring_status", "missing field");

  const manifest: ReleaseManifest = {
    version,
    released_at,
    cycle_id,
    issues,
    changelog,
    artifacts,
    wiring_status,
  };
  if (unresolved !== undefined) manifest.unresolved = unresolved;
  if (retro) manifest.retro = retro;
  if (github_release_url !== undefined) manifest.github_release_url = github_release_url;
  if (git_tag !== undefined) manifest.git_tag = git_tag;

  validateManifest(manifest);
  return manifest;
}

function readUnresolved(ctx: ParseContext, parentIndent: number, inlineRest: string): ReleaseUnresolved[] {
  if (inlineRest.trim() === "[]") return [];
  if (inlineRest.trim().length > 0) {
    fail("unresolved", "non-empty inline lists are not supported; use block form");
  }
  const items: ReleaseUnresolved[] = [];
  while (ctx.idx < ctx.lines.length) {
    const line = peek(ctx)!;
    if (line.indent <= parentIndent) break;
    const header = line.text.match(/^- id:\s*(.+)$/);
    if (!header) break;
    consume(ctx);
    const item: Partial<ReleaseUnresolved> = { id: unquote(header[1]) };
    const childIndent = line.indent + 2;
    while (ctx.idx < ctx.lines.length) {
      const inner = peek(ctx)!;
      if (inner.indent < childIndent) break;
      if (inner.indent === childIndent && inner.text.startsWith("- ")) break;
      consume(ctx);
      const kv = inner.text.match(/^([a-z_]+):\s*(.*)$/);
      if (!kv) fail("unresolved", `unparseable line: ${inner.text}`);
      if (kv[1] === "note") item.note = unquote(kv[2]);
      else if (kv[1] === "owner") item.owner = unquote(kv[2]);
      else fail("unresolved", `unknown key "${kv[1]}"`);
    }
    if (!item.id) fail("unresolved[].id", "expected non-empty string");
    if (!item.note) fail("unresolved[].note", "expected non-empty string");
    if (!item.owner) fail("unresolved[].owner", "expected non-empty string");
    items.push(item as ReleaseUnresolved);
  }
  return items;
}

function readMapOfStringLists(
  ctx: ParseContext,
  parentIndent: number,
  field: string,
  allowedKeys: string[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const allowed = new Set(allowedKeys);
  while (ctx.idx < ctx.lines.length) {
    const line = peek(ctx)!;
    if (line.indent <= parentIndent) break;
    consume(ctx);
    const kv = line.text.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) fail(field, `unparseable line ${line.lineNo}: ${line.text}`);
    const key = kv[1];
    if (!allowed.has(key)) fail(field, `unknown key "${key}"`);
    out[key] = readStringList(ctx, line.indent, `${field}.${key}`, kv[2]);
  }
  return out;
}

function readWiringStatus(ctx: ParseContext, parentIndent: number): WiringStatus {
  let intended: string[] | undefined;
  let actual: string[] | undefined;
  let gaps: WiringGap[] | undefined;
  while (ctx.idx < ctx.lines.length) {
    const line = peek(ctx)!;
    if (line.indent <= parentIndent) break;
    consume(ctx);
    const kv = line.text.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) fail("wiring_status", `unparseable line ${line.lineNo}: ${line.text}`);
    const key = kv[1];
    if (key === "intended") intended = readStringList(ctx, line.indent, "wiring_status.intended", kv[2]);
    else if (key === "actual") actual = readStringList(ctx, line.indent, "wiring_status.actual", kv[2]);
    else if (key === "gaps") gaps = readGaps(ctx, line.indent, kv[2]);
    else fail("wiring_status", `unknown key "${key}"`);
  }
  if (intended === undefined) fail("wiring_status.intended", "missing");
  if (actual === undefined) fail("wiring_status.actual", "missing");
  if (gaps === undefined) fail("wiring_status.gaps", "missing");
  return { intended, actual, gaps };
}

// ---------- writer ----------

export function releaseManifestPath(version: string, rootDir = process.cwd()): string {
  validateSemver(version);
  // POKIT-175 (M6) — 버전 단위 폴더로 묶음. memory/releases/v<X>.yaml → releases/v<X>/manifest.yaml
  return join(rootDir, "releases", `v${version}`, "manifest.yaml");
}

export async function writeReleaseManifest(
  version: string,
  manifest: ReleaseManifest,
  rootDir = process.cwd(),
): Promise<string> {
  if (manifest.version !== version) {
    fail("version", `argument "${version}" does not match manifest.version "${manifest.version}"`);
  }
  const path = releaseManifestPath(version, rootDir);
  const body = renderReleaseManifest(manifest);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, "utf8");
  return path;
}

// ---------- M2 (POKIT-171) — buildReleaseManifest 자동 생성 ----------

export type BuildReleaseManifestOptions = {
  rootDir?: string;
  now?: Date;
  cycleId?: string;
  issues?: ReleaseIssue[];
  changelog?: string[];
  codePaths?: string[];
  docPaths?: string[];
  skills?: string[];
  unresolved?: ReleaseUnresolved[];
};

/**
 * Build a release manifest skeleton from CHANGELOG + (optional) Linear cycle issues.
 *
 * release dispatcher [4/8]에서 호출. manifest 파일이 없을 때 자동 생성.
 *
 * - issues: 호출자가 Linear cycle context를 넘겨주거나 빈 배열로 시작
 * - changelog: CHANGELOG.md의 `## v<version>` 섹션 bullets 자동 파싱
 * - artifacts: 호출자가 git diff로 채워 넘기거나 빈 배열로 시작
 * - wiring_status: intended/actual/gaps 모두 빈 배열로 초기화 → [6/8] retro-check가 채움
 */
export function buildReleaseManifest(version: string, opts: BuildReleaseManifestOptions = {}): ReleaseManifest {
  validateSemver(version);
  const rootDir = opts.rootDir ?? process.cwd();
  const now = opts.now ?? new Date();

  const changelog = opts.changelog ?? parseChangelogSection(rootDir, version);

  const manifest: ReleaseManifest = {
    version,
    released_at: now.toISOString(),
    cycle_id: opts.cycleId ?? "n/a",
    issues: opts.issues ?? [],
    changelog,
    artifacts: {
      code_paths: opts.codePaths ?? [],
      doc_paths: opts.docPaths ?? [],
      skills: opts.skills ?? [],
    },
    wiring_status: {
      intended: [],
      actual: [],
      gaps: [],
    },
  };

  if (opts.unresolved !== undefined) {
    manifest.unresolved = opts.unresolved;
  }

  validateManifest(manifest);
  return manifest;
}

/**
 * CHANGELOG.md에서 `## v<version>` 섹션의 bullet 추출.
 * `### Added` / `### Changed` 같은 하위 헤더는 그대로 보존.
 * 다음 `## v...` 또는 EOF까지가 한 섹션.
 */
export function parseChangelogSection(rootDir: string, version: string): string[] {
  const path = join(rootDir, "CHANGELOG.md");
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf8");
  const headerRe = new RegExp(`^## v?${escapeRegExp(version)}\\b`, "m");
  const headerMatch = headerRe.exec(content);
  if (!headerMatch) return [];
  const start = headerMatch.index + headerMatch[0].length;
  const tail = content.slice(start);
  const nextHeader = tail.search(/^## v?\d+\.\d+\.\d+/m);
  const section = nextHeader >= 0 ? tail.slice(0, nextHeader) : tail;
  const bullets: string[] = [];
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (/^\s*-\s+/.test(line)) {
      bullets.push(line.replace(/^\s*-\s+/, "").trim());
    }
  }
  return bullets;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
