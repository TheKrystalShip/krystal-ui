// check-contract.mjs — packages/krystal/theme-contract.json describes tokens.css exactly: the
// required, optional, structural and invariant lists partition the base token set, every built-in
// palette defines each required token, and no built-in palette re-values a token outside the
// required, optional and structural lists.
//
//   npm run check:contract
import { readFileSync } from "node:fs";
import { collectScopes } from "../packages/krystal/tools/theme-css.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const contract = JSON.parse(read("../packages/krystal/theme-contract.json"));
const { base, palettes } = collectScopes(read("../packages/krystal/styles/tokens.css"));

const problems = [];
const lists = ["required", "optional", "structural", "invariant"];
const owner = new Map();
for (const list of lists) {
  for (const t of contract[list]) {
    if (owner.has(t)) problems.push(`${t} is in both ${owner.get(t)} and ${list}`);
    owner.set(t, list);
    if (!base.has(t)) problems.push(`${list}: ${t} is not defined by the base of tokens.css`);
  }
}
for (const t of base.keys()) if (!owner.has(t)) problems.push(`${t} is in tokens.css but in no contract list`);

for (const [id, tokens] of palettes) {
  for (const t of contract.required) if (!tokens.has(t)) problems.push(`${id} does not define required ${t}`);
  for (const t of tokens.keys()) {
    if (owner.get(t) === "invariant" || !owner.has(t)) problems.push(`${id} re-values ${t}, which a palette may not`);
  }
}

if (problems.length) {
  for (const p of problems) console.error("✗ " + p);
  console.error(`\n${problems.length} contract violation${problems.length === 1 ? "" : "s"}`);
  process.exit(1);
}
console.log(`✓ the theme contract matches tokens.css and ${palettes.size} built-in palettes`);
