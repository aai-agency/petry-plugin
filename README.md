# petry — instruction-only O&G skills for Claude

petry gives Claude and Cowork two oil-and-gas workflows without shipping a
runtime, renderer, server, or backend:

| Skill | What Claude does |
|---|---|
| **`/capture`** | Writes an approved field observation into the connected project's local Markdown vault. |
| **`/get-well-production`** | Retrieves production from the sources available in the session and creates a component-first well profile or grouped area, field, pad, basin, or subsystem overview. |

The loop is intentionally simple: capture writes structured Markdown under
`.petry/vault/`; production reads the same observations and includes them in the
next artifact. The vault stays on the user's computer inside the connected
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

Production data must come from a source available to the session, such as a
CSV, Excel workbook, JSON file, connected database, API, or MCP. petry never
invents production unless the user explicitly asks for sample data.

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
and corrections. `/get-well-production` reads this shape without editing it and
surfaces the activity in the generated artifact.

## Repository layout

```text
.claude-plugin/                 marketplace and plugin metadata
skills/capture/SKILL.md         capture behavior and Markdown contract
skills/get-well-production/SKILL.md
                                production retrieval and artifact contract
test/release.test.mjs           package-shape and instruction invariants
UPGRADE.md                      mapping the local vault to petry's context graph
```

For any oil-and-gas interface that can be built as React, the production skill
uses the latest compatible version of the free
[`@aai-agency/og-components`](https://www.npmjs.com/package/@aai-agency/og-components)
package before generating custom UI. Charts use `Chart` or `ChartGroup`; well
history uses `EventTimeline` and its built-in detail dialog. Custom UI is only
for gaps in the library, such as a semantic production table or grouped KPI,
filter, ranking, summary, and multi-event drill-down. Grouped values and AI
summary statements remain clickable and traceable to their contributing assets
and source events. The package is a generation-time dependency in the artifact
workspace, not a petry plugin runtime dependency.

MIT © AAI Agency · [aai.agency](https://aai.agency) · husam@aai.agency
