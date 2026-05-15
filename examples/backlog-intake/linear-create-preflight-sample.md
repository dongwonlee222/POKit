# Linear Create Preflight Sample

```text
Linear Create Preflight  (project: POKit)
┌─────────────────────────────────────────────────────────────────────┐
│  ▸ CREATE (1)
│    01  PO/PM AI News source 등록
│        id: candidate-news   linear: absent   evidence: none
│        action: 완료 증거 없음
│  ▸ SKIP   (1)
│    01  v0.4.1 release notes
│        id: candidate-release   linear: absent   evidence: complete
│        action: 완료 증거가 있어 신규 Linear create를 막음
│          + CHANGELOG.md — v0.4.1 exists and tag exists
│  ▸ NOOP   (0)
│    - 없음
└─────────────────────────────────────────────────────────────────────┘
gates remaining: [user_approval]
write_target: Linear Backlog
idempotency: linear:create-preflight:example
```
