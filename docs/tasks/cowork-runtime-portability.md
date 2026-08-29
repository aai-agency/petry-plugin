# Cowork runtime portability

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
- [ ] Install the updated plugin in Cowork and repeat the installed-only smoke
  test (deferred until PR #6 reaches the marketplace default branch).
- [x] Commit, push, and open pull request #6.

## Decisions

- Skill-local helpers are the source of truth because Cowork mounts supporting
  files with the skill on the active execution surface.
- Root `scripts/` files remain thin compatibility launchers.
- The production preview stays fully self-contained and offline.

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
