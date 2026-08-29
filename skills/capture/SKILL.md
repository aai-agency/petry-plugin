---
name: capture
description: >
  Capture an asserted oil & gas field insight about a named well, lease, field,
  or operator into the connected project's local Petry Markdown vault. Activate
  for concrete measurements, events, decisions, corrections, instructions, or
  preferences, and when the user says "capture that", "log this", "note this",
  or invokes /capture. Never activate for questions, hypotheticals, or inferred
  facts. Propose automatic captures and write only after approval; an explicit
  capture request is approval.
---

# Capture → local knowledge vault

Petry is an instruction-only skill. Use Claude's connected-folder tools to read
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
  beside the proposed correction and get explicit approval.
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

## Observation shape

Append one line under `## Observations` for each approved fact:

```md
- **[measurement]** 2026-06-10 — ESP swapped; rate back to 280 bbl/d <!-- petry:obs type="measurement" valid_at="2026-06-10" captured_at="2026-08-29T19:30:00.000Z" source="session" -->
```

Required behavior:

- `type`: one of `note`, `decision`, `event`, `measurement`, `correction`,
  `instruction`, or `preference`.
- Visible date: `valid_at` when known; otherwise the UTC capture date.
- `text`: one clean sentence. Preserve the user's numbers and units exactly.
  Collapse line breaks/whitespace and replace `<!--` or `-->` with an em dash.
- `valid_at`: a real `YYYY-MM-DD` date when supplied, otherwise empty.
- `captured_at`: current UTC ISO-8601 timestamp.
- `source`: the named source, or `session` by default.
- HTML-escape comment attribute values as described above.
- Existing rows may include a `hash` attribute. Preserve it; new rows do not
  need one.

## Prevent duplicates and contradictions

Before appending, read all observations for the exact asset from both vault
directories. Treat the new observation as a duplicate when `type`, `valid_at`,
and normalized visible text match an existing row. Normalize text only for this
comparison: lowercase, trim, and collapse whitespace. A duplicate is a no-op.

If the new fact conflicts with existing context, show the conflict and follow
the correction approval rule instead of silently appending contradictory facts.

## Finish

After a successful write, confirm in one line with the asset, type, and exact
stored sentence. For a duplicate, say it was already logged and that nothing
changed. Do not over-narrate implementation details.

The `/get-well-production` skill reads this same shape and surfaces dated
observations in the well profile.
