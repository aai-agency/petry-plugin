import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const CAPTURE = path.resolve("skills/capture/scripts/capture.mjs");
const RENDER = path.resolve("skills/get-well-production/scripts/render-preview.mjs");

const run = (script, args, cwd) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
  });

test("skill-local capture entry point writes to the active workspace", () => {
  const cwd = mkdtempSync(path.join(tmpdir(), "petry-portable-capture-"));
  try {
    const result = run(
      CAPTURE,
      ["add", "--asset", "COWORK 1", "--text", "Portable capture"],
      cwd
    );
    assert.equal(result.status, 0, result.stderr);
    const response = JSON.parse(result.stdout);
    assert.equal(response.status, "added");
    assert.equal(
      path.dirname(response.file),
      path.join(realpathSync(cwd), ".petry", "vault")
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("skill-local renderer resolves its bundled template", () => {
  const cwd = mkdtempSync(path.join(tmpdir(), "petry-portable-render-"));
  const output = path.join(cwd, "profile.html");
  try {
    const result = run(
      RENDER,
      ["--data", path.resolve("test/fixtures/chart-data.json"), "--out", output],
      cwd
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).status, "rendered");
    const html = readFileSync(output, "utf8");
    assert.equal(html.includes("{{CHART_DATA_JSON}}"), false);
    assert.match(html, /HOWARD 4N-28HZ/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
