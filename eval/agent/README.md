# Headless capture and artifact-refresh eval

This harness runs the installed repository skills through a real headless Claude
Code agent in one resumed conversation. A disposable file-backed artifact adapter
stands in for the native Cowork artifact tool so deterministic code can inspect
the artifact identity, revision, activity projection, telemetry, and hashes.

```sh
pnpm eval:agent
```

To exercise the user-installed marketplace build in a fresh Claude process,
without loading the repository as a development plugin:

```sh
PETRY_EVAL_USE_INSTALLED=1 pnpm eval:agent
```

Install or update `petry@aai-agency` first. The result reports
`"plugin_source": "installed"`, which distinguishes release evidence from
working-tree validation.

The runner requires an authenticated `claude` CLI. Override the executable,
model, or per-turn ceiling with `PETRY_EVAL_CLAUDE_BIN`, `PETRY_EVAL_MODEL`, and
`PETRY_EVAL_TURN_BUDGET_USD`. Use `pnpm eval:agent -- --keep` to retain a passing
temporary workspace. Failed workspaces and transcripts are always retained.

The four sequential cases verify:

1. A relevant capture writes one complete v2 observation and updates the same
   artifact with the exact insight fields its dependency manifest consumes.
2. An unrelated asset writes its vault record without changing the artifact.
3. An exact duplicate changes no project bytes.
4. An approved out-of-window correction preserves/links history and removes the
   old event from the same artifact while leaving telemetry unchanged.

These are deterministic code oracles around a stochastic agent. Repeat runs and
track pass rate before making them a release gate. Do not put an API key in this
repository or in a fixture. The runner grants file tools but no Bash, web,
browser, or MCP tools, and sets a per-turn budget ceiling. Run it only against
plugin changes you trust: Claude Code's file-tool grant is not an operating
system sandbox, even though the evaluation prompt confines writes to the
disposable project.

Claude Code 2.1.260 exposes a first-party `claude plugin eval` command for
isolated activation and no-plugin-baseline cases, but access is still gated as
early access. Add that layer when it is enabled for the release environment.
Its isolated cases will complement rather than replace this resumed lifecycle.

This does **not** prove native Cowork rendering, library component behavior,
dialogs, zoom, or live UI-state preservation. Run the separate native acceptance
protocol for those surfaces. The adapter tests the model-mediated storage,
applicability, and refresh projection that precede rendering.

## Entity and attachment lifecycle

Run `pnpm eval:entities` for the working-tree plugin. It creates disposable projects
and real PNG/PDF/PowerPoint/opaque fixtures. A resumed Claude agent creates custom
entities and a diamond hierarchy, captures multi-subject notes and files, imports
a binary upload, builds the parent projection, replaces/removes evidence, retries
removal, and reloads in a fresh session. It also attempts a cycle and an unsafe
path. Independent oracles check resulting records, membership, history, unchanged
input bytes, and the artifact projection.

This harness additionally grants `Bash(cp:*)` solely for an explicit binary upload
fixture copy; it pre-creates the managed destination. This is a tool grant, not an
OS sandbox. Use only trusted working-tree skills. The fixture PowerPoint is a
minimal empty presentation, the PDF a blank page, and the image a tiny PNG; the
eval verifies file preservation, not content extraction or visual preview quality.

Override the CLI/model/budget with the same environment variables as the original
harness. Default ceiling is $0.80 per turn. It retains both the project and an
upload/evidence directory, including transcripts, and prints their paths.
Contract tests assert agreement among independently loaded skills; oracle mutation
tests verify that the evaluators reject deliberately incorrect outcomes. Neither
kind of deterministic test alone proves stochastic agent behavior.
