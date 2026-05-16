# Collected Data — Sidecar Metadata Schema

Every file placed in `collected/raw/` or `collected/digest/` under any profile MUST have a
companion sidecar file named `<original-filename>.meta.yaml` in the same directory.

The sidecar travels with the artifact so that governance attributes survive moves and copies.

## Required Fields

| Field | Type | Allowed Values | Description |
|---|---|---|---|
| `sensitivity` | enum | `low`, `medium`, `high`, `critical` | Classification of how sensitive the content is |
| `contains_pii` | boolean | `true`, `false` | Whether the artifact contains personally identifiable information |
| `retention_until` | string | ISO 8601 date (`YYYY-MM-DD`) | Date after which the artifact must be deleted or re-evaluated |
| `license` | string | e.g. `internal-only`, `CC-BY-4.0`, `proprietary`, `public-domain` | Usage rights governing the artifact |
| `source` | string | Free text | Origin of the data — URL, tool name, dataset identifier, or person/team |

All five fields are mandatory. A file without a sidecar is considered non-compliant and MUST NOT
be referenced from any artifact.

## Sensitivity Enum

| Value | Meaning |
|---|---|
| `low` | No risk if disclosed. Publicly available information. |
| `medium` | Mild risk. Internal knowledge, aggregate stats, de-identified data. |
| `high` | Significant risk. Confidential business data, personally identifiable. |
| `critical` | Severe risk. Credentials, regulated data, personally sensitive (health, legal). |

## Example Sidecar

```yaml
sensitivity: medium
contains_pii: false
retention_until: "2026-12-31"
license: "internal-only"
source: "Linear export 2025-05-01 — cycle velocity data"
```

The example template lives at:
`artifacts/profiles/_template/collected/raw/example.public.meta.yaml`

## Artifact `sources` Field

When an artifact (PRD, analysis, sprint output) references data from a `collected/` file, it MUST
include a `sources` frontmatter field listing the sidecar paths:

```yaml
---
id: prd-YYYY-MM-DD-example
sources:
  - artifacts/profiles/default/collected/digest/velocity-2025-Q2.csv
---
```

This creates an auditable lineage from published artifact back to raw data governance.

## Validation

A sidecar is considered valid when:
1. All five fields are present.
2. `sensitivity` is one of the four allowed enum values.
3. `contains_pii` is a boolean.
4. `retention_until` parses as a valid ISO 8601 date.
5. `license` and `source` are non-empty strings.
