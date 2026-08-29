import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const readSkill = (name) => readFileSync(`skills/${name}/SKILL.md`, "utf8");

test("release metadata is aligned at 0.3.0", () => {
  const root = readJson("package.json");
  const plugin = readJson(".claude-plugin/plugin.json");
  assert.equal(root.version, "0.3.0");
  assert.equal(plugin.version, root.version);
});

test("the package ships exactly two instruction-only skills", () => {
  const skillDirs = readdirSync("skills", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(skillDirs, ["capture", "get-well-production"]);

  for (const skill of skillDirs) {
    assert.deepEqual(readdirSync(`skills/${skill}`).sort(), ["SKILL.md"]);
  }
  assert.equal(existsSync("scripts"), false);
  assert.equal(existsSync("build"), false);
});

test("capture defines the vault contract without a runtime dependency", () => {
  const skill = readSkill("capture");
  assert.match(skill, /instruction-only skill/i);
  assert.match(skill, /connected-folder tools/i);
  assert.match(skill, /\.petry\/vault/);
  assert.match(skill, /\.petry\/insights/);
  assert.match(skill, /petry:asset ref=/);
  assert.match(skill, /petry:obs type=/);
  assert.match(skill, /valid_at/);
  assert.match(skill, /captured_at/);
  assert.match(skill, /source/);
  assert.match(skill, /duplicate/i);
  assert.doesNotMatch(skill, /CLAUDE_(?:SKILL_DIR|PLUGIN_ROOT)|\.mjs|preview\.html/);
});

test("production defines dynamic native artifacts without a renderer", () => {
  const skill = readSkill("get-well-production");
  assert.match(skill, /instruction-only skill/i);
  assert.match(skill, /native Cowork\s+artifact/i);
  assert.match(skill, /connected database, API, or MCP/i);
  assert.match(skill, /\.petry\/vault/);
  assert.match(skill, /Read database sources without modifying them/i);
  assert.match(skill, /"series"/);
  assert.match(skill, /"activity"/);
  assert.match(skill, /"provenance"/);
  assert.doesNotMatch(skill, /CLAUDE_(?:SKILL_DIR|PLUGIN_ROOT)|\.mjs|preview\.html/);
});
