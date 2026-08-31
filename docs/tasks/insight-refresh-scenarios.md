# Insight contract review cases

These are manually reviewed expected behaviors for the instruction-only skills,
not an executed capture engine or evidence of native Cowork refresh. Automated
tests validate shared JSON examples, field coverage, temporal precision, and
instruction/package invariants. A future native evaluation should exercise the
same cases with a disposable connected project and explicit write permission.

Unless overridden, artifact A belongs to project P, loads asset M-101, consumes
measurement/event insights and their source/details, uses current knowledge,
includes undated context, and covers calendar interval [2026-08-01, 2026-08-15).
Artifact B loads only W-202 in P. Artifact C has A's asset name in project Q.

| Case | Mutation | Expected artifact behavior |
|---|---|---|
| Relevant point | Capture M-101 event on Aug 9 | Refresh A only; no B/C changes. |
| Unrelated asset | Capture W-202 event on Aug 9 | Refresh B only. |
| Unrelated project | Capture M-101 in Q | Refresh C only. |
| Outside coverage | Capture point Aug 20 for M-101 | Skip A, unless an explicit all-time summary/context dependency includes it. |
| Range crossing left boundary | M-101 interval [Jul 30, Aug 3) | Refresh A; filtering by start alone would be wrong. |
| Touching left boundary only | Interval [Jul 30, Aug 1) | Skip A; end is exclusive. |
| Touching right boundary only | Interval [Aug 15, Aug 17) | Skip A. |
| Inclusive calendar expression | "Aug 5 through Aug 6" | Store [Aug 5, Aug 7), retain original expression/precision; refresh A. |
| Open-ended state | Explicitly true from Jul 30, no known end | Interval overlaps A; refresh. Never reinterpret a point this way. |
| Single dated event | Point Jul 30, no end | Skip A; not an open-ended state. |
| Unknown date | Undated M-101 note; A configured to include notes | Refresh A's undated context only; no fabricated chart marker. |
| Undated excluded | Same record, A excludes undated context | Skip A. |
| Correct date outside scope | Existing Aug 9 event changed to Aug 20 | Refresh A to remove old content even though replacement does not match. |
| Correct asset | Existing M-101 Aug 9 event corrected to W-202 | Refresh A to remove it and B to add it; skip C. |
| Narrow a range | Old [Aug 5, Aug 10) becomes [Aug 5, Aug 7) | Refresh A's range/details; preserve prior version with expired_at and successor link. |
| Retraction | Retract a displayed event | Expire old version in knowledge time; remove stale annotation/evidence in A. Audit retains history. |
| Known real-world end | Learn Aug 30 that a state ended Aug 7 | Replacement invalid_at=Aug 7, old expired_at=Aug 30 knowledge timestamp. Historical August coverage remains valid. |
| Duplicate | Same active assertion, bounds, metadata and provenance | No write and no refresh; capture time alone does not make a new fact. |
| New evidence | Same sentence/time but additional episode/source evidence | Do not discard new provenance as a duplicate; refresh A if displayed provenance changes. |
| Embedding only | Preserve updated supplied embedding, no display dependency | No artifact refresh; storage change is distinct from view applicability. |
| Correct text with embedding | Correct pressure 340 to 320 psig | Replacement fact_embedding=null, old vector retained in history; refresh relevant details/annotations. |
| Telemetry-only | A explicitly does not consume captured insights | Save insight, skip A; raw rates do not change. |
| Hidden selectable member | Group artifact loads M-101 and W-202, currently selects W-202 | Refresh M-101 cached insight payload; keep W-202 selected and unchanged. |
| As-of view | A fixed as-of Aug 20, correction learned Aug 30 | Skip if selected historical projection is unchanged. Current view refreshes. |
| Legacy row | Correct one valid_at-only inline row | Preserve original fields/hash/evidence, assign stable local identity to target and link v2 replacement; no duplicated active legacy row. |
| Unknown timezone | Date-only insight compared with an hourly window, no timezone/precision policy | Report applicability unknown; don't invent UTC midnight. |
| Missing dependency state | Native artifact source/request cannot identify project or scope | Save capture; report unable to refresh, not an unconditional rebuild. |
| Refresh failure | Vault save succeeds but native artifact update fails | Keep capture; report stale artifact. Retry refresh without another capture. |
| Narrow importer | Destination accepts only asset_ref/text/type/valid_at | Report unsupported full import; retain local fields and do not transmit a silently reduced record. |

Final visual checks must include range boundaries in the event detail dialog,
an old annotation disappearing after a date/asset correction, an unchanged view,
and preserved active filters/zoom when the surface exposes them. Verify native
timestamp formatting; a headless container's timezone is not the user's timezone.
