# Agent evaluation harness

## Goal

Exercise petry through a real Claude agent and independently verify that local
capture changes the affected saved artifact without corrupting telemetry or
refreshing unrelated work.

## Accepted scope

- [x] Run capture in a disposable project through the repository plugin.
- [x] Reuse one Claude conversation for relevant, unrelated, duplicate, and
  correction turns.
- [x] Inspect the resulting vault and artifact with deterministic Node checks.
- [x] Restrict the agent to project-local file tools and cap spend per turn.
- [x] Keep model calls out of the normal unit-test command.
- [x] Validate the complete lifecycle harness against an authenticated Claude CLI.
- [ ] Record repeat-run reliability before making it a release gate.

## Decisions

The native Cowork artifact API is unavailable to a headless Claude Code run. A
test-only file-backed adapter therefore represents one accessible artifact. It
has a stable ID, revision, telemetry, dependency manifest, and activity
projection. The parent Node process, rather than Claude's response, decides
whether each case passed.

The lifecycle stays in one resumed conversation because artifact accessibility
and same-conversation refresh are part of the product contract. The workspace
is temporary and begins with a synthetic CSV plus a pre-existing artifact.
Claude receives Read, Write, Edit, Glob, and Grep only; it receives no Bash,
web, MCP, or browser tools. This CLI tool grant is not an operating-system read
sandbox, so the harness must run only against trusted plugin changes.

Claude Code's first-party `claude plugin eval` runner is useful for isolated
skill-activation and with/without-plugin comparisons. Version 2.1.260 exposes
the command, but this account currently receives the early-access gate before a
case runs. Its cases are also isolated, so it cannot replace this stateful
lifecycle test. Add those cases after the feature is enabled.

## Verification evidence

- Deterministic oracle unit tests run under `pnpm check`.
- The paid live run is `pnpm eval:agent`; failures retain the disposable
  workspace and transcripts for diagnosis.
- Native Cowork rendering, component behavior, dialogs, axes, filters, and host
  artifact revision identity remain covered by
  `docs/tasks/local-acceptance-protocol.md`.
