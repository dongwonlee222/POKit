// POKIT-211 T1 — Linear 이슈 description의 ## 버전 라인 insert/update/read.
//
// 표준:
//   ## 버전
//
//   v0.17.4
//
//   ## AS-IS
//   ...
//
// carry-over 형식:
//   v0.17.4 (carry-over from v0.17.3)
//
// 규칙:
// - 상단(description 시작 ~ ## AS-IS 직전)에만 ## 버전 라인 인식·삽입
// - description 하단의 자유 형식 carry-over 노트(--- separator 뒤 등)는 보존
// - idempotent: 같은 값 N회 호출 → 결과 동일

const VERSION_HEADING = "## 버전";
const AS_IS_HEADING = "## AS-IS";

export type VersionLine = {
  version: string | null;
  carryOverFrom: string | null;
};

function findAsIsIndex(description: string): number {
  // 첫 번째 ## AS-IS 헤더 위치. 없으면 -1.
  const lines = description.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === AS_IS_HEADING) return i;
  }
  return -1;
}

function findTopVersionLine(
  description: string,
): { start: number; end: number } | null {
  // 상단(0 ~ 다음 ## 헤더) 범위 안에서 ## 버전 헤더 위치 + 본문 끝 라인.
  // ## AS-IS 가 없어도 다른 ## 헤더(예: ## 목표)를 경계로 사용.
  const lines = description.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === VERSION_HEADING) {
      let end = i + 1;
      while (end < lines.length && !lines[end].trim().startsWith("## ")) end++;
      return { start: i, end };
    }
    // ## 버전이 아닌 다른 ## 헤더가 먼저 나오면 종료 (상단 영역 끝)
    if (lines[i].trim().startsWith("## ") && lines[i].trim() !== VERSION_HEADING) {
      return null;
    }
  }
  return null;
}

export function readVersionLine(description: string): VersionLine {
  const range = findTopVersionLine(description);
  if (!range) return { version: null, carryOverFrom: null };
  const lines = description.split("\n");
  // 헤더 다음 본문 라인들에서 첫 v<X> 패턴 추출
  for (let i = range.start + 1; i < range.end; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    // 1) carry-over 형식: v0.17.4 (carry-over from v0.17.3)
    const m1 = raw.match(
      /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\s*\(carry-over from\s+v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\)\s*$/,
    );
    if (m1) return { version: m1[1], carryOverFrom: m1[2] };
    // 2) 단순 형식: v0.17.4
    const m2 = raw.match(/^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\s*$/);
    if (m2) return { version: m2[1], carryOverFrom: null };
    // 다른 형식은 무시하고 계속
  }
  return { version: null, carryOverFrom: null };
}

export function insertVersionLine(
  description: string,
  version: string,
  carryOverFrom?: string,
): string {
  const versionValue = carryOverFrom
    ? `v${version} (carry-over from v${carryOverFrom})`
    : `v${version}`;
  const versionBlock = `${VERSION_HEADING}\n\n${versionValue}\n\n`;

  const asIsIdx = findAsIsIndex(description);
  if (asIsIdx < 0) {
    // ## AS-IS 없으면 description 최상단에 prepend
    return versionBlock + description;
  }

  const lines = description.split("\n");
  const range = findTopVersionLine(description);
  if (range) {
    // 기존 ## 버전 블록 교체
    const before = lines.slice(0, range.start).join("\n");
    // 기존 블록의 trailing 빈 줄 통일을 위해 range.end까지 잘라냄
    let endIdx = range.end;
    // 트레일링 빈 줄 흡수
    while (endIdx < lines.length && lines[endIdx].trim() === "") endIdx++;
    const after = lines.slice(endIdx).join("\n");
    const beforePart = before.length ? before + "\n" : "";
    return beforePart + versionBlock + after;
  }
  // ## AS-IS 위에 새로 삽입
  const before = lines.slice(0, asIsIdx).join("\n");
  const after = lines.slice(asIsIdx).join("\n");
  // before가 비어있지 않으면 줄바꿈 1회로 분리
  const beforePart = before.length ? before.replace(/\n+$/, "") + "\n\n" : "";
  return beforePart + versionBlock + after;
}
