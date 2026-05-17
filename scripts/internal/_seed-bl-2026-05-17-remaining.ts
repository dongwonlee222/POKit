/**
 * 일회용 잔여 등록 스크립트 — 8건 (7 create + 1 update)
 *
 * 대상: bl-005, 006, 011 (v0.17.1) / bl-007, 008, 009, 010 (v0.17.2 create) /
 *       bl-003 (v0.17.2 update — POKIT-192 description append)
 *
 * 본 스크립트는 일회용 — bl-011(backlog-promote) 완성 후 삭제
 *
 * 사용:
 *   node --experimental-strip-types scripts/internal/_seed-bl-2026-05-17-remaining.ts dry-run
 *   node --experimental-strip-types scripts/internal/_seed-bl-2026-05-17-remaining.ts apply
 */
import {
  applyCreateIssue,
  applyUpdateIssue,
  planCreateIssue,
  planUpdateIssue,
  type IssueInput,
  type IssueUpdateInput,
} from "./linear.ts";

type SeedCreate = { kind: "create"; blId: string; memoFile: string; input: IssueInput };
type SeedUpdate = { kind: "update"; blId: string; memoFile: string; input: IssueUpdateInput };
type Seed = SeedCreate | SeedUpdate;

const SEED: Seed[] = [
  // ── bl-005 (v0.17.1) ──────────────────────────────────────────────
  {
    kind: "create",
    blId: "bl-2026-05-17-005",
    memoFile: "memory/backlog-raw/bl-2026-05-17-005-decision-log-md-yaml-sync.md",
    input: {
      title:
        "[v0.17.1] decision-log.md ↔ decision-log.yaml 동기화 (linear.ts CLI append 보강)",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "linear.ts CLI가 decision 확정 시 decision-log.yaml만 append하고 .md 동기화 부재. 사람 가독 / LLM 가독 양식이 불일치해 검색 시 한쪽에만 있는 항목 발생.",
        userVisibleChange:
          "decision append 시 yaml + md 동시 갱신. 두 파일 entries count 일치. backfill 1회로 기존 차이도 정리됨.",
        doneCondition:
          "신규 결정 1건 append → yaml + md 동시 갱신 확인. backfill 후 entries count 동일. 통합 테스트 PASS.",
        scope:
          "scripts/internal/linear.ts append 경로, decision-log.md 본문 형식 표준화, backfill 스크립트(일회용).",
        outOfScope:
          "decision-log 양식 자체 변경, 새 메타 필드 추가, 외부 시스템 동기화.",
        evidence: [
          "v0.16.0 manifest unresolved: decision-log-md-sync",
          "memory/backlog-raw/bl-2026-05-17-005-decision-log-md-yaml-sync.md",
        ],
        release: { kind: "minor", targetVersion: "v0.17.1" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-005-decision-log-md-yaml-sync",
        },
        asIs:
          "linear.ts CLI가 decision 확정 시 decision-log.yaml만 append. decision-log.md 부재 → 가독·검색 불일치.",
        toBe:
          "append 시 yaml + md 동시 갱신. md 본문: 일자/결정/사유/출처. backfill 1회 실행으로 기존 차이 정리.",
        successVerification:
          "yaml entries == md 결정 수 일치. 신규 1건 append 후 양쪽 갱신 확인. bl-002 collectUnresolved에서 decision-log 일관성 전제 충족.",
      },
    },
  },

  // ── bl-006 (v0.17.1) ──────────────────────────────────────────────
  {
    kind: "create",
    blId: "bl-2026-05-17-006",
    memoFile: "memory/backlog-raw/bl-2026-05-17-006-dogfood-references-cleanup.md",
    input: {
      title:
        "[v0.17.1] dogfood historical 참조 정리 (docs/PRD.md, docs/DESIGN.md 등)",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "docs 하위 파일에 dogfood historical 참조가 남아 신규 작업자가 혼선. 사용자 결정에 따라 정리(제거) 방향으로 진행.",
        userVisibleChange:
          "docs/PRD.md, docs/DESIGN.md 등 진입 시 dogfood 노이즈 0. 의도된 historical 참조는 'Historical:' 라벨로 명시.",
        doneCondition:
          "rg 'dogfood' docs/ 결과 = 의도된 historical만 (Historical: 라벨 동반). PR description에 제거/유지 분류 기준 명시.",
        scope:
          "docs/PRD.md, docs/DESIGN.md, 기타 docs/ 하위 파일에서 dogfood 참조 분류 + 제거 또는 라벨 부여.",
        outOfScope:
          "코드 주석의 dogfood 참조 (별도 결정), CHANGELOG의 historical 항목.",
        evidence: [
          "v0.16.0 manifest unresolved: dogfood-references-cleanup",
          "memory/backlog-raw/bl-2026-05-17-006-dogfood-references-cleanup.md",
          "사용자 결정 (2026-05-17): 정리 방향 (옵션 B)",
        ],
        release: { kind: "minor", targetVersion: "v0.17.1" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-006-dogfood-references-cleanup",
        },
        asIs:
          "docs/PRD.md, docs/DESIGN.md 등에 historical dogfood 참조 존재. 의도 유지 vs 정리 결정 미정 → 신규 작업자 혼선.",
        toBe:
          "운영 영향 0 + 단순 회고 = 제거. 정책·근거 참조 = 'Historical:' 라벨로 보존. docs/ 일괄 정리.",
        successVerification:
          "rg 'dogfood' docs/ 결과 = 의도된 historical만. 첫 진입 시 노이즈 0. 정리 기준 PR description에 박힘.",
      },
    },
  },

  // ── bl-011 (v0.17.1, NEW) ─────────────────────────────────────────
  {
    kind: "create",
    blId: "bl-2026-05-17-011",
    memoFile:
      "memory/backlog-raw/bl-2026-05-17-011-backlog-raw-to-linear-batch-runner.md",
    input: {
      title:
        "[v0.17.1] backlog-promote 스킬 + CLI — raw 메모 Linear 배치 승격 (자연어 진입)",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "raw memo → Linear 배치 승격 자동화. 일회용 스크립트 반복 작성 비용(batch당 60-90분) 제거. 사용자·LLM·sub-agent 공통 진입점 제공.",
        userVisibleChange:
          "'Linear에 v0.17.1 다 등록해줘' 자연어 발화 → dry-run → 승인 → apply 흐름. memo frontmatter 자동 갱신. decision-log append 자동.",
        doneCondition:
          "skills/backlog-promote/SKILL.md + scripts/cli/backlog-promote.ts + ./bin/pokit verb-dispatch 라우팅 완성. bl-005·006 시뮬레이션 등록 PASS. memo 자동 갱신 검증.",
        scope:
          "Layer 1 자연어 진입, Layer 2 스킬, Layer 3 CLI, Layer 4 기존 linear.ts 함수 재사용. 의존성 그래프 분석. create/update 모드 양쪽.",
        outOfScope:
          "Linear API 신규 엔드포인트, 외부 CLI wrapper, 자동 apply (사용자 승인 게이트 유지).",
        evidence: [
          "사용자 발화 (2026-05-17): '다음부터는 배치러너 만들어야겠네 계속 사용할 수 있게'",
          "memory/backlog-raw/bl-2026-05-17-011-backlog-raw-to-linear-batch-runner.md",
          "ROI: batch당 1.5h 절약, 1년 +28h",
        ],
        release: { kind: "minor", targetVersion: "v0.17.1" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-011-backlog-promote",
        },
        asIs:
          "2026-05-17 부트스트랩 시 250줄 일회용 스크립트 작성. 다음 batch마다 동일 패턴 반복 = batch당 60-90분 추가 비용. sub-agent 사용 불가.",
        toBe:
          "스킬(backlog-promote) + CLI(pokit backlog promote) 4계층. 자연어→파라미터→dry-run→승인→apply→memo 자동 갱신→decision-log append. 사용자·LLM·sub-agent·hook 공통.",
        successVerification:
          "bl-005·006 등록 = 스킬 1회 호출 + 1회 승인. memo 자동 갱신. decision-log 누락 0. batch당 30분 이내. _seed-*.ts 폐기.",
      },
    },
  },

  // ── bl-007 (v0.17.2) ──────────────────────────────────────────────
  {
    kind: "create",
    blId: "bl-2026-05-17-007",
    memoFile: "memory/backlog-raw/bl-2026-05-17-007-c4-phase2-and-m6.md",
    input: {
      title:
        "[v0.17.2] C4 Phase 2 전수 마이그레이션 + M6 (artifacts/ → releases/v*/) 묶음 처리",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "C4 Phase 1 후 잔여 95 파일 마이그레이션 + M6 (artifacts/ → releases/v*/) 묶음 처리. 산출물 경로 통일 + contract test warn → block 승격.",
        userVisibleChange:
          "rg 'artifacts/(prds|criteria|sprints)/' 결과 0건. contract test block 모드 PASS. pokit start / pokit release 경로 표시 정확. 외부 참조 dead link 0.",
        doneCondition:
          "95 파일 releases/v*/ 이동, artifacts/ 잔여 정리, contract test block 승격, 산출물 위치 룰을 docs/architecture/01-document-roles.md 박힘.",
        scope:
          "criteria 29 / prds 3 / sprints / docs / notes / problem-reviews 마이그레이션. M6 흡수. manifest YAML 경로 필드 갱신. 외부 참조 링크 검사.",
        outOfScope:
          "산출물 양식 자체 변경, 신규 디렉토리 도입, contract test 룰 재설계.",
        evidence: [
          "v0.16.0 manifest unresolved: c4-phase2-full-migration, artifacts-migration",
          "memory/backlog-raw/bl-2026-05-17-007-c4-phase2-and-m6.md",
          "사용자 결정: 묶음 (옵션 A)",
        ],
        release: { kind: "minor", targetVersion: "v0.17.2" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-007-c4-phase2-and-m6",
        },
        asIs:
          "C4 Phase 1 완료, 잔여 95 파일 미이행. contract test warn 수준. artifacts/{prds,criteria,sprints}/ → releases/v*/ M6 별도 항목 존재.",
        toBe:
          "95 파일 releases/v*/ 이동 + M6 흡수 + contract test block 승격 + 위치 룰 docs/architecture에 박힘.",
        successVerification:
          "rg artifacts/* 결과 0건. contract test block PASS. 외부 dead link 0. manifest 경로 필드 정확.",
      },
    },
  },

  // ── bl-008 (v0.17.2) ──────────────────────────────────────────────
  {
    kind: "create",
    blId: "bl-2026-05-17-008",
    memoFile:
      "memory/backlog-raw/bl-2026-05-17-008-linear-cli-assign-label-cumulative.md",
    input: {
      title:
        "[v0.17.2] linear.ts CLI assign-label 누적 보존 (덮어쓰기 → append)",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "assign-label apply가 기존 라벨 덮어쓰기. 누적 라벨(pokit:prd + cycle + state) 손실 위험. --mode add(기본) / --mode replace로 명시.",
        userVisibleChange:
          "assign-label 기본 동작이 union(누적). replace는 명시 시에만. dry-run에 before/after 라벨 diff 표시.",
        doneCondition:
          "기본 add 동작 PASS, replace 모드 명시 시만 덮어쓰기, dry-run diff 출력, 통합 테스트 PASS.",
        scope:
          "scripts/internal/linear.ts assign-label 경로, CLI 옵션 추가, dry-run 포맷 보강.",
        outOfScope:
          "라벨 자체 추가/삭제, Linear API 신규 엔드포인트.",
        evidence: [
          "v0.16.0 manifest unresolved: assign-label-cumulative",
          "memory/backlog-raw/bl-2026-05-17-008-linear-cli-assign-label-cumulative.md",
        ],
        release: { kind: "minor", targetVersion: "v0.17.2" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-008-assign-label-cumulative",
        },
        asIs:
          "assign-label apply가 기존 라벨 덮어쓰기. 누적 보존 로직 부재. 기존 라벨 손실 사례 발생 가능.",
        toBe:
          "--mode add(기본) union / --mode replace 명시 덮어쓰기. dry-run에 before/after 라벨 diff.",
        successVerification:
          "기존 3개 + 신규 1개 → 결과 4개 (add). replace는 명시 시. dry-run diff 가독 PASS.",
      },
    },
  },

  // ── bl-009 (v0.17.2) ──────────────────────────────────────────────
  {
    kind: "create",
    blId: "bl-2026-05-17-009",
    memoFile: "memory/backlog-raw/bl-2026-05-17-009-hook-whitelist-node-flags.md",
    input: {
      title:
        "[v0.17.2] block-linear-api.sh 화이트리스트 node 플래그 매칭 보강",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "block-linear-api.sh hook이 node 옵션 플래그(--experimental-strip-types 등) 미매칭. defense-in-depth 우회 위험. 정규식 매칭 강화.",
        userVisibleChange:
          "허용 명령(`node --experimental-strip-types ...`) PASS, 비허용(`curl api.linear.app`) 정상 차단. 차단 사유 로그 명확.",
        doneCondition:
          "화이트리스트 정규식 보강, allow/deny 테스트 매트릭스 PASS 100%, 차단 로그 포맷 명확.",
        scope:
          ".claude/hooks/block-linear-api.sh (또는 scripts/hooks/), 매칭 정규식, 테스트 매트릭스.",
        outOfScope:
          "Linear API write 정책 변경, 신규 hook 도입, 보안 모델 재설계.",
        evidence: [
          "v0.16.0 manifest unresolved: hook-whitelist-node-flags",
          "memory/backlog-raw/bl-2026-05-17-009-hook-whitelist-node-flags.md",
        ],
        release: { kind: "minor", targetVersion: "v0.17.2" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-009-hook-whitelist-node-flags",
        },
        asIs:
          "block-linear-api.sh 화이트리스트가 node --experimental-strip-types 플래그 미매칭. defense-in-depth 우회 또는 오차단 발생.",
        toBe:
          "정규식 강화 (node + 옵션 플래그 N개 + 스크립트 경로). allow/deny 테스트 매트릭스. 로그 명확.",
        successVerification:
          "node --experimental-strip-types ... PASS. curl api.linear.app 차단. 테스트 100% PASS.",
      },
    },
  },

  // ── bl-010 (v0.17.2) ──────────────────────────────────────────────
  {
    kind: "create",
    blId: "bl-2026-05-17-010",
    memoFile: "memory/backlog-raw/bl-2026-05-17-010-regression-test-naming.md",
    input: {
      title:
        "[v0.17.2] regression 테스트 명명 표준화 + _setup/ 공통 helper + tests/ci/ 분리",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "regression 테스트 파일명 표준화(v<ver>-<bug>.test.mjs) + _setup/ helper + ci/ 분리. WF11 후속 종결.",
        userVisibleChange:
          "tests/regression/ 일관 명명, tests/_setup/ 공통 helper, tests/ci/ 분리. CI 워크플로우 경로 갱신.",
        doneCondition:
          "회귀 테스트 100% v<ver>-<bug>.test.mjs 패턴. _setup/ 최소 3 모듈 재사용. ci/ 분리. 전체 테스트 결과 회귀 0.",
        scope:
          "tests/ 디렉토리 재배치, 공통 setup 추출, CI 워크플로우 경로 수정, 명세 문서 갱신.",
        outOfScope:
          "테스트 프레임워크 변경, 새 테스트 추가, CI 실행 환경 변경.",
        evidence: [
          "v0.16.0 manifest unresolved: tests-regression-naming-helpers",
          "memory/backlog-raw/bl-2026-05-17-010-regression-test-naming.md",
        ],
        release: { kind: "minor", targetVersion: "v0.17.2" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-010-regression-test-naming",
        },
        asIs:
          "regression 테스트 파일명 들쭉날쭉. _setup/ 부재. ci 전용 테스트와 일반 unit 경계 불명확.",
        toBe:
          "tests/{unit,integration,regression,ci,_setup}/ 구조. 회귀 명명 v<ver>-<bug>.test.mjs. 공통 helper 추출.",
        successVerification:
          "회귀 100% 패턴 매칭. _setup/ 3+ 재사용. ci/ 분리. 전체 테스트 회귀 0.",
      },
    },
  },

  // ── bl-003 (v0.17.2, UPDATE) ──────────────────────────────────────
  {
    kind: "update",
    blId: "bl-2026-05-17-003",
    memoFile: "memory/backlog-raw/bl-2026-05-17-003-pokit-192-redefine.md",
    input: {
      issueIdentifier: "POKIT-192",
      descriptionAppend: [
        "## 재정의 (2026-05-17, bl-2026-05-17-003)",
        "",
        "### 배경",
        "",
        "POKIT-192 (WF15 release dispatcher [4.5/8] manifest backfill 자동화)는 본질적으로 bl-2026-05-17-002 (session-scope 미결 집계 = POKIT-194)와 동일한 'scope별 미결 자동 집계' 패턴이다. 따로 구현 시 중복 + drift 위험.",
        "",
        "### 재정의 내용",
        "",
        "- POKIT-194 (bl-002) 완료 후 진입",
        "- POKIT-194의 `collectUnresolved(scope='session')` 패턴을 release-scope로 재활용 평가 (Rule of three — 두 번째 사용처 등장 시 함수 추출)",
        "- release dispatcher [4.5/8] 단계로 추가",
        "  - Linear cycle issues 자동 수집",
        "  - backlog-raw/ 누락 후보 알림 (promoted_to=null & target_version=현재 cycle)",
        "  - carry-forward 자동 이월",
        "  - wiring.actual probe",
        "  - owner=human N cycle 카운트 정책",
        "",
        "### 의존성",
        "",
        "- depends_on: POKIT-194 (bl-002)",
        "- target_version: v0.17.2",
        "",
        "### 성공 검증",
        "",
        "- `./bin/pokit release v0.17.2` 실행 시 [4.5/8] 단계 진입 + manifest unresolved 자동 채움",
        "- v0.17.2 manifest carry-forward 항목 자동 포함",
        "- wiring.actual probe 결과 YAML 반영",
        "- POKIT-194 collectUnresolved 재사용 (중복 구현 0)",
        "- owner=human N cycle 카운트 시나리오 1건 검증",
        "",
        "### 출처",
        "",
        "- memory/backlog-raw/bl-2026-05-17-003-pokit-192-redefine.md",
        "- v0.16.0 manifest unresolved: wf15-manifest-backfill → routed_to: bl-2026-05-17-003",
      ].join("\n"),
    },
  },
];

function fmtCreate(item: SeedCreate, idx: number, total: number): string {
  const desc = item.input.description!;
  return [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `[${idx + 1}/${total}] ${item.blId} → CREATE`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `제목  : ${item.input.title}`,
    `라벨  : ${item.input.labels?.join(", ") ?? "(없음)"}`,
    `target: ${desc.release.targetVersion ?? "none"}`,
    `idem  : ${desc.linearVariables.idempotencyKey}`,
    `목적  : ${desc.purpose.slice(0, 140)}${desc.purpose.length > 140 ? "..." : ""}`,
    ``,
  ].join("\n");
}

function fmtUpdate(item: SeedUpdate, idx: number, total: number): string {
  return [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `[${idx + 1}/${total}] ${item.blId} → UPDATE`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `대상  : ${item.input.issueIdentifier}`,
    `모드  : description append`,
    `추가  : ${item.input.descriptionAppend?.split("\n")[0]} ...`,
    `(전체 ${item.input.descriptionAppend?.length ?? 0} 자)`,
    ``,
  ].join("\n");
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "dry-run";
  if (!["dry-run", "apply"].includes(mode)) {
    console.error(`Unknown mode: ${mode}. Use 'dry-run' or 'apply'.`);
    process.exit(1);
  }

  console.log(`mode=${mode} items=${SEED.length}\n`);

  if (mode === "dry-run") {
    for (let i = 0; i < SEED.length; i++) {
      const item = SEED[i];
      if (item.kind === "create") {
        await planCreateIssue(item.input);
        console.log(fmtCreate(item, i, SEED.length));
      } else {
        await planUpdateIssue(item.input);
        console.log(fmtUpdate(item, i, SEED.length));
      }
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`dry-run complete. ${SEED.length}건 등록 준비 OK.`);
    console.log(
      `apply 진입: node --experimental-strip-types scripts/internal/_seed-bl-2026-05-17-remaining.ts apply`,
    );
    return;
  }

  // apply
  const issued: Array<{ blId: string; identifier: string; kind: string }> = [];
  for (let i = 0; i < SEED.length; i++) {
    const item = SEED[i];
    if (item.kind === "create") {
      const plan = await planCreateIssue(item.input);
      const issue = await applyCreateIssue(plan, { approved: true, actor: "main_agent" });
      console.log(
        `[${i + 1}/${SEED.length}] ${item.blId} → ${issue.identifier} (create)`,
      );
      issued.push({ blId: item.blId, identifier: issue.identifier, kind: "create" });
    } else {
      const plan = await planUpdateIssue(item.input);
      const issue = await applyUpdateIssue(plan, { approved: true, actor: "main_agent" });
      console.log(
        `[${i + 1}/${SEED.length}] ${item.blId} → ${issue.identifier} (update)`,
      );
      issued.push({ blId: item.blId, identifier: issue.identifier, kind: "update" });
    }
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`apply complete. 처리된 항목:`);
  for (const item of issued) {
    console.log(`  ${item.blId} → ${item.identifier} (${item.kind})`);
  }
  console.log(``);
  console.log(`다음 단계: 각 memo frontmatter 갱신`);
  console.log(`  promoted_to: <POKIT-XXX>`);
  console.log(`  status: promoted`);
}

main().catch((err) => {
  console.error("[seed-error]", err);
  process.exit(1);
});
