/**
 * 일회용 부트스트랩 등록 스크립트 (bl-001, bl-002, bl-004)
 *
 * 용도: backlog-raw/ 메모 3건을 Linear에 신규 이슈로 등록
 *       (v0.17.1 cycle 1차 진입 부트스트랩)
 *
 * 사용:
 *   node --experimental-strip-types scripts/internal/_seed-bl-2026-05-17-bootstrap.ts dry-run
 *   node --experimental-strip-types scripts/internal/_seed-bl-2026-05-17-bootstrap.ts apply
 *
 * 본 스크립트는 일회용 — 부트스트랩 완료 후 삭제 예정
 * (bl-002 본격 구현에서 자동화로 대체)
 */
import { applyCreateIssue, planCreateIssue, type IssueInput } from "./linear.ts";
import type { LinearBacklogDescriptionInput } from "./backlog-outline.ts";

type SeedItem = {
  blId: string;
  memoFile: string;
  input: IssueInput;
};

const SEED: SeedItem[] = [
  // ── bl-001 ────────────────────────────────────────────────────────
  {
    blId: "bl-2026-05-17-001",
    memoFile: "memory/backlog-raw/bl-2026-05-17-001-bagje-rename.md",
    input: {
      title: '[v0.17.1] "박제" 어휘 맥락별 치환 (기록 / dry-run 미리보기 등)',
      labels: ["pokit:criteria"],
      description: {
        purpose:
          '"박제" 단어가 4개 맥락(release manifest / 결정 / unresolved / dry-run 박제)에 단일 단어로 과부하되어 신입·외부 협업자 진입장벽이 높다. 사용자 명시 거부 발화에 따라 맥락별로 자연 어휘로 치환한다.',
        userVisibleChange:
          'pokit start/end 출력, AGENTS.md, CLAUDE.md, sentinel 블록, approval-flow 문서 등에서 "박제"가 사라지고 맥락별 친숙 어휘("기록", "dry-run 미리보기" 등)로 노출된다.',
        doneCondition:
          '`rg "박제" --type md --type ts --type sh --type yaml` 결과 0건 (히스토리 manifest 의도된 보존 제외), approval-flow 문서가 "dry-run 미리보기 + 승인" 어휘로 일관, sentinel 블록(.claude/hooks/show-active-rules.sh) 갱신.',
        scope:
          'CHANGELOG.md, CLAUDE.md, AGENTS.md, docs/_details/approval-flow.md, docs/architecture/13-*.md, scripts/internal/release-manifest.ts, scripts/internal/next-action-wizard.ts, scripts/cli/release.ts, skills/linear-issue-manager/SKILL.md, .claude/hooks/show-active-rules.sh, MEMORY.md 인덱스.',
        outOfScope:
          "글로벌 ~/.claude/ 영역 sentinel (repo PR 범위 밖), 히스토리 manifest의 의도된 박물관 표현.",
        evidence: [
          "사용자 발화: '박제란 단어는 쓰지마' (2026-05-17 세션)",
          "memory/backlog-raw/bl-2026-05-17-001-bagje-rename.md",
        ],
        release: { kind: "minor", targetVersion: "v0.17.1" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-001-bagje-rename",
        },
        asIs:
          '"박제" 단일 단어가 release manifest / 결정 / unresolved / dry-run 박제 4개 맥락에 과부하. 죽은 동물 비유로 어감 부적합. 사용자가 명시적으로 사용 거부.',
        toBe:
          "맥락별 치환 매핑 적용:\n- release manifest 박제 → 기록\n- 결정 박제 → 기록\n- unresolved 박제 (carry-forward) → 기록\n- dry-run 박제 + 승인 → dry-run 미리보기 + 승인",
        successVerification:
          'rg "박제" 결과 0건 (히스토리 예외 제외), pokit start/end 출력에서 미노출, AGENTS.md/CLAUDE.md/sentinel 갱신 확인, approval-flow 문서 어휘 일관.',
      },
    },
  },

  // ── bl-002 ────────────────────────────────────────────────────────
  {
    blId: "bl-2026-05-17-002",
    memoFile: "memory/backlog-raw/bl-2026-05-17-002-session-scope-raw.md",
    input: {
      title:
        "[v0.17.1] session-scope raw 백로그 저장소 + pokit start/end 출력 보강",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "세션 사이 raw 아이디어 휘발, '전 세션 남은 것' 정확도 부족, Linear 미등록 항목 추적 부재 — 세 가지 통증을 한 번에 해결한다. raw 백로그 저장소(memory/backlog-raw/)를 도입하고, pokit start/end 출력에 raw/미해결 섹션을 정확한 ID 단위로 표시한다.",
        userVisibleChange:
          "pokit end 출력: '이번 세션이 만든 raw'·'이번 세션 미해결' 명확히 분리. pokit start 출력: '전 세션이 남긴 raw N건'·'전 세션이 안 끝낸 것 M건' 노출. memory/backlog-raw/ 디렉토리 + README 양식 등장.",
        doneCondition:
          "memory/backlog-raw/ + README.md + frontmatter 양식 확정, pokit start/end 출력 보강, collectUnresolved(scope='session') 함수 1개 (bl-003에서 재활용 가능 구조), 세션 1회 굴려서 실제 동작 검증.",
        scope:
          "memory/backlog-raw/ 디렉토리 운영, scripts/cli/session-start.ts / session-close.ts 출력 보강, scripts/cli/session-brief.ts 보강, README 양식, frontmatter 표준(title YAML 따옴표 강제 / 신·구 키 정리 / 섹션 순서 — v0.16 미결 3건 흡수).",
        outOfScope:
          "release-scope manifest backfill (bl-003에서 처리), git commit trailer / events.ndjson / sessions/<id>/ 디렉토리 (over-engineering 제거됨), LLM 자동 gist 요약.",
        evidence: [
          "사용자 발화: '전 세션에서 남은 작업이 뭔지... 저장이 안되니 다음 세션에서 확인이 안되는게 문제의 핵심' (2026-05-17)",
          "memory/backlog-raw/bl-2026-05-17-002-session-scope-raw.md",
          "advisor 권고: 디렉토리 평면화 / Rule of three / Phase 분리",
        ],
        release: { kind: "minor", targetVersion: "v0.17.1" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-002-session-scope-raw",
        },
        asIs:
          "세션 중 raw 아이디어 휘발. pokit end '어디서 멈췄나' = Linear pending ID 1줄로 정확도 낮음. pokit start에 '전 세션 미해결 / 신규 raw' 분리 없음. Linear는 정식 이슈 추적용 — raw 단계 진입 부적합.",
        toBe:
          "memory/backlog-raw/ per-item .md (frontmatter 4섹션 의무) + README 양식. pokit end가 신규 raw·미해결을 ID 단위로 명시. pokit start가 raw(정리/승격 대기) + 전 세션 미해결을 분리 노출. collectUnresolved(scope='session') 함수 1개 — bl-003 재활용 대비.",
        successVerification:
          "memory/backlog-raw/ + README 존재, 세션 1회 실제 굴려 raw 파일 생성·표시 확인, frontmatter 파싱 PASS (title 따옴표 포함), resume-brief.md 호환성 유지, bl-002 PR 머지 후 첫 pokit start에서 새 출력 형식 노출.",
      },
    },
  },

  // ── bl-004 ────────────────────────────────────────────────────────
  {
    blId: "bl-2026-05-17-004",
    memoFile: "memory/backlog-raw/bl-2026-05-17-004-linear-cli-create-apply.md",
    input: {
      title:
        "[v0.17.1] linear.ts CLI create --apply 지원 (description 객체 vs raw 불일치 해결)",
      labels: ["pokit:criteria"],
      description: {
        purpose:
          "linear.ts CLI의 create 명령에 --apply 플래그가 없어 dry-run → write 일관 흐름이 차단된다. description 입력 구조(객체 vs raw string) 불일치를 해소하고 --apply를 지원해 batch 작업 가능 상태로 만든다.",
        userVisibleChange:
          "`linear.ts create --apply` 1회 실행으로 신규 Linear 이슈 생성 가능. dry-run 미리보기 description ↔ apply 후 Linear description이 동일.",
        doneCondition:
          "create --apply 플래그 동작, description 입력 정규화(raw string 단일 경로), 통합 테스트 PASS, v0.17.1 잔여 백로그(bl-005·006·008·009·010·007) 등록에 본 명령 사용 검증.",
        scope:
          "scripts/internal/linear.ts CLI 진입점, description 직렬화/역직렬화 정규화, 관련 단위/통합 테스트.",
        outOfScope:
          "assign-label 동작 변경(bl-008), Linear API 신규 엔드포인트 추가, 외부 CLI wrapper 변경.",
        evidence: [
          "v0.16.0 manifest unresolved: cli-create-apply-support",
          "memory/backlog-raw/bl-2026-05-17-004-linear-cli-create-apply.md",
        ],
        release: { kind: "minor", targetVersion: "v0.17.1" },
        linearVariables: {
          state: "Backlog",
          labels: ["pokit:criteria"],
          source: "linear",
          idempotencyKey: "bl-2026-05-17-004-linear-cli-create-apply",
        },
        asIs:
          "linear.ts CLI create 명령이 --apply 미지원. description 객체 vs raw 불일치로 apply 시 직렬화 실패 가능. bl-002·003 같은 후속 batch 등록 차단.",
        toBe:
          "create --apply 플래그 추가, description 입력 → raw string 단일 정규화, dry-run 미리보기와 apply 결과 동일성 보장.",
        successVerification:
          "linear.ts create --apply 실행 → Linear 신규 이슈 생성 확인, 결과 description == dry-run 출력, v0.17.1 잔여 7건 등록 절차에서 본 명령 사용 PASS.",
      },
    },
  },
];

function fmtPlan(item: SeedItem, idx: number, plan: { input: IssueInput; idempotencyKey?: string }): string {
  const desc = item.input.description!;
  return [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `[${idx + 1}/3] ${item.blId} → 신규 Linear 이슈`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `제목  : ${item.input.title}`,
    `라벨  : ${item.input.labels?.join(", ") ?? "(없음)"}`,
    `state : ${desc.linearVariables.state}`,
    `target: ${desc.release.targetVersion ?? "none"}`,
    `idem  : ${desc.linearVariables.idempotencyKey}`,
    ``,
    `목적 : ${desc.purpose}`,
    `완료 : ${desc.doneCondition}`,
    ``,
    `AS-IS: ${desc.asIs?.slice(0, 120)}${(desc.asIs?.length ?? 0) > 120 ? "..." : ""}`,
    `TO-BE: ${desc.toBe?.slice(0, 120)}${(desc.toBe?.length ?? 0) > 120 ? "..." : ""}`,
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
      const plan = await planCreateIssue(item.input);
      console.log(fmtPlan(item, i, plan as never));
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`dry-run complete. ${SEED.length}건 등록 준비 OK.`);
    console.log(`apply 진입 명령: node --experimental-strip-types scripts/internal/_seed-bl-2026-05-17-bootstrap.ts apply`);
    return;
  }

  // mode === "apply"
  const issued: Array<{ blId: string; identifier: string }> = [];
  for (let i = 0; i < SEED.length; i++) {
    const item = SEED[i];
    const plan = await planCreateIssue(item.input);
    const issue = await applyCreateIssue(plan, { approved: true, actor: "main_agent" });
    console.log(`[${i + 1}/${SEED.length}] ${item.blId} → ${issue.identifier} ${issue.title}`);
    issued.push({ blId: item.blId, identifier: issue.identifier });
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`apply complete. 발급된 이슈:`);
  for (const item of issued) {
    console.log(`  ${item.blId} → ${item.identifier}`);
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
