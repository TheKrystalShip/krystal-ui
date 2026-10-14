// check-contrast.mjs — in every palette of tokens.css, each --on-<x> ink reads on its --<x> fill at
// WCAG AA for normal text (4.5:1). The palette reading and the measurement are
// packages/krystal/tools/theme-css.js, the module a site's `krystal-check-theme` runs too.
//
//   npm run check:contrast
import { readFileSync } from "node:fs";
import { MIN_CONTRAST, collectScopes, contrastFailures } from "../packages/krystal/tools/theme-css.js";

const css = readFileSync(new URL("../packages/krystal/styles/tokens.css", import.meta.url), "utf8");
const { base, palettes } = collectScopes(css);
const names = ["dark", ...palettes.keys()];
const { pairs, failures } = contrastFailures(base, palettes, names);

if (failures.length) {
  for (const f of failures) console.error("✗ " + f);
  console.error(`\n${failures.length} of ${pairs} ink/fill pairs fail across ${names.length} palettes`);
  process.exit(1);
}
console.log(`✓ ${pairs} ink/fill pairs across ${names.length} palettes read at ${MIN_CONTRAST}:1 or better`);
