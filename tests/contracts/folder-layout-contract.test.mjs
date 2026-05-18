import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

// POKIT-150 (v0.10.0 F-4): 폴더 레이아웃 계약 가드.
//
// docs/architecture/15-folder-layout.md §2 배포 표에 등록된 최상위 폴더 외에는
// 추가되지 않도록 차단한다. 신규 폴더 추가 시 본 문서 갱신을 강제한다.
//
// 본 가드는 LLM 명확성 박제(AGENTS.md Core Principle)의 운영 장치다.

const LAYOUT_DOC = "docs/architecture/15-folder-layout.md";

// 15-folder-layout.md §2 배포 표에 등록된 최상위 폴더 (Public + Internal).
// 새 최상위 폴더를 추가하려면 먼저 15-folder-layout.md 표를 갱신한 뒤
// 이 목록에 추가한다.
const REGISTERED_TOP_LEVEL_FOLDERS = new Set([
  // Public
  "bin",
  "scripts",
  "tests",
  "skills",
  ".claude-plugin",
  ".codex-plugin",
  "workflows",
  "templates",
  "examples",
  "docs",
  // Internal (gitignore)
  "memory",
  "artifacts",
  "releases", // POKIT-175 (M6) — 버전 단위 산출물 묶음
  ".claude",
  // 빌드/환경
  "node_modules",
  ".git",
]);

// 최상위에 허용되는 알려진 파일 (dotfile 포함).
const ALLOWED_TOP_LEVEL_FILES_PATTERN = /^(AGENTS\.md|CLAUDE\.md|README\.md|CHANGELOG\.md|SECURITY\.md|LICENSE|package\.json|package-lock\.json|tsconfig\.json|pokit\.config\.yaml|pokit\.local\.config\.yaml|\.env|\.env\..+|\.gitignore|\.npmignore|\.DS_Store|.+\.zip)$/;

const ALLOWED_TOP_LEVEL_DIR_DOTFILES = new Set([
  "POKit-Day1-Design", // 로컬 design export (gitignored)
  ".modu-harness", // 로컬 workspace harness state (gitignored)
]);

test("폴더 레이아웃 가드: 최상위에 정의되지 않은 폴더 차단", async () => {
  const entries = await readdir(".", { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (REGISTERED_TOP_LEVEL_FOLDERS.has(entry.name)) continue;
    if (ALLOWED_TOP_LEVEL_DIR_DOTFILES.has(entry.name)) continue;
    // .modu-harness/ 같은 로컬 도구 디렉토리는 dot prefix로 식별
    if (entry.name.startsWith(".") && !REGISTERED_TOP_LEVEL_FOLDERS.has(entry.name)) {
      // .git, .claude 외 dotfile dir은 명시 등록 필요
      assert.fail(
        `미등록 최상위 dotfile 디렉토리 '${entry.name}'. ` +
          `${LAYOUT_DOC} §2 배포 표에 등록하거나 본 테스트의 REGISTERED_TOP_LEVEL_FOLDERS 또는 ALLOWED_TOP_LEVEL_DIR_DOTFILES에 추가하세요.`,
      );
    }

    assert.fail(
      `미등록 최상위 폴더 '${entry.name}'. ` +
        `${LAYOUT_DOC} §2 배포 표에 등록하거나 의도와 다르면 제거하세요. ` +
        `등록 후 본 테스트의 REGISTERED_TOP_LEVEL_FOLDERS에도 추가해야 합니다.`,
    );
  }
});

test("폴더 레이아웃 가드: 최상위 파일도 알려진 패턴만 허용", async () => {
  const entries = await readdir(".", { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (ALLOWED_TOP_LEVEL_FILES_PATTERN.test(entry.name)) continue;

    assert.fail(
      `미등록 최상위 파일 '${entry.name}'. ` +
        `${LAYOUT_DOC} 정책에 부합하지 않습니다. ` +
        `필요하면 ALLOWED_TOP_LEVEL_FILES_PATTERN을 갱신하세요.`,
    );
  }
});

test("폴더 레이아웃 문서 존재", async () => {
  const content = await readFile(LAYOUT_DOC, "utf8");
  // 핵심 섹션 존재 확인
  assert.match(content, /## 1\. 폴더 책임 정의/);
  assert.match(content, /## 2\. 배포 표/);
  assert.match(content, /## 3\. 5가지 경계 결정/);
  assert.match(content, /## 4\. 레거시 이동 매핑/);
});

test("15-folder-layout.md ↔ .gitignore 동기화: Internal 폴더는 gitignore에 명시", async () => {
  const gitignore = await readFile(".gitignore", "utf8");

  // Internal 폴더 (gitignore되어야 함)
  const internalFolders = [
    "docs/plans/",
    "docs/history/",
    "memory/notes/",
    "memory/manifests/",
    "memory/problem-reviews/",
    ".claude/",
  ];

  for (const folder of internalFolders) {
    assert.match(
      gitignore,
      new RegExp(`^${folder.replace(/[.\/]/g, "\\$&")}`, "m"),
      `${folder} 는 Internal이므로 .gitignore에 등록되어야 합니다 (15-folder-layout.md §2 배포 표 참조)`,
    );
  }
});
