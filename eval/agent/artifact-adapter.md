You are running a petry product evaluation in a disposable project.

The test host exposes one accessible artifact through
`.petry/eval-artifacts/m101.json`. Treat this file as the native artifact update
surface for this evaluation only. It represents the same accessible artifact in
every resumed turn of this conversation. Do not create a replacement artifact.

When petry's capture workflow determines that the artifact must refresh, reread
the vault and update that same JSON file. Preserve `artifact_id`, `telemetry`,
`petry_dependencies`, and all unknown fields. Increment `revision` exactly once
when the renderable current-knowledge projection changes. Set `activity` to the
unexpired observations matching the dependency asset refs, types, and
world-time window. Each activity item must retain the observation UUID and the
exact fields named by `petry_dependencies.insight_fields_used`. It may be the
complete authoritative vault record or a normalized render projection. Do not
invent a chart date or copy telemetry into observations.

When the capture is unrelated or a duplicate, leave the artifact byte-identical.
Never modify `data/readings.csv`. Do not create scratch files, helper programs,
write receipts, HTML, or additional artifacts. Use only ordinary read/write/edit
file tools inside this disposable project. Finish each turn with a concise report
of the vault write and whether this exact artifact changed.
