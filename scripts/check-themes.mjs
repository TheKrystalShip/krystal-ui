// check-themes.mjs — the palettes tokens.css draws native controls light for are exactly the light
// palettes THEME_OPTS declares.
//
//   npm run check:themes
import { readFileSync } from "node:fs";
import { THEME_OPTS } from "../src/lib/theme.js";

const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
const block = /((?::root\[data-theme="[^"]+"\],?\s*)+)\{\s*color-scheme:\s*light;/.exec(css);
const listed = block ? [...block[1].matchAll(/data-theme="([^"]+)"/g)].map((m) => m[1]).sort() : [];
const light = THEME_OPTS.filter((o) => o.mode === "light").map((o) => o.id).sort();

const missing = light.filter((id) => !listed.includes(id));
const extra = listed.filter((id) => !light.includes(id));
if (missing.length || extra.length) {
  if (missing.length) console.error("✗ light palettes drawn with dark native controls: " + missing.join(", "));
  if (extra.length) console.error("✗ listed as light but not a light palette: " + extra.join(", "));
  process.exit(1);
}
console.log(`✓ native controls follow every palette's mode (${light.length} light)`);
