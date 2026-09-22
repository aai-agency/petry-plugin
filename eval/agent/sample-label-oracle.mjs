import assert from "node:assert/strict";

// Static fallback check only. Browser/CSS visibility needs separate acceptance.
export function assertSampleDisclosure(html) {
  const source = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  assert.ok(body, "missing HTML body");
  const tablePosition = body.search(/<table\b/i);
  assert.ok(tablePosition >= 0, "expected requested table");
  const beforeReadings = body.slice(0, tablePosition)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/\s+/g, " ");
  assert.match(beforeReadings, /\bSample data\b/i,
    "saved artifact must disclose sample data in body content before readings");
}
