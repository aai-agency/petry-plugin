# Plain-language artifact presentation

## Goal

Keep petry's exact local records available for safe capture, filtering, and
refresh while ensuring operational users see only familiar business language.

## Accepted behavior

- [x] Event views label temporal information as **Date** and default to a
  friendly calendar date.
- [x] Exact timestamps and same-day event identity remain available privately
  for ordering, filtering, and refresh.
- [x] Event component metadata uses an explicit presentation allowlist because
  the component library renders primitive `WellEvent.meta` entries.
- [x] UUIDs, schema fields, graph fields, connector/resource IDs, hashes, paths,
  raw JSON, and internal field names stay out of visible and accessible UI.
- [x] Capture-driven refresh follows the same presentation boundary.
- [x] Repeat the installed-plugin Cowork demo and visually inspect the timeline,
  event dialog, chart annotations, and summary after the updated release is
  installed.

## Verification

- Package contract tests cover the generation and refresh instructions.
- The component library 0.7.0 declarations and implementation were inspected;
  its event dialog renders primitive `WellEvent.meta` entries and accepts a
  shared `formatDate` callback for timeline and detail presentation.
- Candidate release: 0.6.1.
- Cowork session:
  `https://claude.ai/cowork/cse_01RbkyQq657Jfk9773uWdAGu`.
- The existing private artifact `13a38dac-efe5-424f-b1ca-a0b0c5b93cae` was
  republished at the same identity. Before correction its visible dialog exposed
  world time, UTC, precision, knowledge timestamp, and UUID; the page also showed
  file paths, external IDs, schema state, refs, and dependency disclosures.
- After correction, the full rendered accessibility tree uses friendly calendar
  dates across KPIs, chart annotations, summaries, evidence links, and all four
  timeline rows. The two Sep 5 events remain distinct. The transmitter-restart
  dialog was opened and contains only Date (`Sep 5, 2026`), Type (`Event`), Asset
  (`W-42`), Status (`Active`), and Source (`Operator note`).
