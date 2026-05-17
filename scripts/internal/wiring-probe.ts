// POKIT-176 (M7) — wiring 실측 probe. release manifest 의 wiring_status.actual 자동 채움 + retro-check 의 production hit 카운트 단일 진입점.
//
// 사용:
//   const hits = countProductionHits("renderLinearBacklogDescription", rootDir);
//   const { actual, hitCounts } = scanWiring(intended, { rootDir, threshold: 1 });

import { spawnSync } from "node:child_process";

export type ScanWiringOptions = {
  rootDir?: string;
  threshold?: number; // actual 통과 임계값 (기본 1)
  excludeGlobs?: string[]; // 검색 제외 패턴 (기본: tests/, .claude/, node_modules/, memory/)
};

export type ScanWiringResult = {
  actual: string[];
  hitCounts: Record<string, number>;
};

const DEFAULT_EXCLUDES = ["tests/**", ".claude/**", "node_modules/**", "memory/**", "artifacts/**"];

/**
 * production 디렉토리(`scripts/`, `skills/`, `bin/`, `docs/_details/`)에서 id 의 등장 횟수 카운트.
 * ripgrep 가용 시 사용. 부재 시 0 반환 (호출자가 대체 점검 필요).
 */
export function countProductionHits(id: string, rootDir = process.cwd(), excludeGlobs: string[] = DEFAULT_EXCLUDES): number {
  const args = ["--count-matches", "--no-heading"];
  for (const glob of excludeGlobs) {
    args.push("--glob", `!${glob}`);
  }
  args.push("--fixed-strings", id, rootDir);

  const result = spawnSync("rg", args, { encoding: "utf8" });
  if (result.status === 1) return 0; // ripgrep: no matches
  if (result.status !== 0) return 0; // rg 부재 또는 오류 — 보수적으로 0
  let total = 0;
  for (const line of result.stdout.split(/\r?\n/)) {
    const m = line.match(/:(\d+)$/);
    if (m) total += Number.parseInt(m[1], 10);
  }
  return total;
}

/**
 * intended 배열의 각 id에 대해 production hit 측정.
 * threshold 이상이면 actual에 포함.
 *
 * 결과:
 * - actual: hitCount >= threshold 인 id 만 (제출용 wiring_status.actual)
 * - hitCounts: 모든 id 의 hit map (디버깅·gap 분류용)
 */
export function scanWiring(intended: string[], opts: ScanWiringOptions = {}): ScanWiringResult {
  const rootDir = opts.rootDir ?? process.cwd();
  const threshold = opts.threshold ?? 1;
  const excludes = opts.excludeGlobs ?? DEFAULT_EXCLUDES;

  const hitCounts: Record<string, number> = {};
  const actual: string[] = [];
  for (const id of intended) {
    const hits = countProductionHits(id, rootDir, excludes);
    hitCounts[id] = hits;
    if (hits >= threshold) actual.push(id);
  }
  return { actual, hitCounts };
}
