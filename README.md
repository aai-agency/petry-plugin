# petry — instruction-only O&G skills for Claude

petry gives Claude and Cowork three oil-and-gas workflows without shipping a
runtime, renderer, server, or backend:

| Skill | What Claude does |
|---|---|
| **`/manage-assets`** | Creates and edits local assets and artifact templates, remembers source mappings, and verifies or repairs connections. |
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
  templates/<id>.json reusable presentation specs by asset type and view type
  vault/*.md         observations and revision history
  attachments/<id>/<revision>/ immutable uploaded evidence
```

Setup/edit requests authorize the corresponding local writes. Reads do not
create records or silently import an inventory. Sources can be project files,
explicit directory file lists, or existing host connectors. Workbook sheet names
and connector workspace/resource IDs keep source scope precise. Passwords,
tokens, connection strings, and signed URLs are never stored here; authentication
stays in the host. A remembered connector must still be available and authorized
in the current session. Missing connections retain their configuration and show
what needs repairing; they do not silently fall back to another system.

One asset can have production in one system and real-time data in another.
Bindings select datasets, metrics, and source time granularity; broad labels
such as telemetry can appear on several bindings. For example:

| Dataset / metric | Source grain | Source |
|---|---|---|
| Production / oil volume | Daily | Production accounting |
| Operations / pressure | One minute | Real-time system |
| Maintenance / events | Event-driven | Maintenance system |

If two systems supply the same dataset, metric, and grain, explicitly choose a
preferred source for that scope—or request a comparison. Claude does not choose
by file order, silently replace a failed preferred source, or add competing
readings together. A combined view retains each source's identity, timestamp,
units, and coverage. Real-time data is fetched on request, without a background
stream. Say “Use Accounting for daily production oil volume and SCADA for minute
pressure for this asset; remember both.” Different IDs in each system are saved
against the same local asset after the mapping is established.

New configuration uses schema version 2. Existing version 1 bindings remain
readable, and reads never rewrite them. Unknown legacy datasets/granularities
are resolved from actual data or clarified when they conflict with another source.
 Same-named assets in different systems stay separate unless you explicitly
link them. Local edits do not change external source data. Archived assets are
excluded from default lists while remaining available for historical requests.
Asset changes appear on the next data request; existing artifacts remain snapshots.

## Entities, deals, and consolidated insights

Entity and asset are the same saved identity. Suggested types include deal,
well, facility, meter, and economics_case; users can supply their own types.
No source or database is needed to create an entity.

- “Create Falcon as a deal, and Research as type Research Basket.”
- “Link Falcon contains North facility, and North contains W-1.”
- “Capture this decision on Falcon: defer the bid until engineering review.”
- “Capture this note on W-1 and the Base case together.”
- “Show Falcon with consolidated insights from its children.”
- “Show only W-1's own notes.”

Parent overviews follow explicit contains/parent_of links through descendants.
An insight appears once even when several children refer to it or a well belongs
under several branches. Its original subjects stay visible. Other relationship
types remain useful links without adding their targets to a parent summary.
Child views do not inherit their parents' notes. Cyclic additions are rejected;
incomplete existing relationships produce an explicitly partial view.

Deal workspaces present the overview, linked entities, analysis cases, insights,
and evidence. Save the layout as a template for the deal-workspace view, or
customize templates for your own entity types. Case assumptions and numbers come
from your sources and assertions. Separate seller/base/downside cases retain
separate identities. Entity membership reflects current saved links; historical
note views do not imply a historical snapshot of ownership.

## Attach files to captures

- “Capture this note on W-1 and attach this photo, PDF, and PowerPoint.”
- “Attach documents/review.pdf, page 14, to that insight.”
- “Replace the photo on that insight with this new image.”
- “Change that attachment's caption to Inspection after repair.”
- “Remove the PDF attachment from that insight.”

Any file type the host can save can accompany an insight. Unsupported previews
still appear as file cards. Reading or interpreting a document requires actual
host support; registering a file does not mean Claude has analyzed it.

Existing project files are referenced in place. Uploads and explicitly requested
snapshots are copied byte-for-byte to `.petry/attachments/<id>/<revision>/` through
the host's file tools. Temporary chat uploads must be persisted before a capture
can promise to remember them. If the host cannot save binary files, it asks you
to save the file into the connected project using the host's file controls.
No database or paid MCP is required. Authorized connectors can optionally supply
external evidence; these references do not create a local backup.

Replacing, adding, editing, or removing an attachment creates a new insight
version and preserves its predecessor. Removal unlinks the attachment from the
current insight; originals and historical evidence remain. A repeated removal
is a no-op. Files shared by other captures remain linked to those captures.
An in-place project file can change or disappear; the interface reports missing
files or detected changes rather than pretending historical bytes are available.

Insight details show friendly attachment names, captions, and page/slide labels.
Previews and open/download actions depend on host capabilities. Attachment edits
refresh affected insight and parent views in the current conversation; a fresh
session reloads the project. Existing views do not watch files or membership
changes in the background. Local storage still uses the host's normal model
processing; it does not mean offline inference.

## Remember artifact templates

Say “Save this as Standard well profile and use it by default for well profiles.”
petry stores a declarative presentation spec under `.petry/templates/`, without
copying the artifact's data, sources, observations, generated AI summary, or
artifact identity. In a fresh conversation, “Show W-42's well profile” resolves
the active default for `(well, profile)` and applies its section order, chart
choices, activity placement, summary mode, and formatting to current data.

Explicitly named templates take precedence over defaults. Current-request layout
changes override a template for that artifact only. Template edits affect newly
requested artifacts; they do not silently restyle existing snapshots. Capture
refresh preserves the exact template revision already recorded by the artifact.

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

Artifacts are written for operations and business users. Event views show a
friendly calendar **Date** by default and use familiar labels such as Event,
Type, Asset, Status, and Source. Exact timestamps and internal observation data
remain available privately for filtering and refresh, but UUIDs, schema fields,
graph fields, connector/resource IDs, hashes, storage paths, and raw JSON do not
appear in the interface. Two events on the same date remain separate events.

Filter changes recompute factual summaries from loaded data locally. AI
interpretations appear only for the exact scope and data revision they were
generated for; a new scope can request a fresh interpretation through Claude.
Self-contained artifacts do not make background AI or MCP requests.
Some hosts reset transient filters when an artifact closes or reloads. Refresh
preserves state when the host exposes it, or can use a saved view you specify;
the plugin cannot promise persistence of controls the host does not retain.

## Agent evaluation

`pnpm eval:agent` runs the capture/refresh sequence through a real headless
Claude agent in a disposable project. Deterministic oracles verify the same
artifact identity, relevant/unrelated/duplicate/correction behavior, vault
history, and unchanged telemetry. See [eval/agent/README.md](eval/agent/README.md).
`pnpm eval:entities` runs a separate real-agent lifecycle for custom types,
shared child relationships, multi-subject deduplication, binary upload, attachment
replacement/removal, parent refresh, fresh-session retrieval, and rejected paths
and cycles. The test-only file-backed adapters do not replace native Cowork
visual testing.

MIT © AAI Agency · [aai.agency](https://aai.agency) · husam@aai.agency

### Insight attachment presentation

Default and custom templates share one insight-detail behavior: summaries, chart
annotations, and entity notes lead to the full note and its evidence. Details
include attachment thumbnails where safely supported, captions, and original-file
Open/Download actions. Unsupported previews use a file-type tile. Missing or
blocked access must be explained rather than presented as a working button.

Host support must be tested: this instruction-only plugin cannot itself grant a
hosted artifact access to local files. A private artifact may need derived copies
of evidence to provide previews/downloads; those copies are hosted with the
artifact while canonical records and originals stay in the local project.
