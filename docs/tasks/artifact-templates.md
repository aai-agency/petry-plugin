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
- [x] Harden canonical registered-asset refs after the native demo exposed a
  display-name vault/dependency mismatch.
- [ ] Verify save and fresh-session reuse in native Cowork after installation.

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
