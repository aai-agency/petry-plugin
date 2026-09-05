# Local source registry and asset records

## Scope and decisions

- Add configure-once local sources and persistent assets, consumed by capture and retrieval.
- Keep the instruction-only Claude/Cowork architecture; add manage-assets as the explicit writer.
- Store non-secret project-relative locations or host connector identities, never credentials.
- Stable asset refs survive renames; explicit legacy ownership prevents same-name note leakage.
- Support create, edit, link, archive/restore, source verification and moved-file repair.
- No paid backend, automatic synchronization, external source writes, or runtime helpers.
- Base: PR #12 (`fix/local-acceptance`), still open. Deliver a stacked PR.

## Checklist

- [x] Define and implement the shared local contract and management workflow.
- [x] Integrate saved source resolution and canonical observation identities.
- [x] Update release metadata, user examples, and upgrade boundaries.
- [x] Validate contract examples and regression checks.
- [x] Exercise candidate instructions in fresh native sessions with synthetic data.
- [x] Review final diff, deliver PR, and record evidence and limitations.

## Verification

`pnpm run check`: 17/17 passing, including identical shared contracts in all
three independently loaded skills, example identities/references, and prior
observation/release safeguards. `git diff --check` passed.

Native tests use candidate skill files explicitly, not an installed 0.6.0 plugin.
Synthetic fixture: `/Users/husamrahman/Documents/petry-source-acceptance-20260905`.
Evidence snapshots/hashes: sibling folder with `-evidence` appended.
The host also retained the prior synthetic acceptance folder as connected;
the prompt explicitly restricts operations to the new fixture. Initial setup
read both for disambiguation, but writes targeted only the new project.

- Setup: https://claude.ai/cowork/cse_01VqGDTNFMUcWYMTtrypDcr5
  Created one source and exactly two assets, no automatic M-202 import.
  Source `b3a88e09-ec87-41cc-bbe4-f0bbb5cd6621`, verified available.
  Meter `d818d27c-a8f6-4a04-b7a1-9669ee01bd1a`, external ID `00101`.
  Pump `0d60bb76-2dbf-4bc5-ba75-07b98b7bfb1d` has no source bindings.
  Independent disk parse confirmed schema/fields and exact leading-zero identity.
- Fresh read: https://claude.ai/cowork/cse_01QUiewuednaqFbVy4DProA8
  Supplied only asset names and candidate retrieval instructions, no source path
  or mapping. Returned 310 and 320 psig, 2 rows, mean 315 psig; excluded the
  M-202/00202 row. Source-free pump profile loaded. Every fixture file hash
  matched the post-creation snapshot after the read.
- Capture/rename/archive in the fresh-read session: created exactly one v2
  event with canonical meter ref, then renamed it to North meter (revision 2).
  Source binding, serial number, and immutable IDs survived. Archived P-7 at
  revision 2. Disk oracle confirmed the exact original fact and date precision.
- Missing-source fresh session:
  https://claude.ai/cowork/cse_01G4ux5f9UUF32PZaEFewwR4
  The test moved the CSV to `data/archive/readings.csv` before this read. Claude
  reported the configured path missing despite saved status available. It did
  see the moved filename during project inspection but did not use it as
  telemetry or update the registry. It returned the renamed meter's original
  canonical-ref calibration history and excluded P-7 from the active list.
  Independent hashes confirmed every fixture file remained byte-identical.
- Repair/restore in that session: source path changed to the supplied archive
  path; source ID and all meter bindings remained stable, registry revision 2,
  available verification. P-7 restored. Independent before/after hashes show
  only the registry and pump record changed. The requested same-name meter
  rename was a byte-identical no-op, including revision/timestamps, and the
  existing calibration note was unchanged. Subsequent retrieval returned both
  original pressure values with North meter as the display name and M-101 as
  source provenance, plus the unchanged calibration fact.
- Negative native requests: duplicate `(source_id, external_id)` binding to P-7
  and `../outside.csv` source registration were both rejected. The agent used
  path normalization without reading outside the fixture. Independent hashes
  were identical to the repaired snapshot. CSV bytes match the original setup
  fixture despite the move; no scratch/helper files were left in the project.
- Final candidate files are retained in the fixture with SHA-256 hashes in
  `final-candidate-hashes.json`. The final retrieval edit after the run was line
  wrapping only; the tested current-name behavior and all contracts are unchanged.

## Acceptance protocol

1. Start with a connected synthetic folder and a CSV with textual `00101` and
   another asset ID. Supply the candidate manage-assets skill. Remember the
   CSV and create/bind one meter plus a source-free pump. Assert only requested
   assets were created; read back the registry and IDs.
2. In a fresh conversation, load candidate retrieval and ask for those assets
   without a source filename. Verify rows, identity, units, mean and read-only
   file hashes. No artifact is required for this persistence-specific check.
3. Capture a canonical-ref observation, rename the meter, archive/restore the
   pump, and verify immutable IDs, revision behavior, and preserved note history.
4. Move the synthetic CSV on disk. A read must report missing source while
   retaining the registry. Repair the supplied path, retaining source ID/bindings,
   and read again. Repeating a rename should be a byte-identical no-op.
5. Reject an out-of-project path and a conflicting binding without persisting
   either. Document any model deviation and targeted correction separately.

## Limits

Instruction conformance checks are not a database implementation. Local files
have no transactional multi-writer guarantee. Paid team MCP, credential storage,
connector reauthentication, workbook/directory permutations, OS-specific host
behavior and fault-injected partial writes require separate integration coverage.
No plugin installation or merge is part of this delivery.

## Delivery

PR: https://github.com/aai-agency/petry-plugin/pull/13
Base: `fix/local-acceptance` (PR #12), which must merge before this PR is
retargeted to main. Feature commit: `d2e2cd7`. The original checkout's existing
untracked build files were preserved. Candidate release 0.6.0 is not installed
or merged. CI runs the same 17 checks on Ubuntu and Windows; current status is
visible on the PR. Native tests used macOS Cowork with explicitly loaded
candidate files, not a claim of installed-skill discovery.


## Follow-up: multiple sources for the same broad capability

User feedback: production in one system and real-time data in another must
coexist on one asset. The first capability-exclusive implementation was too
coarse. Replace that rule within PR #13; retain duplicate source-identity checks.

- [x] Define schema 2 dataset/metric/granularity selections and scoped preferences.
- [x] Integrate routing, partial-source failure, comparison, and per-series provenance.
- [x] Keep schema 1 readable without an automatic migration.
- [x] Validate production + real-time + overlapping production source in native use.
- [ ] Update PR and verify final Ubuntu/Windows checks.

Previous evidence above describes the initial single-binding candidate. Additional
multi-source evidence below will state which revised behavior was exercised.


### Multi-source native evidence

Synthetic fixture: `/Users/husamrahman/Documents/petry-multisource-acceptance-20260905`.
Only that folder is connected. Evidence is in the sibling `-evidence` folder.
All three candidate skill files match the revised repository instructions.

Setup session: https://claude.ai/cowork/cse_011SVZGTRnuxEagsLRQLgiUh

Created well W-42 (`c7315c93-d23d-4c91-94c5-35c34a53ada4`) with three telemetry
bindings: Accounting/WELL-1042 and Alternate/ALT-22 supply production/oil_volume
at P1D; SCADA/RT-883 supplies operations/pressure at PT1M. Saved one exact
production/oil_volume/P1D preference for Accounting, retaining all bindings.

Independent disk validation caught an initial invented metric kind `total`.
The shared contract now enumerates the allowed kinds and explicitly uses
`interval_total` for daily production volumes. Added explicit time_role and
source-defined interval_duration metadata to preserve calendar label semantics.
The candidate was reread and the test configuration corrected through native
management; the disk oracle then passed for all bindings, metrics and preference.
This was a targeted correction, not an unassisted first-pass success.

The independent `check.py` snapshots JSON/hashes and asserts schema versions,
three binding scopes, external IDs, metric kinds and exact preference target.

Fresh retrieval session:
https://claude.ai/cowork/cse_01XMRdyWNH8iVy2H7hEJ8hfm

Without receiving any source paths or external IDs in its request, Claude loaded
the saved bindings and chose Accounting for production/oil_volume/P1D and SCADA
for operations/pressure/PT1M. It returned Accounting's two rows and 220 bbl
total, plus the two SCADA points and latest 305 psig at 14:01 UTC. It kept the
Alternate source separate for a requested comparison.

The first comparison response displayed Alternate rows 105 and 125 but stated
250 bbl. This arithmetic failure prompted a retrieval rule requiring actual
calculation over selected source rows and reconciliation against every displayed
aggregate. After rereading the candidate skill, Claude computed 220 bbl for
Accounting and 230 bbl for Alternate, each from two rows, without creating a
cross-source total. Independent hashes show no data, registry, or asset file
changed during either read; only the deliberately updated candidate instruction
file differed between snapshots.
