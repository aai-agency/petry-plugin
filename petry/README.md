# petry — a free O&G plugin for Claude Code

Two verb skills every oil & gas team wants from an AI agent, free and with no backend. Each **activates on its own** when you talk about a well, and you can also invoke it by name:

| Skill | What it does |
|---|---|
| **`/get-well-production <well>`** | Pulls a well's production data **from whatever you're connected to** (your files, a database, an MCP) and renders it as a self-contained production chart — or a fuller profile card with metadata + KPIs. |
| **`/capture-insight <well>: <what you saw>`** | Saves one field insight to a local Markdown knowledge log, in a schema that upgrades cleanly to a real knowledge base. |

> Skills are verb-named, so you invoke them bare: `/get-well-production`, `/capture-insight`. (Claude Code also lists a namespaced form, `/petry:get-well-production`, to disambiguate if another plugin ever ships the same verb — but you don't type it.)

## Install

From a local checkout:

```
/plugin marketplace add <path-to-your-checkout>/plugins
/plugin install petry@aai-agency
```

From GitHub:

```
/plugin marketplace add aai-agency/plugins
/plugin install petry@aai-agency
```

## Requirements

- **None to start.** Charts render as offline HTML — no API key, no Mapbox token, no server.
- Production data comes from **your** connected sources — a CSV/Excel/JSON export, a database, or an MCP. The plugin is source-agnostic; it does not depend on Petry for data. With nothing connected, it can render the bundled `@aai-agency/og-components` sample data (clearly labeled) so you can see the shape.
- The real interactive components (deck.gl map, editable decline curve) need a React app — `get-well-production` scaffolds that on request (`pnpm add @aai-agency/og-components`), and the map needs a free [Mapbox token](https://account.mapbox.com/access-tokens/).

## How it works

- **Charts** — `get-well-production` knows the real [`@aai-agency/og-components`](https://www.npmjs.com/package/@aai-agency/og-components) API (Map, ProductionChart, DeclineCurve, AssetDetailCard). It fills a self-contained HTML preview for a quick look, or scaffolds the actual React components when you want the interactive versions.
- **Insights** — `capture-insight` appends one observation per fact to `.petry/insights/<well>.md`. The store is idempotent (no duplicates) and every observation records `type`, `text`, `valid_at`, and `source`.

## Layout

```
.claude-plugin/plugin.json        plugin manifest
.claude-plugin/marketplace.json   lets this repo act as a marketplace ("petry")
skills/get-well-production/        data-sourcing + chart skill + self-contained HTML preview
skills/capture-insight/            insight-capture skill
scripts/capture.mjs                the local knowledge-log store (zero-dep Node)
UPGRADE.md                         moving the local log into the Petry knowledge base
```

## Upgrading to a real knowledge base

The local log is perfect for one person on one machine. When you want temporal history, hybrid search, per-asset AI summaries, and team access control, the same observations replay into the paid **Petry context-graph** MCP — nothing is re-typed. See [`UPGRADE.md`](./UPGRADE.md).

## Coming next

Session lifecycle (auto-capture at session start/end, tied into the Petry app) is Phase 2 — this release keeps the core tight.

---

MIT © AAI Agency · [aai.agency](https://aai.agency) · husam@aai.agency
