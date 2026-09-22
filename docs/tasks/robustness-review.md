# Functionality and robustness review fixes

## Scope

Fix all four findings from the September 22 review: trusted capture clocks,
correction evaluation, case-sensitive duplicate detection, and sample labels.
Keep the plugin instruction-only and preserve the existing attachment UI work
on main. The original checkout's untracked build directory is untouched.

## Checklist

- [x] Require a fresh verified UTC clock for capture and correction writes.
- [x] Validate complete successor payloads, UUIDs, and real knowledge times.
- [x] Preserve case and exact text in duplicate decisions; exercise unit case.
- [x] Always label generated sample data without a separate label request.
- [x] Run deterministic checks and the live capture lifecycle with strict oracles.
- [ ] Review changes and deliver a pull request with verification evidence.

## Decisions

- Host-supplied current-request UTC timestamps are valid clock evidence; example
  dates, model guesses, and earlier-turn timestamps are not.
- Corrections must have a nonempty predecessor knowledge interval. A stale or
  insufficiently precise clock requires a fresh sample, never an invented tick.
- Compare exact fact strings for automatic duplicate suppression. Near-matches
  may prompt clarification but must not silently discard a distinct assertion.
- Tests remain development tools; no validator/runtime is shipped into skills.

## Verification

- `pnpm check`: 60/60 tests pass, including negative mutation cases for incorrect
  facts/subjects, missing metadata, stale/future/invalid clocks, duplicate IDs,
  damaged history and lost as-of visibility.
- `claude plugin validate .`: marketplace validation passes.
- `git diff --check`: passes.
- `pnpm eval:agent -- --keep`: seven cases passed with Haiku/low, including fresh
  timestamps, preserved correction history, a case-only unit correction, and
  byte-identical duplicates. CLI-reported cost: $1.6471014. The predecessor was
  recorded at 18:41:57.099Z and expired at 18:43:42.524Z, matching the successor's
  creation time. See [structured evidence](robustness-review-eval.json).
- Entity/attachment evaluation with the new per-turn clock checks: in progress.

Native Cowork UI is a separate acceptance surface; the headless adapter cannot
prove browser rendering, sample-banner visibility, or attachment preview behavior.
