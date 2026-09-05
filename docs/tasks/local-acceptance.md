# Local user acceptance and optional team MCP

## Scope and product decision

The local plugin must be useful independently: retrieve connected local data,
capture to the local vault, and update applicable artifacts. The optional paid
MCP is the intended shared database/team path. This task does not implement or
claim a deployed paid service, team authorization, or lossless importer.

## Checklist

- [x] Review current release and recover prior native evidence.
- [x] Create isolated worktree; preserve original checkout and build leftovers.
- [x] Reproduce fresh installed-plugin retrieval using disposable synthetic data.
- [x] Verify final hourly interval and component-library use.
- [x] Verify capture, out-of-window correction, unrelated capture, duplicate,
      and saved-view preservation with artifact and local-file evidence.
- [x] Verify disk persistence in a fresh read-only conversation.
- [x] Address confirmed instruction gaps and clarify local/paid boundary.
- [ ] Validate changes and deliver a pull request with evidence and limitations.

## Recovered evidence

The repository task record was stale. Vault session log
`petry-native-capture-tests-2026-08-30-200328` records an installed v0.5.0
Cowork run with successful range capture, unrelated capture, duplicate no-op,
and correction outside the displayed scope. The test session was
https://claude.ai/cowork/cse_014uETnmxXvFDRkxaNf3URJx.

It also records two unresolved retrieval defects: 335 rather than 336 hourly
intervals for August 1–14, and an unsupported claim that CSP prevented use of
the shared component library. A bare `/capture` invocation was unrecognized;
explicit `petry:capture` loading worked.

## Current verification

Fresh Cowork session:
https://claude.ai/cowork/cse_017PL93yS54u7NrNZiZNG1vS.
Installed plugin observed enabled at 0.5.0. Connected only disposable synthetic
folder `petry-local-acceptance-20260905` with session-only permission; persistent
permission checkbox remained off. No original vault, database, installed settings,
or existing services modified.

Baseline native artifact: `06d60541-c303-4ab4-9ea6-7860dcfaeb0e`, revision
`1788613622-8d2d`.

- PASS: all 336 M-101 points/bounds match source CSV independently; original
  hashes unchanged; vault absent. Native UI displays the final interval ending
  August 15 00:00 UTC, mean 311.5/min 300/max 323 psig.
- PASS: native date controls changed to August 5–6 and displayed 48 intervals
  with correct first/last boundaries.
- FAIL: shared library skipped because the artifact was self-contained. Claude
  explicitly described a custom SVG chart and event panel; no bundle attempt.
- Additional metadata gaps: unverified source mtime, descriptive project identity,
  and null saved artifact_id after native publication.

Candidate 0.5.1 instructions were supplied as files in the disposable folder for
an explicit second pass. This is not an installed-candidate acceptance result.
The candidate resolved and installed `@aai-agency/og-components@0.7.0`, inspected
focused exports/declarations, bundled Chart/EventTimeline with React 19 and
compiled Tailwind/uPlot CSS into a 668,971-byte self-contained file. Native
artifact identity stayed the same at revision `1788614311-839d`. Native UI
independently exposes the real chart zoom/settings controls, 48 intervals and
the saved August 5–6 view. Cowork's executed headless checks report event-dialog
behavior, Escape close, no console errors or external requests, and no overflow.
Local source hashes stayed unchanged and vault remained absent.

The rebuild prompt explicitly supplied August 5–6 selection. A stronger live
state probe selected August 5 only (24 rows), then closed and reopened the panel
WITHOUT a capture: it reset to the saved August 5–6 view (48 rows). Automatic
transient-state persistence is therefore not established and fails on this
surface. The capture pass explicitly requests the saved view; this must not be
reported as proof of live filter recovery. Instructions now state this boundary.

## Capture pass (candidate instructions)

- Relevant range PASS: UUID `083851af-b035-43d8-83c8-a75b39027fe6`, all 14 fact
  fields, date precision and [2026-08-05, 2026-08-07). Native artifact revision
  changed to `1788615043-57ed` at the same ID. Independently opened the real
  timeline row; detail dialog shows exact text, boundaries, source and UUID;
  Escape closes. The requested saved August 5–6 view still shows 48 rows.
- Independently compared entire normalized telemetry series/records and saved
  filters before/after: identical. Original CSV hashes unchanged.
- Visual testing caught a bad chart annotation adapter (forecast-relative versus
  absolute telemetry coordinates). It was removed before publication; exact
  interval remains in the library timeline/details. Native chart X zoom labels
  remain August 5–7 and Y upper bound approximately 325 psig.
- Capture created an unnecessary `_last_write.json` scratch file. Broad delete
  permission was denied; Claude moved it aside, then the reviewer moved that
  task-created directory to evidence. Final candidate instructions prohibit
  scratch writes to the connected project. Subsequent captures will test that
  guard. This first capture is not evidence of scratch-free behavior.
- Saved project identity initially contained descriptive vault-state prose
  despite the clarified instruction. Targeted repair during the correction set
  the exact connected-folder path in the final saved model and native artifact.
  Do not claim that this metadata rule was followed autonomously. The same repair
  prevented CSS from uppercasing the petry brand in the observation heading.
- Unrelated capture PASS: M-202 point event created one file, UUID
  `82717468` (prefix), valid_at August 9 with no invalid_at. Independent file
  mapping comparison shows all seven pre-existing files byte-identical and
  exactly one new file. Native M-101 artifact remains revision
  `1788615043-57ed`, 48 telemetry rows and one event. No scratch file created.
- Duplicate PASS: repeated the exact original M-101 assertion. Independent
  comparison shows all eight project files byte-identical, no new files, and
  native artifact revision still `1788615043-57ed` with the same displayed view.
- Out-of-window correction PASS: predecessor is identical except expired_at;
  expiry equals replacement created_at (`2026-09-05T13:38:53Z`). Replacement
  UUID starts `f82d85b9`, supersedes the old UUID, is unexpired and covers
  [August 20, August 22). Three records total (two M-101 versions plus M-202).
  Independent comparison confirms M-202 file, source hashes, entire telemetry
  model/records, saved filters, and artifact identity unchanged. No scratch files.
- Native final revision `1788615768-4793` removes the old event, shows an accurate
  out-of-window explanation, retains the correct August 5–7 chart axis and 48
  telemetry rows, and displays the exact project path and lowercase brand.
  The full rendered native artifact was visually inspected.
- Fresh-session persistence PASS:
  https://claude.ai/cowork/cse_0192h9qywtRSdDRQpKrrTy3N read only the candidate
  retrieval contract and local vault, recovered both exact M-101 UUIDs/times and
  the supersedes link, identified the correct current version, and returned
  neither record for an August 1–14 current-knowledge view. Independent hash
  comparison confirms all eight project files unchanged.

## Verification limits

This was model-mediated acceptance on one macOS Cowork surface, using installed
0.5.0 for the baseline and explicitly supplied candidate instructions for the
repaired flow. Final candidate files exactly match the repository skills.
Component adherence and stable metadata needed review feedback; one passing run
does not establish autonomous success on every prompt/host. First capture took
about nine minutes including discovering/repairing the annotation issue; this
is not an instant updater or a latency benchmark.

Transient UI filters reset on close/reopen in this host. Saved-view refresh was
verified; automatic live-state recovery was not. No paid MCP, team concurrency,
permissions enforcement, migration, Graphiti insertion, cross-session refresh,
or hourly/as-of native UI was tested. A fresh disk read establishes persistence,
not automatic synchronization. The candidate is not merged or installed.

Local evidence is retained in `Documents/petry-local-acceptance-20260905-evidence`:
independent source hashes, per-stage file snapshots, parsed observations,
`check.py` assertions, and fresh-session result. The synthetic fixture and final
standalone HTML/model remain in `Documents/petry-local-acceptance-20260905`.

## Changes

- Local mode has no petry subscription/MCP prerequisite. Explicit shared writes
  must use actual workspace/permissions, cannot silently become local success,
  and do not automatically upload or dual-write the vault.
- Telemetry intervals retain boundaries and are filtered by overlap; final-hour
  inclusion is verified independently of display timestamps.
- Component fallback requires an actual resolution/bundle attempt or an explicit
  unavailable host capability; runtime CDN restrictions do not establish failure.
- Local summaries recompute facts; AI interpretations require an exact matching
  scope/revision or a fresh conversation request, without hidden network calls.
- Provenance uses observed metadata; project identity is stable and publication
  IDs propagate to requested saved model copies.
- Release metadata proposed as 0.5.1. Twelve static checks pass; these do not
  substitute for native behavior evidence.

Repeatable steps and numerical oracle: [local-acceptance-protocol.md](local-acceptance-protocol.md).
