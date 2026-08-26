#!/usr/bin/env node
// petry — local Markdown knowledge vault for oil & gas field insights.
//
// Zero dependencies. Node 18+. Cross-platform. Every observation is stored in a
// schema that maps 1:1 to a Petry context-graph observation, so the vault can be
// replayed into the paid MCP later (see ../UPGRADE.md).
//
// Commands:
//   add       --asset <ref> --text <text> [--type <type>] [--valid-at YYYY-MM-DD] [--source <id>]
//   list      [--asset <ref>] [--json]
//   export    [--asset <ref>]              # all observations as JSON (for the upgrade flow; see UPGRADE.md)
//   finalize  [--session <id>]             # dedupe + summary (Phase 2 session hook calls this). Never fails.
//   where                                  # print the resolved store directory
//
// Vault location: $PETRY_VAULT_DIR (or legacy $PETRY_INSIGHTS_DIR), else <cwd>/.petry/vault

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const OBSERVATION_TYPES = [
  "note",
  "decision",
  "event",
  "measurement",
  "correction",
  "instruction",
  "preference",
];

const storeDir = () => {
  const env = process.env.PETRY_VAULT_DIR || process.env.PETRY_INSIGHTS_DIR;
  return env ? path.resolve(env) : path.resolve(process.cwd(), ".petry", "vault");
};

const legacyStoreDir = () =>
  process.env.PETRY_VAULT_DIR || process.env.PETRY_INSIGHTS_DIR
    ? null
    : path.resolve(process.cwd(), ".petry", "insights");

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";

const todayIso = () => new Date().toISOString().slice(0, 10);

// Collapse whitespace + lowercase so trivially-different phrasings dedupe.
const normalize = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();

const obsHash = (type, text, validAt) =>
  crypto
    .createHash("sha1")
    .update(`${type}|${normalize(text)}|${validAt || ""}`)
    .digest("hex")
    .slice(0, 12);

const assetRefHash = (ref) =>
  crypto.createHash("sha256").update(String(ref)).digest("hex").slice(0, 10);

const isIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

// Keep user text on one visible line and out of the HTML comment machinery.
const cleanText = (s) => s.replace(/\s+/g, " ").replace(/<!--|-->/g, "—").trim();

const attr = (v) =>
  String(v ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const decodeAttr = (v) =>
  String(v ?? "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const parseArgs = (argv) => {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
};

const ensureStore = () => {
  const dir = storeDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const readFileSafe = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");

// One list-item line for an observation.
const renderObsLine = (o) => {
  const date = o.valid_at || o.captured_at?.slice(0, 10) || todayIso();
  const meta =
    `<!-- petry:obs type="${attr(o.type)}" valid_at="${attr(o.valid_at || "")}" ` +
    `captured_at="${attr(o.captured_at)}" source="${attr(o.source || "")}" hash="${o.hash}" -->`;
  return `- **[${o.type}]** ${date} — ${cleanText(o.text)} ${meta}`;
};

// Parse every observation out of one asset file.
const parseObsFromFile = (content, ref, slug) => {
  const obs = [];
  const lineRe =
    /^- \*\*\[(.+?)\]\*\* .*? — (.*?) <!-- petry:obs (.*?) -->\s*$/gm;
  let m;
  while ((m = lineRe.exec(content)) !== null) {
    const [, type, text, metaStr] = m;
    const meta = {};
    for (const am of metaStr.matchAll(/(\w+)="([^"]*)"/g)) meta[am[1]] = decodeAttr(am[2]);
    obs.push({
      asset_ref: ref,
      asset_slug: slug,
      type,
      text: text.trim(),
      valid_at: meta.valid_at || null,
      captured_at: meta.captured_at || null,
      source: meta.source || null,
      hash: meta.hash || obsHash(type, text, meta.valid_at),
    });
  }
  return obs;
};

const readAssetHeader = (content, ref) => {
  const m = content.match(/<!-- petry:asset ref="([^"]*)" slug="([^"]*)" -->/);
  if (m) return { ref: decodeAttr(m[1]), slug: decodeAttr(m[2]) };
  return { ref, slug: slugify(ref) };
};

const listAssetFiles = () => {
  const dirs = [storeDir(), legacyStoreDir()].filter(Boolean);
  const files = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    files.push(
      ...fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.join(dir, f))
    );
  }
  return [...new Set(files)];
};

const findAssetFile = (ref) => {
  for (const fp of listAssetFiles()) {
    const content = readFileSafe(fp);
    if (!content) continue;
    if (readAssetHeader(content, path.basename(fp, ".md")).ref === ref) return fp;
  }
  return null;
};

const assetFilePath = (ref) =>
  findAssetFile(ref) ||
  path.join(ensureStore(), `${slugify(ref)}--${assetRefHash(ref)}.md`);

const allObservations = (filterRef) => {
  const result = [];
  const seen = new Set();
  for (const fp of listAssetFiles()) {
    const content = readFileSafe(fp);
    if (!content) continue;
    const header = readAssetHeader(content, path.basename(fp, ".md"));
    if (filterRef && header.ref !== filterRef) continue;
    for (const observation of parseObsFromFile(content, header.ref, header.slug)) {
      const key = `${observation.asset_ref}\0${observation.hash}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(observation);
    }
  }
  return result;
};

// ---- commands ----

const cmdAdd = (args) => {
  const ref = args.asset || args.well;
  const text = args.text;
  if (!ref || !text) {
    console.error(
      'petry add: need --asset "<well>" and --text "<insight>"'
    );
    process.exit(2);
  }
  let type = (args.type || "note").toLowerCase();
  if (!OBSERVATION_TYPES.includes(type)) {
    console.error(
      `petry add: unknown --type "${type}". Use one of: ${OBSERVATION_TYPES.join(", ")}`
    );
    process.exit(2);
  }
  const validAt = args["valid-at"] && args["valid-at"] !== true ? args["valid-at"] : "";
  const source = args.source && args.source !== true ? args.source : "";
  if (validAt && !isIsoDate(validAt)) {
    console.error(`petry add: invalid --valid-at "${validAt}". Use a real YYYY-MM-DD date.`);
    process.exit(2);
  }
  const hash = obsHash(type, text, validAt);

  const fp = assetFilePath(ref);
  const slug = slugify(ref);
  let content = readFileSafe(fp);

  if (!content) {
    content = `# ${ref}\n\n<!-- petry:asset ref="${attr(ref)}" slug="${slug}" -->\n\n## Observations\n\n`;
  }
  // Idempotent: same (type + normalized text + valid_at) is a no-op.
  if (allObservations(ref).some((observation) => observation.hash === hash)) {
    console.log(
      JSON.stringify({ status: "duplicate", asset: ref, slug, type, hash, file: fp })
    );
    return;
  }

  const line = renderObsLine({
    type,
    text,
    valid_at: validAt || null,
    captured_at: new Date().toISOString(),
    source,
    hash,
  });

  const trimmed = content.replace(/\s+$/, "");
  content = `${trimmed}\n${line}\n`;
  fs.writeFileSync(fp, content);
  console.log(
    JSON.stringify({ status: "added", asset: ref, slug, type, hash, file: fp })
  );
};

const cmdList = (args) => {
  const obs = allObservations(args.asset || args.well);
  if (args.json) {
    console.log(JSON.stringify(obs, null, 2));
    return;
  }
  if (obs.length === 0) {
    console.log(`No insights captured yet. Store: ${storeDir()}`);
    return;
  }
  const byAsset = {};
  for (const o of obs) (byAsset[o.asset_ref] ||= []).push(o);
  for (const [ref, list] of Object.entries(byAsset)) {
    console.log(`\n${ref}  (${list.length})`);
    for (const o of list) {
      console.log(`  [${o.type}] ${o.valid_at || o.captured_at?.slice(0, 10) || ""} — ${o.text}`);
    }
  }
};

const cmdExport = (args) => {
  const obs = allObservations(args.asset || args.well);
  console.log(JSON.stringify({ count: obs.length, observations: obs }, null, 2));
};

// Dedupe every file in place (keep first occurrence of each hash), print a summary.
// A session hook must never break the session, so this always exits 0.
const cmdFinalize = (args) => {
  try {
    const files = listAssetFiles();
    let assets = 0;
    let total = 0;
    let removed = 0;
    for (const fp of files) {
      const content = readFileSafe(fp);
      if (!content) continue;
      const seen = new Set();
      let fileRemoved = 0;
      const lines = content.split("\n");
      const kept = lines.filter((ln) => {
        const hm = ln.match(/<!-- petry:obs .*?hash="([^"]*)".*?-->/);
        if (!hm) return true;
        if (seen.has(hm[1])) {
          fileRemoved++;
          return false;
        }
        seen.add(hm[1]);
        return true;
      });
      if (fileRemoved > 0) fs.writeFileSync(fp, kept.join("\n"));
      assets++;
      total += seen.size;
      removed += fileRemoved;
    }
    const session = args.session && args.session !== true ? ` (session ${args.session})` : "";
    if (total > 0) {
      console.error(
        `[petry] ${total} insight(s) across ${assets} asset(s) saved to ${storeDir()}${session}` +
          (removed ? ` — deduped ${removed}` : "")
      );
    }
  } catch (err) {
    console.error(`[petry] finalize skipped: ${String(err.message || err).split("\n")[0]}`);
  }
  process.exit(0);
};

const cmdWhere = () => {
  console.log(storeDir());
};

const main = () => {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  switch (cmd) {
    case "add":
      return cmdAdd(args);
    case "list":
      return cmdList(args);
    case "export":
      return cmdExport(args);
    case "finalize":
      return cmdFinalize(args);
    case "where":
      return cmdWhere();
    default:
      console.error(
        "petry: usage — capture.mjs <add|list|export|finalize|where> [options]"
      );
      process.exit(2);
  }
};

main();
