// docs-tokens.mjs — reads packages/krystal/styles/tokens.css and theme-contract.json and writes
// playground/generated/tokens.json, the data behind the playground's token reference: every base
// token with its group, its value in the base palette, and whether a theme may re-value it.
//
//   npm run docs:data
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { collectScopes } from "../packages/krystal/tools/theme-css.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const OUT = fileURLToPath(new URL("../playground/generated/tokens.json", import.meta.url));
const contract = JSON.parse(read("../packages/krystal/theme-contract.json"));
const { base, palettes } = collectScopes(read("../packages/krystal/styles/tokens.css"));

// The first matching rule names a token's group; the order is the order the page reads in.
const GROUPS = [
  ["colour", "Surfaces", /^--(canvas|surface-\d)$/],
  ["colour", "Text", /^--(fg-[\w]+)$/],
  ["colour", "Borders", /^--border-/],
  ["colour", "Accent", /^--(krystal-|btn-|on-accent$)/],
  ["colour", "Success", /^--(success|on-success)/],
  ["colour", "Danger", /^--(danger|on-danger)/],
  ["colour", "Warning", /^--(warning|on-warning)/],
  ["colour", "Update", /^--(update|on-update)/],
  ["colour", "Info", /^--(info|on-info)/],
  ["colour", "Veils and scrims", /^--(veil-|scrim-)/],
  ["colour", "Sign-in providers", /^--(on-)?brand-/],
  ["colour", "Over artwork", /^--art-/],
  ["colour", "Scrollbar", /^--scrollbar-/],
  ["type", "Families", /^--font-/],
  ["type", "Sizes", /^--text-/],
  ["type", "Weights", /^--w-/],
  ["type", "Line heights", /^--lh-/],
  ["spacing", "Spacing", /^--s-\d+$/],
  ["radius", "Radius", /^--r-/],
  ["edge", "Edges", /^--edge/],
  ["shadow", "Shadows and rings", /^--(shadow-|glow-|ring-)/],
  ["motion", "Durations and easing", /^--(d-|ease-)/],
  ["layout", "Layout", /^--(sidebar-w|topbar-h|content-max|gutter)$/],
];

const listOf = (token) => ["required", "optional", "structural", "invariant"].find((l) => contract[l].includes(token));
const tokens = [];
for (const [name, value] of base) {
  const group = GROUPS.find(([, , re]) => re.test(name));
  if (!group) throw new Error(`${name} belongs to no group in docs-tokens.mjs`);
  const list = listOf(name);
  tokens.push({
    name,
    value,
    category: group[0],
    group: group[1],
    themeable: list !== "invariant",
    contract: list,
    revaluedBy: [...palettes].filter(([, t]) => t.has(name)).length,
  });
}

const order = GROUPS.map(([, g]) => g);
tokens.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ palettes: palettes.size, tokens }, null, 1) + "\n");
console.log(`✓ ${tokens.length} tokens in ${new Set(tokens.map((t) => t.group)).size} groups → playground/generated/tokens.json`);
