import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const readSkill = (name) => readFileSync(`skills/${name}/SKILL.md`, "utf8");

test("release metadata is aligned at 0.6.1 with a lowercase plugin name", () => {
  const root = readJson("package.json");
  const plugin = readJson(".claude-plugin/plugin.json");
  const marketplace = readJson(".claude-plugin/marketplace.json");
  assert.equal(root.version, "0.6.1");
  assert.equal(plugin.version, root.version);
  assert.equal(plugin.name, "petry");
  assert.equal(marketplace.plugins[0].name, "petry");
});

test("the package ships exactly three instruction-only skills", () => {
  const skillDirs = readdirSync("skills", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(skillDirs, ["capture", "get-asset-data", "manage-assets"]);

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

test("asset data defines component-first artifacts without a plugin renderer", () => {
  const skill = readSkill("get-asset-data");
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
  assert.match(skill, /@aai-agency\/og-components\/asset-breakdown/);
  assert.match(skill, /AssetScopeBinding/);
  assert.match(skill, /ScopeFilters/);
  assert.match(skill, /MetricCard/);
  assert.match(skill, /RecordDrilldownDialog/);
  assert.match(skill, /OperationalSummary/);
  assert.match(skill, /Asset\.meta\[dimensionKey\]/);
  assert.match(skill, /link every `TimeSeries` and `WellEvent` with `assetId`/i);
  assert.match(skill, /mode: "dimension"/);
  assert.match(skill, /built-in accessible\s+event detail dialog/i);
  assert.match(skill, /Keep storage details out of the interface/i);
  assert.match(skill, /Label event time as \*\*Date\*\*/i);
  assert.match(skill, /friendly calendar date/i);
  assert.match(skill, /WellEvent\.meta.*visible/i);
  assert.match(skill, /separate private lookup/i);
  assert.match(skill, /Never expose schema\/version language/i);
  assert.match(skill, /Show a time of day only when the user explicitly requests it/i);
  assert.doesNotMatch(
    skill,
    /preserve the complete observation[\s\S]{0,160}in `meta`/i,
  );
  assert.match(skill, /Generate custom UI only when/i);
  assert.match(skill, /does not export an\s+asset data table/i);
  assert.match(skill, /area, field, pad, basin, subsystem/i);
  assert.match(skill, /"aggregate"/);
  assert.match(skill, /Clicking a KPI opens an accessible drill-down dialog/i);
  assert.match(skill, /sort\s+or group them by asset, date, and event type/i);
  assert.match(skill, /AI-generated operational summary/i);
  assert.match(skill, /Recompute the summary whenever group or filters\s+change/i);
  assert.match(skill, /Do not write generated summaries back to\s+the vault/i);
  assert.match(skill, /No sample, mock, demo, or synthetic-data banner unless the user explicitly/i);
  assert.match(skill, /every petry product or brand label exactly as lowercase `petry`/i);
  assert.doesNotMatch(skill, /CLAUDE_(?:SKILL_DIR|PLUGIN_ROOT)|\.mjs|preview\.html/);
});

test("capture refreshes keep technical observation fields out of visible artifacts", () => {
  const skill = readSkill("capture");
  assert.match(skill, /visible event objects presentation-safe/i);
  assert.match(skill, /friendly calendar\s+date under a \*\*Date\*\* label/i);
  assert.match(skill, /never expose timestamps, UUIDs, schema\/version fields/i);
  assert.match(skill, /Two events on one day remain two\s+distinct records/i);
});

test("the petry brand is lowercase in shipped text", () => {
  const files = [
    "README.md",
    "UPGRADE.md",
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    "skills/capture/SKILL.md",
    "skills/get-asset-data/SKILL.md",
    "skills/manage-assets/SKILL.md",
  ];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /\b(?:Petry|PETRY|Petree|PETREE)\b/);
  }
});
