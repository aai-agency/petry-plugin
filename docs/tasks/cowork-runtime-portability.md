# Cowork runtime portability

> Historical v0.2.2 work. The installed-only smoke test disproved the assumed
> shared runtime model. Superseded by `docs/tasks/instruction-only-plugin.md`.

## Goal

Make an installed Petry plugin run capture and artifact generation against a
connected local Cowork folder without attaching the plugin source checkout or
copying plugin files between cloud and device environments.

## Scope

- [x] Reproduce the installed-only Cowork failure.
- [x] Identify the cloud/device path boundary.
- [x] Move executable helpers into their owning skill directories.
- [x] Reference helpers through `${CLAUDE_SKILL_DIR}`.
- [x] Preserve root-level script entry points for Claude Code and existing docs.
- [x] Add Linux and Windows CI coverage for the portable entry points.
- [x] Run the full repository check.
- [x] Install the updated plugin in Cowork and repeat the installed-only smoke
  test; it failed at the cloud/device boundary without modifying the vault.
- [x] Commit, push, and open pull request #6.

## Decisions

- The skill-local helper approach was not portable: Cowork loaded plugin files
  in its cloud environment while exposing the connected vault to device tools.
- v0.3.0 removes helpers and uses native connected-folder and artifact actions.

## Evidence

- Installed v0.2.1 exposed both skills but `${CLAUDE_PLUGIN_ROOT}` resolved only
  in Cowork's cloud container; the writable project folder was on the device.
- Attaching the source checkout made the unchanged helpers work, isolating the
  defect to runtime path resolution rather than capture or rendering logic.
- `pnpm run check` passed after the refactor: 17 tests, syntax checks, direct
  execution of both skill-local helpers, and the pinned artifact freshness
  check were green.
- `claude plugin validate .` passed for the marketplace manifest.
- GitHub Actions now validates Ubuntu and Windows runners, and the portable
  entry-point assertions use Node path semantics instead of Unix separators.
- The Windows runner exposed a Unix-only build-tool launcher; the artifact
  build now invokes Tailwind's JavaScript entry point through Node.
- The freshness check normalizes checkout line endings so Windows CRLF files
  compare correctly with the generated LF bundle.
- PR #6 CI passed on both `ubuntu-latest` and `windows-latest` after exercising
  all 17 tests and the generated-artifact freshness check.
- After PR #6 merged, Cowork marketplace sync and installation of v0.2.2
  succeeded, but `${CLAUDE_SKILL_DIR}` still resolved only in the cloud
  container. The device runtime had the vault but no installed plugin copy.
- The clean test stopped without writing the requested observation, proving
  that CI path portability did not solve Cowork execution-surface portability.
