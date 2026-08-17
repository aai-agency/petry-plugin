---
name: capture-insight
description: >
  Capture an asserted oil & gas field insight about a well/asset into the local
  Petry knowledge log. Activate automatically whenever the user states a fact,
  measurement, event, or decision about a specific well, lease, field, or
  operator — e.g. "the ESP on HOWARD 4N failed", "COASTAL 14 tested 280 bbl/d",
  "we're deferring the recompletion on WELLS RANCH 12-3" — and when the user
  explicitly says "capture that", "log this", "note this on <well>", or invokes
  /capture-insight. Only fires for ASSERTED facts about a named asset, never for
  questions or hypotheticals.
---

# Capture insight → local knowledge log

Petry keeps a plain-Markdown log of what your team learns about its assets, on
disk, no backend. This skill turns an asserted fact in the conversation into one
stored **observation**. The stored schema is a 1:1 subset of a Petry
context-graph observation, so the log upgrades cleanly to the knowledge-base MCP
later (see the plugin's `UPGRADE.md`).

## When to capture (and when not to)

Capture when the user **asserts** something concrete about a **named asset**:

- A measurement: rates, pressures, GOR, water cut, test results.
- An event: a failure, shut-in, workover, restart, choke change.
- A decision: defer, sell, recomplete, change artificial lift.
- A correction, instruction, or preference tied to the asset.

Do **not** capture:

- Questions ("what's the water cut on HOWARD 4N?").
- Hypotheticals or things you inferred but the user didn't state.
- Chit-chat, or anything not about a specific asset.

If a turn has no assertable asset fact, do nothing — say nothing about capturing.

## How to capture

For each asserted fact, run the capture script once. It is idempotent — the same
fact captured twice is a no-op, so you never create duplicates.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/capture.mjs" add \
  --asset "HOWARD 4N-28HZ" \
  --type measurement \
  --text "ESP swapped; rate back to 280 bbl/d" \
  --valid-at 2026-06-10 \
  --source "session"
```

- `--asset` — the well/lease/field/operator name exactly as the user says it.
  Don't normalize or guess an ID.
- `--type` — one of: `note` `decision` `event` `measurement` `correction`
  `instruction` `preference`. Pick the most specific one; default `note`.
- `--text` — one clean sentence. **Keep the user's numbers and units exactly** —
  never round or convert. Don't embellish or infer values that weren't stated.
- `--valid-at` — the date the fact is true for (`YYYY-MM-DD`), if the user gave
  one. Omit if unknown.
- `--source` — leave as `session` unless the user names a source (a report, a
  gauge, a person).

`${CLAUDE_PLUGIN_ROOT}` points at this plugin's directory. If it isn't set in
your shell, the script is at `scripts/capture.mjs` inside this plugin (installed
under `~/.claude/plugins/`); locate it and call it with the same arguments.

## After capturing

Confirm in **one line**: the well, the observation type, and the exact sentence
stored. Example: `Logged HOWARD 4N-28HZ · measurement · "ESP swapped; rate back
to 280 bbl/d".` Don't over-narrate. If several facts were in one turn, capture
each and give a one-line summary of how many were logged to which wells.

If a new fact contradicts something you can see already logged (check with
`node "${CLAUDE_PLUGIN_ROOT}/scripts/capture.mjs" list --asset "<well>"`), flag
the conflict and capture the fix as a `correction`.

## Where it's stored

One Markdown file per asset under `.petry/insights/` in the current project (or
`$PETRY_INSIGHTS_DIR`). The files are human-readable and safe to commit or keep
private. Capture is automatic — this skill fires as you assert facts, so you
don't have to run a command — and the store is idempotent, so re-capturing the
same fact is a no-op.

## Upgrading to a real knowledge base

The local log is great for one person on one machine. When the team needs
temporal history, hybrid search, per-asset AI summaries, and access control, the
same observations replay into the Petry context-graph MCP — every observation
carries the type, text, valid_at, and source it needs, so nothing is lost in the
move. See the plugin's `UPGRADE.md`.
