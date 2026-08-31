# petry — instruction-only O&G skills for Claude

petry gives Claude and Cowork two oil-and-gas workflows without shipping a
runtime, renderer, server, or backend:

| Skill | What Claude does |
|---|---|
| **`/capture`** | Writes approved insights with Graphiti fact metadata and refreshes only affected artifacts. |
| **`/get-asset-data`** | Retrieves data for any asset (wells, meters, tanks, pumps, and more) and creates a component-first profile, table, chart, or grouped overview. |

Capture writes structured Markdown under `.petry/vault/`; asset retrieval reads
those observations into an artifact. A material capture or correction updates
an existing artifact in the same conversation only if its actual insight
dependencies change. The vault stays inside the connected local project.
There is no watcher or automatic synchronization between sessions.

## Install

In Claude Code or Cowork, add the marketplace and install petry:

```text
/plugin marketplace add aai-agency/petry-plugin
/plugin install petry@aai-agency
```

## Requirements

There are no runtime dependencies. petry contains only two `SKILL.md` files and
plugin metadata. Claude uses the current surface's own connected-folder, data,
and artifact capabilities.

Asset data must come from a source available to the session, such as a
CSV, Excel workbook, JSON file, connected database, API, or MCP. petry never
invents asset data unless the user explicitly asks for sample data.

## Asset examples

- `/get-asset-data` — show readings and calibration events for meter M-101.
- Show tank T-20 levels or pump P-7 status from a connected file.
- Get production for HOWARD 4N, including oil, gas, water, and field observations.
- Summarize a subsystem with wells and meters, preserving each asset's identity
  and aggregating only compatible metrics without double-counting shared flow.

The renamed `/get-asset-data` replaces `/get-well-production`; it is not a third
skill or an alias. Well-production requests remain supported. Existing vault
files need no migration. `/capture` creates `.petry/vault/` on the first approved
write if it is absent and reuses it thereafter.

## Vault format and temporal history

New observations live at `<connected-project>/.petry/vault/`. Each asset file
keeps its exact `petry:asset` header and readable observations. Version 2 stores
a fenced JSON record after a `petry:observation schema="2"` marker. Both skills
contain the complete format example. Existing inline `petry:obs` rows, including
legacy `.petry/insights/`, remain readable without an automatic migration.

The full Graphiti fact field set is retained:

- Identity and relationships: `uuid`, `group_id`, `source_node_uuid`,
  `target_node_uuid`, `name`.
- Content and provenance: `fact`, `fact_embedding`, `episodes`, `attributes`.
- World time: `valid_at`, `invalid_at`.
- Knowledge time: `created_at`, `expired_at`, plus source `reference_time`.

Local `petry` metadata retains asset refs, observation type, source/capture time,
date precision/timezone, point versus interval semantics, and predecessor UUIDs.
Unknown graph fields may remain null in local staging; no graph service or
embedding model is required. Supplied graph fields and unknown nested metadata
are preserved. This preserves a Graphiti fact's fields; it does not create a
Graphiti database or fabricate missing entity/episode records.

Date-only facts remain date-only. Intervals have an inclusive start and exclusive
end; "August 5 through August 6" is `[2026-08-05, 2026-08-07)`. Corrections retain
the prior version, expire it in knowledge time, and append a linked replacement.
An insight ending in real life is not the same as an insight being superseded.

## When an artifact refreshes

After a successful capture/update, Claude compares the old and new observation
against accessible artifacts' recorded project, loaded assets, time coverage,
insight types, displayed fields, and summary/evidence dependencies.

| Change | Result |
|---|---|
| Relevant insight added/edited within the artifact's scope | Update that same artifact's affected insight views. |
| Relevant old insight moved outside the scope or retracted | Remove its stale content; include replacement only if applicable. |
| Insight belongs to an unrelated asset/project or an unrelated time window | No refresh. |
| Duplicate capture, or only an unused embedding changed | No refresh. |
| Artifact shows only telemetry and does not consume insights | No refresh. |
| Changed asset is hidden by a filter but still selectable in the loaded artifact | Update its cached insight payload without changing the user's selection. |
| Original artifact/update capability/dependencies are unavailable | Keep the saved insight and report that no refresh happened. |

Only the affected artifact is updated; source telemetry and sharing settings do
not change. Current and historical as-of views use separate knowledge/world-time
filters. Self-contained artifacts do not watch the vault themselves.

See [UPGRADE.md](UPGRADE.md) for exact field mapping and migration limitations.
The old narrow `petry_map_insight` API is not a lossless full-record importer.

## Repository layout

```text
.claude-plugin/                 marketplace and plugin metadata
skills/capture/SKILL.md         capture behavior and Markdown contract
skills/get-asset-data/SKILL.md
                                asset data retrieval and artifact contract
test/release.test.mjs           package-shape and instruction invariants
test/insight-contract.test.mjs  shared schema and temporal example checks
UPGRADE.md                      mapping the local vault to petry's context graph
```

For any oil-and-gas interface that can be built as React, the asset data skill
uses the latest compatible version of the free
[`@aai-agency/og-components`](https://www.npmjs.com/package/@aai-agency/og-components)
package before generating custom UI. Charts use `Chart` or `ChartGroup`; asset
history uses `EventTimeline` and its built-in detail dialog. When the installed
release exposes `/asset-breakdown`, grouped scopes use its dynamic `Asset.meta`
dimensions, filters, KPI cards, contributor drill-downs, and evidence-linked
operational summary. Custom UI is only for a remaining library gap, such as a
semantic asset data table. Grouped values and AI summary statements remain
clickable and traceable to their contributing assets and source events. The
package is a generation-time dependency in the artifact workspace, not a petry
plugin runtime dependency.

MIT © AAI Agency · [aai.agency](https://aai.agency) · husam@aai.agency
