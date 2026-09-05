# Release readiness 0.7.0

## Decision

Released. The combined candidate was merged to `main`, installed through the
documented GitHub marketplace, exercised in fresh headless and native Cowork
sessions, and published as `petry--v0.7.0`.

## Required before release

- [x] Combine the agent eval harness, artifact templates, and plain-language UI
  boundary without losing any behavior.
- [x] Resolve the template branch conflicts against current `main`.
- [x] Fix explicit observation-type and exact-fact nondeterminism discovered by
  live agent evaluation.
- [x] Fix the oracle to accept manifest-named dotted projection fields.
- [x] Pass the deterministic suite (`32` tests) and plugin validation.
- [x] Pass three consecutive fresh live lifecycle evals (`3/3`, total $0.6431).
- [x] Merge the open feature work and the release-audit fixes into `main`.
- [x] Add the GitHub marketplace locally, install the exact merged `0.7.0`
  plugin, restart the host, and verify all three skills are discovered in a
  fresh session.
- [x] Run one installed-only Cowork smoke flow: resolve the saved default well
  profile template, capture an exact typed event, refresh the same artifact,
  and inspect the plain-language event dialog.
- [x] Tag the verified final commit and publish release notes/install steps.

## Release evidence

- Release commit: `9632d54551d13496aeeea0b4971e1895d54169e3`
- Immutable tag: `petry--v0.7.0`
- Release: <https://github.com/aai-agency/petry-plugin/releases/tag/petry--v0.7.0>
- Installed package: `petry@aai-agency` 0.7.0, enabled with all three skills.
- Installed-only lifecycle eval: pass for relevant, unrelated, duplicate, and
  correction cases; same artifact reached revision 3 with unchanged telemetry.
- Native Cowork session: <https://claude.ai/cowork/cse_01GutdxHcqSArahbMTA1Vv1v>
- Native artifact: `ff570184-deae-4c28-b53d-463c4ff69c71`; the saved profile
  template, scoped source preferences, exact event capture, same-artifact
  refresh, three same-day flags, AI summary, events view, and plain-language
  detail dialog were visually verified.

## Hygiene

The original checkout contains a preserved untracked `build/` directory, so its
package-shape test fails and `npm pack` can include `build/.og-barrel.mjs`. CI and
the clean release-candidate worktree pass. Build and tag only from a clean
checkout; do not delete or publish the user's existing local build files.
