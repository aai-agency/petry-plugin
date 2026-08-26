# Petry plugin deployment readiness

## Scope

Prepare the capture → vault → well-profile feature branch for release as
`0.2.0` without changing its product intent.

## Accepted work

- [x] Preserve observations written to the legacy `.petry/insights/` store.
- [x] Prevent distinct asset references from sharing a vault file.
- [x] Render well-profile data without HTML/script injection.
- [x] Plot oil, gas, and water without compressing or misaligning sparse dates.
- [x] Make the committed HTML artifact reproducible from pinned dependencies.
- [x] Remove stale naming and documentation, and bump release metadata.
- [x] Add regression tests for the vault, renderer, and chart-data normalization.
- [x] Validate the plugin manifest, build, generated artifact, and user-facing CLI.
- [x] Ship the work on a reviewable pull request; do not merge or deploy it.

## Decisions

- The release remains a self-contained offline HTML artifact.
- `DeclineCurve` prefers oil as the primary view, falls back to gas or water,
  and renders remaining fluids as context on the same time axis.
- Existing legacy files remain readable and writable in place. New asset files
  use a readable slug plus a stable reference hash.
- Artifact filling is owned by a local renderer script instead of prompt-driven
  string replacement.

## Verification evidence

- `pnpm install --frozen-lockfile` — passed with pnpm `11.22.0`.
- `pnpm run check` — 14 tests passed; syntax and artifact freshness passed.
- `claude plugin validate .` — marketplace manifest passed.
- Artifact SHA-256: `8d75e54a09f8ad13228def57d9cca9dab21addedadb244526c501d764340e8b6`.
- Rendered fixture inspected at `1440×1100` and `390×1100`; no clipping,
  unreadable density, or missing series labels observed.
- Pull request: https://github.com/aai-agency/petry-plugin/pull/3
