---
name: get-well-production
description: >
  Get production data for a well or a group such as an area, field, pad, basin,
  subsystem, or selected set from the files, databases, APIs, or connectors
  available in the current session. Present it as a production chart, decline
  curve, profile, grouped overview, or lease map. Activate for requests such as
  "get production for HOWARD 4N", "show this area's wells", "summarize subsystem
  activity", "well profile", or "map my wells", and for /get-well-production.
  petry supplies the workflow and data shape, not the production data.
---

# get well production → component-first artifact

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
and label it prominently. Never present invented production as real.

Read database sources without modifying them. Preserve the source's values and
units. Partial data is acceptable; explain material gaps instead of filling them
with invented values.

## Normalize the artifact data

Create an in-memory model with this shape before rendering:

```json
{
  "well": {
    "id": "source identifier when available",
    "name": "exact well name",
    "operator": "operator when available",
    "status": "status when available",
    "basin": "basin when available",
    "county": "county when available",
    "state": "state when available",
    "formation": "formation when available",
    "first_production": "YYYY-MM-DD when available"
  },
  "series": {
    "months": ["YYYY-MM"],
    "oil": [0],
    "gas": [0],
    "water": [0],
    "units": { "oil": "BBL/month", "gas": "MCF/month", "water": "BBL/month" }
  },
  "kpis": {
    "peak_oil": null,
    "latest_rate": null,
    "months_on_production": null,
    "cumulative_oil": null
  },
  "activity": [
    { "type": "event", "date": "YYYY-MM-DD", "text": "exact captured observation" }
  ],
  "provenance": "plain-language description of the source"
}
```

Requirements:

- Align oil, gas, and water to the same ordered monthly calendar axis.
- Use `null` for a missing measurement; do not remove a month to hide a gap.
- Preserve each fluid's source unit or state any explicit conversion.
- Oil is the primary decline series when present, then gas, then water.
- Compute KPIs only from available values and label their units.

For an area, field, pad, basin, subsystem, or selected set, extend the model
with an explicit group and retain each contributing asset:

```json
{
  "group": {
    "id": "source identifier or stable selection key",
    "name": "exact group or selection name",
    "type": "area | field | pad | basin | subsystem | selection",
    "parent_id": "parent identifier when available"
  },
  "members": [
    {
      "id": "source asset identifier",
      "name": "exact asset name",
      "status": "status when available",
      "series": { "months": [], "oil": [], "gas": [], "water": [] },
      "kpis": {},
      "activity": []
    }
  ],
  "aggregate": {
    "series": { "months": [], "oil": [], "gas": [], "water": [] },
    "kpis": {},
    "activity": []
  },
  "active_filters": {
    "asset_ids": [],
    "statuses": [],
    "event_types": [],
    "date_from": null,
    "date_to": null
  }
}
```

Group requirements:

- Aggregate volumes only after aligning every member to the same calendar and
  unit. Do not replace missing member values with zero unless the source defines
  them as zero.
- Preserve the member asset ID and name on every KPI contribution and activity
  record so a grouped value can always drill back to its source.
- Report totals and distributions separately. For example, distinguish total
  oil from average well rate and show the denominator for averages.
- Recompute grouped series, KPIs, event counts, and summaries from the same
  active filter set; never display a stale unfiltered summary beside filtered
  metrics.

## Read petry observations

When a connected project exists, read `.petry/vault/*.md` and legacy
`.petry/insights/*.md`. For one well, select only files whose decoded
`<!-- petry:asset ref="..." -->` exactly matches the requested asset. For a
group, select the group record when present plus records whose exact asset refs
belong to the resolved member set. Do not use fuzzy names to add a well to a
group.

Parse rows shaped like:

```md
- **[event]** 2026-06-10 — Well returned to production. <!-- petry:obs type="event" valid_at="2026-06-10" captured_at="..." source="session" -->
```

Map each row to `{ asset_id, asset_name, type, date, text, source }`, using
`valid_at` as `date` and omitting the date when it is empty. Existing optional
`hash` attributes do not affect rendering. Do not edit the vault while
producing a chart.

## Build and show the result

### Use the oil-and-gas component library first

For every oil-and-gas interface, first determine whether the current artifact
surface can build and bundle React. When it can, resolve and use the latest
compatible release of `@aai-agency/og-components` before writing custom UI.
Inspect the installed package README and TypeScript declarations rather than
guessing its API. Install it in the temporary artifact workspace with the
surface's default package manager; never add it to the connected user's project
unless the user explicitly asked for application implementation there.

Use the library component that owns the interaction:

- Production history: `Chart` or `ChartGroup` from
  `@aai-agency/og-components/chart`. Prefer `ChartGroup` for aligned oil, gas,
  and water panels.
- Well history: `EventTimeline` from
  `@aai-agency/og-components/event-timeline`. Map dated petry observations to
  `WellEvent` records and preserve their original petry type and source in
  `meta`. Clicking a row or marker must open the component's built-in accessible
  event detail dialog.
- Detailed event extensions: use `EventDetailDialog`, `EventActivityLog`, or
  `EventTimeline.renderDetail` instead of creating another modal or timeline.
- Maps and asset details: use the package's `Map` and asset-card components only
  when requested and when their required inputs, including a Mapbox token, are
  available.

### Grouped asset interfaces

For grouped scopes, compose the available library primitives before filling
gaps with custom UI:

- Use `ChartGroup` for the filtered aggregate oil, gas, and water series.
- Use `EventTimeline` for the filtered event collection and its built-in dialog
  for the final single-event detail.
- When the package has no grouped KPI, member-performance, filter, summary, or
  multi-event drill-down component, generate those pieces as explicit custom
  fallbacks. Do not recreate a library chart, timeline, or single-event dialog.
- Keep the selected hierarchy path visible, such as
  `area / subsystem / selected wells`, and provide asset, status, event-type,
  and date filters when the corresponding fields exist.

Every grouped number or event grouping must be interactive:

- Clicking a KPI opens an accessible drill-down dialog showing the contributing
  assets or records, calculation, units, selected period, and current filters.
- Clicking an event count, cluster, or summary statement opens an accessible
  multi-event dialog containing the associated source events. Let the user sort
  or group them by asset, date, and event type, then open an individual event in
  the library's detail dialog.
- Clicking a member row drills into the existing single-well profile without
  losing the parent scope or filter context.

Include an AI-generated operational summary for the exact visible scope. Build
it only from the filtered production values and petry observations already
loaded into the artifact; do not invent causes, recommendations, or missing
events. State the covered asset count and date range, distinguish observed facts
from interpretation, and cite the supporting asset names or source-event count
inside each summary section. Recompute the summary whenever group or filters
change. A summary sentence must be clickable and open the same supporting-event
dialog used by grouped event counts. Do not write generated summaries back to
the vault unless the user separately requests capture.

Generate custom UI only when the installed package has no applicable component
or the surface cannot build React. For example, if the package does not export a
production table, a responsive semantic HTML table behind a disclosure is an
acceptable custom addition. Do not claim a custom element came from the package.
If React bundling is unavailable, build the native fallback and state briefly
that the component library could not be used on the current surface.

For a one-off chart, profile, or decline-curve request, create a native Cowork
artifact directly from the normalized model and show it inline. The artifact
should be self-contained and must not depend on a plugin file, local server,
external CDN, browser storage, or hidden network request.

Include:

- Well identity/status and clear data provenance.
- Oil, gas, and water history with units and a readable legend.
- A decline or forecast line only when supported by the available history;
  distinguish forecasts visually from actuals.
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
- Open a KPI drill-down and a grouped-event or summary drill-down. Confirm their
  contents match the active filters, can sort or group by asset and date, and
  can reach a library single-event detail dialog without losing context.
- Confirm there are no console errors, unexpected network requests, or
  horizontal overflow at split-pane and mobile widths.

For implementation inside the user's React application, keep domain fields
inside `Asset.properties`, add Mapbox only for map views, and follow the
installed package's current peer-dependency and styling instructions.

## Related

Use `/capture` when the user wants to log an asserted asset observation. That
skill writes the Markdown shape this skill reads back into future profiles.
