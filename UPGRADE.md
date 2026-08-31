# Graphiti field compatibility and vault migration

The local vault retains the full Graphiti **fact** record (`EntityEdge`, including
inherited `Edge` fields). This is field-preserving local staging, not a claim
that every local observation is already an insertable graph edge or that the
plugin implements Graphiti's graph, search, embeddings, or entity extraction.

Verified against Graphiti source revision
[`8b61fce9f003cc3a05e246f6201f8b782dfe6546`](https://github.com/getzep/graphiti/blob/8b61fce9f003cc3a05e246f6201f8b782dfe6546/graphiti_core/edges.py).
Node and episode records have their own
[models](https://github.com/getzep/graphiti/blob/8b61fce9f003cc3a05e246f6201f8b782dfe6546/graphiti_core/nodes.py);
preserve supplied payloads intact rather than flattening them into a fact.

## Fact field mapping

| Graphiti field | Local v2 representation |
|---|---|
| uuid | Same field; stable local UUID or preserved supplied ID. |
| group_id | Same field; null until a real partition is known. |
| source_node_uuid | Same field; null until the actual source entity is resolved. |
| target_node_uuid | Same field; null until the actual target entity is resolved. |
| created_at | Same field; UTC knowledge creation time, not event time. |
| name | Same field; relation name, not the observation type. |
| fact | Same field; the assertion, with original numbers/units. |
| fact_embedding | Same field; supplied vector preserved, otherwise null. |
| episodes | Same field; real source episode IDs, otherwise []. |
| expired_at | Same field; knowledge-time supersession/retraction, nullable. |
| valid_at | Same field; real-world start or point time, nullable. |
| invalid_at | Same field; exclusive real-world end, nullable. |
| reference_time | Same field; source episode/reference anchor, nullable when unknown. |
| attributes | Same field; arbitrary typed metadata preserved recursively. |

`petry` is a separate local extension: schema version, exact asset refs,
observation type, source/captured_at, temporal kind, precision, timezone,
original time expression, and supersedes UUIDs. Preserve other supplied fields
and payloads, too. Graphiti names and fields must not overwrite unrelated local
metadata or silently drop unknown data.

Date-only values retain their precision locally; Graphiti's temporal fields are
datetimes. Export requires an explicit timezone/precision policy and keeps the
original dates/expressions as metadata. Do not invent timestamp precision to
satisfy the destination schema. Relation name, group and entity IDs must also be
resolved before direct edge insertion; do not make fake nodes or self-links.

## Reading old notes

Read both `.petry/vault/` and legacy `.petry/insights/`. Inline `petry:obs` rows
remain supported. Map their visible sentence to fact, header ref to asset_refs,
and preserve type/source/captured_at/optional hash and all supplied metadata.
Unknown world-time ends and knowledge-time expiry remain null. A trustworthy
captured_at can fill missing created_at; it never fills valid_at. Existing
valid_at-only date rows are points unless explicit evidence establishes a range.
Reading an artifact never rewrites old notes. An approved correction upgrades
only its target, preserves original evidence, and links version UUIDs.

## Lossless migration requires a capable destination

The original vault only mirrored the narrow `petry_map_insight` parameters:
asset_ref, text, observation_type, valid_at. That was never the full Graphiti
fact model. The local context-graph MCP inspected for this change still exposes
that smaller schema. Sending v2 records through it as if it accepted the whole
record would lose information.

When a graph connection is available:

1. Read its CURRENT tool/input schema. Verify it can preserve identities,
   both temporal axes, episode links, attributes, local metadata and revision
   history; Graphiti library support alone does not prove the MCP supports them.
2. If any required field or precision mapping is unsupported, keep the local
   record and report the capability gap. Do not silently drop fields or call
   the narrow petry_map_insight endpoint as a full-record import.
3. Prepare the exact project/asset scope and records to send. Get authorization
   for that destination/data if not already supplied. Local capture alone is
   not approval to transmit the vault to a graph service.
4. Resolve graph identities and date/time precision explicitly. Retain an
   original-record mapping for local IDs and all metadata; preserve source
   entity/episode payloads separately where supplied. Do not invent a relation
   or treat petry observation type as a Graphiti relation name.
5. Use an importer with documented ID-based idempotency and full-record support.
   Verify retries update the same record and that supersession links/expired
   history survive. Do not assume semantic deduplication is an idempotency key.
6. Read the destination back and compare all fields, including nulls, arrays,
   metadata, original precision, and version chains. Report successes and
   failures; never delete the local notes or mark a partial import complete.

Expanding the separate context-graph MCP/importer is outside this plugin change.
Until it supports the full record, local capture and artifact refresh work
without it, and the vault remains the source of truth.
