#!/usr/bin/env node
// Safely fill the generated well-profile template with chart data.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TEMPLATE = path.resolve(
  __dirname,
  "../skills/get-well-production/assets/preview.html"
);
const DATA_PLACEHOLDER = "{{CHART_DATA_JSON}}";

const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export const renderPreview = (template, data) => {
  const sites = template.split(DATA_PLACEHOLDER).length - 1;
  if (sites !== 1) {
    throw new Error(`preview template must contain exactly one ${DATA_PLACEHOLDER}; found ${sites}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("chart data must be a JSON object");
  }
  return template.replace(DATA_PLACEHOLDER, () => safeJson(data));
};

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--") || argv[i + 1] === undefined) continue;
    args[key.slice(2)] = argv[++i];
  }
  return args;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.data || !args.out) {
    console.error(
      "petry render-preview: need --data <chart-data.json> and --out <profile.html>"
    );
    process.exit(2);
  }

  const templatePath = path.resolve(args.template || DEFAULT_TEMPLATE);
  const dataPath = path.resolve(args.data);
  const outputPath = path.resolve(args.out);
  const template = fs.readFileSync(templatePath, "utf8");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const html = renderPreview(template, data);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log(JSON.stringify({ status: "rendered", file: outputPath }));
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
