#!/usr/bin/env node
// krystal-check-theme — checks the palettes of one or more stylesheets against the theme contract
// (theme-contract.json): every [data-theme="…"] block defines the required colour tokens, re-values
// no token outside the permitted set, declares a colour scheme, and reads at 4.5:1 for each --on-*
// ink on its fill.
//
//   krystal-check-theme <file.css>...
//
// Tokens a palette does not define are inherited from the package's tokens.css, so the measurement
// resolves a palette exactly as the page does.
import { readFileSync } from "node:fs";
import { MIN_CONTRAST, collectScopes, contrastFailures } from "../tools/theme-css.js";

const files = process.argv.slice(2);
if (!files.length || files.some((f) => f === "-h" || f === "--help")) {
  console.error("usage: krystal-check-theme <file.css>...");
  process.exit(files.length ? 0 : 2);
}

const read = (url) => readFileSync(url, "utf8");
const contract = JSON.parse(read(new URL("../theme-contract.json", import.meta.url)));
const shipped = collectScopes(read(new URL("../styles/tokens.css", import.meta.url)));

const base = new Map(shipped.base);
const palettes = new Map();
const schemes = new Map();
let rootScheme;
const origin = new Map();

for (const file of files) {
  const scopes = collectScopes(read(file));
  for (const [name, value] of scopes.base) base.set(name, value);
  rootScheme = scopes.rootScheme ?? rootScheme;
  for (const [id, tokens] of scopes.palettes) {
    palettes.set(id, new Map([...(palettes.get(id) ?? []), ...tokens]));
    if (!origin.has(id)) origin.set(id, file);
  }
  for (const [id, scheme] of scopes.schemes) schemes.set(id, scheme);
}

const problems = [];
const allowed = new Set([...contract.required, ...contract.optional, ...contract.structural]);
const locked = new Set(contract.invariant);

for (const [id, tokens] of palettes) {
  const where = `${origin.get(id)}: ${id}`;
  const missing = contract.required.filter((t) => !tokens.has(t));
  if (missing.length) problems.push(`${where}: missing required token${missing.length === 1 ? "" : "s"} ${missing.join(" ")}`);
  for (const t of tokens.keys()) {
    if (!allowed.has(t) && locked.has(t)) problems.push(`${where}: ${t} is not re-valuable in a palette`);
  }
  if (!schemes.has(id) && !rootScheme) problems.push(`${where}: declares no color-scheme (light or dark)`);
}

const { pairs, failures } = contrastFailures(base, palettes, [...palettes.keys()]);
for (const f of failures) problems.push(f);

if (!palettes.size) problems.push(`no [data-theme="…"] palette found in ${files.join(", ")}`);

if (problems.length) {
  for (const p of problems) console.error("✗ " + p);
  console.error(`\n${problems.length} theme contract violation${problems.length === 1 ? "" : "s"}`);
  process.exit(1);
}
console.log(`✓ ${palettes.size} palettes meet the theme contract; ${pairs} ink/fill pairs read at ${MIN_CONTRAST}:1 or better`);
