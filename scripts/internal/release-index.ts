// POKIT-204 — Release INDEX.md generator
//
// releases/v<X>/manifest.yaml + 동일 폴더의 prds/criteria/backlog/backlog-raw 를 읽어
// 한 화면에 "계획 / 완료 / 미결 / 산출물 링크" 를 정리한 INDEX.md 를 만든다.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseReleaseManifest, releaseManifestPath } from "./release-manifest.ts";

type IssueLite = {
  id: string;
  title?: string;
  state?: string;
  type?: string;
};

function listMd(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("README"))
    .sort();
}

function renderIssueLine(i: IssueLite): string {
  const icon = (i.state ?? "").toLowerCase() === "done" ? "✅" : (i.state ? "🔄" : "•");
  const tag = i.type ? ` _(${i.type})_` : "";
  return `- ${icon} **${i.id}** — ${i.title ?? "(no title)"}${tag}`;
}

export function renderReleaseIndex(version: string, rootDir: string): string {
  const v = version.startsWith("v") ? version : `v${version}`;
  const releaseDir = join(rootDir, "releases", v);
  const manifestPath = releaseManifestPath(version.replace(/^v/, ""), rootDir);

  if (!existsSync(manifestPath)) {
    throw new Error(`manifest not found: ${manifestPath}`);
  }

  const manifest = parseReleaseManifest(readFileSync(manifestPath, "utf8"));
  const issues: IssueLite[] = (manifest.issues ?? []) as IssueLite[];
  const done = issues.filter((i) => (i.state ?? "").toLowerCase() === "done");
  const inProgress = issues.filter((i) => (i.state ?? "").toLowerCase() !== "done");
  const unresolved = (manifest as any).unresolved ?? [];

  const prds = listMd(join(releaseDir, "prds"));
  const criteria = listMd(join(releaseDir, "criteria"));
  const backlog = listMd(join(releaseDir, "backlog"));
  const backlogRaw = listMd(join(releaseDir, "backlog-raw"));

  const lines: string[] = [];
  lines.push(`# ${v} — Release INDEX`);
  lines.push("");
  lines.push(`> released_at: ${manifest.released_at ?? "(미정)"} · cycle: ${manifest.cycle_id ?? "n/a"}`);
  lines.push("");

  lines.push("## 📋 이슈 (계획)");
  if (issues.length === 0) {
    lines.push("_(manifest issues 비어 있음)_");
  } else {
    for (const i of issues) lines.push(renderIssueLine(i));
  }
  lines.push("");

  lines.push("## ✅ 완료");
  if (done.length === 0) lines.push("_(없음)_");
  else for (const i of done) lines.push(`- **${i.id}** — ${i.title ?? ""}`);
  lines.push("");

  if (inProgress.length > 0) {
    lines.push("## 🔄 진행 중 / 미완");
    for (const i of inProgress) lines.push(`- **${i.id}** — ${i.title ?? ""} _(state: ${i.state ?? "?"})_`);
    lines.push("");
  }

  if (Array.isArray(unresolved) && unresolved.length > 0) {
    lines.push("## ⏭️ 미결 → 다음 cycle");
    for (const u of unresolved) {
      const owner = u.owner ? ` _(owner: ${u.owner})_` : "";
      lines.push(`- **${u.id}** — ${u.title ?? ""}${owner}`);
    }
    lines.push("");
  }

  lines.push("## 📝 Changelog");
  for (const c of manifest.changelog ?? []) lines.push(`- ${c}`);
  lines.push("");

  lines.push("## 📂 산출물");
  const section = (label: string, dir: string, files: string[]) => {
    if (files.length === 0) return;
    lines.push(`### ${label} (${files.length})`);
    for (const f of files) lines.push(`- [${f}](./${dir}/${f})`);
    lines.push("");
  };
  section("PRDs", "prds", prds);
  section("Criteria", "criteria", criteria);
  section("Backlog", "backlog", backlog);
  section("Backlog (raw)", "backlog-raw", backlogRaw);
  if (prds.length + criteria.length + backlog.length + backlogRaw.length === 0) {
    lines.push("_(이관된 산출물 없음)_");
    lines.push("");
  }

  lines.push("## 🔗 메타");
  lines.push(`- [manifest.yaml](./manifest.yaml)`);
  lines.push("");

  return lines.join("\n");
}

export function writeReleaseIndex(version: string, rootDir: string): string {
  const v = version.startsWith("v") ? version : `v${version}`;
  const path = join(rootDir, "releases", v, "INDEX.md");
  const content = renderReleaseIndex(version, rootDir);
  writeFileSync(path, content, "utf8");
  return path;
}
