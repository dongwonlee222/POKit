// POKIT-167 G2/T7 — 이전 버전 release manifest 점검 + pokit:gap Linear 이슈 자동 등록.
//
// 갭 3분류:
//   structural — manifest.wiring_status.intended 에 있으나 actual ∌ id 이고 production grep 0건.
//                인터페이스/스키마만 만들어졌고 어느 호출처도 wiring 되지 않음.
//   bitrot     — intended ∋ id 이고 actual ∋ id (한때 wiring 되었다고 기록) 이지만 현재 production grep 0건.
//                이후 리팩토링으로 끊어진 상태.
//   partial    — intended ∋ id 이고 production grep hit > 0 이지만 expectedMinHits 미만,
//                또는 actual ∌ id 인 채로 hit > 0 (일부만 wiring).
//
// 외부 write 경로는 반드시 `planCreateIssue` / `applyCreateIssue` 를 경유한다.
// raw GraphQL 호출은 G1 T3 hook 이 차단하므로 여기서 직접 fetch 하지 않는다.

import {
  buildBacklogTitle,
  renderLinearBacklogDescription,
  type LinearBacklogDescriptionInput,
} from "./backlog-outline.ts";
import {
  applyCreateIssue,
  planCreateIssue,
  type ApplyOptions,
  type Issue,
  type Plan,
} from "./linear.ts";
import {
  parseReleaseManifest,
  releaseManifestPath,
  type ReleaseManifest,
  type WiringGap,
} from "./release-manifest.ts";

export type ProductionHitCounts = Record<string, number>;

export type AnalyzeVersionWiringOptions = {
  /**
   * Wiring id 별 production grep hit 수. 호출자(주로 CLI)가 미리 rg/grep 으로 집계해 주입한다.
   * 키 누락 시 0 으로 간주.
   */
  productionHitCounts: ProductionHitCounts;
  /**
   * partial 판정 임계값. id 별로 다르게 주고 싶으면 map 사용. 기본값 1
   * (즉 intended 인데 actual 에 없고 hit > 0 이면 partial).
   */
  expectedMinHits?: number | Record<string, number>;
};

export type GapReport = {
  version: string;
  gaps: WiringGap[];
  /**
   * 진단 상세 — 각 intended id 가 어떻게 분류되었는지. 디버깅·CLI 출력용.
   */
  details: Array<{
    id: string;
    inActual: boolean;
    hits: number;
    expectedMin: number;
    category: WiringGap["category"] | "ok";
  }>;
};

function expectedMinFor(
  id: string,
  expected: AnalyzeVersionWiringOptions["expectedMinHits"],
): number {
  if (expected === undefined) return 1;
  if (typeof expected === "number") return expected;
  return expected[id] ?? 1;
}

export function analyzeVersionWiring(
  manifest: ReleaseManifest,
  options: AnalyzeVersionWiringOptions,
): GapReport {
  const actualSet = new Set(manifest.wiring_status.actual);
  const gaps: WiringGap[] = [];
  const details: GapReport["details"] = [];

  for (const id of manifest.wiring_status.intended) {
    const inActual = actualSet.has(id);
    const hits = options.productionHitCounts[id] ?? 0;
    const expectedMin = expectedMinFor(id, options.expectedMinHits);

    let category: WiringGap["category"] | "ok";
    let note: string | undefined;

    if (!inActual && hits === 0) {
      category = "structural";
      note = `v${manifest.version} "${id}" intended but no production wiring (actual=∅, grep=0).`;
    } else if (inActual && hits === 0) {
      category = "bitrot";
      note = `v${manifest.version} "${id}" recorded in wiring_status.actual but grep finds 0 production hits — wiring removed by later refactor.`;
    } else if (hits > 0 && hits < expectedMin) {
      category = "partial";
      note = `v${manifest.version} "${id}" wiring only partial (grep hits=${hits} < expected ${expectedMin}); some call sites bypass the canonical entry point.`;
    } else if (!inActual && hits > 0) {
      category = "partial";
      note = `v${manifest.version} "${id}" intended; grep finds ${hits} production reference(s) but wiring_status.actual does not list it — manifest drift.`;
    } else {
      category = "ok";
    }

    details.push({ id, inActual, hits, expectedMin, category });
    if (category !== "ok") {
      gaps.push({ category, note: note! });
    }
  }

  return { version: manifest.version, gaps, details };
}

// ---------- Linear dispatch ----------

export type DispatchOptions = {
  dryRun?: boolean;
  /**
   * 4섹션 본문 생성 시 사용되는 release 메타. 누락 시 manifest 에서 추론.
   */
  release?: LinearBacklogDescriptionInput["release"];
  /**
   * planCreateIssue 만 호출하고 applyCreateIssue 는 건너뛸지. dryRun=true 면 자동으로 true.
   */
  applyOptions?: ApplyOptions;
  /**
   * 라벨. 기본은 ["pokit:gap"]. spec 상 라벨명은 "pokit:gap" 고정.
   */
  labels?: string[];
};

export type DispatchedGap = {
  gap: WiringGap;
  title: string;
  description: string;
  plan: Plan;
  issue?: Issue;
};

const GAP_LABEL = "pokit:gap";

function shortDescription(note: string, max = 80): string {
  const trimmed = note.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max - 1) + "…";
}

function categoryAction(category: WiringGap["category"]): string {
  switch (category) {
    case "structural":
      return "structural wiring 0건 — production 호출처 연결";
    case "partial":
      return "partial wiring 보강 — 우회 호출처 표준 진입점으로 통일";
    case "bitrot":
      return "bitrot 복구 — 끊어진 wiring 재연결";
  }
}

function buildDescription(
  version: string,
  gap: WiringGap,
  release: DispatchOptions["release"],
  idempotencyKey: string,
  labels: string[],
): { title: string; description: string } {
  const action = categoryAction(gap.category);
  const title = buildBacklogTitle({
    status: "definition_needed",
    scope: `v${version} wiring`,
    action: `${gap.category} — ${shortDescription(gap.note, 60)}`,
  });

  const description = renderLinearBacklogDescription({
    purpose: `v${version} 릴리스 산출물의 wiring 갭(${gap.category})을 해소해 release manifest 의도와 실제 production 사용을 일치시킨다.`,
    userVisibleChange:
      "내부 운영 품질 개선. 사용자에게 직접 보이는 변화는 없으나 후속 회귀 위험이 감소한다.",
    doneCondition: `해당 wiring id 의 production grep 결과가 0 → 1+ 로 전환되고, release manifest 의 wiring_status.actual 이 갱신된다. (${gap.note})`,
    scope: `v${version} 점검에서 검출된 갭 1건: ${gap.note}`,
    outOfScope:
      "동일 버전의 다른 갭, 그리고 다른 릴리스 버전의 wiring 점검 (별도 이슈로 분리).",
    evidence: [
      `release manifest: ${releaseManifestPathDisplay(version)}`,
      `pokit retro-check v${version} (T7)`,
      `category: ${gap.category}`,
      `note: ${gap.note}`,
    ],
    release: release ?? { kind: "none" },
    linearVariables: {
      state: "Backlog",
      labels,
      source: "retro",
      idempotencyKey,
    },
    asIs: `v${version} ${gap.category} 갭 존재: ${gap.note}`,
    toBe: `${action}. release manifest 의 wiring_status.actual 이 grep 실측과 일치.`,
    successVerification: `\`pokit retro-check ${version}\` 가 해당 id 에 대해 gap 을 더 이상 검출하지 않는다 (production grep hit ≥ 1 확인).`,
    responsibleAgents: {
      design: "TBD",
      build: "TBD",
      review: "TBD",
      timeline: "TBD",
    },
  });

  return { title, description };
}

function releaseManifestPathDisplay(version: string): string {
  // For description text — show repo-relative path, not absolute.
  return `releases/v${version}/manifest.yaml`;
}

function idempotencyKeyFor(version: string, gap: WiringGap): string {
  const slug = gap.note
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `pokit:gap:v${version}:${gap.category}:${slug}`;
}

export async function dispatchGapsToLinear(
  version: string,
  gaps: WiringGap[],
  options: DispatchOptions = {},
): Promise<DispatchedGap[]> {
  const dryRun = options.dryRun ?? true;
  const labels = options.labels ?? [GAP_LABEL];
  const release = options.release;

  const dispatched: DispatchedGap[] = [];
  for (const gap of gaps) {
    const idempotencyKey = idempotencyKeyFor(version, gap);
    const { title, description } = buildDescription(
      version,
      gap,
      release,
      idempotencyKey,
      labels,
    );
    const plan = await planCreateIssue({
      title,
      description,
      labels,
    });
    const result: DispatchedGap = { gap, title, description, plan };
    if (!dryRun) {
      result.issue = await applyCreateIssue(plan, options.applyOptions ?? {});
    }
    dispatched.push(result);
  }
  return dispatched;
}

// ---------- CLI helper ----------

export type RetroCheckCliOptions = {
  version: string;
  rootDir?: string;
  dryRun?: boolean;
  noDispatch?: boolean;
  /**
   * Injected reader — tests stub this. 기본은 fs 에서 manifest 를 읽음.
   */
  readManifest?: (version: string, rootDir?: string) => Promise<ReleaseManifest>;
  /**
   * Injected grep — tests stub. 기본은 ripgrep 으로 production 디렉토리만 검색.
   */
  countProductionHits?: (id: string, rootDir?: string) => Promise<number>;
};

export type RetroCheckCliResult = {
  report: GapReport;
  dispatched: DispatchedGap[];
};

async function defaultReadManifest(
  version: string,
  rootDir?: string,
): Promise<ReleaseManifest> {
  const { readFile } = await import("node:fs/promises");
  const path = releaseManifestPath(version, rootDir);
  const yaml = await readFile(path, "utf8");
  return parseReleaseManifest(yaml);
}

export async function runRetroCheckCli(
  options: RetroCheckCliOptions,
): Promise<RetroCheckCliResult> {
  const readManifest = options.readManifest ?? defaultReadManifest;
  const manifest = await readManifest(options.version, options.rootDir);

  const hitCounts: ProductionHitCounts = {};
  if (options.countProductionHits) {
    for (const id of manifest.wiring_status.intended) {
      hitCounts[id] = await options.countProductionHits(id, options.rootDir);
    }
  }

  const report = analyzeVersionWiring(manifest, {
    productionHitCounts: hitCounts,
  });

  let dispatched: DispatchedGap[] = [];
  if (!options.noDispatch && report.gaps.length > 0) {
    dispatched = await dispatchGapsToLinear(options.version, report.gaps, {
      dryRun: options.dryRun ?? true,
    });
  }

  return { report, dispatched };
}
