---
name: get-well-production
description: >
  Get a well's production data from the files, databases, APIs, or connectors
  available in the current session and present it as a production chart, decline
  curve, profile, or lease map. Activate for requests such as "get production
  for HOWARD 4N", "show a decline curve", "well profile", or "map my wells",
  and for /get-well-production. Petry supplies the workflow and data shape, not
  the production data.
---

# Get well production → native artifact

Petry is an instruction-only skill. Retrieve the user's data dynamically and
build the result with Claude's native artifact capabilities. Do not look for,
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

## Read Petry observations

When a connected project exists, read `.petry/vault/*.md` and legacy
`.petry/insights/*.md`. Select only files whose decoded
`<!-- petry:asset ref="..." -->` exactly matches the requested asset.

Parse rows shaped like:

```md
- **[event]** 2026-06-10 — Well returned to production. <!-- petry:obs type="event" valid_at="2026-06-10" captured_at="..." source="session" -->
```

Map each row to `{ type, date, text }`, using `valid_at` as `date` and omitting
the date when it is empty. Existing optional `hash` attributes do not affect
rendering. Do not edit the vault while producing a chart.

## Build and show the result

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
- Dated Petry activity as chart annotations when practical and as a readable
  activity list in all cases.
- A visible sample-data notice when applicable.

Use accessible colors, text alternatives/labels, and responsive layout. Escape
user-provided text before placing it in HTML or executable contexts. Present the
artifact inline; save a copy into the connected project only when the user asks.

If the current surface cannot create a native artifact, create a standalone HTML
file in the connected project using Claude's ordinary file tools and open it for
the user. This fallback is generated for the current request; it is not a Petry
runtime dependency.

## React application requests

When the user explicitly wants implementation inside a React application, use
the free `@aai-agency/og-components` package rather than recreating production
components. Inspect the installed package documentation for its current API,
keep domain fields inside `Asset.properties`, and add Mapbox only for map views.
Do not scaffold or install packages for an ordinary one-off artifact request.

## Related

Use `/capture` when the user wants to log an asserted asset observation. That
skill writes the Markdown shape this skill reads back into future profiles.
