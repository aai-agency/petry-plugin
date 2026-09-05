# petry — instruction-only O&G skills for Claude

petry gives Claude and Cowork three oil-and-gas workflows without shipping a
runtime, renderer, server, or backend:

| Skill | What Claude does |
|---|---|
| **`/manage-assets`** | Creates and edits local assets, remembers source mappings, and verifies or repairs connections. |
| **`/capture`** | Writes approved insights with Graphiti fact metadata and refreshes only affected artifacts. |
| **`/get-asset-data`** | Retrieves data for any asset (wells, meters, tanks, pumps, and more) and creates a component-first profile, table, chart, or grouped overview. |

Capture writes structured Markdown under `.petry/vault/`; asset retrieval reads
those observations into an artifact. A material capture or correction updates
an existing artifact in the same conversation only if its actual insight
dependencies change. The vault stays inside the connected local project.
There is no watcher or automatic synchronization between sessions.

## Local use and the optional team service

The free plugin works with your connected files and local Markdown vault.
It requires no petry account, subscription, graph database, or petry MCP.
"Local" describes data storage: Claude/Cowork may process connected files on
Anthropic's servers according to the host's permissions. It does not mean an
offline language model.

The intended paid offering is an optional MCP-backed shared database for teams.
Connecting it should add shared knowledge and team access while keeping local
use available. This repository does not implement that service, its permissions,
or billing. A connection alone does not upload your vault or switch its source
of truth; a requested transfer must pass the capability and read-back checks in
[UPGRADE.md](UPGRADE.md). Do not treat a shared Markdown folder as a database
with concurrent-write guarantees.

## Install

In Claude Code or Cowork, add the marketplace and install petry:

```text
/plugin marketplace add aai-agency/petry-plugin
/plugin install petry@aai-agency
```

Plugin skills may be namespaced in the host's command picker. If `/capture`
or `/get-asset-data` or `/manage-assets` is unrecognized, select the installed petry skill or say
"Use petry:capture to log this" / "Use petry:get-asset-data to show this data."

## Requirements

There are no runtime dependencies. petry contains only three `SKILL.md` files and
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

The renamed `/get-asset-data` replaces `/get-well-production`; it is not an additional
skill or an alias. Well-production requests remain supported. Existing vault
files need no migration. `/capture` creates `.petry/vault/` on the first approved
write if it is absent and reuses it thereafter.

## Remember sources and create assets

Use `/manage-assets` (or say “Use petry:manage-assets”) to set up local memory:

- “Create meter M-101 with serial number ABC-101.” A source is optional.
- “Remember data/readings.csv as Meter readings and link M-101 to meter_id
  00101 for telemetry.” Claude inspects fields and preserves the leading zeros.
- In a new conversation connected to the same folder: “Show M-101 readings.”
  Claude loads the saved binding and checks that source without asking again.
- “The Meter readings file moved to data/archive/readings.csv. Update it.”
  The source ID and asset bindings survive; changed columns need a new mapping.
- “Rename M-101 to North meter.” Its ID and captured history remain connected.
- “Archive North meter” / “Restore North meter.” History is retained.
- “List my assets and verify their sources.” Saved availability is updated only
  for an explicit verification/setup request, not an ordinary data read.

```text
<connected-project>/.petry/
  sources.json       non-secret locations, field mappings, last verification
  assets/<id>.json   stable identities, properties, source bindings, relationships
  vault/*.md         observations and revision history
```

Setup/edit requests authorize the corresponding local writes. Reads do not
create records or silently import an inventory. Sources can be project files,
explicit directory file lists, or existing host connectors. Workbook sheet names
and connector workspace/resource IDs keep source scope precise. Passwords,
tokens, connection strings, and signed URLs are never stored here; authentication
stays in the host. A remembered connector must still be available and authorized
in the current session. Missing connections retain their configuration and show
what needs repairing; they do not silently fall back to another system.

Each capability (such as telemetry or maintenance) has one source owner per
asset. Same-named assets in different systems stay separate unless you explicitly
link them. Local edits do not change external source data. Archived assets are
excluded from default lists while remaining available for historical requests.
Asset changes appear on the next data request; existing artifacts remain snapshots.

New registered-asset observations use immutable `asset:<id>` refs. Existing
name-only notes remain readable; explicitly assign their legacy ref to an asset
before combining them with that asset's history. Renaming does not rewrite facts
or automatically claim another asset's old notes. The local JSON records are
versioned and checked before writes, but do not provide database transactions or
multi-user locking. Back up the project folder to preserve its local memory.

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
skills/manage-assets/SKILL.md   local assets and source registry
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

Filter changes recompute factual summaries from loaded data locally. AI
interpretations appear only for the exact scope and data revision they were
generated for; a new scope can request a fresh interpretation through Claude.
Self-contained artifacts do not make background AI or MCP requests.
Some hosts reset transient filters when an artifact closes or reloads. Refresh
preserves state when the host exposes it, or can use a saved view you specify;
the plugin cannot promise persistence of controls the host does not retain.

MIT © AAI Agency · [aai.agency](https://aai.agency) · husam@aai.agency
