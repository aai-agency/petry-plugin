import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderPreview } from "../scripts/render-preview.mjs";

const template = readFileSync("skills/get-well-production/assets/preview.html", "utf8");

test("renderer safely embeds markup-like user data and removes the placeholder", () => {
  const payload = {
    well: { name: '</script><script>globalThis.pwned=true</script>' },
    note: "line\u2028separator",
    series: { months: ["2026-01"], oil: [100] },
  };
  const html = renderPreview(template, payload);

  assert.equal(html.includes("{{CHART_DATA_JSON}}"), false);
  assert.equal(html.includes(payload.well.name), false);
  assert.match(html, /\\u003c\/script>/);

  const match = /<script type="application\/json" id="petry-data">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(match);
  assert.deepEqual(JSON.parse(match[1]), payload);
});

test("renderer rejects malformed templates", () => {
  assert.throws(() => renderPreview("no placeholder", {}), /exactly one/);
  assert.throws(
    () => renderPreview("{{CHART_DATA_JSON}}{{CHART_DATA_JSON}}", {}),
    /exactly one/
  );
});
