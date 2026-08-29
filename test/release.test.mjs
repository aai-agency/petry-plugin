import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

test("release metadata is aligned at 0.2.2", () => {
  const root = readJson("package.json");
  const plugin = readJson(".claude-plugin/plugin.json");
  assert.equal(root.version, "0.2.2");
  assert.equal(plugin.version, root.version);
});

test("only the current public skills ship", () => {
  const skillDirs = readdirSync("skills", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(skillDirs, ["capture", "get-well-production"]);
});

test("skill executables are colocated and use the portable skill directory", () => {
  const captureSkill = readFileSync("skills/capture/SKILL.md", "utf8");
  const productionSkill = readFileSync("skills/get-well-production/SKILL.md", "utf8");

  assert.equal(existsSync("skills/capture/scripts/capture.mjs"), true);
  assert.equal(
    existsSync("skills/get-well-production/scripts/render-preview.mjs"),
    true
  );
  assert.match(captureSkill, /\$\{CLAUDE_SKILL_DIR\}\/scripts\/capture\.mjs/);
  assert.match(
    productionSkill,
    /\$\{CLAUDE_SKILL_DIR\}\/scripts\/render-preview\.mjs/
  );
  assert.equal(captureSkill.includes("CLAUDE_PLUGIN_ROOT"), false);
  assert.equal(productionSkill.includes("CLAUDE_PLUGIN_ROOT"), false);
});

test("generated template exposes only the safe chart-data placeholder", () => {
  const template = readFileSync("skills/get-well-production/assets/preview.html", "utf8");
  assert.equal(template.split("{{CHART_DATA_JSON}}").length - 1, 1);
  assert.equal(template.includes("{{TITLE}}"), false);
  assert.equal(template.includes("{{OG_BUNDLE}}"), false);
  assert.equal(template.includes("{{OG_STYLES}}"), false);
});
