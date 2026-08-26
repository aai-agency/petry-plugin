// Reproducibly bundle the published @aai-agency/og-components DeclineCurve and
// its compiled Tailwind CSS into the self-contained artifact template.
import * as esbuild from "esbuild";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (value) => resolve(__dirname, value);
const require = createRequire(import.meta.url);

const ogStylesPath = require.resolve("@aai-agency/og-components/styles.css");
const ogPackageRoot = resolve(dirname(ogStylesPath), "..");
const ogDist = join(ogPackageRoot, "dist");
if (!existsSync(ogDist)) {
  console.error(`og-components distribution not found at ${ogDist}. Run pnpm install.`);
  process.exit(1);
}

// Importing the DeclineCurve subpath avoids pulling the map entrypoint into the
// bundle while preserving the real published component and its direct deps.
const result = await esbuild.build({
  entryPoints: [R("src/entry.jsx")],
  bundle: true,
  write: false,
  format: "iife",
  minify: true,
  target: ["es2020"],
  loader: { ".jsx": "jsx", ".tsx": "tsx", ".ts": "ts", ".css": "empty" },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
});
const bundleJs = result.outputFiles[0].text;

// The package stylesheet owns tokens and uPlot CSS; Tailwind scans the pinned
// distribution for component utility classes.
const twInput = R(".tw-input.css");
writeFileSync(
  twInput,
  `@import "tailwindcss";\n` +
    `@source ${JSON.stringify(ogDist)};\n` +
    readFileSync(ogStylesPath, "utf8")
);
const twOut = R(".tw-out.css");
execFileSync(R("node_modules/.bin/tailwindcss"), ["-i", twInput, "-o", twOut, "--minify"], {
  stdio: "inherit",
  cwd: __dirname,
});
const ogStyles = readFileSync(twOut, "utf8");

const skeleton = readFileSync(R("template.skeleton.html"), "utf8");
const html = skeleton
  .replace("/* {{OG_STYLES}} */", () => ogStyles)
  .replace("/* {{OG_BUNDLE}} */", () => bundleJs);

if (html.includes("{{OG_STYLES}}") || html.includes("{{OG_BUNDLE}}")) {
  console.error("artifact build left an internal bundle placeholder behind");
  process.exit(1);
}
if (html.split("{{CHART_DATA_JSON}}").length - 1 !== 1) {
  console.error("artifact must contain exactly one chart-data placeholder");
  process.exit(1);
}

const lower = bundleJs.toLowerCase();
const heavyReferences = ["mapbox", "deck.gl", "deckgl", "@deck", "supercluster"].filter(
  (name) => lower.includes(name)
);
if (heavyReferences.length) {
  console.error(`chart-only bundle unexpectedly references: ${heavyReferences.join(", ")}`);
  process.exit(1);
}

const out = R("../skills/get-well-production/assets/preview.html");
const check = process.argv.includes("--check");
if (check) {
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (existing !== html) {
    console.error("generated artifact is stale; run pnpm build in build/");
    process.exit(1);
  }
} else {
  writeFileSync(out, html);
}

const kb = (value) => `${(Buffer.byteLength(value) / 1024).toFixed(0)}kb`;
const digest = createHash("sha256").update(html).digest("hex");
console.log(`bundle ${kb(bundleJs)} · css ${kb(ogStyles)} · artifact ${kb(html)}`);
console.log(`${check ? "verified" : "wrote"} ${out} · sha256 ${digest}`);
