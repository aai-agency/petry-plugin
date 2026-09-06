# Shared insight attachment UI

## User requirement
Every insight detail, reached from a summary, chart, event, entity or custom template, exposes all friendly details and attachments with thumbnails, opening and original-file download.

## Work
- [x] Replace informational-only card contract in all three independently loaded skills.
- [x] Require common detail behavior across default and custom templates.
- [x] Specify safe previews, original-byte downloads, host resource resolution, explicit unavailable states, and current-revision refresh.
- [x] Run existing 37 checks (pass; instruction consistency only).
- [x] Exercise actual previews and downloads in Cowork.
- [ ] Deliver PR with concrete capability limits.

Candidate native test uses explicit guidance supplied in the synthetic demo folder. It is not an installed-package acceptance test. Canonical attachments and observations remain unchanged.

## Native candidate evidence

Session: https://claude.ai/cowork/cse_01Tt3NWcJ8qVPT3ZqS3nQ9wa
Same private artifact: `739ad5d4-d879-4ebe-a271-b31750de58f7`.
Final inspected preview revision: `1788728282-726a`.

- PASS: summary and well own-note entry open the shared detail gallery with exact note, Date, both subjects, source, captioned PDF and PNG.
- PASS: actual PNG thumbnail opens enlarged image; Escape closes and restores focus to the originating thumbnail.
- PASS: PDF Open shows the safe first-page raster. Native inspection found an initial black rectangle caused by hand-copied/truncated raster base64. Candidate was repaired with programmatic embedding; final native screenshot shows the correct blank page. Instructions now prohibit hand-transcribed payloads and require final packaged-preview checks.
- PASS: original PNG/PDF Download uses documented Cowork `downloads` capability rather than blocked browser anchors. Native clicks reached host confirmation, then macOS Save dialogs with correct original filenames and sizes. Saved unique test copies in Downloads to avoid collisions.
- PASS: downloaded image is exactly 70 original bytes (SHA-256 ee68049f8976341376cf2883efe6a2afc081d936289bf59260dd278753af0be9); downloaded PDF is exactly 414 original bytes (SHA-256 c7b6f3dd95c14017019ded89dbd4c08fd239c28ce22e5633cf646a981dad7bff).
- PASS: all eight canonical asset/vault/evidence file hashes unchanged by UI work.
- 37 repository checks pass. These check instruction consistency/contracts, not graphical host behavior.

## Boundaries
This is explicit candidate-guidance native acceptance, not a marketplace-installed candidate or universal-template test. Verified PNG and single-page PDF; arbitrary custom layouts, multipage PDFs, presentations, missing files, and other hosts still need the documented acceptance matrix. The instruction-only plugin supplies a common contract, not a bundled renderer. Hosting this private preview embeds derived copies of the two tiny synthetic attachments; canonical originals remain local. Existing audience was preserved.
