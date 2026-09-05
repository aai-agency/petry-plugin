import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const names = ["manage-assets", "get-asset-data", "capture"];
const skills = names.map((name) => readFileSync(`skills/${name}/SKILL.md`, "utf8").replace(/\r\n/g, "\n"));
const examples = (text) => [...text.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
const contract = (text) => text.split("## Persistent local identity contract\n")[1].split(/\n## /)[0];
const registry = examples(skills[0]).find((item) => item.sources);
const asset = examples(skills[0]).find((item) => item.source_bindings);

// This plugin executes instructions through a host model. These checks protect
// its independently loaded contract, not claim a deterministic storage runtime.
test("all three independently loaded skills carry the exact local identity contract", () => {
  for (const skill of skills) {
    assert.ok(contract(skill));
    assert.equal(contract(skill), contract(skills[0]));
    assert.deepEqual(examples(skill).find((item) => item.sources), registry);
    assert.deepEqual(examples(skill).find((item) => item.source_bindings), asset);
  }
});

test("registry and asset examples are referentially consistent with stable identities", () => {
  assert.equal(registry.schema_version, 1);
  assert.equal(asset.schema_version, 1);
  assert.equal(registry.revision, 1);
  assert.equal(asset.revision, 1);
  for (const id of [asset.id, ...registry.sources.map((source) => source.id)]) {
    assert.match(id, /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/);
  }
  assert.equal(asset.ref, `asset:${asset.id}`);
  assert.equal(new Set(registry.sources.map((source) => source.id)).size, registry.sources.length);
  const owners = new Set();
  for (const binding of asset.source_bindings) {
    const source = registry.sources.find((item) => item.id === binding.source_id);
    assert.ok(source, "dangling source binding");
    assert.equal(binding.external_id, "00101", "leading zeros are identity");
    for (const capability of binding.capabilities) {
      assert.ok(source.capabilities.includes(capability));
      assert.ok(!owners.has(capability), "competing capability owners");
      owners.add(capability);
    }
  }
  assert.deepEqual(asset.legacy_refs, [], "legacy names require explicit ownership");
  assert.equal(asset.archived_at, null);
  assert.equal(asset.created_at, asset.updated_at);
});

test("source example distinguishes configuration from verified availability", () => {
  const source = registry.sources[0];
  assert.equal(source.kind, "file");
  assert.equal(source.location.path, "data/readings.csv");
  assert.deepEqual(source.verification, { status: "unverified", checked_at: null, last_success_at: null });
  assert.equal(source.mapping.asset_id, "meter_id");
  assert.equal(source.mapping.metrics.pressure.kind, "gauge");
  assert.equal(source.mapping.metrics.pressure.unit, "psig");
  assert.equal(source.mapping.interval_end, "interval_end");
  assert.doesNotMatch(JSON.stringify(registry), /password|token|secret|connection_string|https?:/i);
});

test("read paths cannot silently create records, switch sources, or join names", () => {
  const [, retrieval, capture] = skills;
  assert.match(retrieval, /A read request never creates or updates/);
  assert.match(retrieval, /An explicit source is a one-request override/);
  assert.match(retrieval, /do not silently try another connector or same-named asset/);
  assert.match(retrieval, /qualify identity by the\nsource location\/workspace and external ID/);
  assert.match(capture, /A capture never creates or edits\nan asset record/);
  assert.match(capture, /assigned legacy\nfiles are additional reads/);
  assert.match(contract(capture), /each legacy ref has one local owner/);
  assert.match(contract(capture), /canonical ref\nand its assigned legacy refs/);
});

test("management specifies bounded safe writes and recoverable retries", () => {
  const management = skills[0];
  for (const pattern of [
    /symlinks escaping it/, /authentication stays in/,
    /unknown fields recursively/, /unsupported schema versions/,
    /read-only/, /same \(source_id, external_id\)/,
    /write\n   and verify the registry first|write\nand verify the registry first/,
    /On partial failure preserve successful records/,
    /reload and reconcile/, /best-effort conflict detection/,
    /do not permanently delete files/,
    /explicit user assignment/, /do not import every asset|does not import every asset/,
    /keeps its ID and all asset bindings/,
  ]) assert.match(management, pattern);
});
