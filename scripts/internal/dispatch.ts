import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SkillManifest = {
  name: string;
  description: string;
  entry: string;
  labels: string[];
  trigger_phrases?: string[];
  body: string; // SKILL.md 본문 (frontmatter 제외)
};

/**
 * YAML frontmatter 파서 — 외부 의존성 없이 간단한 정규식 기반 구현.
 *
 * 지원 형식:
 *   key: value                  — 단순 문자열
 *   key: [a, b, c]              — 인라인 배열
 *   key:                        — 들여쓰기 배열 (다음 줄에 "  - item")
 *     - item1
 *     - item2
 */
function parseFrontmatter(raw: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // key: value or key: [...]
    const keyValueMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!keyValueMatch) {
      i++;
      continue;
    }

    const key = keyValueMatch[1];
    const rawValue = keyValueMatch[2].trim();

    if (rawValue === "") {
      // 들여쓰기 배열 수집
      const items: string[] = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        const itemMatch = lines[i].match(/^\s+-\s+"?([^"]*)"?\s*$/);
        if (itemMatch) {
          items.push(itemMatch[1].trim());
        }
        i++;
      }
      result[key] = items;
      continue;
    }

    // 인라인 배열 [a, b, c]
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const inner = rawValue.slice(1, -1);
      result[key] = inner
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      i++;
      continue;
    }

    // 단순 문자열 (앞뒤 따옴표 제거)
    result[key] = rawValue.replace(/^["']|["']$/g, "");
    i++;
  }

  return result;
}

/**
 * 단일 SKILL.md 파일을 파싱하여 SkillManifest 반환.
 * frontmatter가 없거나 name 필드가 없으면 null 반환.
 */
function parseSkillFile(filePath: string): SkillManifest | null {
  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return null;
  }

  // frontmatter 추출: --- 로 시작하고 다음 --- 까지
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) {
    return null;
  }

  const rawFm = fmMatch[1];
  const body = fmMatch[2].trim();
  const fm = parseFrontmatter(rawFm);

  if (!fm.name || typeof fm.name !== "string") {
    return null;
  }

  const labels = Array.isArray(fm.labels) ? fm.labels : [];
  const triggerPhrases = Array.isArray(fm.trigger_phrases) ? fm.trigger_phrases : [];

  return {
    name: fm.name as string,
    description: (fm.description as string) ?? "",
    entry: (fm.entry as string) ?? "",
    labels,
    trigger_phrases: triggerPhrases,
    body,
  };
}

/**
 * skills/ 디렉토리의 모든 SKILL.md를 읽어 SkillManifest 배열 반환.
 * skillsDir는 프로젝트 루트 기준 상대경로 또는 절대경로.
 */
export function loadSkillManifests(skillsDir = "skills"): SkillManifest[] {
  let skillDirs: string[];
  try {
    skillDirs = readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }

  const manifests: SkillManifest[] = [];
  for (const dir of skillDirs) {
    const skillPath = join(skillsDir, dir, "SKILL.md");
    const manifest = parseSkillFile(skillPath);
    if (manifest) {
      manifests.push(manifest);
    }
  }
  return manifests;
}

/**
 * labels 배열 중 하나라도 manifest.labels에 포함되면 해당 manifest 반환.
 * 여러 스킬이 동일 라벨을 가질 수 있으므로 배열 반환.
 */
export function dispatchByLabels(labels: string[], manifests: SkillManifest[]): SkillManifest[] {
  if (labels.length === 0) return [];
  return manifests.filter((m) =>
    m.labels.some((skillLabel) => labels.includes(skillLabel))
  );
}

/**
 * userInput에 trigger_phrases 항목이 부분 일치하는 SKILL 반환.
 * 여러 항목이 매칭되면 더 길고 구체적인 phrase를 우선한다.
 * 매칭 없으면 null 반환.
 */
export function dispatchByTriggerPhrase(userInput: string, manifests: SkillManifest[]): SkillManifest | null {
  const lower = userInput.toLowerCase();
  const matches: Array<{ manifest: SkillManifest; phrase: string; manifestIndex: number; phraseIndex: number }> = [];

  manifests.forEach((manifest, manifestIndex) => {
    const phrases = manifest.trigger_phrases ?? [];
    phrases.forEach((phrase, phraseIndex) => {
      if (lower.includes(phrase.toLowerCase())) {
        matches.push({ manifest, phrase, manifestIndex, phraseIndex });
      }
    });
  });

  if (matches.length === 0) {
    return null;
  }

  matches.sort((a, b) => {
    const phraseLengthDelta = b.phrase.length - a.phrase.length;
    if (phraseLengthDelta !== 0) return phraseLengthDelta;
    const manifestOrderDelta = a.manifestIndex - b.manifestIndex;
    if (manifestOrderDelta !== 0) return manifestOrderDelta;
    return a.phraseIndex - b.phraseIndex;
  });

  return matches[0].manifest;
}
