# Local entities, hierarchy, and capture attachments

## Scope and decisions
- User requested suggested entity types plus arbitrary custom types; local uploads
  of any file type; add/edit/replace/remove attachments; parent/individual insights.
- Reuse existing canonical asset IDs and explicit contains/parent_of relationships.
- Read-time descendant traversal with deduplication; no physical note fanout.
- Attachment metadata is additive to observation v2; attachment edits use existing
  successor history. Remove unlinks and retains original/history bytes.
- Host binary tools persist uploads; unsupported preview does not block storage.
- Local storage does not imply offline Claude inference or automatic shared sync.
- Existing files are live references; uploaded snapshots use immutable managed paths.

## Checklist
- [x] Shared entity and attachment contracts across all three skills
- [x] Regression and behavioral tests
- [ ] Real agent evaluation of custom hierarchy and attachment lifecycle
- [x] Documentation and upgrade compatibility
- [ ] Review final diff, push feature branch, open PR

## Verification
Pending. Native Cowork binary upload/preview is a separate host acceptance surface;
headless tests must not be described as native UI evidence.

## Hardening evidence
- First live run rejected an attachment ID containing non-hex characters. Added
  explicit UUID validation before writes and after read-back.
- Inspection of the second run found a display-name vault filename and reuse of
  an example entity ID. Added early execution checklists and independent checks
  for canonical filenames and fresh entity IDs to the final harness.
- The original four-case capture/refresh regression eval passed after the shared
  contract changes (Haiku; relevant/unrelated/duplicate/correction).
- 37 deterministic tests pass, including reference-oracle negative cases for
  cycles, scope leakage, duplicate rollups, damaged history, and unsafe paths.
- Binary fixture validation found and repaired a bad PNG CRC; final fixture is a
  valid generated RGBA PNG. PDF and PowerPoint fixtures are minimal containers.
- A retained parent artifact used the valid activity[].observation wrapper. The
  first oracle incorrectly rejected it; normalization now accepts direct records
  or that wrapper while still checking subjects, evidence, and deduplication.
- A live replacement saved correct history and attachment revision but skipped
  parent refresh because the artifact falsely set includes_undated=false and a
  zero-length date window. Added early manifest consistency checks and negative
  oracle coverage; all-dates views retain null bounds and undated inclusion.
- Windows CI exposed CRLF parsing in the new contract test. Normalized line
  endings and marked binary fixtures -text; Linux and Windows CI then passed.
- A later run produced a six-group attachment ID despite textual validation
  guidance. The shared identity contract now prefers the actual host UUID
  generator, and the live evaluator exposes only uuidgen plus scoped fixture
  copying as shell capabilities. This keeps ID generation deterministic when
  the host provides it, without shipping a plugin runtime.
- Another valid capture replacement did not refresh because the generated parent
  manifest omitted project_identity. Required both actual project/artifact identity
  in the early overview checklist and oracle; capture now explicitly reports its
  refresh outcome after evidence mutations. Also retained correct successor
  knowledge/capture timestamps in the early save checklist.
- A focused Haiku retest included a related_to entity in descendant scope. The
  oracle rejected it. Re-emphasized the exact membership relation whitelist and
  began a separate Sonnet full lifecycle; model results must stay distinct.
- Sonnet passed creation, binary upload, parent rollup, replacement with refresh,
  unlink with retained original bytes, and byte-identical repeated removal.
- Its first fresh-session direct well view missed a joint well/case note stored
  in the case file. Retrieval now explicitly searches all vault/legacy Markdown
  by canonical refs, including multi-subject notes outside the primary file.
- A fresh Sonnet continuation on a copied post-removal project passed the fixed
  direct lookup and caption revision/refresh checks. Remaining checks in flight.
- Extended eval default is Sonnet. Haiku runs are retained as failed stress
  evidence, not hidden or counted as passing release verification.
- Sonnet continuation PASSED all five turns on final skill hashes: fresh direct
  retrieval, caption edit, add another evidence item, reject cycle, reject unsafe
  path. Evidence: /var/folders/_d/bj61wtqs4xd8qf3mj6fqmk5c0000gn/T/petry-upload-g9Pxc2;
  project: /var/folders/_d/bj61wtqs4xd8qf3mj6fqmk5c0000gn/T/petry-entity-evidence-7kojk8.
  Cost reported by CLI: $1.5950286. This is continuation evidence, not a clean run.
- Final clean-start Sonnet lifecycle on the finished skills is now running.
- A subsequent low-effort clean Sonnet run still produced a partial private
  manifest. Added a complete required manifest template at the start of retrieval
  and made the release-default eval Sonnet/high ($1.50 per-turn ceiling). No
  oracle criteria were relaxed. The old filled-example test now selects its
  concrete observation-bound example rather than the new blank template.
- Inspected the real Claude session log: Skill loads point to this worktree,
  including the new manifest template, not a stale installed plugin.
- The high-effort clean run passed through fresh-session recovery; an oracle
  falsely rejected display-only available:true enrichment. The corrected oracle
  still requires every stored attachment field verbatim, permits derived display
  metadata, and rejects altered authoritative fields. The retained output passed
  revalidation without any data edits. A final clean run uses this oracle.
