# Release readiness 0.7.0

## Decision

Do not publish yet. The combined candidate is technically healthy, but the two
open feature PRs are not on `main`, the template PR conflicts with `main`, and the
exact final commit has not been installed from its documented marketplace in a
fresh session.

## Required before release

- [x] Combine the agent eval harness, artifact templates, and plain-language UI
  boundary without losing any behavior.
- [x] Resolve the template branch conflicts against current `main`.
- [x] Fix explicit observation-type and exact-fact nondeterminism discovered by
  live agent evaluation.
- [x] Fix the oracle to accept manifest-named dotted projection fields.
- [x] Pass the deterministic suite (`32` tests) and plugin validation.
- [x] Pass three consecutive fresh live lifecycle evals (`3/3`, total $0.6431).
- [ ] Merge the open feature work and the release-audit fixes into `main`.
- [ ] Add the GitHub marketplace locally, install the exact merged `0.7.0`
  plugin, restart the host, and verify all three skills are discovered in a
  fresh session.
- [ ] Run one installed-only Cowork smoke flow: resolve the saved default well
  profile template, capture an exact typed event, refresh the same artifact,
  and inspect the plain-language event dialog.
- [ ] Tag the verified final commit and publish release notes/install steps.

## Hygiene

The original checkout contains a preserved untracked `build/` directory, so its
package-shape test fails and `npm pack` can include `build/.og-barrel.mjs`. CI and
the clean release-candidate worktree pass. Build and tag only from a clean
checkout; do not delete or publish the user's existing local build files.
