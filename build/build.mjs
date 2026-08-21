// Bundles the real @aai-agency/og-components Chart + its compiled Tailwind CSS
// into the self-contained artifact template the plugin ships. Leaves {{TITLE}}
// and {{CHART_DATA_JSON}} for the skill to fill at render time.
//
// The library is resolved from npm (a normal dependency of this build package),
// so the artifact tracks the published version and no local checkout is needed.
// We import ONLY the focused `@aai-agency/og-components/chart` export so esbuild
// pulls the chart (React + uPlot) and never the deck.gl/mapbox Map. We also
// COMPILE Tailwind against the library's shipped dist so the component's
// utility-class UI (toolbar, buttons, controls) is actually styled.
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (p) => resolve(__dirname, p);

// Resolve the npm-installed library (from build/node_modules) via the ESM
// resolver — the package is ESM-only (no CJS `require` condition) and its
// exports map doesn't expose ./package.json, so derive its dir from the main
// entry (exports "." -> "./dist/index.js").
const mainEntry = fileURLToPath(import.meta.resolve("@aai-agency/og-components"));
const pkgDir = resolve(dirname(mainEntry), "..");
const version = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).version;
console.log(`bundling @aai-agency/og-components@${version} (/chart export) from npm`);

// ── 1. JS: bundle the real Chart via the focused /chart export ────────────────
// Importing the package index would drag in the deck.gl/mapbox Map; the /chart
// subpath is chart-only (React + uPlot), so the artifact stays self-contained.
const result = await esbuild.build({
  entryPoints: [R("src/entry.jsx")],
  absWorkingDir: __dirname,
  bundle: true,
  write: false,
  format: "iife",
  minify: true,
  target: ["es2020"],
  loader: { ".jsx": "jsx", ".css": "empty" },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
});
const bundleJs = result.outputFiles[0].text;

// ── 2. CSS: compile Tailwind against the library's shipped dist ───────────────
// The component UI uses Tailwind utility classes (flex, rounded-sm, px-2,
// text-muted-foreground …). The shipped styles.css only carries the @theme
// tokens + uPlot CSS, so without this the toolbar/buttons render unstyled. Scan
// the built dist for the classes it actually uses and emit just those + preflight.
const twInput = R(".tw-input.css");
writeFileSync(
  twInput,
  `@import "tailwindcss";\n` +
    `@source ${JSON.stringify(join(pkgDir, "dist"))};\n` +
    readFileSync(join(pkgDir, "src/styles.css"), "utf8")
);
const twOut = R(".tw-out.css");
execFileSync(
  R("node_modules/.bin/tailwindcss"),
  ["-i", twInput, "-o", twOut, "--minify"],
  { stdio: "inherit", cwd: __dirname }
);
const ogStyles = readFileSync(twOut, "utf8");

// ── 3. Inline both into the artifact ─────────────────────────────────────────
// Function replacements: the minified bundle contains `$` sequences that a
// string replacement would misinterpret ($&, $', $$).
const skeleton = readFileSync(R("template.skeleton.html"), "utf8");
const html = skeleton
  .replace("/* {{OG_STYLES}} */", () => ogStyles)
  .replace("/* {{OG_BUNDLE}} */", () => bundleJs);

const out = R("../skills/get-well-production/assets/preview.html");
writeFileSync(out, html);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + "kb";
console.log(`bundle ${kb(bundleJs)} · css ${kb(ogStyles)} · artifact ${kb(html)}`);
console.log(`wrote ${out}`);
const lower = bundleJs.toLowerCase();
for (const heavy of ["mapbox", "deck.gl", "deckgl", "@deck", "supercluster"]) {
  if (lower.includes(heavy)) console.warn(`  ! bundle references "${heavy}" — expected chart-only, check the /chart export`);
}
