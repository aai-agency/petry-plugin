import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  artifactPath,
  assertCorrection,
  assertRelevant,
  observations,
  readArtifact,
  snapshot,
} from "./oracle.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const adapter = join(here, "artifact-adapter.md");
const keep = process.argv.includes("--keep");
const claude = process.env.PETRY_EVAL_CLAUDE_BIN || "claude";
const model = process.env.PETRY_EVAL_MODEL || "haiku";
const budget = process.env.PETRY_EVAL_TURN_BUDGET_USD || "0.40";
const root = await mkdtemp(join(tmpdir(), "petry-agent-eval-"));
const sessionId = randomUUID();
const transcripts = [];
let passed = false;

const artifact = {
  artifact_id: "petry-eval-m101",
  revision: 1,
  telemetry: [
    { time: "2026-08-05T00:00:00Z", pressure_psig: 310 },
    { time: "2026-08-06T00:00:00Z", pressure_psig: 320 },
  ],
  activity: [],
  petry_dependencies: {
    schema_version: 1,
    project_identity: root,
    consumes_insights: true,
    loaded_asset_refs: ["M-101"],
    loaded_world_window: {
      from: "2026-08-01",
      to: "2026-08-15",
      precision: "date",
      timezone: "UTC",
    },
    includes_undated: false,
    observation_types: ["event", "measurement"],
    knowledge_view: { mode: "current", as_of: null },
    insight_fields_used: ["fact", "valid_at", "invalid_at", "petry.type"],
  },
};

async function runClaude(prompt, first = false) {
  const args = [
    "-p",
    ...(first ? ["--session-id", sessionId] : ["--resume", sessionId]),
    "--plugin-dir", repo,
    "--append-system-prompt-file", adapter,
    "--permission-mode", "acceptEdits",
    "--permission-prompts", "none",
    "--allowedTools", "Read,Write,Edit,Glob,Grep",
    "--model", model,
    "--effort", "low",
    "--max-budget-usd", budget,
    "--output-format", "json",
    prompt,
  ];
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn(claude, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolveResult({ code, stdout, stderr }));
  });
  transcripts.push({ prompt, ...result });
  if (result.code !== 0) throw new Error(`Claude exited ${result.code}: ${result.stderr}`);
}

await mkdir(dirname(artifactPath(root)), { recursive: true });
await mkdir(join(root, "data"), { recursive: true });
await writeFile(
  join(root, "data/readings.csv"),
  "asset_id,time,pressure_psig\nM-101,2026-08-05T00:00:00Z,310\nM-101,2026-08-06T00:00:00Z,320\n",
);
await writeFile(artifactPath(root), `${JSON.stringify(artifact, null, 2)}\n`);
const sourceHash = (await snapshot(root))["data/readings.csv"];

try {
  const beforeRelevant = await readArtifact(root);
  await runClaude(
    "Use petry:capture. Capture this exact event: M-101 line pressure was constrained from August 5 through August 6, 2026. This explicit request authorizes the local write and applicable artifact refresh.",
    true,
  );
  let records = await observations(root);
  const afterRelevant = await readArtifact(root);
  assertRelevant(beforeRelevant, afterRelevant, records);
  const predecessor = structuredClone(records[0]);
  const predecessorUuid = predecessor.uuid;
  assert.deepEqual(Object.keys(await snapshot(root)).sort(), [
    ".petry/eval-artifacts/m101.json",
    ".petry/vault/m-101.md",
    "data/readings.csv",
  ]);

  const beforeUnrelatedArtifactBytes = await readFile(artifactPath(root));
  const beforeUnrelated = await snapshot(root);
  await runClaude(
    "Use petry:capture. Capture this exact assertion: M-202 calibration completed on August 9, 2026. This explicitly authorizes the local write.",
  );
  assert.deepEqual(await readFile(artifactPath(root)), beforeUnrelatedArtifactBytes);
  const afterUnrelated = await snapshot(root);
  for (const [path, hash] of Object.entries(beforeUnrelated)) {
    if (!path.includes("m-202")) assert.equal(afterUnrelated[path], hash, `${path} changed`);
  }
  assert.deepEqual(
    Object.keys(afterUnrelated).filter((path) => !(path in beforeUnrelated)),
    [".petry/vault/m-202.md"],
    "unrelated capture created unexpected files",
  );

  const beforeDuplicate = await snapshot(root);
  await runClaude(
    "Use petry:capture. Capture this exact event again: M-101 line pressure was constrained from August 5 through August 6, 2026.",
  );
  assert.deepEqual(await snapshot(root), beforeDuplicate, "duplicate changed project bytes");

  const beforeCorrection = await readArtifact(root);
  const beforeCorrectionFiles = await snapshot(root);
  await runClaude(
    `Use petry:capture. Correct event ${predecessorUuid} so its exact fact is: M-101 line pressure was constrained from August 20 through August 21, 2026. This identifies the exact observation and correction and authorizes both the local revision and applicable artifact refresh.`,
  );
  records = await observations(root);
  assertCorrection(beforeCorrection, await readArtifact(root), records, predecessor);
  const afterCorrectionFiles = await snapshot(root);
  assert.equal(afterCorrectionFiles["data/readings.csv"], sourceHash);
  assert.equal(
    afterCorrectionFiles[".petry/vault/m-202.md"],
    beforeCorrectionFiles[".petry/vault/m-202.md"],
  );
  assert.deepEqual(Object.keys(afterCorrectionFiles), Object.keys(beforeCorrectionFiles));
  assert.equal(records.length, 3, "expected predecessor, replacement, and M-202");

  if (keep) {
    await writeFile(join(root, "transcripts.json"), `${JSON.stringify(transcripts, null, 2)}\n`);
  }
  const totalCostUsd = transcripts.reduce((sum, transcript) => {
    try {
      return sum + (JSON.parse(transcript.stdout).total_cost_usd || 0);
    } catch {
      return sum;
    }
  }, 0);

  console.log(JSON.stringify({
    result: "pass",
    model,
    cases: ["relevant", "unrelated", "duplicate", "correction"],
    artifact_id: artifact.artifact_id,
    final_revision: (await readArtifact(root)).revision,
    observation_count: records.length,
    total_cost_usd: totalCostUsd,
    workspace: keep ? root : null,
  }, null, 2));
  passed = true;
} catch (error) {
  await writeFile(join(root, "transcripts.json"), `${JSON.stringify(transcripts, null, 2)}\n`);
  console.error(`Agent eval failed. Evidence retained at ${root}`);
  throw error;
} finally {
  if (passed && !keep) await rm(root, { recursive: true, force: true });
}
