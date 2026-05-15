import assert from "node:assert/strict";
import test from "node:test";

async function loadCardModule() {
  return import(`../scripts/backlog-idea-card.ts?cacheBust=${Date.now()}`);
}

test("buildBacklogIdeaCard creates a lightweight card with optional PO fields", async () => {
  const { buildBacklogIdeaCard } = await loadCardModule();

  const card = buildBacklogIdeaCard({
    rawIdea: "AI PM 뉴스에 BBC RSS 추가해줘. 하루 10개.",
    title: "PO/PM AI News source 등록",
    source: "chat",
  });

  assert.equal(card.kind, "backlog_idea_card");
  assert.equal(card.status, "draft");
  assert.equal(card.title, "PO/PM AI News source 등록");
  assert.equal(card.raw_idea, "AI PM 뉴스에 BBC RSS 추가해줘. 하루 10개.");
  assert.deepEqual(card.progress_steps, [
    "Raw Idea",
    "Backlog Idea Card",
    "방향 확인",
    "Local JSON 저장",
    "Linear Backlog 등록",
    "Cycle 구체화",
  ]);
  assert.equal(card.hypothesis, "");
  assert.equal(card.success_signal, "");
  assert.equal(card.measurement_plan, "");
  assert.equal(card.token_budget.bucket, "unknown");
  assert.equal(card.priority.bucket, "unscored");
  assert.equal(card.priority.total, null);
});

test("scoreBacklogIdeaCard is deterministic and explains the score", async () => {
  const { buildBacklogIdeaCard, scoreBacklogIdeaCard } = await loadCardModule();

  const card = buildBacklogIdeaCard({
    rawIdea: "Backlog 등록 전 완료 증거를 확인해서 중복 Linear issue 생성을 막자.",
    title: "Linear Preflight CREATE/SKIP",
    hypothesis: "완료된 작업의 중복 Backlog 생성을 줄인다.",
    successSignal: "완료 증거가 있는 후보가 SKIP으로 분류된다.",
    measurementPlan: "동일 후보 재실행 시 같은 preflight 결과를 비교한다.",
  });

  const first = scoreBacklogIdeaCard(card);
  const second = scoreBacklogIdeaCard(card);

  assert.deepEqual(first, second);
  assert.equal(first.bucket, "high");
  assert.equal(first.impact, 4);
  assert.equal(first.confidence, 4);
  assert.equal(first.ease, 3);
  assert.equal(first.total, 48);
  assert.match(first.reason, /hypothesis/);
  assert.match(first.reason, /success_signal/);
  assert.match(first.reason, /measurement_plan/);
});

test("renderBacklogIdeaCardMarkdown keeps user-facing card compact", async () => {
  const { buildBacklogIdeaCard, renderBacklogIdeaCardMarkdown, scoreBacklogIdeaCard } = await loadCardModule();
  const card = buildBacklogIdeaCard({
    rawIdea: "사용자가 뉴스 소스를 등록하면 local digest 수집까지 연결되게 하자.",
    title: "뉴스 소스 등록 UX",
    userOutcome: "사용자는 API/RSS를 몰라도 뉴스 소스를 등록한다.",
  });
  const scored = { ...card, priority: scoreBacklogIdeaCard(card) };

  const markdown = renderBacklogIdeaCardMarkdown(scored);

  assert.match(markdown, /# Backlog Idea Card/);
  assert.match(markdown, /뉴스 소스 등록 UX/);
  assert.match(markdown, /진행/);
  assert.match(markdown, /가설/);
  assert.match(markdown, /우선순위/);
  assert.doesNotMatch(markdown, /PRD Draft/);
  assert.doesNotMatch(markdown, /TDD Plan/);
});
