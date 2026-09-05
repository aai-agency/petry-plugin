import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const names = ["manage-assets", "get-asset-data", "capture"];
const skills = names.map((name) => readFileSync(`skills/${name}/SKILL.md`, "utf8").replace(/\r\n/g, "\n"));
const section = (text) => text.split("## Persistent artifact templates\n")[1].split(/\n## /)[0];
const jsonExamples = (text) => [...text.matchAll(/```json\n([\s\S]*?)\n```/g)]
  .map((match) => JSON.parse(match[1]));
const template = jsonExamples(skills[0]).find((value) => value.default_for);

test("all independently loaded skills carry the exact template contract", () => {
  for (const skill of skills) {
    assert.ok(section(skill));
    assert.equal(section(skill), section(skills[0]));
    assert.deepEqual(jsonExamples(skill).find((value) => value.default_for), template);
  }
});

test("template example has stable identity and deterministic type defaults", () => {
  assert.equal(template.schema_version, 1);
  assert.equal(template.revision, 1);
  assert.match(template.id, /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/);
  assert.equal(template.view_type, "profile");
  assert.deepEqual(template.applies_to.asset_types, ["well"]);
  assert.deepEqual(template.default_for, [{ asset_type: "well", view_type: "profile" }]);
  assert.deepEqual(template.spec.activity, {
    placement: "below-timeseries",
    same_day: "separate",
    annotations: { placement: "on-timeseries", series: "oil_volume" },
  });
  assert.equal(template.created_at, template.updated_at);
});

test("template contract excludes live data and executable instructions", () => {
  const contract = section(skills[0]).replace(/\s+/g, " ");
  for (const phrase of [
    "must not store asset",
    "source or connector identities",
    "vault observations",
    "artifact IDs",
    "generated AI summary text",
    "credentials",
    "executable code",
    "tool instructions",
    "never execute them",
  ]) assert.match(contract, new RegExp(phrase, "i"));
});

test("templates can preserve separate same-day timeseries annotations", () => {
  for (const text of skills) {
    assert.match(text, /"same_day": "separate"/);
    assert.match(text, /"annotations": \{ "placement": "on-timeseries", "series": "oil_volume" \}/);
    assert.match(text, /timeseries annotation placement/);
  }
});

test("template resolution and snapshot behavior are unambiguous", () => {
  const contract = section(skills[0]);
  assert.match(contract, /exact template explicitly named/);
  assert.match(contract, /sole active `default_for` match/);
  assert.match(contract, /at most one\ntemplate across the project/);
  assert.match(contract, /Current-request layout instructions override/);
  assert.match(contract, /Existing artifacts remain\nsnapshots/);
  assert.match(contract, /newly requested artifact resolves the current saved template/);
});

test("management, retrieval, and capture honor their template responsibilities", () => {
  const [management, retrieval, capture] = skills;
  assert.match(management, /extract only its\n  reusable declarative presentation choices/);
  assert.match(management, /remove that exact default pair from any prior active template/);
  assert.match(management, /requested `.petry\/templates\/<id>\.json` records/);
  assert.match(retrieval, /resolve the requested view type and local template/);
  assert.match(retrieval, /template_revision/);
  assert.match(retrieval, /never selects a data source/);
  assert.match(capture, /preserve its template ID, revision, view/);
  assert.match(capture, /Do not resolve a\n   newer default template during capture/);
});
