# Native local acceptance protocol

Run in a new Cowork conversation with only a disposable synthetic project
connected. Record plugin version, host, session URL, native artifact identity,
and each artifact revision. Do not reuse a production vault. Keep evidence
outside the connected folder so evidence writes do not affect no-op checks.

## Fixture and oracle

Create `readings.csv` with columns `asset_id,asset_name,asset_type,subsystem,
interval_start,interval_end,pressure_psig`. For each meter M-101 (North) and
M-202 (South), create 336 contiguous one-hour UTC intervals starting
2026-08-01T00:00:00Z. For zero-based hour i, pressure is 300 + (i % 24) for
M-101, and 400 + (i % 24) for M-202. These are interval means, not point
measurements. Keep `.petry` absent. Hash source files before starting.

Independent expected M-101 values: 336 rows; first start August 1 00:00Z;
last start August 14 23:00Z; last end August 15 00:00Z; mean 311.5 psig;
minimum 300; maximum and final reading 323. August 5–6 includes 48 rows with
the same mean/min/max. Pressure must never be summed as a produced volume.

## Steps and pass criteria

1. Ask the installed `petry:get-asset-data` skill for M-101 pressure August
   1–14 UTC, a date filter, source count, interval boundaries, and an initially
   empty observation panel. Keep M-202 outside loaded scope. Request a saved
   self-contained copy and normalized model for verification. Confirm the
   oracle, unchanged source hashes, absent vault, library version/imports or
   concrete fallback failure, and actual artifact rendering.
2. Select August 5–6 in the artifact. Confirm 48 rows, unchanged loaded scope,
   and consistent chart/KPIs/summary. Record filter state.
3. Use `petry:capture`: "M-101 line pressure was constrained from August 5
   through August 6, 2026." Confirm one authoritative v2 record with all 14
   Graphiti fields, bounds [August 5, August 7), and date precision. Confirm
   the SAME native artifact changes, the observation appears, and the filter
   remains August 5–6 when exposed. Verify details show original bounds and
   provenance. Source telemetry must be unchanged.
4. Capture "M-202 calibration completed on August 9, 2026." Confirm its own
   vault record, byte-identical M-101 vault, and no artifact revision change.
5. Repeat step 3 exactly. Compare the entire project file/hash mapping and
   artifact revision: no writes or refresh. Existing fixture evidence files
   must not be rewritten to manufacture a successful no-op.
6. Correct the original M-101 statement to August 20 through August 21, 2026.
   Confirm predecessor unchanged except knowledge expiry, a new UUID with
   supersedes link and [August 20, August 22), and preserved unknown metadata.
   The same artifact removes its old annotation/summary evidence. The active
   filter and raw telemetry remain unchanged. M-202's file stays identical.
7. Open a fresh conversation on the same disposable folder and retrieve M-101.
   Confirm persistence from disk without relying on old conversation memory.
   This is a new snapshot; it does not establish cross-session synchronization.

## Evidence boundaries

Distinguish installed-release runs from runs supplied with candidate skill
instructions. Test-file assertions do not prove native artifact behavior.
Successful HTML export does not prove a native artifact was published. Passing
capture does not prove component adherence. Saved filter state does not prove
live UI selection survived; inspect the rendered artifact after refresh.

No team MCP, access-control, concurrent-writer, or migration claim follows from
this local test. Verify those separately against an actual shared service.
