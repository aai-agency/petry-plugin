# Instruction-only Petry plugin

## Goal

Make Cowork capture and production artifacts operate entirely through Claude's
native connected-folder and artifact capabilities. The marketplace package must
ship instructions and data shapes, with no executable runtime or bundled
renderer.

## Scope

- [x] Record the installed-only v0.2.2 failure and correct the runtime model.
- [x] Replace capture execution with connected-folder Markdown instructions.
- [x] Specify exact asset, observation, deduplication, and legacy-read behavior.
- [x] Replace bundled rendering with dynamic native-artifact instructions.
- [x] Remove runtime programs, bundled preview, and artifact build workspace.
- [x] Remove obsolete tests and add instruction-package invariants.
- [x] Update release metadata and documentation.
- [x] Validate the marketplace package on Linux and Windows.
- [x] Open pull request #7.
- [ ] Install from the marketplace and repeat the clean Cowork smoke test.

## Decisions

- Cowork must never depend on a plugin path being visible to the device runtime.
- Claude reads and writes the vault through connected-folder tools.
- The vault remains human-readable Markdown and continues to read legacy rows.
- One-off production views are native Cowork artifacts generated from a defined
  in-memory data model.
- React implementation remains an explicit, separate path using
  `@aai-agency/og-components`.
- Version `0.3.0` marks the removal of the executable runtime contract.

## Evidence

- Marketplace sync and update to v0.2.2 succeeded.
- A clean Cowork task invoked the installed `/capture` skill, but
  `${CLAUDE_SKILL_DIR}` resolved only in the cloud container.
- The attached vault was available only on the device runtime, where the skill
  directory and variable were absent.
- Cowork stopped without writing the requested observation or modifying SQLite.
- `pnpm run check` passed all four instruction-package invariants locally.
- `claude plugin validate .` passed for the marketplace manifest.
- PR #7 passed its Ubuntu and Windows validation jobs.
