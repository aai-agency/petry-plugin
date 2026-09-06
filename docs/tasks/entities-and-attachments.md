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
