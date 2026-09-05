import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const capture = read("skills/capture/SKILL.md");
const retrieval = read("skills/get-asset-data/SKILL.md");
const jsonExamples = (text) =>
  [...text.matchAll(/```json\r?\n([\s\S]*?)\r?\n```/g)].map((match) =>
    JSON.parse(match[1]),
  );
const observation = (text) =>
  jsonExamples(text).find((value) => value.petry?.schema_version === 2);

test("JSON contract examples parse with Unix and Windows line endings", () => {
  for (const skill of [capture, retrieval]) {
    assert.deepEqual(jsonExamples(skill.replace(/\n/g, "\r\n")), jsonExamples(skill));
    assert.ok(jsonExamples(skill).length > 0);
  }
});

// Pinned upstream Edge + EntityEdge fields, not the narrow MCP input schema.
const graphitiFields = [
  "uuid", "group_id", "source_node_uuid", "target_node_uuid", "created_at",
  "name", "fact", "fact_embedding", "episodes", "expired_at", "valid_at",
  "invalid_at", "reference_time", "attributes",
];

test("both independently loaded skills carry the same complete fact example", () => {
  const writer = observation(capture);
  const reader = observation(retrieval);
  assert.ok(writer, "capture must contain an authoritative v2 JSON example");
  assert.deepEqual(writer, reader);
  assert.deepEqual(
    Object.keys(writer).sort(),
    [...graphitiFields, "petry"].sort(),
  );
  const migration = read("UPGRADE.md");
  for (const field of graphitiFields) {
    assert.ok(migration.includes(`| ${field} |`), `missing mapping: ${field}`);
  }
});

test("local staging does not manufacture graph endpoints or embeddings", () => {
  const record = observation(capture);
  for (const field of [
    "group_id", "source_node_uuid", "target_node_uuid", "name", "fact_embedding",
  ]) {
    assert.equal(record[field], null, `${field} must remain unresolved`);
  }
  assert.match(record.uuid, /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/);
  assert.deepEqual(record.episodes, []);
  assert.deepEqual(record.attributes, {});
  assert.deepEqual(record.petry.asset_refs, ["M-101"]);
  assert.deepEqual(record.petry.supersedes, []);
});

test("range example preserves calendar precision and separates knowledge time", () => {
  const record = observation(capture);
  assert.equal(record.petry.temporal_kind, "interval");
  assert.equal(record.valid_at, "2026-08-05");
  assert.equal(record.invalid_at, "2026-08-07");
  assert.equal(
    (Date.parse(record.invalid_at) - Date.parse(record.valid_at)) / 86_400_000,
    2,
    "Aug 5 through Aug 6 covers two calendar days, not one",
  );
  assert.deepEqual(record.petry.time_precision, {
    valid_at: "date", invalid_at: "date",
  });
  assert.equal(record.petry.timezone, null);
  assert.equal(record.expired_at, null, "a historical end is not supersession");
  assert.equal(record.created_at, record.petry.captured_at);
  assert.ok(Date.parse(record.created_at) > Date.parse(record.invalid_at));
  assert.notEqual(record.valid_at, record.created_at.slice(0, 10));
});

test("dependency example binds to the record and separates loaded and visible scope", () => {
  const record = observation(retrieval);
  const manifest = jsonExamples(retrieval).find((value) =>
    Object.hasOwn(value, "consumes_insights"),
  );
  assert.ok(manifest);
  assert.equal(manifest.consumes_insights, true);
  assert.deepEqual(manifest.loaded_asset_refs, record.petry.asset_refs);
  assert.deepEqual(manifest.observation_uuids, [record.uuid]);
  assert.ok(manifest.observation_types.includes(record.petry.type));
  assert.equal(manifest.knowledge_view.mode, "current");
  assert.equal(manifest.knowledge_view.as_of, null);
  assert.ok(Object.hasOwn(manifest, "active_filters"));
  assert.ok(Object.hasOwn(manifest, "derived_dependencies"));
  assert.ok(Object.hasOwn(manifest, "source_snapshot"));
  assert.ok(manifest.insight_fields_used.includes("invalid_at"));
  assert.ok(!manifest.insight_fields_used.includes("fact_embedding"));
});

test("instruction safety and migration boundaries cannot silently regress", () => {
  assert.match(capture, /BOTH old and new scope/);
  assert.match(retrieval, /Compare BEFORE and AFTER versions/);
  assert.match(capture, /duplicate\/no-op never refreshes/);
  assert.match(capture, /same connected project/);
  assert.match(retrieval, /full loaded\/selectable scope/);
  assert.match(retrieval, /Reading or\nrefreshing must never migrate or edit the vault/);
  assert.match(capture, /invalidate an old\n  embedding/);
  assert.match(retrieval, /entire record\s+in `activity\[\]\.observation`/);
  assert.match(read("UPGRADE.md"), /Do not silently drop fields/);
  assert.doesNotMatch(read("UPGRADE.md"), /import can be safely retried/);
});

// These guard instruction presence, not executed host/model behavior. Native
// acceptance evidence lives in docs/tasks/local-acceptance.md.
test("local acceptance safeguards remain explicit in both workflows", () => {
  assert.match(capture, /Never block a local write/);
  assert.match(capture, /substitute local success for a failed\nshared write/);
  assert.match(retrieval, /Local file retrieval needs no petry account/);
  assert.match(retrieval, /Do not filter interval-end labels as/);
  assert.match(retrieval, /August 14 23:00–August 15 00:00/);
  assert.match(retrieval, /attempt package resolution and a\nminimal bundle/);
  assert.match(retrieval, /immediately remove stale\ninterpretations/);
  assert.match(retrieval, /Omit an unavailable modification time/);
});
