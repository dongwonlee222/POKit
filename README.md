# POKit

POKit의 첫 번째 약속은 신뢰다.

POKit is a GitHub-distributed AI scrum workspace for PO/PM work. It is not a separate CLI, SaaS, or chat UI. Clone or fork this repo, fill `.env`, open Codex CLI or Claude Code in the repo root, and work in natural language.

## Core Contract

POKit은 cycle 안에서 산출물과 승인 계획을 만든다. Linear/GitHub 같은 외부 시스템의 상태는 사용자의 명시적 승인 없이는 절대 바꾸지 않는다.

- All AI-generated artifacts are drafts with source context and rationale.
- Run Summary lists generated, needs-label, needs-clarification, needs-approval, and failed items separately, with "what AI did not do" shown first.
- State Brief renders every session and is read-only.
- Action Nudge appears at most once per session and only when cycle state changed.
- Fork users who want to commit personal memory/artifacts should review `.gitignore` first.
