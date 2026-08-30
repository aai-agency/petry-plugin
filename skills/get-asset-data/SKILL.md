---
name: get-asset-data
description: >
  Get data for any named asset, including a well, meter, tank, pump, compressor,
  pipeline, facility, or a group such as an area, field, pad, basin, subsystem,
  or selected set, from files, databases, APIs, or connectors available in the
  current session. Present readings, production, status, specifications, or
  events as an asset profile, table, chart, grouped overview, or map. Activate
  for requests such as "get asset data", "show meter M-101 readings", "tank
  levels", "get production for HOWARD 4N", "show a decline curve", "well
  profile", "map my wells", or "summarize subsystem activity", and for
  /get-asset-data. petry supplies the workflow and data shape, not the data.
---

# get asset data → component-first artifact

petry is an instruction-only skill. Retrieve the user's data dynamically and
build the result with Claude's artifact capabilities. Do not look for,
execute, copy, or create plugin helper programs, bundled templates, or renderers.

## Get the data

Use sources in this order:

1. A file, spreadsheet, database table, URL, or connector the user named.
2. Data already attached or pasted in the conversation.
3. A relevant connected database, API, or MCP available in this session.
4. If nothing is connected, ask the user to attach or identify a CSV, Excel,
   JSON, or database source.

Use sample or representative data only when the user explicitly requests it,
and label it prominently. Never present invented asset data as real.

Read database sources without modifying them. Preserve the source's values and
units. Partial data is acceptable; explain material gaps instead of filling them
with invented values. Resolve the requested asset by source identity and type;
ask which asset when a name is ambiguous. Do not assume every asset is a well.

## Normalize the artifact data

Create an in-memory model with this shape before rendering. The example field
values describe the schema; they are not measurements to display:

```json
{
  "asset": {
    "id": "source identifier when available",
    "name": "exact asset name",
    "type": "source asset type when available",
    "status": "status when available",
    "properties": { "source property name": "source value" },
    "meta": { "dynamic source classification key": "source value" }
  },
  "series": [
    {
      "metric": "source metric identifier",
      "label": "source metric label",
      "unit": "source unit when available",
      "kind": "rate | interval_total | cumulative_counter | gauge | state",
      "points": [
        { "time": "source date or timestamp", "value": null }
      ]
    }
  ],
  "records": [
    { "source column name": "source value" }
  ],
  "kpis": [
    {
      "metric": "source metric identifier",
      "label": "calculation label",
      "value": null,
      "unit": "source or explicitly derived unit",
      "calculation": "calculation and covered period"
    }
  ],
  "activity": [
    { "type": "event", "date": "YYYY-MM-DD", "text": "exact captured observation" }
  ],
  "provenance": "plain-language description of the source"
}
```

Requirements:

- Include only fields and metrics supported by the source. Leave collections
  empty when unavailable; an asset profile or table is valid without time series.
- Keep domain fields such as well formation, meter serial number, or tank
  capacity inside `asset.properties`; source classifications go in `asset.meta`.
- Preserve source time granularity and timezone information. Sort points by time
  and align comparable series on a shared axis only when needed. Use `null` for a
  missing measurement; do not remove a timestamp to hide a gap, invent a sampling
  interval, or force meter readings into monthly production buckets.
- Preserve each metric's source unit or state any explicit conversion. Do not
  plot incompatible units on a shared unlabeled axis.
- Set `kind` from source semantics, not just a label or unit; omit it when unknown
  and avoid calculations that require it until clarified. Do not sum pressure,
  temperature, tank levels, or cumulative meter counters as produced volumes.
  Counter differences require a known interval and reset/rollover handling;
  integrating rates requires known time intervals and an explicit method.
- Compute KPIs only from available values, with units, period, and calculation.
  Preserve non-time-series readings and specifications in `records` or properties.
- For well production, keep oil, gas, and water as metric series when present,
  align their supplied monthly history when applicable, and retain source units.
  Oil is the primary decline series when present, then gas, then water. Production
  KPIs such as peak rate and cumulative volume apply only to appropriate data.

For an area, field, pad, basin, subsystem, or selected set, extend the model
with an explicit group and retain each contributing asset:

```json
{
  "group": {
    "id": "source identifier or stable selection key",
    "name": "exact group or selection name",
    "type": "source group type or selection",
    "parent_id": "parent identifier when available"
  },
  "members": [
    {
      "asset": {
        "id": "source asset identifier",
        "name": "exact asset name",
        "type": "source asset type when available",
        "properties": {},
        "meta": { "dynamic source classification key": "source value" }
      },
      "series": [],
      "records": [],
      "kpis": [],
      "activity": []
    }
  ],
  "aggregate": { "series": [], "kpis": [], "activity": [] },
  "active_filters": {
    "asset_ids": [],
    "statuses": [],
    "event_types": [],
    "date_from": null,
    "date_to": null
  },
  "dimension_key": "direct key selected from member.asset.meta"
}
```

Group requirements:

- Each member uses the same asset model above, including status when available.
  Resolve membership from source relationships; groups may contain mixed types.
- Aggregate only semantically comparable metrics after aligning time intervals
  and units. Use a domain-correct operation and identify its contributors. Do not
  double-count the same flow measured by a meter and its upstream wells. Keep
  incompatible metrics separate; explain when an aggregate cannot be supported.
- Do not replace missing member values with zero unless the source defines them
  as zero. Report partial coverage and the denominator for averages.
- Preserve the member asset ID and name on every KPI contribution and activity
  record so a grouped value can always drill back to its source.
- Keep classifications on each member's `asset.meta` object. Treat `dimension_key`
  as a dynamic direct key (`member.asset.meta[dimension_key]`), not a fixed list or
  a dot-path. Link every series and event to its member with `assetId` when
  preparing library inputs; do not duplicate dimension values on those records.
- Report totals and distributions separately. For example, distinguish total
  oil volume from average well rate or average meter pressure.
- Recompute grouped series, KPIs, event counts, and summaries from the same
  active filter set; never display a stale unfiltered summary beside filtered
  metrics.

## Read petry observations

When a connected project exists, read `.petry/vault/*.md` and legacy
`.petry/insights/*.md`. For one asset, select only files whose decoded
`<!-- petry:asset ref="..." -->` exactly matches the requested asset. For a
group, select the group record when present plus records whose exact asset refs
belong to the resolved member set. Do not use fuzzy names to add an asset to a
group.

Parse rows shaped like:

```md
- **[event]** 2026-06-10 — Well returned to production. <!-- petry:obs type="event" valid_at="2026-06-10" captured_at="..." source="session" -->
```

Map each row to `{ asset_id, asset_name, type, date, text, source }`, using
`valid_at` as `date` and omitting the date when it is empty. Existing optional
`hash` attributes do not affect rendering. Do not edit the vault while
producing an asset artifact.

## Build and show the result

### Use the oil-and-gas component library first

For every oil-and-gas interface, first determine whether the current artifact
surface can build and bundle React. When it can, resolve and use the latest
compatible release of `@aai-agency/og-components` before writing custom UI.
Inspect the installed package README and TypeScript declarations rather than
guessing its API. Install it in the temporary artifact workspace with the
surface's default package manager; never add it to the connected user's project
unless the user explicitly asked for application implementation there.

Adapt the generic model to the installed component API at the presentation
boundary. Do not coerce an unsupported asset type or metric into well/oil data
to satisfy a component. If that input is unsupported, use the applicable library
primitive or the narrowly scoped fallback described below.

Use the library component that owns the interaction:

- Asset measurement history: `Chart` or `ChartGroup` from
  `@aai-agency/og-components/chart`. Prefer `ChartGroup` for aligned oil, gas,
  and water panels, or other compatible metric panels.
- Asset history: `EventTimeline` from
  `@aai-agency/og-components/event-timeline`. Map dated petry observations to
  `WellEvent` records and preserve their original petry type and source in
  `meta`. Retain the actual asset type even if the library type is named
  `WellEvent`. Clicking a row or marker must open the component's built-in accessible
  event detail dialog.
- Detailed event extensions: use `EventDetailDialog`, `EventActivityLog`, or
  `EventTimeline.renderDetail` instead of creating another modal or timeline.
- Maps and asset details: use the package's `Map` and asset-card components only
  when requested and when their required inputs, including a Mapbox token, are
  available.
- Shared group scope: when the installed declarations export the focused
  `@aai-agency/og-components/asset-breakdown` entry, use its `AssetScope`,
  `ScopeFilters`, `MetricCard`, `RecordDrilldownDialog`, and
  `OperationalSummary` primitives. Keep one controlled scope object and pass it
  to every component that accepts it.

### Grouped asset interfaces

For grouped scopes, compose the installed library primitives before filling a
remaining gap with custom UI:

- Build package `Asset` inputs from each `member.asset`, retain classifications in
  `Asset.meta`, and link every `TimeSeries` and `WellEvent` with `assetId`.
- Use one controlled `AssetScopeBinding` for `ScopeFilters`, `ChartGroup`, and
  `EventTimeline`. A selected breakdown is an arbitrary direct
  `Asset.meta[dimensionKey]` key.
- Use `ChartGroup.assetScope` plus `breakdown`. Choose `mode: "aggregate"` for
  one selected-scope total or `mode: "dimension"` for one series per metadata
  value. Always supply the domain-correct aggregation explicitly; never infer
  it from a label or unit.
- Use `EventTimeline.assetScope` plus the same `breakdown.dimensionKey` for the
  filtered event collection and retain its built-in dialog for final
  single-event detail.
- Use library `MetricCard` for interactive aggregate values,
  `RecordDrilldownDialog` for KPI/event/summary contributors, and
  `OperationalSummary` for evidence-linked observed facts and interpretations.
  A record selection may hand an event to the library `EventDetailDialog`.
- Generate a custom grouped control only when the installed declarations lack
  that exact primitive. Do not recreate a library scope filter, KPI card,
  contributor dialog, summary, chart, timeline, or single-event dialog.
- Keep the selected hierarchy path visible, such as
  `area / subsystem / selected assets`, and provide asset, status, event-type,
  and date filters when the corresponding fields exist.

Every grouped number or event grouping must be interactive:

- Clicking a KPI opens an accessible drill-down dialog showing the contributing
  assets or records, calculation, units, selected period, and current filters.
- Clicking an event count, cluster, or summary statement opens an accessible
  multi-event dialog containing the associated source events. Let the user sort
  or group them by asset, date, and event type, then open an individual event in
  the library's detail dialog.
- Clicking a member row drills into the corresponding single-asset profile without
  losing the parent scope or filter context.

Include an AI-generated operational summary for the exact visible scope. Build
it only from the filtered asset values and petry observations already
loaded into the artifact; do not invent causes, recommendations, or missing
events. State the covered asset count and date range, distinguish observed facts
from interpretation, and cite the supporting asset names or source-event count
inside each summary section. Recompute the summary whenever group or filters
change. A summary sentence must be clickable and open the same supporting-event
dialog used by grouped event counts. Do not write generated summaries back to
the vault unless the user separately requests capture.

Pass the generated result into `OperationalSummary` with `generation: "ai"`
when that export is installed. Keep its observed facts distinct from
interpretations, pass the supporting `DrilldownRecord` collection, and route
`onInsightSelect` to the same contributor dialog. The component displays the
summary; petry/Claude remains responsible for generating it from the filtered
vault and asset data context.

Generate custom UI only when the installed package has no applicable component
or the surface cannot build React. For example, if the package does not export an
asset data table, a responsive semantic HTML table behind a disclosure is an
acceptable custom addition. Do not treat grouped primitives as missing merely
because they live under the focused `/asset-breakdown` export. Do not claim a
custom element came from the package.
If React bundling is unavailable, build the native fallback and state briefly
that the component library could not be used on the current surface.

For a one-off table, chart, asset profile, or decline-curve request, create a
native Cowork artifact directly from the normalized model and show it inline.
The artifact should be self-contained and must not depend on a plugin file, local server,
external CDN, browser storage, or hidden network request.

Include:

- Asset identity/type/status and clear data provenance.
- The requested readings, specifications, status, or events in an appropriate
  profile, table, or chart. Show units and a readable legend for metric history;
  show oil, gas, and water only when those production metrics exist.
- A decline curve only for applicable production history, and a forecast only
  when the data and method support it; distinguish forecasts from actuals.
  Never apply production decline assumptions to meter counters or equipment
  status. Maps require source coordinates; do not invent asset locations.
- Useful KPIs derived from the data.
- Dated petry activity as chart annotations when practical and through
  `EventTimeline` in all component-capable artifacts.
- For grouped scopes, a filter-aware AI summary, aggregate KPIs, member ranking,
  and grouped event access with traceable drill-down to each contributing asset.
- No sample, mock, demo, or synthetic-data banner unless the user explicitly
  asks for that label. Keep source provenance neutral and factual.
- Render every petry product or brand label exactly as lowercase `petry`; never
  title-case or uppercase it in headings, badges, metadata, or provenance.

Use accessible colors, text alternatives/labels, and responsive layout. Escape
user-provided text before placing it in HTML or executable contexts. Present the
artifact inline; save a copy into the connected project only when the user asks.

Scope responsive SVG or canvas sizing rules to chart containers. Never apply a
global `svg { width: 100% }` rule: it can stretch legends, alerts, and interface
icons. Give non-chart icons explicit width and height with shrinking disabled.
Verify the finished artifact at split-pane widths so banners remain readable,
charts do not clip, and `scrollWidth` does not exceed `clientWidth`.

If the current surface cannot create a native artifact, create a standalone HTML
file in the connected project using Claude's ordinary file tools and open it for
the user. This fallback is generated for the current request; it is not a petry
runtime dependency.

## Verify component behavior

For a component-first artifact, verify the rendered result rather than only the
build output:

- Click at least one `EventTimeline` row or marker and confirm the library event
  detail dialog opens, can close with its button or Escape, and shows the exact
  observation text, date, type, and source.
- Exercise chart hover, zoom, or presentation controls that the selected chart
  component exposes.
- Exercise every custom fallback interaction, including table disclosures.
- For grouped scopes, change at least one hierarchy, asset, or date filter and
  confirm the aggregate chart, KPIs, member list, event collection, and AI
  summary update together.
- Switch the breakdown to a second available metadata key and confirm filters,
  chart series, event filtering, KPI contributor grouping, and summary scope
  all resolve from that direct key without changing component code.
- Open a KPI drill-down and a grouped-event or summary drill-down. Confirm their
  contents match the active filters, can sort or group by asset and date, and
  can reach a library single-event detail dialog without losing context.
- Confirm there are no console errors, unexpected network requests, or
  horizontal overflow at split-pane and mobile widths.

For implementation inside the user's React application, keep domain fields
inside `Asset.properties`, retain classifications in `Asset.meta`, add Mapbox
only for map views, and follow the installed package's current peer-dependency
and styling instructions.

## Related

Use `/capture` when the user wants to log an asserted asset observation. That
skill writes the Markdown shape this skill reads back into future profiles.
