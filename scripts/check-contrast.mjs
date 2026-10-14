// check-contrast.mjs — in every palette of tokens.css, each --on-<x> ink reads on its --<x> fill at
// WCAG AA for normal text (4.5:1).
//
// A palette is a [data-theme="…"] scope; the bare :root scopes are the base every palette inherits
// from, so a palette that does not re-value a token carries the base value. The fills are the
// semantic families (--success, --danger, --warning, --update, --info), the brand accent
// (--krystal-teal, for --on-accent) and the sign-in providers (--brand-<x>, for --on-brand-<x>).
// A value that cannot be resolved to one opaque colour (a missing token, an alpha, an unknown
// function) is reported as unresolved and fails the check; nothing is guessed.
//
//   npm run check:contrast
import { readFileSync } from "node:fs";

const MIN = 4.5;
const css = readFileSync(new URL("../packages/krystal/styles/tokens.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

// ---- Palettes -----------------------------------------------------------------------------------

const base = new Map();
const palettes = new Map();
for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const decls = [...rule[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)];
  if (!decls.length) continue;
  for (const selector of rule[1].split(",").map((s) => s.trim())) {
    const theme = /^(?::root)?\[data-theme="([^"]+)"\]$/.exec(selector)?.[1];
    const target = selector === ":root" ? base : theme && theme !== "dark" ? (palettes.get(theme) ?? palettes.set(theme, new Map()).get(theme)) : theme === "dark" ? base : null;
    if (!target) continue;
    for (const [, name, value] of decls) target.set(name, value.trim());
  }
}

// ---- Colour resolution --------------------------------------------------------------------------

class Unresolved extends Error {}

function resolve(env, name, seen = []) {
  if (seen.includes(name)) throw new Unresolved(`${name} refers to itself`);
  if (!env.has(name)) throw new Unresolved(`${name} is not defined`);
  return parse(env, env.get(name), [...seen, name]);
}

function splitArgs(text) {
  const parts = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      parts.push(text.slice(from, i).trim());
      from = i + 1;
    }
  }
  parts.push(text.slice(from).trim());
  return parts;
}

const channel = (token) => (token.endsWith("%") ? (parseFloat(token) / 100) * 255 : parseFloat(token));
const alphaOf = (token) => (token === undefined ? 1 : token.endsWith("%") ? parseFloat(token) / 100 : parseFloat(token));

function hslToRgb(h, s, l) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

// Returns [r, g, b] (0-255) of an opaque colour, or throws Unresolved.
function parse(env, value, seen) {
  const v = value.trim();
  let m;
  if ((m = /^var\(\s*(--[\w-]+)\s*(?:,(.*))?\)$/.exec(v))) {
    try {
      return resolve(env, m[1], seen);
    } catch (e) {
      if (e instanceof Unresolved && m[2]) return parse(env, m[2], seen);
      throw e;
    }
  }
  if ((m = /^#([0-9a-f]{3,8})$/i.exec(v))) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
    if (hex.length === 8 && parseInt(hex.slice(6), 16) !== 255) throw new Unresolved(`${v} has an alpha`);
    if (hex.length !== 6 && hex.length !== 8) throw new Unresolved(`${v} is not a colour`);
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  if ((m = /^rgba?\((.*)\)$/i.exec(v))) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length === 4 && alphaOf(parts[3]) !== 1) throw new Unresolved(`${v} has an alpha`);
    return parts.slice(0, 3).map(channel);
  }
  if ((m = /^hsla?\((.*)\)$/i.exec(v))) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length === 4 && alphaOf(parts[3]) !== 1) throw new Unresolved(`${v} has an alpha`);
    return hslToRgb(parseFloat(parts[0]), parseFloat(parts[1]) / 100, parseFloat(parts[2]) / 100);
  }
  if ((m = /^color-mix\(\s*in\s+srgb\s*,(.*)\)$/i.exec(v))) {
    const operands = splitArgs(m[1]).map((o) => {
      const pct = /\s(\d+(?:\.\d+)?)%$/.exec(o) ?? /^(\d+(?:\.\d+)?)%\s/.exec(o);
      const colour = pct ? o.replace(/\s?\d+(?:\.\d+)?%\s?/, " ").trim() : o;
      return { colour: parse(env, colour, seen), weight: pct ? parseFloat(pct[1]) : undefined };
    });
    if (operands.length !== 2) throw new Unresolved(`${v} does not mix two colours`);
    let [a, b] = operands;
    if (a.weight === undefined && b.weight === undefined) a.weight = b.weight = 50;
    else if (a.weight === undefined) a.weight = 100 - b.weight;
    else if (b.weight === undefined) b.weight = 100 - a.weight;
    if (a.weight + b.weight !== 100) throw new Unresolved(`${v} has weights that do not sum to 100%`);
    return a.colour.map((c, i) => (c * a.weight + b.colour[i] * b.weight) / 100);
  }
  if (/^black$/i.test(v)) return [0, 0, 0];
  if (/^white$/i.test(v)) return [255, 255, 255];
  throw new Unresolved(`${v} is not a colour this check reads`);
}

const luminance = ([r, g, b]) => {
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ---- The pairs ----------------------------------------------------------------------------------

const fillOf = (ink) => {
  const family = ink.slice("--on-".length);
  return family === "accent" ? "--krystal-teal" : "--" + family;
};

const inks = [...new Set([...base.keys(), ...[...palettes.values()].flatMap((p) => [...p.keys()])])]
  .filter((k) => k.startsWith("--on-"))
  .sort();

const names = ["dark", ...[...palettes.keys()]];
let failures = 0;
let pairs = 0;
for (const name of names) {
  const env = new Map([...base, ...(palettes.get(name) ?? [])]);
  for (const ink of inks) {
    const fill = fillOf(ink);
    pairs++;
    try {
      const r = ratio(resolve(env, ink), resolve(env, fill));
      if (r < MIN) {
        failures++;
        console.error(`✗ ${name}: ${ink} on ${fill} is ${r.toFixed(2)}:1 (needs ${MIN}:1)`);
      }
    } catch (e) {
      if (!(e instanceof Unresolved)) throw e;
      failures++;
      console.error(`✗ ${name}: ${ink} on ${fill} is unresolved (${e.message})`);
    }
  }
}

if (failures) {
  console.error(`\n${failures} of ${pairs} ink/fill pairs fail across ${names.length} palettes`);
  process.exit(1);
}
console.log(`✓ ${pairs} ink/fill pairs across ${names.length} palettes read at ${MIN}:1 or better`);
