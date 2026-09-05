# Persistent local artifact templates

## Goal

Let a user save the reusable presentation choices from an artifact and have a
fresh Cowork session apply the right template for an asset type and view type.

## Scope

- [x] Store declarative templates under `.petry/templates/<id>.json`.
- [x] Resolve an explicitly named template before an exact type default.
- [x] Support create, edit, list, set-default, archive, and restore workflows.
- [x] Keep data, observations, source identities, generated summaries, artifact
  identity, credentials, code, and tool instructions out of templates.
- [x] Record the applied template ID/revision/view type in artifact dependencies.
- [x] Preserve the recorded template revision during capture refresh.
- [x] Preserve same-day timeseries annotation placement as declarative template
  configuration.
- [x] Harden canonical registered-asset refs after the native demo exposed a
  display-name vault/dependency mismatch.
- [x] Verify save and fresh-session reuse in native Cowork with the candidate
  skills and local project files.

## Decisions

A template applies to exact `(asset_type, view_type)` pairs. One active default
may own each pair. Explicit naming wins; current-request presentation choices
override in memory; absence falls back to petry's normal component-first view.

Templates contain presentation structure only. Source selection, identity
resolution, factual calculation, current data, and authorization always run from
the request and connected project. Unknown template fields are preserved as inert
data and never executed.

Existing artifacts pin the template revision they used. Editing a template
affects new artifacts and does not silently restyle snapshots. Capture refreshes
the same artifact with its recorded template rather than resolving a newer
default.

## Native verification

On 2026-09-05, Cowork saved the displayed W-42 profile as the default template
for `(well, profile)` and resolved it independently in a new session. The new
artifact selected Accounting/WELL-1042 for oil, SCADA/RT-883 for pressure,
excluded the Alternate oil source, and loaded the two canonical Sep 4 event
records. The first render exposed that timeline grouping alone did not preserve
chart-marker placement, so revision 2 added
`spec.activity.annotations.placement: on-timeseries` for `oil_volume`.

The revised artifact showed separate 08:00 restriction and 18:00 restoration
markers above the Sep 4 oil bar, separate activity rows, and an evidence-linked
observed-versus-interpretation summary. Cowork's render check confirmed two
focusable, non-overlapping markers and no horizontal overflow. Artifact
dependencies recorded template ID `2ae0e85d-ddf1-4c93-a511-d69da969d716`,
revision 2, view type `profile`, the canonical asset ref, selected sources, and
both active observation UUIDs.
