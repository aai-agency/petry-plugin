# AAI Agency plugins

A Claude Code plugin marketplace by [AAI Agency](https://aai.agency). Free oil & gas tooling for AI agents — no backend, no keys.

## Install

```
/plugin marketplace add aai-agency/plugins
/plugin install petry@aai-agency
```

## Plugins

| Plugin | What it does |
|---|---|
| **[petry](./petry)** | Get a well's production data (from whatever you're connected to) as a self-contained production chart, and capture field insights to a local knowledge log. Two verb skills: `/get-well-production`, `/capture-insight`. |

More plugins will land here over time — each is an independent install from this same marketplace.

## Structure

```
.claude-plugin/marketplace.json   the marketplace catalog (lists the plugins below)
petry/                            the petry plugin (its own plugin.json, skills, scripts)
```

---

MIT © AAI Agency · husam@aai.agency
