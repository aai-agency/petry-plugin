# petry — instruction-only O&G skills for Claude

petry gives Claude and Cowork two oil-and-gas workflows without shipping a
runtime, renderer, server, or backend:

| Skill | What Claude does |
|---|---|
| **`/capture`** | Writes an approved field observation into the connected project's local Markdown vault. |
| **`/get-asset-data`** | Retrieves data for any asset (wells, meters, tanks, pumps, and more) and creates a component-first profile, table, chart, or grouped overview. |

The loop is intentionally simple: capture writes structured Markdown under
`.petry/vault/`; asset data retrieval reads the same observations and includes
them in the next artifact. The vault stays on the user's computer inside the connected
project.

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

## Vault format

New observations live at `<connected-project>/.petry/vault/`. petry also reads
legacy `.petry/insights/` files. An asset file remains ordinary Markdown:

```md
# HOWARD 4N-28HZ

<!-- petry:asset ref="HOWARD 4N-28HZ" slug="howard-4n-28hz" -->

## Observations

- **[measurement]** 2026-06-10 — Rate back to 280 bbl/d. <!-- petry:obs type="measurement" valid_at="2026-06-10" captured_at="2026-08-29T19:30:00.000Z" source="session" -->
```

`/capture` handles approval, collision-safe asset files, duplicate detection,
and corrections. `/get-asset-data` reads this shape without editing it and
surfaces the activity in the generated artifact.

## Repository layout

```text
.claude-plugin/                 marketplace and plugin metadata
skills/capture/SKILL.md         capture behavior and Markdown contract
skills/get-asset-data/SKILL.md
                                asset data retrieval and artifact contract
test/release.test.mjs           package-shape and instruction invariants
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
