/**
 * POKIT-159: 장기기억 retrieval (v1 stub).
 *
 * 설계 PRD: docs/architecture/16-retrieval.md
 *
 * 현재 구현 범위 (stub):
 * - decision-log.yaml 소스만 어댑터 구현
 * - 단순 keyword count 점수
 * - 키워드 모두 OR 매칭
 *
 * 159b 에서 backlog-raw / session / release 소스 어댑터 추가 + 점수 산식 정교화.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type RetrievalSource = "decision" | "backlog-raw" | "session" | "release";

export type RetrievalQuery = {
  keywords: string[];
  scope?: RetrievalSource[];
  since?: string;
  limit?: number;
};

export type RetrievalHit = {
  source: RetrievalSource;
  id: string;
  title: string;
  excerpt: string;
  path: string;
  ts: string;
  score: number;
};

export function retrieveContext(query: RetrievalQuery, rootDir = process.cwd()): RetrievalHit[] {
  const scope = query.scope ?? ["decision", "backlog-raw", "session", "release"];
  const limit = query.limit ?? 10;
  const since = query.since;
  const keywords = query.keywords.map((k) => k.toLowerCase()).filter(Boolean);
  if (keywords.length === 0) return [];

  const hits: RetrievalHit[] = [];

  if (scope.includes("decision")) {
    hits.push(...retrieveFromDecisionLog(rootDir, keywords));
  }
  // 159b: backlog-raw / session / release 어댑터 추가 예정

  const filtered = since
    ? hits.filter((h) => h.ts >= since)
    : hits;
  return filtered
    .sort((a, b) => b.score - a.score || (b.ts.localeCompare(a.ts)))
    .slice(0, limit);
}

function retrieveFromDecisionLog(rootDir: string, keywords: string[]): RetrievalHit[] {
  const path = join(rootDir, "memory/decision-log.yaml");
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  // 단순 entry 분리: `  - id:` 헤더 기준
  const entries = raw.split(/\n  - id:\s+/).slice(1);
  const hits: RetrievalHit[] = [];
  for (const entry of entries) {
    const id = (entry.match(/^([^\s\n]+)/) ?? [, ""])[1].trim();
    const ts = (entry.match(/timestamp:\s*"([^"]+)"/) ?? [, ""])[1];
    const title = (entry.match(/title:\s*"([^"]+)"/) ?? [, ""])[1];
    const summary = (entry.match(/summary:\s*"([^"]+)"/) ?? [, ""])[1];
    const body = `${title}\n${summary}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      const occurrences = body.split(kw).length - 1;
      score += occurrences;
    }
    if (score === 0) continue;
    hits.push({
      source: "decision",
      id,
      title,
      excerpt: summary.slice(0, 200),
      path: "memory/decision-log.yaml",
      ts,
      score,
    });
  }
  return hits;
}
