# Graphiti insight fields and applicable artifact refresh

## Accepted scope

- Preserve the full Graphiti fact (EntityEdge) field set, not only valid_at.
- Retain ranges, knowledge-time history, stable identities, provenance, arbitrary attributes, and supplied graph identifiers/embeddings without requiring a graph backend.
- Keep legacy vault notes readable and avoid destructive migration.
- Refresh an existing artifact after capture/correction only when its actual dependencies change; compare both old and new versions.
- Keep the plugin instruction-only, with two skills and no watcher or background server.

## Findings

The early local-vault commit 7319170 already reduced observations to the narrow
petry_map_insight input (asset_ref, text, observation_type, valid_at). The
instruction-only rewrite retained that limitation. The current local app's MCP
still exposes that narrow input, while its database already has additional
temporal fields. Do not claim this MCP can losslessly import the expanded record.

Graphiti's upstream EntityEdge and inherited Edge define identity, graph links,
fact/provenance/attributes, and separate world-time and knowledge-time fields.
Record the upstream revision and field coverage in UPGRADE.md.

## Checklist

- [x] Inspect history, local MCP boundary, and upstream Graphiti source.
- [x] Expand both self-contained skill contracts and reader compatibility.
- [x] Define corrections, interval semantics, and old/new refresh applicability.
- [x] Update README, migration guidance, and release metadata (0.5.0).
- [x] Validate schema examples, package invariants, and scenario expectations.
- [x] Review changes, open PR, and record evidence/limitations.

## Verification boundaries

The native Cowork demo previously used uploaded CSVs and no vault. It does not
prove these new capture/refresh instructions work. Contract validation must be
reported separately from a live model or Graphiti integration test.

## Review and evidence

- `pnpm run check`: 10/10 pass. Shared complete JSON examples, all 14 fields,
  unresolved graph identity, temporal interval precision, dependency manifest,
  compatibility/safety text and package invariants are checked.
- Parsed pinned upstream Python source with Python AST and compared inherited
  Edge/EntityEdge annotated fields to each skill's JSON example: exact 14-field
  coverage at revision 8b61fce9f003cc3a05e246f6201f8b782dfe6546.
- `claude plugin validate .`: marketplace validation passes.
- `git diff --check`: passes.
- Manually reviewed 29 cases in insight-refresh-scenarios.md. These are expected
  outcomes, not executed model behavior.
- Review fixes: explicitly clear replacement expired_at; preserve original
  legacy rows inside an expired snapshot instead of duplicate active lines;
  discover multi-asset facts by record refs across files; separate graph partition
  from artifact grouping; retain authorization boundaries for external refresh.
- No native capture/refresh run, Graphiti write, MCP upgrade, plugin install,
  or production vault migration was performed. Current installed version remains
  0.4.0; 0.5.0 is the proposed release.

## Delivery

PR: https://github.com/aai-agency/petry-plugin/pull/11

Branch: fix/graphiti-insight-contract. Not merged or installed by this task.
Next runtime verification: use a disposable connected project and test a relevant
date-range capture, a correction moved outside scope, and an unrelated capture
that leaves the existing artifact untouched. Do not treat the prior CSV-only
demo or these static checks as that verification.

## Authorized merge and installation follow-up

- User requested merge, installation, and another Cowork test.
- Windows CI exposed LF-only parsing/assertions in the contract tests. Normalize
  prose line endings and accept CRLF JSON fences; explicitly exercise both formats.
- Local check now passes 11/11; plugin validation and whitespace check pass.
- Pending: green cross-platform CI, merge, installed-version verification, and
  disposable-project native capture/refresh evidence.
