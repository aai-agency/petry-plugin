import assert from "node:assert/strict";
import test from "node:test";
import { assertSampleDisclosure } from "../eval/agent/sample-label-oracle.mjs";

const table = "<table><tr><td>245.3 psig</td></tr></table>";

test("sample disclosure accepts labeled body content and inline formatting", () => {
  assertSampleDisclosure(`<body><p>Sample data</p>${table}</body>`);
  assertSampleDisclosure(`<body><p><strong>Sample</strong>&nbsp;data</p>${table}</body>`);
});

test("sample disclosure rejects absent labels, misleading names and late labels", () => {
  for (const html of [
    `<body>${table}</body>`,
    `<body><h1>Meter M-SAMPLE</h1>${table}</body>`,
    `<body>${table}<p>Sample data</p></body>`,
    "<body><h1>Sample data</h1></body>",
  ]) assert.throws(() => assertSampleDisclosure(html));
});

test("sample disclosure cannot pass using metadata or executable text", () => {
  for (const label of [
    "<!-- Sample data -->",
    "<script>const label = 'Sample data';</script>",
    "<style>.label::before { content: 'Sample data'; }</style>",
    '<p title="Sample data">Readings</p>',
  ]) assert.throws(() => assertSampleDisclosure(`<head><title>Sample data</title></head><body>${label}${table}</body>`));
});
