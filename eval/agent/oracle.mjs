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

export function assertRelevant(before, after, records) {
  assertArtifactInvariant(before, after);
  assert.equal(after.revision, before.revision + 1);
  assert.equal(records.length, 1);
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
  assert.equal(rendered.petry?.type ?? rendered.type, records[0].petry.type);
  if ("expired_at" in rendered) assert.equal(rendered.expired_at, null);
}

export function assertCorrection(before, after, records, predecessor) {
  assertArtifactInvariant(before, after);
  assert.equal(after.revision, before.revision + 1);
  const oldRecord = records.find((record) => record.uuid === predecessor.uuid);
  const replacement = records.find((record) =>
    record.petry?.supersedes?.includes(predecessor.uuid),
  );
  assert.ok(oldRecord?.expired_at, "predecessor must be expired");
  assert.deepEqual(
    { ...oldRecord, expired_at: predecessor.expired_at },
    predecessor,
    "correction changed predecessor fields besides expired_at",
  );
  assert.ok(replacement, "replacement must link to predecessor");
  assert.equal(replacement.expired_at, null);
  assert.equal(replacement.valid_at, "2026-08-20");
  assert.equal(replacement.invalid_at, "2026-08-22");
  assert.equal(replacement.petry.type, "event");
  assert.deepEqual(after.activity, [], "replacement is outside loaded window");
}
