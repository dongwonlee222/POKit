/**
 * POKIT-192: release dispatcher [4.5/8] manifest backfill.
 *
 * manifest 자동 생성 직후 다음 4개 함수를 호출해 비어있는 필드를 채운다:
 *   - collectCycleIssues   : Linear 에서 현재 cycle 이슈 가져와 manifest.issues 채움
 *   - carryForwardUnresolved : 이전 manifest unresolved 항목 carry-forward
 *   - snapshotWiringActual : scanWiring 으로 wiring.actual + gaps 갱신
 *   - escalateUnresolved   : owner=human + cycle_count>=N 이면 owner=agent 자동 전환
 *
 * 같은 패턴(scope별 미결 자동 집계)을 POKIT-194 (session-scope) 와 공유 — 다만
 * release-scope 데이터는 Linear API + 이전 manifest 가 1차 source.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseReleaseManifest, type ReleaseManifest, type ReleaseUnresolved } from "./release-manifest.ts";
import { scanWiring } from "./wiring-probe.ts";

const DEFAULT_HUMAN_ESCALATION_THRESHOLD = 2;

export type CycleIssueLite = {
  id: string;
  identifier: string;
  title: string;
  state?: string;
};

/**
 * Linear cycle 이슈 목록을 manifest.issues 에 채움.
 * 호출자가 listIssues(cycleId) 결과를 주입하는 형태 — Linear API 호출은 위임.
 */
export function collectCycleIssues(
  manifest: ReleaseManifest,
  issues: CycleIssueLite[],
): ReleaseManifest {
  return {
    ...manifest,
    issues: issues.map((i) => ({
      id: i.id,
      identifier: i.identifier,
      title: i.title,
      ...(i.state ? { state: i.state } : {}),
    })),
  };
}

/**
 * 이전 release manifest 의 unresolved 항목 중 promoted_to/done 아닌 것을 현재 manifest 로 이월.
 */
export function carryForwardUnresolved(
  current: ReleaseManifest,
  previous: ReleaseManifest | null,
): ReleaseManifest {
  if (!previous?.unresolved || previous.unresolved.length === 0) return current;
  const existingIds = new Set((current.unresolved ?? []).map((u) => u.id));
  const carryItems: ReleaseUnresolved[] = previous.unresolved
    .filter((u) => !existingIds.has(u.id))
    .map((u) => ({
      ...u,
      cycle_count: (u.cycle_count ?? 1) + 1,
      carried_from: previous.version,
    }));
  if (carryItems.length === 0) return current;
  return {
    ...current,
    unresolved: [...(current.unresolved ?? []), ...carryItems],
  };
}

/**
 * scanWiring 으로 wiring.actual + gaps 갱신.
 * intended 는 buildReleaseManifest 가 이미 채웠다고 가정.
 */
export function snapshotWiringActual(
  manifest: ReleaseManifest,
  opts: { rootDir?: string; threshold?: number } = {},
): ReleaseManifest {
  const intended = manifest.wiring_status.intended;
  if (intended.length === 0) {
    return {
      ...manifest,
      wiring_status: { ...manifest.wiring_status, actual: [], gaps: [] },
    };
  }
  const { actual } = scanWiring(intended, {
    rootDir: opts.rootDir,
    threshold: opts.threshold ?? 1,
  });
  const actualSet = new Set(actual);
  const gaps = intended.filter((id) => !actualSet.has(id));
  return {
    ...manifest,
    wiring_status: { intended, actual, gaps },
  };
}

/**
 * owner=human + cycle_count>=threshold 인 unresolved 항목은 owner=agent 로 자동 전환.
 * "박제 ≠ 실행" 영구 루프 차단.
 */
export function escalateUnresolved(
  manifest: ReleaseManifest,
  threshold: number = DEFAULT_HUMAN_ESCALATION_THRESHOLD,
): ReleaseManifest {
  if (!manifest.unresolved || manifest.unresolved.length === 0) return manifest;
  const updated = manifest.unresolved.map((u) => {
    if (u.owner === "human" && (u.cycle_count ?? 1) >= threshold) {
      return { ...u, owner: "agent", escalated_at: new Date().toISOString() };
    }
    return u;
  });
  return { ...manifest, unresolved: updated };
}

/**
 * 4단계를 한 번에 실행. release.ts [4.5/8] 진입점.
 */
export type BackfillResult = {
  manifest: ReleaseManifest;
  log: {
    issues_added: number;
    carry_forward_count: number;
    wiring_actual: number;
    wiring_gaps: number;
    escalations: number;
  };
};

export function runManifestBackfill(
  manifest: ReleaseManifest,
  opts: {
    issues?: CycleIssueLite[];
    previousManifest?: ReleaseManifest | null;
    rootDir?: string;
    escalationThreshold?: number;
    wiringThreshold?: number;
  } = {},
): BackfillResult {
  const beforeUnresolved = manifest.unresolved?.length ?? 0;
  const beforeIssues = manifest.issues.length;

  // Step 1: collectCycleIssues
  let next = opts.issues ? collectCycleIssues(manifest, opts.issues) : manifest;

  // Step 2: carryForwardUnresolved
  next = carryForwardUnresolved(next, opts.previousManifest ?? null);

  // Step 3: snapshotWiringActual
  next = snapshotWiringActual(next, {
    rootDir: opts.rootDir,
    threshold: opts.wiringThreshold,
  });

  // Step 4: escalateUnresolved
  const beforeEscalations = (next.unresolved ?? []).filter(
    (u) => u.owner === "agent" && "escalated_at" in u,
  ).length;
  next = escalateUnresolved(next, opts.escalationThreshold ?? DEFAULT_HUMAN_ESCALATION_THRESHOLD);
  const afterEscalations = (next.unresolved ?? []).filter(
    (u) => u.owner === "agent" && "escalated_at" in u,
  ).length;

  return {
    manifest: next,
    log: {
      issues_added: next.issues.length - beforeIssues,
      carry_forward_count: (next.unresolved?.length ?? 0) - beforeUnresolved,
      wiring_actual: next.wiring_status.actual.length,
      wiring_gaps: next.wiring_status.gaps.length,
      escalations: afterEscalations - beforeEscalations,
    },
  };
}

/**
 * release.ts 에서 호출하기 위한 비동기 wrapper.
 * 이전 manifest 자동 검색 + (선택) Linear cycle 이슈 fetch.
 */
function compareSemver(a: string, b: string): number {
  const ap = a.replace(/^v/, "").split(".").map(Number);
  const bp = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((ap[i] ?? 0) !== (bp[i] ?? 0)) return (ap[i] ?? 0) - (bp[i] ?? 0);
  }
  return 0;
}

/**
 * releases/ 디렉토리에서 currentVersion 보다 낮은 가장 최근 release manifest 검색.
 */
export function findPreviousReleaseManifest(
  rootDir: string,
  currentVersion: string,
): ReleaseManifest | null {
  const releasesDir = join(rootDir, "releases");
  if (!existsSync(releasesDir)) return null;
  const entries = readdirSync(releasesDir);
  const candidates: { version: string; path: string }[] = [];
  for (const entry of entries) {
    if (!entry.startsWith("v")) continue;
    const v = entry.slice(1);
    if (!/^\d+\.\d+\.\d+/.test(v)) continue;
    if (compareSemver(v, currentVersion) >= 0) continue;
    const p = join(releasesDir, entry, "manifest.yaml");
    if (existsSync(p)) candidates.push({ version: v, path: p });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => compareSemver(b.version, a.version));
  try {
    return parseReleaseManifest(readFileSync(candidates[0].path, "utf8"));
  } catch {
    return null;
  }
}

export async function backfillForRelease(
  manifest: ReleaseManifest,
  opts: {
    rootDir?: string;
    fetchIssues?: () => Promise<CycleIssueLite[]>;
    escalationThreshold?: number;
  } = {},
): Promise<BackfillResult> {
  const rootDir = opts.rootDir ?? process.cwd();
  const previousManifest = findPreviousReleaseManifest(rootDir, manifest.version);
  const issues = opts.fetchIssues ? await opts.fetchIssues() : undefined;

  return runManifestBackfill(manifest, {
    issues,
    previousManifest,
    rootDir,
    escalationThreshold: opts.escalationThreshold,
  });
}
