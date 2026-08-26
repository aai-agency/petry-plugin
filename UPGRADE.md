# Upgrading the local vault to the Petry knowledge base

The free plugin stores insights as flat Markdown — one collision-safe file per
well under `.petry/vault/`. Files created by `0.1.x` under `.petry/insights/`
remain readable. That's great for one person on one machine. A real knowledge
base does what flat files can't:

| Local Markdown vault (free) | Petry context-graph MCP (paid) |
|---|---|
| One file per well, on your disk | Temporal graph: entities, observations, facts |
| Full-text search (grep) | Hybrid search (BM25 + vector) |
| You read the raw notes | Per-asset AI summary, regenerated as facts land |
| Single user | Team access control, per-asset scoping |
| Manual sharing | Live in the Petry app + API |

The point of the vault's schema is that **nothing is thrown away** in the move.
Every observation already carries what the graph needs:

```
type       one of note | decision | event | measurement | correction | instruction | preference
text       the exact sentence, numbers and units preserved
valid_at   the date the fact is true for (optional)
source     where it came from
```

## The migration

The store speaks JSON so a migration is mechanical:

```bash
node scripts/capture.mjs export            # everything
node scripts/capture.mjs export --asset "HOWARD 4N-28HZ"   # one well
```

Output:

```json
{ "count": 12, "observations": [
  { "asset_ref": "HOWARD 4N-28HZ", "type": "measurement",
    "text": "ESP swapped; rate back to 280 bbl/d", "valid_at": "2026-06-10",
    "source": "session", "captured_at": "2026-08-17T15:20:00.000Z", "hash": "…" }
]}
```

With the `petry-context-graph` MCP connected, each observation becomes one call:

```
petry_map_insight({
  asset_ref: observation.asset_ref,
  text: observation.text,
  observation_type: observation.type,
  valid_at: observation.valid_at   // omit if null
})
```

The context-graph dedupes on its side, so the migration is safe to re-run. Your
Markdown files stay put as a portable backup — delete them only when you're
happy the graph has everything.

> A one-command `/upgrade` skill that drives this end-to-end ships with the
> Phase 2 (sessions + knowledge base) release. Until then the steps above do the
> same thing, and any agent with the MCP connected can run them.
