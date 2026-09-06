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
- [ ] Regression and behavioral tests
- [ ] Real agent evaluation of custom hierarchy and attachment lifecycle
- [ ] Documentation and upgrade compatibility
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
