import assert from "node:assert/strict";
import test from "node:test";

async function loadBriefModule() {
  return import(`../scripts/cli/session-brief.ts?cacheBust=${Date.now()}`);
}

// Rule 1: [배포대상]·[정의필요] prefix issues rank above priority=3 issues
test("Rule 1: [배포대상] prefix ranks above priority=3 todo issue", async () => {
  const { selectNextCandidates } = await loadBriefModule();

  const issues = [
    { id: "a", identifier: "POKIT-10", title: "일반 작업", labels: [], state: "Todo", priority: 3 },
    { id: "b", identifier: "POKIT-11", title: "[배포대상] 릴리즈 후보", labels: [], state: "Todo", priority: 0 },
  ];

  const result = selectNextCandidates(issues);
  assert.equal(result[0].identifier, "POKIT-11", "[배포대상] issue should be first");
  assert.equal(result[1].identifier, "POKIT-10");
});

test("Rule 1: [정의필요] prefix ranks above priority=3 todo issue", async () => {
  const { selectNextCandidates } = await loadBriefModule();

  const issues = [
    { id: "a", identifier: "POKIT-20", title: "일반 작업", labels: [], state: "Todo", priority: 3 },
    { id: "b", identifier: "POKIT-21", title: "[정의필요] 스펙 검토", labels: [], state: "Todo", priority: 0 },
  ];

  const result = selectNextCandidates(issues);
  assert.equal(result[0].identifier, "POKIT-21", "[정의필요] issue should be first");
  assert.equal(result[1].identifier, "POKIT-20");
});

// Rule 2: Same parent sub-issues — only 1 per parent in Top 3
test("Rule 2: Only one sub-issue per parent appears in Top 3", async () => {
  const { selectNextCandidates } = await loadBriefModule();

  const issues = [
    { id: "a", identifier: "POKIT-30", title: "Sub A-1", labels: [], state: "Todo", priority: 1, parent: { id: "parent-1", identifier: "POKIT-10" } },
    { id: "b", identifier: "POKIT-31", title: "Sub A-2", labels: [], state: "Todo", priority: 2, parent: { id: "parent-1", identifier: "POKIT-10" } },
    { id: "c", identifier: "POKIT-32", title: "Sub A-3", labels: [], state: "Todo", priority: 3, parent: { id: "parent-1", identifier: "POKIT-10" } },
    { id: "d", identifier: "POKIT-33", title: "Standalone", labels: [], state: "Todo", priority: 4 },
  ];

  const result = selectNextCandidates(issues);
  assert.equal(result.length, 2, "Should only have 2 results: 1 sub + 1 standalone");
  assert.equal(result[0].identifier, "POKIT-30", "Highest priority sub-issue of parent-1");
  assert.equal(result[1].identifier, "POKIT-33", "Standalone issue");
});

test("Rule 2: Sub-issues from different parents each get one slot", async () => {
  const { selectNextCandidates } = await loadBriefModule();

  const issues = [
    { id: "a", identifier: "POKIT-40", title: "Sub A", labels: [], state: "Todo", priority: 1, parent: { id: "parent-a", identifier: "POKIT-1" } },
    { id: "b", identifier: "POKIT-41", title: "Sub A2", labels: [], state: "Todo", priority: 2, parent: { id: "parent-a", identifier: "POKIT-1" } },
    { id: "c", identifier: "POKIT-42", title: "Sub B", labels: [], state: "Todo", priority: 2, parent: { id: "parent-b", identifier: "POKIT-2" } },
    { id: "d", identifier: "POKIT-43", title: "Sub C", labels: [], state: "Todo", priority: 3, parent: { id: "parent-c", identifier: "POKIT-3" } },
  ];

  const result = selectNextCandidates(issues);
  assert.equal(result.length, 3);
  assert.equal(result[0].identifier, "POKIT-40", "Best from parent-a (priority 1)");
  assert.equal(result[1].identifier, "POKIT-42", "Best from parent-b (priority 2)");
  assert.equal(result[2].identifier, "POKIT-43", "Best from parent-c (priority 3)");
});

// Rule 3: Recommendation action ID == Top 3 first issue ID
test("Rule 3: buildSessionBrief Top 3 first issue is the same as candidate #1", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-12T09:00:00+09:00"),
    context: {
      source: "linear_active",
      cycle: { id: "cycle-99", name: "Cycle 99" },
      issues: [
        { id: "p1", identifier: "POKIT-100", title: "Sub-1", labels: [], state: "Todo", priority: 2, parent: { id: "par-1", identifier: "POKIT-50" } },
        { id: "p2", identifier: "POKIT-101", title: "Sub-2", labels: [], state: "Todo", priority: 3, parent: { id: "par-1", identifier: "POKIT-50" } },
        { id: "s1", identifier: "POKIT-102", title: "Standalone", labels: [], state: "Todo", priority: 1 },
      ],
    },
  });

  // Top 3 first item should be POKIT-102 (priority 1, no parent dedup) but
  // POKIT-100 has priority=2 and POKIT-101 has priority=3 (same parent)
  // So sorted: POKIT-102(p=1), POKIT-100(p=2 from par-1), POKIT-101 blocked by par-1 dedup
  // Top 3 should be: 1. POKIT-102, 2. POKIT-100
  assert.match(brief, /1\. POKIT-102 Standalone/);
  assert.match(brief, /2\. POKIT-100 Sub-1/);
  assert.doesNotMatch(brief, /POKIT-101 Sub-2/);
});

test("Rule 3: buildSessionBrief start variant Top 3 first = highest priority candidate", async () => {
  const { buildSessionBrief } = await loadBriefModule();

  const brief = buildSessionBrief({
    now: new Date("2026-05-12T09:00:00+09:00"),
    variant: "start",
    context: {
      source: "linear_active",
      cycle: { id: "cycle-99", name: "Cycle 99" },
      issues: [
        { id: "t1", identifier: "POKIT-200", title: "[배포대상] 릴리즈", labels: [], state: "Todo", priority: 0 },
        { id: "t2", identifier: "POKIT-201", title: "일반 작업", labels: [], state: "Todo", priority: 1 },
      ],
    },
  });

  // [배포대상] (tier 0) should appear first
  assert.match(brief, /1\. POKIT-200/);
  assert.match(brief, /2\. POKIT-201/);
});
