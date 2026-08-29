#!/usr/bin/env node
// Compatibility launcher. The portable implementation lives with the
// get-well-production skill so Cowork can execute it from the skill mount.

import path from "node:path";
import { pathToFileURL } from "node:url";
import { main } from "../skills/get-well-production/scripts/render-preview.mjs";

export {
  main,
  renderPreview,
} from "../skills/get-well-production/scripts/render-preview.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
