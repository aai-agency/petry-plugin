# General asset data retrieval

## Scope and feedback

The user requested `/get-asset-data` instead of `/get-well-production` because
assets include meters and other equipment. Preserve local vault creation and
reuse, and preserve the component-first grouped interfaces already in PR #9.

## Checklist

- [x] Rename the skill directory, frontmatter, and current cross-references.
- [x] Generalize source identity, properties, records, metric series, and KPIs.
- [x] Cover meters, tanks, pumps, compressors, pipelines, facilities, and wells.
- [x] Retain well production and group/filter/component behavior.
- [x] Extend capture activation to the same asset types without changing storage.
- [x] Document command migration and keep exactly two shipped skills.
- [x] Run package checks and plugin validation; review schema examples and diff.
- [ ] Commit, push, and open a pull request stacked on PR #9.

## Decisions

- Base this change on `codex/petry-components-lowercase` (PR #9), which contains
  accepted component and grouped-scope work not yet present on main.
- Keep the pending release's existing 0.4.0 version; this is a follow-on change
  to that unreleased work, not a deployment.
- Replace the old slash command; natural-language well-production queries remain
  supported. No alias skill or vault migration is needed.
- Preserve metric semantics and time granularity. Do not treat gauges or counters
  as production volumes, or double-count flows across meters and wells.
- Adapt generic assets to installed component APIs without mislabeling equipment.

## Verification

- `pnpm run check`: all 5 existing package/instruction checks pass with the new
  skill path; still exactly two skills and no bundled runtime.
- `claude plugin validate .`: marketplace validation passes.
- `git diff --check`: passes.
- Both embedded JSON data-model examples parse successfully.
- Reviewed the renamed skill against the PR #9 base: filters, metadata
  breakdowns, component reuse, event dialogs, summary traceability, and responsive
  rules remain intact. Well-production prompts remain explicit triggers.
- Checked meter readings, static equipment properties, mixed asset groups, and
  well production against the written contract. This is an instruction review,
  not a live model-behavior test.
- No fresh installed Cowork session is exercised by this task.
