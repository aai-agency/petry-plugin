# Upgrading the local vault to the Petry knowledge base

The free plugin stores observations as Markdown under `.petry/vault/` and reads
legacy `.petry/insights/` files. The schema is deliberately portable so Claude
can migrate it without a Petry export program.

Each observation contains the fields the context graph needs:

```text
asset_ref    exact `ref` from the petry:asset header
type         note | decision | event | measurement | correction | instruction | preference
text         visible observation sentence with numbers and units preserved
valid_at     date the fact is true for, when known
captured_at  UTC time it was captured
source       where it came from
```

## Migration workflow

With the `petry-context-graph` MCP connected, ask Claude to migrate the vault.
Claude should:

1. Read every Markdown file in `.petry/vault/` and `.petry/insights/`.
2. Decode the exact asset reference from each `petry:asset` header.
3. Parse each `petry:obs` row, including older rows with an optional `hash`.
4. Show the asset and observation count and get approval before sending data.
5. Call `petry_map_insight` once per observation with `asset_ref`, `text`,
   `observation_type`, and `valid_at` when present.
6. Report successes and failures without deleting or changing the Markdown.

The context graph deduplicates on its side, so the import can be safely retried.
The local Markdown remains a readable backup unless the user explicitly chooses
to remove it.
