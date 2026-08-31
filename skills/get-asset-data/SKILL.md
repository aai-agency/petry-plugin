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
    { "observation": "complete v2 record below", "date": null, "end_date": null }
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

## Read petry observations — full fact metadata

Read `.petry/vault/*.md` and legacy `.petry/insights/*.md` only from the connected
project. Resolve exact asset refs, never fuzzy names. For groups include the
explicit group record and resolved member refs; do not invent group membership.
For v2, match each record's petry.asset_refs across files, not only the primary
file header. A multi-asset assertion is stored once and deduplicated by
project-scoped UUID in grouped views. Graph endpoints alone do not add an asset
to the requested display scope. For legacy rows decode HTML entities in the
asset header's ref before exact comparison.
New records are a readable bullet followed by `<!-- petry:observation schema="2" -->`
and a fenced JSON record. Parse top-level markers only, not marker text inside
JSON strings or archived petry.legacy_origin evidence. The JSON is authoritative.
Preserve the entire record
in `activity[].observation`; never reduce it to `{type, date, text}`. Format example:

```json
{
  "uuid": "ec87917b-8c24-4bfb-9af4-0da2f4b1e910",
  "group_id": null,
  "source_node_uuid": null,
  "target_node_uuid": null,
  "created_at": "2026-08-30T18:00:00Z",
  "name": null,
  "fact": "M-101 line pressure was 340 psig from August 5 through August 6.",
  "fact_embedding": null,
  "episodes": [],
  "expired_at": null,
  "valid_at": "2026-08-05",
  "invalid_at": "2026-08-07",
  "reference_time": "2026-08-30T18:00:00Z",
  "attributes": {},
  "petry": {
    "schema_version": 2,
    "asset_refs": [
      "M-101"
    ],
    "type": "measurement",
    "source": "session",
    "captured_at": "2026-08-30T18:00:00Z",
    "temporal_kind": "interval",
    "time_precision": {
      "valid_at": "date",
      "invalid_at": "date"
    },
    "timezone": null,
    "original_time_expression": "August 5 through August 6, 2026",
    "supersedes": []
  }
}
```

These are all inherited Graphiti Edge/EntityEdge fields: uuid, group_id,
source_node_uuid, target_node_uuid, created_at, name, fact, fact_embedding,
episodes, expired_at, valid_at, invalid_at, reference_time, attributes. `petry`
is the local extension with exact asset refs, type, source/capture provenance,
precision/timezone, temporal kind, and revision links. Preserve unknown fields,
nested attributes, supplied embeddings and entity/episode payloads losslessly in
the normalized model. Do not require graph IDs, relation names, or embeddings to
render a local insight; null means unresolved, not permission to invent one.
Keep graph partition `group_id` distinct from the artifact's asset grouping.

Also parse legacy rows:

```md
- **[event]** 2026-06-10 — Well returned to production. <!-- petry:obs type="event" valid_at="2026-06-10" captured_at="2026-08-29T19:30:00Z" source="session" -->
```

Map the visible sentence to fact and the exact header ref to petry.asset_refs;
retain type, source, captured_at, optional hash and all extra metadata. Preserve
existing temporal fields, never infer an end/expiry. A valid_at-only legacy date
is a date-precision point unless source context explicitly establishes an
interval. Use trustworthy captured_at for missing created_at; otherwise leave
knowledge time unknown. Missing graph fields stay null and lists/objects may
normalize to []/{} in memory. An expired v2 snapshot's petry.legacy_origin retains
the replaced legacy row as evidence; never parse that archived string as another
active observation. A preserved legacy row already represented by a v2 revision
chain is historical evidence, not another active row. Reading or
refreshing must never migrate or edit the vault.

Keep the two temporal axes separate:

- World time: valid_at starts a fact; invalid_at is its exclusive real-world end.
  Show `temporal_kind=point` as a marker, an interval as a range, and undated
  context as undated. An open-ended interval is not the same as a point. A point
  has no invalid_at, and an interval needs at least one known boundary; entirely
  unknown time belongs in undated context. Validate real dates and timestamps.
- Knowledge time: created_at records this version; expired_at records when it
  was superseded/retracted. Current knowledge uses unexpired versions, including
  facts with historical invalid_at. An explicit as-of T selects versions with
  created_at <= T < expired_at (null expiry is open), then separately filters
  world time. Unknown created_at prevents exact historical membership.
- Preserve ISO timestamp precision and offsets/UTC instants. Date-only values
  stay dates with their precision; do not silently assign midnight or a timezone.
  Calendar ranges use [start,end), so "Aug 5 through Aug 6" ends Aug 7. Date-only
  points overlap their calendar day. An interval overlaps [from,to) iff start < to
  and end > from; null interval bounds are open. Do not filter ranges by start
  date alone. Invalid/reversed ranges must be reported, not silently drawn.
- Do not replace unknown valid_at with captured_at or use expired_at as a chart
  interval end. Undated facts appear only when the requested insight context
  includes them. Explain ambiguous hourly/date-only comparisons.
- Derive display `date`/`end_date` from world time only and retain original bounds
  and provenance in detail dialogs. If the library supports only point markers,
  keep EventTimeline with exact bounds in details and add a labeled range overlay
  or interval list as a narrow fallback. Never collapse a known duration to one
  point or fabricate supported component props. Do not plot expired versions as
  current facts; explicit audit views label the revision chain.

## Artifact dependencies and applicable refresh

Embed a `petry_dependencies` manifest in the generated source/model, alongside
the normalized data. This is inert metadata, not a polling implementation:

```json
{
  "schema_version": 1,
  "artifact_id": "native artifact identity once available",
  "project_identity": "exact connected-project identity",
  "consumes_insights": true,
  "loaded_asset_refs": ["M-101"],
  "loaded_world_window": { "from": "2026-08-01", "to": "2026-08-15", "precision": "date", "timezone": null },
  "includes_undated": true,
  "observation_types": ["measurement", "event", "correction"],
  "knowledge_view": { "mode": "current", "as_of": null },
  "observation_uuids": ["ec87917b-8c24-4bfb-9af4-0da2f4b1e910"],
  "insight_fields_used": ["fact", "valid_at", "invalid_at", "petry.type", "petry.source", "attributes"],
  "derived_dependencies": [],
  "active_filters": {},
  "source_snapshot": "identity/version of the actual loaded source"
}
```

Fill this from the actual artifact, not the example. Record the full loaded and
selectable asset/member scope and time coverage, every displayed insight field
(including detail dialogs), and dependency refs for generated summaries/KPIs.
Track loaded version UUIDs and project-scoped legacy row identities when needed.
If no project is connected use null project_identity; do not pretend an uploaded
CSV is linked to a writable vault. Set consumes_insights=false for an artifact
whose contents do not use insights. Update exposed filter/selection state in the
artifact's model as the user changes it; do not write a registry into the vault
or use browser storage. Record native artifact identity when the surface provides
it; never guess it or a local project path.

After `/capture` saves an observation, refresh only accessible artifacts in the
same conversation/project whose renderable insight payload or explicit derived
dependencies change. Compare BEFORE and AFTER versions, including old and new
asset refs, world-time ranges, expiry and revision links. A moved/expired insight
may require removing old content even if its replacement no longer matches.
A new insight may enter the scope even though its UUID was never loaded.

Use the full loaded/selectable scope, not only current visible filters, so a
hidden selectable asset does not retain stale data. A truly unrelated asset,
non-overlapping window with no summary/context dependency, ignored metadata,
telemetry-only view, or duplicate/no-op does not refresh. An as-of view only
changes if its selected historical projection changes. Unknown dates can affect
an undated context panel but never acquire invented chart dates. Project/manifest
uncertainty is not permission to rebuild everything: report unable to determine
applicability if the original source/request cannot establish the dependencies.

For an applicable change, reread saved observations, update the same artifact,
and preserve filters, selection, zoom and access settings when available.
Honor the artifact's data authorization; get approval for any new destination,
sensitive-data transmission or expanded permission before crossing that boundary. Rebuild
the affected timeline, interval annotations, details and evidence-linked summary
together; do not alter raw telemetry just because a note changed. Validate the
changed view and an unaffected view. If update capability, original source, or
state is unavailable, report that capture was saved but refresh did not happen.
Do not claim live synchronization, create a duplicate artifact, or refresh other
sessions. This runs during an agent interaction; no watcher, server, hidden
network request, or background refresh is introduced.

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
  `WellEvent` records and preserve the complete observation (including both
  temporal axes, UUID, source and interval bounds) in `meta`. Retain the actual
  asset type even if the library type is named
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
skill writes the full Markdown record this skill reads and refreshes only
applicable existing artifacts after a successful material change.
