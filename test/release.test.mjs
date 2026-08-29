import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const readSkill = (name) => readFileSync(`skills/${name}/SKILL.md`, "utf8");

test("release metadata is aligned at 0.4.0 with a lowercase plugin name", () => {
  const root = readJson("package.json");
  const plugin = readJson(".claude-plugin/plugin.json");
  const marketplace = readJson(".claude-plugin/marketplace.json");
  assert.equal(root.version, "0.4.0");
  assert.equal(plugin.version, root.version);
  assert.equal(plugin.name, "petry");
  assert.equal(marketplace.plugins[0].name, "petry");
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

test("production defines component-first artifacts without a plugin renderer", () => {
  const skill = readSkill("get-well-production");
  assert.match(skill, /instruction-only skill/i);
  assert.match(skill, /native Cowork\s+artifact/i);
  assert.match(skill, /connected database, API, or MCP/i);
  assert.match(skill, /\.petry\/vault/);
  assert.match(skill, /Read database sources without modifying them/i);
  assert.match(skill, /"series"/);
  assert.match(skill, /"activity"/);
  assert.match(skill, /"provenance"/);
  assert.match(skill, /Never apply a\s+global `svg \{ width: 100% \}` rule/i);
  assert.match(skill, /scrollWidth.*clientWidth/i);
  assert.match(skill, /@aai-agency\/og-components/);
  assert.match(skill, /latest\s+compatible release/i);
  assert.match(skill, /ChartGroup/);
  assert.match(skill, /EventTimeline/);
  assert.match(skill, /built-in accessible\s+event detail dialog/i);
  assert.match(skill, /Generate custom UI only when/i);
  assert.match(skill, /does not export a\s+production table/i);
  assert.match(skill, /No sample, mock, demo, or synthetic-data banner unless the user explicitly/i);
  assert.doesNotMatch(skill, /CLAUDE_(?:SKILL_DIR|PLUGIN_ROOT)|\.mjs|preview\.html/);
});

test("the petry brand is lowercase in shipped text", () => {
  const files = [
    "README.md",
    "UPGRADE.md",
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    "skills/capture/SKILL.md",
    "skills/get-well-production/SKILL.md",
  ];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /\b(?:Petry|PETRY|Petree|PETREE)\b/);
  }
});
