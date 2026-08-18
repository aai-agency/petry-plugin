// Bundles the real @aai-agency/og-components chart + its styles into the
// self-contained artifact template the plugin ships. Leaves {{TITLE}} and
// {{CHART_DATA_JSON}} for the skill to fill at render time.
//
// The library's 0.4.1 is not on npm yet, so we resolve it from the local
// aai-og-components workspace (already built + installed). Override with
// OG_COMPONENTS_DIR. We bundle the chart component from SOURCE so only its real
// deps come along (React + uPlot) — importing the package index would drag in
// the deck.gl/mapbox Map.
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (p) => resolve(__dirname, p);

const OGPKG =
  process.env.OG_COMPONENTS_DIR ||
  join(homedir(), "Documents/aai-agency/os/aai-og-components/packages/og-components");
const lineChartSrc = join(OGPKG, "src/components/line-chart/line-chart.tsx");
const declineCurveSrc = join(OGPKG, "src/components/decline-curve/decline-curve.tsx");
if (!existsSync(lineChartSrc) || !existsSync(declineCurveSrc)) {
  console.error(`og-components source not found at ${OGPKG}. Set OG_COMPONENTS_DIR.`);
  process.exit(1);
}

// A barrel that re-exports only the components we render, from source — so the
// deck.gl/mapbox Map never enters the graph. (DeclineCurve's "wasm-engine" is a
// pure-TS facade, so this stays self-contained.)
const barrel = R(".og-barrel.mjs");
writeFileSync(
  barrel,
  `export { LineChart, ProductionChart } from ${JSON.stringify(lineChartSrc)};\n` +
    `export { DeclineCurve } from ${JSON.stringify(declineCurveSrc)};\n`
);

const result = await esbuild.build({
  entryPoints: [R("src/entry.jsx")],
  bundle: true,
  write: false,
  format: "iife",
  minify: true,
  target: ["es2020"],
  loader: { ".jsx": "jsx", ".tsx": "tsx", ".ts": "ts", ".css": "empty" },
  define: { "process.env.NODE_ENV": '"production"' },
  alias: { "@aai-agency/og-components": barrel },
  nodePaths: [join(OGPKG, "node_modules")],
  logLevel: "info",
});
const bundleJs = result.outputFiles[0].text;

// og-components ships src/styles.css (theme tokens + bundled uPlot CSS).
const ogStyles = readFileSync(join(OGPKG, "src/styles.css"), "utf8");

// Function replacements: the minified bundle contains `$` sequences that a
// string replacement would misinterpret ($&, $', $$). A function returns the
// text verbatim.
const skeleton = readFileSync(R("template.skeleton.html"), "utf8");
const html = skeleton
  .replace("/* {{OG_STYLES}} */", () => ogStyles)
  .replace("/* {{OG_BUNDLE}} */", () => bundleJs);

const out = R("../skills/get-well-production/assets/preview.html");
writeFileSync(out, html);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + "kb";
console.log(`bundle ${kb(bundleJs)} · styles ${kb(ogStyles)} · artifact ${kb(html)}`);
console.log(`wrote ${out}`);
const lower = bundleJs.toLowerCase();
for (const heavy of ["mapbox", "deck.gl", "deckgl", "@deck", "supercluster"]) {
  if (lower.includes(heavy)) console.warn(`  ! bundle references "${heavy}" — expected chart-only, check tree-shaking`);
}
