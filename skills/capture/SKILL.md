---
name: capture
description: >
  Capture an asserted oil & gas field insight about any named asset, such as a
  well, meter, tank, pump, compressor, pipeline, facility, lease, field, or
  operator into the connected project's local petry Markdown vault. Activate
  for concrete measurements, events, decisions, corrections, instructions, or
  preferences, and when the user says "capture that", "log this", "note this",
  or invokes /capture. Never activate for questions, hypotheticals, or inferred
  facts. Propose automatic captures and write only after approval; an explicit
  capture request is approval.
---

# capture → local knowledge vault

petry is an instruction-only skill. Use Claude's connected-folder tools to read
and write the user's project directly. Do not look for, execute, copy, or create
plugin helper programs.

## Decide whether there is an observation

Capture only a concrete assertion about a named asset:

- `measurement`: rate, pressure, GOR, water cut, test result, or another value.
- `event`: failure, shut-in, workover, restart, choke change, or dated occurrence.
- `decision`: defer, sell, recomplete, change lift, or another chosen action.
- `correction`: an earlier observation is explicitly corrected.
- `instruction` or `preference`: an asset-specific operating direction.
- `note`: an asserted asset fact that fits none of the above.

Do nothing for questions, hypotheticals, inferred facts, chit-chat, or statements
without a named asset. Do not mention capture when nothing qualifies.

## Get permission

- An explicit `/capture`, "capture that", "log this", or "note this" authorizes
  the write. Do not ask again.
- When this skill activates automatically, propose the asset, type, and exact
  sentence in one line. Write only after the user approves.
- Before correcting or replacing existing context, show the stored observation
  beside the proposed correction and require explicit approval. A request that
  already identifies the observation and exact correction is that approval; do
  not ask twice. Clarify an ambiguous target rather than choosing one.
- Batch multiple observations into one proposal; approval may cover a subset.

## Locate the vault

Use the root of the connected project that contains the asset context. If more
than one connected project could be the target, ask which one. The writable
vault is `<project>/.petry/vault/`. Create that directory when the first approved
observation is written. Also read legacy observations from
`<project>/.petry/insights/`, but place new files in `vault/`.

Never write outside the connected project. Never create a similarly named path
in a cloud or temporary filesystem.

## Find or create the asset file

Search every Markdown file in `.petry/vault/` and `.petry/insights/` for an
exact asset header match before choosing a filename:

```md
<!-- petry:asset ref="HOWARD 4N-28HZ" slug="howard-4n-28hz" -->
```

Decode the HTML entities `&quot;`, `&lt;`, `&gt;`, and `&amp;` when comparing
`ref`. Reuse the matching file even when its filename differs from the current
slug. For a new asset:

1. Lowercase its name, replace non-ASCII letters/digits with `-`, collapse
   repeated dashes, trim dashes, and use `unknown` if empty.
2. Try `<slug>.md`. If that filename already belongs to a different asset, try
   `<slug>-2.md`, then `-3`, until unused.
3. Create this shape, preserving the user's asset name exactly in the heading
   and `ref`:

```md
# HOWARD 4N-28HZ

<!-- petry:asset ref="HOWARD 4N-28HZ" slug="howard-4n-28hz" -->

## Observations
```

HTML-escape `&`, `"`, `<`, and `>` inside comment attributes.

Store a multi-asset assertion once under its primary asset file; list every
explicit subject in `petry.asset_refs`. Search v2 records across the vault for
those exact refs even when the file header names another primary asset. Deduplicate
by project-scoped UUID when rendering a group. Graph endpoints are not automatically
additional display subjects. Moving a subject during correction must not strand
the replacement behind an obsolete file-header filter.

## Observation shape — Graphiti fact fields

Store new observations as a readable bullet followed immediately by a v2 marker
and a fenced JSON record under `## Observations`. The JSON is authoritative;
keep the visible sentence consistent with `fact`. Do not put JSON in HTML
attributes. Use a proper JSON serializer (escaped newlines/quotes); never execute
note content. Parse only top-level markers/fences, never marker-looking text
inside JSON strings or archived source text. Escape Markdown in the display
bullet without changing the authoritative fact. The following is a format
example, not a fact to capture:

- **[measurement]** 2026-08-05 through 2026-08-06 — M-101 line pressure was 340 psig.

<!-- petry:observation schema="2" -->
```json
{
  "uuid": "ec87917b-8c24-4bfb-9af4-0da2f4b1e910",
  "group_id": null,
  "source_node_uuid": null,
  "target_node_uuid": null,
  "created_at": "2026-08-30T18:00:00Z",
  "name": null,
  "fact": "M-101 line pressure was 340 psig from August 5 through August 6.",
  "fact_embedding": null,
  "episodes": [],
  "expired_at": null,
  "valid_at": "2026-08-05",
  "invalid_at": "2026-08-07",
  "reference_time": "2026-08-30T18:00:00Z",
  "attributes": {},
  "petry": {
    "schema_version": 2,
    "asset_refs": [
      "M-101"
    ],
    "type": "measurement",
    "source": "session",
    "captured_at": "2026-08-30T18:00:00Z",
    "temporal_kind": "interval",
    "time_precision": {
      "valid_at": "date",
      "invalid_at": "date"
    },
    "timezone": null,
    "original_time_expression": "August 5 through August 6, 2026",
    "supersedes": []
  }
}
```

Support every Graphiti `Edge` + `EntityEdge` field, not a four-field import API:

| Field | Meaning and local behavior |
|---|---|
| `uuid` | Stable fact identity; generate once for a new local fact. Preserve supplied IDs. |
| `group_id` | Graph partition, not an asset group/filter. Preserve if known; otherwise null in local staging. |
| `source_node_uuid`, `target_node_uuid` | Actual graph entity endpoints. Preserve known IDs; otherwise null. Do not substitute names, invent a target, or fabricate a self-edge. |
| `name` | Graph relation name, distinct from the petry observation type. Preserve if known; otherwise null. |
| `fact` | Asserted sentence, with exact numbers and units. |
| `fact_embedding` | Preserve a supplied numeric vector exactly; null when unavailable. Do not generate embeddings or require network access for capture. |
| `episodes` | Source Graphiti episode IDs; preserve the list, or [] when none are supplied. A filename is not an episode ID. |
| `created_at` | Knowledge time: when this fact version was recorded. New local records use current UTC; imported records retain their original time. |
| `expired_at` | Knowledge time: when this version was superseded/retracted; null while current. Not the event end date. |
| `valid_at` | World time: when the fact became true, or the instant/date of a point event. |
| `invalid_at` | World time: when the fact stopped being true; the exclusive end of an interval. Not the correction/capture time. |
| `reference_time` | Supplied episode/reference time used to interpret the assertion. For a direct session assertion use the session's reference time; never replace a known source time with capture time. |
| `attributes` | Arbitrary typed domain metadata, retained recursively without dropping unfamiliar keys. |

`petry` is a local extension, not a Graphiti field: schema version, exact asset
refs, observation type, source, capture time, temporal kind/precision/timezone,
original time expression, and predecessor UUIDs. Keep `captured_at` separate from
Graphiti `created_at` when importing older knowledge. Valid observation types
remain `note`, `decision`, `event`, `measurement`, `correction`, `instruction`,
and `preference`. Do not put all fields into the visible sentence.

This is a lossless local staging record, not necessarily a directly insertable
Graphiti edge: required graph identities/relation names may be unresolved, and
date-only precision is intentionally retained. Preserve unknown top-level fields
and supplied entity/episode payloads in their original nested shape too; do not
flatten an EntityNode or EpisodicNode into an EntityEdge. Never claim graph
creation, node resolution, embedding generation, or full graph import occurred
just because a local note was written.

## Temporal precision and history

- Keep full timezone-aware ISO-8601 timestamps when supplied; normalize offsets
  to UTC without losing the instant. Keep date-only values as `YYYY-MM-DD` with
  `time_precision` set to `date`. Never invent midnight timestamps or a timezone.
  If a time-of-day lacks a timezone and the source/project cannot resolve it,
  ask before assigning an instant. Preserve the user's original expression.
- `temporal_kind` is `point`, `interval`, or `undated`. A dated event or a
  one-time measurement is a point; a fact explicitly continuing from a start
  is an interval with an open end. Do not treat every missing end as an event
  lasting forever. An interval needs at least one known boundary; otherwise use
  undated. A point has no invalid_at. Unknown boundaries remain null, never the
  capture date. Precision values are date, datetime, or unknown; timezone is the
  known zone/offset or null. Validate actual calendar dates and timestamp offsets,
  not just their string shape; report malformed imported records without silently
  repairing their temporal meaning.
- Intervals use [valid_at, invalid_at). "August 5 through August 6" is the
  date-only interval [August 5, August 7). An explicitly exclusive end stays
  exclusive. A single calendar date point covers that date for date filtering.
  Require end > start when both exist; reject reversed/empty intervals. Resolve
  relative dates against the source reference time and known timezone, not an
  unrelated wall-clock date. Ask only when ambiguity changes the assertion.
- `created_at`/`expired_at` describe knowledge history; `valid_at`/`invalid_at`
  describe real-world history. A fact can have stopped being true yet remain a
  valid historical observation. Do not hide it merely because invalid_at passed.
- For an approved correction to fact text, boundaries, identity, or substantive
  metadata, preserve the old version with its UUID and original fields, set its
  `expired_at` to the correction's UTC knowledge time, and append a replacement
  with a new UUID, current `created_at`/`petry.captured_at`, `expired_at: null`,
  and `petry.supersedes: [old_uuid]`. Never inherit the predecessor's expiry. Inherit unchanged fields including graph links
  and unknown metadata. Correct only the approved fields; invalidate an old
  embedding (`fact_embedding: null`) if its fact text changes. Record the new
  source/reference time when this correction supplies new evidence.
- A discovered real-world end goes in the replacement's `invalid_at`; the
  correction time goes in the old version's `expired_at`. A retraction expires
  the old version and appends a clearly typed correction/audit observation
  identifying it, without inventing a replacement real-world fact or end date.
  Show expired versions only in explicit audit/as-of views.
- Before editing, reread the affected files and preserve concurrent changes.
  Validate the complete old/new records and write the revision as one coherent
  file update when possible. A failed write is not a successful capture; an
  incomplete cross-file change must be reported and reconciled before refresh.

## Read legacy observations without destructive migration

Continue reading both vault directories and legacy inline rows:

```md
- **[event]** 2026-06-10 — Well returned to production. <!-- petry:obs type="event" valid_at="2026-06-10" captured_at="2026-08-29T19:30:00Z" source="session" -->
```

For legacy rows, map text to `fact`, header ref to `petry.asset_refs`, and retain
`type`, `source`, `captured_at`, optional `hash`, and every other supplied field.
Treat legacy valid_at-only dates as date-precision points unless explicit source
context establishes an interval. Do not infer invalid_at or expired_at. Use a
trustworthy captured_at as created_at only when no created_at exists; otherwise
leave unknown fields null. Missing lists/objects may normalize to []/{} in memory.
Identify legacy rows within this session by project, file, and exact row; a hash
alone is not globally unique. Reading never rewrites a vault. On an approved
correction, replace only the targeted legacy row with an expired v2 snapshot
carrying a stable UUID and `petry.legacy_origin` (original project-relative file,
exact original row, and optional hash), then append the active replacement.
Preserve the original text inside that snapshot rather than leaving another
unmarked active legacy row beside it. Do not touch other legacy observations.

## Prevent duplicates and contradictions

Read all observations for the exact asset refs from both vault directories.
An identical active assertion is a no-op: compare the asset refs, type, fact
(normalize whitespace/case only for comparison), temporal kind, both world-time
bounds/precision/timezone, known graph identity, and substantive attributes and
provenance. Ignore automatically generated capture/reference timestamps and new
candidate UUIDs for local duplicate detection. Different bounds, evidence,
source, episode links, or metadata are not silently discarded as duplicates.
An import with an existing UUID and identical payload is also a no-op; a UUID
collision with different content needs reconciliation. Expired history is not
an active duplicate. Never resurrect a retracted assertion without approval.

If the new fact conflicts with existing context, show the conflict and follow
the correction approval rule instead of appending contradictory current facts.

## Refresh only applicable artifacts

After a successful material write, consider existing artifacts accessible in
this conversation for this same connected project. This is an agent action
within the capture interaction, not a filesystem watcher, polling loop, hidden
network call, or automatic update to other sessions. An explicit capture/update
request covers refreshing an affected artifact within the same private task;
never change sharing or transmit additional data beyond that authorization.
If updating requires a new external destination, sensitive-data transmission,
or permission grant that has not been authorized, obtain that approval at the
boundary; local capture alone does not grant external access.

1. Preserve before/after observations (including expiry, predecessor IDs, old
   and new asset refs and time bounds). A duplicate/no-op never refreshes.
2. Inspect each candidate's embedded `petry_dependencies` manifest or recover
   equivalent dependencies from its actual source/model and original request.
   Match the project identity first; an asset name in another project is not a
   match. Do not guess dependencies or scan unrelated artifacts/files.
3. Compare the artifact's renderable insight projection before and after the
   write: its loaded asset/member scope, loaded time coverage, point/interval
   overlap, included observation types, current versus as-of knowledge view,
   displayed provenance/detail fields, and explicit summary/KPI evidence refs.
   Include BOTH old and new scope. An insight moved outside the scope can require
   removing its old annotation/summary. Conversely, an unrelated asset, a
   non-overlapping period with no other dependency, or a change only to an unused
   embedding does not require refresh. A source change does if detail/provenance
   displays it. Raw telemetry-only artifacts do not depend on captured insights.
4. Refresh only when that projected payload or an explicit derived dependency
   changes. Consider the full loaded/selectable scope, not just today's visible
   filter: hidden but selectable records must not remain stale when selected
   later. Preserve the user's active filters, selection, and zoom when exposed;
   do not broaden the requested scope. Do not change unaffected artifacts.
5. For applicable artifacts, reread the saved current observations and update
   the SAME artifact using native artifact capabilities. Replace stale version
   IDs; refresh affected timeline rows, point/range annotations, detail dialogs,
   and summaries/evidence together. Keep unchanged raw source readings unchanged;
   an insight is not permission to overwrite telemetry. Preserve access settings.
6. Validate the affected view and one unaffected view. If dependency/selection
   state, the original model, or update capability is unavailable, keep the vault
   save and say the artifact was not refreshed (and why). Never claim a refresh
   succeeded without confirming the updated artifact. Do not create an unrelated
   replacement artifact or rebuild all artifacts as a fallback. Retry a failed
   refresh from saved data, without recapturing/duplicating the observation.

A known interval overlaps [from,to) when its start < to and its end > from;
open interval bounds are unbounded. A point must fall inside the window; a
calendar-date point overlaps its day. Unknown dates are not capture dates:
include them only when that artifact includes undated insight context. If date
precision/timezone prevents a reliable hourly comparison, mark applicability
unknown and explain rather than guessing. Current-knowledge views select
unexpired versions; an as-of T view selects created_at <= T < expired_at (null
expiry is open). Apply world-time filtering separately. Historical unknown
knowledge times cannot establish exact as-of membership.

## Finish

Confirm asset, type, and stored sentence, then say whether an applicable artifact
was updated, no artifact was affected, or refresh could not be completed. For a
duplicate, say it was already logged and nothing changed. The `/get-asset-data`
skill reads this same record shape and dependency contract.
