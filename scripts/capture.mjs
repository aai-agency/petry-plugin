#!/usr/bin/env node
// Compatibility launcher. The portable implementation lives with the capture
// skill so Cowork can mount it beside SKILL.md on both cloud and device runtimes.

import path from "node:path";
import { pathToFileURL } from "node:url";
import { main } from "../skills/capture/scripts/capture.mjs";

export { main } from "../skills/capture/scripts/capture.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
