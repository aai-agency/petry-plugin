import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertSampleDisclosure } from "./sample-label-oracle.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const root = await mkdtemp(join(tmpdir(), "petry-sample-label-eval-"));
const model = process.env.PETRY_EVAL_MODEL || "haiku";
const adapter = join(root, "host.md");
await writeFile(adapter, "This is a disposable file-only evaluation host. The current directory is the connected project. There is no native artifact surface, React bundler, browser, or calculation tool available. The standalone HTML fallback is available through Write. Do not use a network or install packages. Save only the user-requested result.html.");
const prompt = "Use petry:get-asset-data. Create a simple standalone HTML table with two sample pressure readings for meter M-SAMPLE and save it as result.html. No charts, aggregates, or captured insights are needed.";
const args = [
  "-p", "--plugin-dir", repo, "--append-system-prompt-file", adapter,
  "--permission-mode", "acceptEdits", "--permission-prompts", "none",
  "--allowedTools", "Read,Write,Edit,Glob,Grep", "--model", model,
  "--effort", "low", "--max-budget-usd", process.env.PETRY_EVAL_TURN_BUDGET_USD || "0.50",
  "--output-format", "json", prompt,
];

console.log(`Sample-label evidence: ${root}`);
const result = await new Promise((resolveResult, reject) => {
  const child = spawn(process.env.PETRY_EVAL_CLAUDE_BIN || "claude", args, {
    cwd: root, stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", code => resolveResult({code, stdout, stderr}));
});
await writeFile(join(root, "transcript.json"), JSON.stringify({prompt, ...result}, null, 2));
assert.equal(result.code, 0, result.stderr);
const output = JSON.parse(result.stdout);
assert.ok(!output.is_error, output.result || output.subtype);
const html = await readFile(join(root, "result.html"), "utf8");
assertSampleDisclosure(html);
console.log(JSON.stringify({
  result: "pass", model, case: "sample-label-without-separate-label-request",
  skillSha256: createHash("sha256").update(await readFile(join(repo, "skills/get-asset-data/SKILL.md"))).digest("hex"),
  htmlSha256: createHash("sha256").update(html).digest("hex"),
  workspace: root, total_cost_usd: output.total_cost_usd,
  boundary: "Static standalone HTML content check; native Cowork rendering and CSS visibility are not verified.",
}, null, 2));
