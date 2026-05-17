import test from "node:test";
import assert from "node:assert/strict";
import { mkTempDir, writeFixture } from "../_setup/index.mjs";
import { join } from "node:path";
import { retrieveContext } from "../../scripts/internal/retrieval.ts";

const FIXTURE_YAML = `---
kind: decision-log
schema_version: 1
---
decisions:
  - id: dec-test-001
    timestamp: "2026-05-17T10:00:00.000Z"
    title: "Linear write 정책 결정"
    summary: "외부 write 는 사용자 명시 승인 필수"
    decision: "external write rule 도입"
    alternatives_rejected: []
    evidence: []
    linear_refs:
      - POKIT-100
    actor: "main_agent"

  - id: dec-test-002
    timestamp: "2026-05-18T10:00:00.000Z"
    title: "retrieval stub 추가"
    summary: "POKIT-159 v1 — decision-log 소스만"
    decision: "최소 stub 머지"
    alternatives_rejected: []
    evidence: []
    linear_refs:
      - POKIT-159
    actor: "test-agent"

latest_decision_at: "2026-05-18T10:00:00.000Z"
`;

function setupFixture() {
  const dir = mkTempDir();
  writeFixture(join(dir, "memory/decision-log.yaml"), FIXTURE_YAML);
  return dir;
}

test("retrieveContext: 키워드 매칭 → score 양수, 정렬", () => {
  const dir = setupFixture();
  const hits = retrieveContext({ keywords: ["linear"] }, dir);
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].source, "decision");
  assert.ok(hits[0].score > 0);
});

test("retrieveContext: 빈 키워드 → 빈 결과", () => {
  const dir = setupFixture();
  assert.deepEqual(retrieveContext({ keywords: [] }, dir), []);
});

test("retrieveContext: 매칭 없는 키워드 → 빈 결과", () => {
  const dir = setupFixture();
  assert.deepEqual(retrieveContext({ keywords: ["zzz_nope"] }, dir), []);
});

test("retrieveContext: since 필터 동작", () => {
  const dir = setupFixture();
  const all = retrieveContext({ keywords: ["retrieval", "stub", "write"] }, dir);
  const recent = retrieveContext(
    { keywords: ["retrieval", "stub", "write"], since: "2026-05-18T00:00:00.000Z" },
    dir,
  );
  assert.ok(all.length >= 1);
  assert.ok(recent.length <= all.length);
  for (const h of recent) {
    assert.ok(h.ts >= "2026-05-18T00:00:00.000Z");
  }
});

test("retrieveContext: limit 적용", () => {
  const dir = setupFixture();
  const hits = retrieveContext({ keywords: ["a", "e", "i", "o", "u"], limit: 1 }, dir);
  assert.ok(hits.length <= 1);
});

test("retrieveContext: scope 필터 — decision 외 소스는 stub 단계에서 미구현 (159b)", () => {
  const dir = setupFixture();
  const hits = retrieveContext({ keywords: ["linear"], scope: ["backlog-raw"] }, dir);
  // backlog-raw 어댑터는 159b 예정 — 현재는 0 hit
  assert.deepEqual(hits, []);
});
