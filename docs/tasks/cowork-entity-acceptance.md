# Native Cowork entity acceptance

## Scope
PR #20 merged as f8a4c0ef08b5c2113a93a761aabf07b3e6bde281 on 2026-09-06 after Linux and Windows CI passed. Test the merged installed plugin in native Claude Cowork using a disposable fictional North Field Expansion 2027 project.

## Checklist
- [x] Merge PR #20 and preserve existing checkout changes.
- [ ] Update native installed plugin and verify loaded instructions.
- [ ] Create project, well, and custom workstream entities with explicit membership.
- [ ] Capture a shared note once and verify both individual views and parent rollup.
- [ ] Attach files, update and remove an attachment; inspect persistence/history.
- [ ] Verify a fresh Cowork session recovers local state.
- [ ] Capture native visual evidence and document limitations.

## Evidence
- Existing original checkout build/ remains untouched.
- Native Cowork opened; plugin settings available. No native acceptance result yet.
- Merged clean worktree `pnpm run check`: 37/37 passed.
- Native Customize initially showed separate `petry@petry-plugin` installation at 0.5.0 (2 skills), despite CLI `petry@aai-agency` being 0.7.0. Invoked Check for updates then Update; native UI reported Plugin updated.
- Fresh native session: https://claude.ai/cowork/cse_01Tt3NWcJ8qVPT3ZqS3nQ9wa
- Connected only `/Users/husamrahman/Documents/petry-north-field-demo-20260906` with session-only access. Folder contains synthetic PNG, PDF, PPTX fixtures. No persistent permission selected.
- PASS: Cowork ran installed petry:manage-assets, created three valid UUID-backed records and root `contains` links. Independent host file read confirms exact project/workstream/well names and types. Initial entities snapshot retained at `Documents/petry-north-field-demo-20260906-evidence/01-created-entities`.
- UX finding: management completion prose exposed canonical refs and storage paths even though artifacts have plain-language rules. Native artifact check pending; capture prompt explicitly requests friendly presentation.
- PASS: exactly two observations persisted; shared engineering note has two canonical subject refs and is stored only once. PDF and PPTX attachment size and SHA-256 independently match original fixture bytes. Snapshot: `02-captured-notes.json` in evidence folder.
- Management completion wording repaired to use friendly names/types/relationships; technical refs and paths now reserved for explicit debugging/export/storage requests. 37 checks still pass.
- PASS: native artifact `739ad5d4-d879-4ebe-a271-b31750de58f7` published privately. Project rollup displays exactly two notes; NF-101 and Phase 1 Engineering each display the same shared note, and the project own-notes section displays only the budget note. Independently inspected native summary, note detail dialog, and each-entity section; screenshots shown in task conversation.
- PASS: detail dialog shows Date Sep 18, 2026, both friendly subject names, and PDF/PPTX cards; Escape closes. Summary distinguishes observed facts from interpretation, without inferring blank fixture contents.
- LIMIT: native artifact attachment cards are informational; local files must be opened through the connected project. No working in-artifact file open/download was demonstrated.
- FINDING: Claude skipped the requested component library based on an asserted static-host limitation without demonstrating a bundle attempt. Do not count this as component adherence.
- Cowork updated its actual artifact identity in the private manifest and republished the same artifact; full manifest read-back not independently inspected yet.
- BLOCKED: native control reports "The Mac is locked and automatic unlock could not unlock it." Evidence-mutation prompt was not successfully submitted. Attachment add/remove/caption edits, fresh-session retrieval, and a recording remain pending. User must unlock the Mac to continue native acceptance.
