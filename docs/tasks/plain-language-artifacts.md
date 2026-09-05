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
- [ ] Repeat the installed-plugin Cowork demo and visually inspect the timeline,
  event dialog, chart annotations, and summary after the updated release is
  installed.

## Verification

- Package contract tests cover the generation and refresh instructions.
- The component library 0.7.0 declarations and implementation were inspected;
  its event dialog renders primitive `WellEvent.meta` entries and accepts a
  shared `formatDate` callback for timeline and detail presentation.
- Candidate release: 0.6.1.
