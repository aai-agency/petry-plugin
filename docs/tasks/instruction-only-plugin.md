# Instruction-only petry plugin

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
- [x] Install from the marketplace and repeat the clean Cowork smoke test.
- [x] Make the published oil-and-gas component library the primary artifact UI.
- [x] Require click-through verification of the library event detail dialog.
- [x] Limit generated UI to capabilities the library does not provide.
- [x] Normalize the petry brand to lowercase across shipped text and metadata.
- [x] Define grouped area, field, pad, basin, subsystem, and selection artifacts.
- [x] Require traceable KPI, event, and AI-summary drill-downs for groups.
- [x] Adopt shared dynamic asset breakdown primitives instead of treating
      grouped filters, KPIs, drill-downs, and summaries as custom fallbacks.

## Decisions

- Cowork must never depend on a plugin path being visible to the device runtime.
- Claude reads and writes the vault through connected-folder tools.
- The vault remains human-readable Markdown and continues to read legacy rows.
- One-off production views are native Cowork artifacts generated from a defined
  in-memory data model.
- Oil-and-gas interfaces use the latest compatible
  `@aai-agency/og-components` first whenever React bundling is available.
- Custom artifact UI is limited to library gaps and must not be represented as
  a library component.
- Grouped artifacts keep every aggregate contribution traceable to its member
  asset, and all filters update charts, KPIs, events, and summaries together.
- AI summaries are derived from the visible filtered production and vault
  context, link back to supporting events, and are never captured automatically.
- Group dimensions are arbitrary direct keys in `Asset.meta`; `TimeSeries` and
  `WellEvent` link through `assetId`, and one controlled scope drives every
  installed shared primitive.
- Version `0.3.0` marks the removal of the executable runtime contract;
  `0.3.1` adds the responsive-artifact rule discovered during live visual QA.
- Version `0.4.0` makes component-first artifact generation the default, adds
  required event-dialog interaction verification, removes automatic synthetic
  data banners, and normalizes the petry brand to lowercase.

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
- Cowork marketplace sync exposed v0.3.0 as two skills that "Only adds
  instructions for Claude"; installation completed without attaching source.
- A clean task attached only `petry-mock-cloud`, invoked both installed skills,
  appended one observation through connected-folder editing, and treated the
  identical second capture as a no-op (4 observations and identical SHA-256
  before/after).
- The production skill read 730 mock SQLite rows through a read-only immutable
  connection, published a native inline oil/gas/water artifact with all four
  asset-matched observations, and left the database hash unchanged at
  `c5cdb7183fd664c78f38b7bfb61b73bb794b5ca6170d60c8e06a519c79c92de4`.
- Visual QA caught a global SVG rule stretching the synthetic-data warning
  icon. The generated artifact was corrected and verified at 460, 560, and 720
  px with an 18×18 icon, readable banner, and no horizontal overflow. The skill
  now makes this responsive CSS constraint explicit.
- Live v0.3.1 acceptance testing proved capture, deduplication, read-only SQLite
  access, and native artifacts, but also proved the generated chart, event list,
  and table were handcrafted rather than package components.
- The published `@aai-agency/og-components@0.7.0` declarations expose `Chart`,
  `ChartGroup`, `EventTimeline`, `EventDetailDialog`, and `EventActivityLog`.
  `EventTimeline` opens its accessible detail dialog on row or marker selection.
  The package has no production-table export, so tables remain an explicit
  custom fallback.
- `pnpm run check` passes five release invariants for v0.4.0; both skills pass
  `quick_validate.py`; and `claude plugin validate .` passes.
- A live Cowork rebuild resolved and bundled the published
  `@aai-agency/og-components@0.7.0`: `ChartGroup` rendered the oil, gas, and
  water panels, and `EventTimeline` rendered all eight vault observations.
- Clicking the June 15 tubing-pressure row opened the library's built-in
  accessible dialog with the exact observation text, date, type, source, and
  valid date; Escape closed it. Chart controls, the explicitly custom table
  fallback, responsive widths, and lowercase `petry` labels also passed live
  interaction checks with no runtime errors or external requests.
- PR #9 passes its Ubuntu and Windows validation jobs.
- A live grouped-area preview combined eight wells across ESP and rod-lift
  subsystems. Selecting ESP updated its five KPIs, three aggregate chart panels,
  ranked member list, event clusters, and precomputed AI briefing to the same
  four-well scope.
- The grouped custom fallbacks passed KPI contributor sorting, summary-to-source
  event drill-down organized by asset/date/type, member-well drill-in/back with
  filters preserved, and responsive checks. Selecting a supporting event opened
  the library `EventDetailDialog`; Escape returned to the grouped event dialog
  without losing its asset organization.
- Cowork's grouped interaction suite passed 25/25 with no runtime errors,
  external requests, browser storage, or horizontal overflow at 1280, 900, 760,
  and 390 px.
- O&G components PR #24 adds the shared `AssetScope`, `ScopeFilters`,
  `MetricCard`, `RecordDrilldownDialog`, and `OperationalSummary` contract plus
  `ChartGroup`/`EventTimeline` scope and dynamic metadata breakdown props. The
  petry instructions now detect that focused export from installed declarations
  and use it before generating any grouped fallback.
