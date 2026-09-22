import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export const artifactPath = (root) => join(root, ".petry/eval-artifacts/m101.json");

export async function readArtifact(root) {
  return JSON.parse(await readFile(artifactPath(root), "utf8"));
}

async function filesUnder(root) {
  const found = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) found.push(path);
    }
  }
  await visit(root);
  return found.sort();
}

export async function snapshot(root) {
  const entries = {};
  for (const path of await filesUnder(root)) {
    entries[relative(root, path)] = createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
  }
  return entries;
}

export async function observations(root) {
  const vault = join(root, ".petry/vault");
  let files = [];
  try {
    files = (await filesUnder(vault)).filter((path) => path.endsWith(".md"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const records = [];
  for (const path of files) {
    const markdown = await readFile(path, "utf8");
    for (const match of markdown.matchAll(
      /<!-- petry:observation schema="2" -->\s*```json\s*([\s\S]*?)\s*```/g,
    )) records.push(JSON.parse(match[1]));
  }
  return records;
}

export function assertArtifactInvariant(before, after) {
  assert.equal(after.artifact_id, before.artifact_id);
  assert.deepEqual(after.telemetry, before.telemetry);
  assert.deepEqual(after.petry_dependencies, before.petry_dependencies);
}

const uuidPattern = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

export function utcMillis(value) {
  assert.equal(typeof value, "string", "knowledge time must be a UTC timestamp");
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  assert.ok(match, `invalid UTC knowledge time: ${value}`);
  const millis = Date.parse(value);
  assert.ok(Number.isFinite(millis), `invalid UTC knowledge time: ${value}`);
  assert.equal(new Date(millis).toISOString(), `${match[1]}.${(match[2] ?? "").padEnd(3, "0")}Z`, "invalid calendar time");
  return millis;
}

export function assertMutationTime(record, window) {
  const created = utcMillis(record.created_at);
  assert.equal(record.petry.captured_at, record.created_at, "local capture time must equal creation time");
  const start = utcMillis(window.started_at);
  const end = utcMillis(window.completed_at);
  assert.ok(end >= start, "invalid host execution window");
  assert.ok(created >= start && created <= end, "mutation time must fall within the actual host execution window");
}

// Validate persisted records separately from the smaller render projection.
// These checks are for newly written local records, not historical imports.
export function assertLocalCapture(record, window) {
  assert.match(record.uuid, uuidPattern, "invalid observation UUID");
  for (const field of ["group_id", "source_node_uuid", "target_node_uuid", "name"]) {
    assert.ok(record[field] === null || typeof record[field] === "string", `missing/invalid ${field}`);
  }
  assert.equal(typeof record.fact, "string");
  assert.ok(record.fact.length > 0);
  assert.ok(record.fact_embedding === null || (Array.isArray(record.fact_embedding) && record.fact_embedding.every(Number.isFinite)));
  assert.ok(Array.isArray(record.episodes) && record.episodes.every(x => typeof x === "string"));
  assert.ok(record.attributes && typeof record.attributes === "object" && !Array.isArray(record.attributes));
  assert.equal(record.expired_at, null, "new local record must be current");
  for (const field of ["valid_at", "invalid_at"]) assert.ok(record[field] === null || typeof record[field] === "string", `missing/invalid ${field}`);
  utcMillis(record.reference_time);
  assert.equal(record.petry.schema_version, 2);
  assert.ok(Array.isArray(record.petry.asset_refs) && record.petry.asset_refs.length > 0);
  assert.ok(record.petry.asset_refs.every(x => typeof x === "string" && x.length > 0));
  assert.equal(new Set(record.petry.asset_refs).size, record.petry.asset_refs.length);
  assert.ok(["note", "decision", "event", "measurement", "correction", "instruction", "preference"].includes(record.petry.type));
  assert.equal(typeof record.petry.source, "string");
  assert.ok(["point", "interval", "undated"].includes(record.petry.temporal_kind));
  assert.ok(record.petry.time_precision && typeof record.petry.time_precision === "object" && !Array.isArray(record.petry.time_precision));
  assert.ok(record.petry.timezone === null || typeof record.petry.timezone === "string");
  assert.ok(record.petry.original_time_expression === null || typeof record.petry.original_time_expression === "string");
  assert.ok(Array.isArray(record.petry.supersedes));
  for (const id of record.petry.supersedes) assert.match(id, uuidPattern);
  assertMutationTime(record, window);
}

export function assertRelevant(before, after, records, window) {
  assertArtifactInvariant(before, after);
  assert.equal(after.revision, before.revision + 1);
  assert.equal(records.length, 1);
  assertLocalCapture(records[0], window);
  assert.deepEqual(records[0].petry.supersedes, []);
  assert.equal(records[0].expired_at, null);
  assert.equal(records[0].fact, "M-101 line pressure was constrained from August 5 through August 6, 2026.");
  assert.equal(records[0].valid_at, "2026-08-05");
  assert.equal(records[0].invalid_at, "2026-08-07");
  assert.deepEqual(records[0].petry.asset_refs, ["M-101"]);
  assert.equal(records[0].petry.type, "event");
  assert.equal(after.activity.length, 1);
  const rendered = after.activity[0];
  assert.equal(rendered.uuid, records[0].uuid);
  assert.equal(rendered.fact, records[0].fact);
  assert.equal(rendered.valid_at, records[0].valid_at);
  assert.equal(rendered.invalid_at, records[0].invalid_at);
  assert.equal(
    rendered.petry?.type ?? rendered["petry.type"] ?? rendered.type,
    records[0].petry.type,
  );
  if ("expired_at" in rendered) assert.equal(rendered.expired_at, null);
}

export function assertRevision(records, predecessor, window, expected) {
  assert.equal(new Set(records.map(record => record.uuid)).size, records.length, "duplicate observation UUID");
  const oldRecord = records.find((record) => record.uuid === predecessor.uuid);
  const replacements = records.filter((record) =>
    record.petry?.supersedes?.includes(predecessor.uuid),
  );
  assert.equal(replacements.length, 1, "expected exactly one successor");
  const replacement = replacements[0];
  assert.ok(oldRecord?.expired_at, "predecessor must be expired");
  assert.deepEqual(
    { ...oldRecord, expired_at: predecessor.expired_at },
    predecessor,
    "correction changed predecessor fields besides expired_at",
  );
  assert.ok(replacement, "replacement must link to predecessor");
  assertLocalCapture(replacement, window);
  assert.notEqual(replacement.uuid, predecessor.uuid, "successor needs a new UUID");
  assert.equal(replacement.created_at, oldRecord.expired_at, "knowledge intervals must meet at the mutation time");
  assert.ok(utcMillis(oldRecord.expired_at) > utcMillis(predecessor.created_at), "predecessor knowledge interval must be nonempty");
  assert.equal(replacement.fact, expected.fact);
  assert.equal(replacement.valid_at, expected.valid_at);
  assert.equal(replacement.invalid_at, expected.invalid_at);
  assert.equal(replacement.fact_embedding, null, "changed fact invalidates old embedding");
  assert.deepEqual(replacement.petry.supersedes, [predecessor.uuid]);
  assert.equal(typeof replacement.petry.original_time_expression, "string");
  assert.ok(replacement.petry.original_time_expression.length > 0);
  // Only the approved fact/world-time fields and generated revision metadata
  // may differ; graph links, subjects, source, evidence, and unknown fields stay.
  assert.deepEqual({
    ...replacement,
    uuid: predecessor.uuid,
    fact: predecessor.fact,
    fact_embedding: predecessor.fact_embedding,
    valid_at: predecessor.valid_at,
    invalid_at: predecessor.invalid_at,
    created_at: predecessor.created_at,
    reference_time: predecessor.reference_time,
    petry: {
      ...replacement.petry,
      captured_at: predecessor.petry.captured_at,
      original_time_expression: predecessor.petry.original_time_expression,
      supersedes: predecessor.petry.supersedes,
    },
  }, predecessor, "correction changed fields outside the approved replacement");
  // The correction is a new session assertion; its reference can be retained
  // from the predecessor or supplied by the host for this turn, never invented.
  if (replacement.reference_time !== predecessor.reference_time) {
    assert.ok(utcMillis(replacement.reference_time) >= utcMillis(window.started_at) && utcMillis(replacement.reference_time) <= utcMillis(window.completed_at), "unverified correction reference time");
  }
  return replacement;
}

export function assertCorrection(before, after, records, predecessor, window) {
  assertArtifactInvariant(before, after);
  assert.equal(after.revision, before.revision + 1);
  assertRevision(records, predecessor, window, {
    fact: "M-101 line pressure was constrained from August 20 through August 21, 2026.",
    valid_at: "2026-08-20",
    invalid_at: "2026-08-22",
  });
  assert.deepEqual(after.activity, [], "replacement is outside loaded window");
}
