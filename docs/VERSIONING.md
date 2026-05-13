# POKit Versioning

This document is the canonical release version policy for POKit.

## Release States

- Before the first official release, POKit work is unreleased unless it is explicitly tagged as a pre-release.
- `v0.1.0` was the first official release.
- Work after `v0.1.0` accumulates under `Unreleased` in `CHANGELOG.md` until a new version is approved.

## SemVer After v0.1.0

POKit uses SemVer-style versioning after `v0.1.0`:

- patch: bug fixes, safety guard fixes, documentation corrections, and compatible workflow refinements.
- minor: new scripts, skills, artifacts, or workflow capabilities that remain backward compatible.
- major: incompatible workflow, data layout, public distribution, or command behavior changes.

Because POKit is still early, pre-1.0 minor versions may carry meaningful behavior changes, but the changelog must call out migration impact plainly.

## Hotfixes

Hotfix releases use patch versions.

- A hotfix must carry `sourceCycle`, `targetVersion`, `resumeCycle`, `releaseKind: hotfix`, and release scope.
- Before any public GitHub push, tag, release, or deploy, run the public safety scan.
- A hotfix should be merged back into the normal Cycle history before work resumes.

## Pre-releases and RCs

Use pre-release identifiers only when the user intends to test a candidate before a stable tag:

- `v0.2.0-rc.1` for release candidates.
- `v0.2.0-beta.1` for broader preview builds.

Do not use an RC tag as the final release tag. Promote with a clean stable tag after approval.

## VERSION File

POKit should introduce a root `VERSION` file when release automation or repeated manual release checks need a single local source of truth. Until then, the latest Git tag and `CHANGELOG.md` are sufficient.

The VERSION file is optional before that point, but once introduced it becomes part of the release gate.

If a `VERSION` file exists, release preparation must verify that:

- `VERSION` matches the target tag without the leading `v`.
- `CHANGELOG.md` has a matching version section.
- release notes use the same target version.

## CHANGELOG Structure

`CHANGELOG.md` should keep:

- `Unreleased` for approved but not-yet-tagged changes.
- one section per released version.
- short bullets grouped by user-facing workflow, scripts/skills, safety rules, and documentation when useful.

Actual `CHANGELOG.md` edits require user approval when they are part of a release or public distribution flow.

## Document Versioning

Markdown documents are versioned through releases and `CHANGELOG.md`, not per-file version fields.

- Do not add individual `version:` frontmatter to every Markdown file by default.
- Record release-facing documentation changes under `CHANGELOG.md` in a `Docs / Policy` section.
- Keep canonical roles clear: policy in `docs/OPERATING_MODEL.md`, release policy in `docs/VERSIONING.md`, release checks in `docs/RELEASE_CHECKLIST.md`, and historical design rationale in `docs/DESIGN.md`.
- Before public release, run the release Markdown audit to catch stale version names, missing document role markers, and missing changelog documentation notes.
- Generated artifacts and local memory are not public release documentation and should not receive public document version entries.

## Quick Choice

- normal compatible feature: next minor version
- safety fix or hotfix: next patch version
- breaking workflow or artifact contract: next major version
- not ready for stable release: pre-release or keep in `Unreleased`
