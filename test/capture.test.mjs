import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT = path.resolve("scripts/capture.mjs");
const tempDirs = [];

const workspace = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "petry-capture-test-"));
  tempDirs.push(dir);
  return dir;
};

const run = (cwd, args, extraEnv = {}) => {
  const env = { ...process.env, PETRY_VAULT_DIR: "", PETRY_INSIGHTS_DIR: "", ...extraEnv };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    env,
    encoding: "utf8",
  });
};

const json = (result) => JSON.parse(result.stdout);

test.after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

test("capture is idempotent and uses a collision-safe filename", () => {
  const cwd = workspace();
  const args = [
    "add",
    "--asset",
    "HOWARD 4N-28HZ",
    "--type",
    "measurement",
    "--text",
    "Rate back to 280 bbl/d",
    "--valid-at",
    "2026-06-10",
  ];
  const first = run(cwd, args);
  const second = run(cwd, args);

  assert.equal(first.status, 0, first.stderr);
  assert.equal(json(first).status, "added");
  assert.equal(json(second).status, "duplicate");
  const files = readdirSync(path.join(cwd, ".petry", "vault"));
  assert.equal(files.length, 1);
  assert.match(files[0], /^howard-4n-28hz--[a-f0-9]{10}\.md$/);
});

test("distinct references with the same slug remain separate", () => {
  const cwd = workspace();
  assert.equal(run(cwd, ["add", "--asset", "WELL A/B", "--text", "first"]).status, 0);
  assert.equal(run(cwd, ["add", "--asset", "WELL A B", "--text", "second"]).status, 0);

  const files = readdirSync(path.join(cwd, ".petry", "vault"));
  assert.equal(files.length, 2);
  const slash = json(run(cwd, ["export", "--asset", "WELL A/B"]));
  const space = json(run(cwd, ["export", "--asset", "WELL A B"]));
  assert.deepEqual(slash.observations.map((item) => item.text), ["first"]);
  assert.deepEqual(space.observations.map((item) => item.text), ["second"]);
});

test("legacy .petry/insights observations remain visible", () => {
  const cwd = workspace();
  const legacy = path.join(cwd, ".petry", "insights");
  const added = run(
    cwd,
    ["add", "--asset", "LEGACY 1", "--text", "Old observation", "--source", "field \"book\""],
    { PETRY_INSIGHTS_DIR: legacy }
  );
  assert.equal(added.status, 0, added.stderr);

  const exported = json(run(cwd, ["export", "--asset", "LEGACY 1"]));
  assert.equal(exported.count, 1);
  assert.equal(exported.observations[0].source, 'field "book"');
});

test("invalid calendar dates are rejected", () => {
  const cwd = workspace();
  const result = run(cwd, [
    "add",
    "--asset",
    "DATE TEST",
    "--text",
    "Impossible date",
    "--valid-at",
    "2026-02-30",
  ]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid --valid-at/);
});

test("stored asset references with quotes round-trip exactly", () => {
  const cwd = workspace();
  const asset = 'O\'BRIEN "A"';
  assert.equal(run(cwd, ["add", "--asset", asset, "--text", "Quoted asset"]).status, 0);
  const exported = json(run(cwd, ["export", "--asset", asset]));
  assert.equal(exported.count, 1);
  assert.equal(exported.observations[0].asset_ref, asset);
  const file = path.join(cwd, ".petry", "vault", readdirSync(path.join(cwd, ".petry", "vault"))[0]);
  assert.match(readFileSync(file, "utf8"), /&quot;A&quot;/);
});
