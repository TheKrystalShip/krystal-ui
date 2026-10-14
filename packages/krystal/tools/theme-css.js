// theme-css.js — reads the palettes out of a stylesheet and measures their ink/fill contrast.
//
// A palette is a [data-theme="…"] scope; the bare :root scopes and [data-theme="dark"] are the base
// every palette inherits from, so a palette that does not re-value a token carries the base value.
// The fills are the semantic families (--success, --danger, --warning, --update, --info), the brand
// accent (--krystal-teal, for --on-accent) and the sign-in providers (--brand-<x>, for --on-brand-<x>).
// A value that cannot be resolved to one opaque colour (a missing token, an alpha, an unknown
// function) is Unresolved; nothing is guessed.
//
// Shared by the repository's own checks (scripts/) and the `krystal-check-theme` bin a site runs.

export const MIN_CONTRAST = 4.5;

export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

const SCOPE = /^(?::root|html)?\[data-theme="([^"]+)"\]$/;

/**
 * Reads every rule of a sheet into the base, the palettes and the declared colour schemes.
 * @param {string} css
 * @returns {{ base: Map<string, string>, palettes: Map<string, Map<string, string>>, schemes: Map<string, string>, rootScheme: string | undefined }}
 */
export function collectScopes(css) {
  const base = new Map();
  const palettes = new Map();
  const schemes = new Map();
  let rootScheme;
  for (const rule of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = [...rule[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)];
    const scheme = /(?:^|[;\s])color-scheme\s*:\s*(light|dark)\b/.exec(rule[2])?.[1];
    if (!decls.length && !scheme) continue;
    for (const selector of rule[1].split(",").map((s) => s.trim())) {
      const theme = SCOPE.exec(selector)?.[1];
      if (selector === ":root") {
        if (scheme) rootScheme = scheme;
        for (const [, name, value] of decls) base.set(name, value.trim());
      } else if (theme) {
        if (scheme) schemes.set(theme, scheme);
        const target = theme === "dark" ? base : (palettes.get(theme) ?? palettes.set(theme, new Map()).get(theme));
        for (const [, name, value] of decls) target.set(name, value.trim());
      }
    }
  }
  return { base, palettes, schemes, rootScheme };
}

// ---- Colour resolution --------------------------------------------------------------------------

export class Unresolved extends Error {}

export function resolve(env, name, seen = []) {
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

export const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ---- The pairs ----------------------------------------------------------------------------------

export const fillOf = (ink) => {
  const family = ink.slice("--on-".length);
  return family === "accent" ? "--krystal-teal" : "--" + family;
};

/**
 * Measures each --on-* ink on its fill in the named palettes.
 * @param {Map<string, string>} base
 * @param {Map<string, Map<string, string>>} palettes
 * @param {string[]} names Palette ids to measure; "dark" is the base alone.
 * @returns {{ pairs: number, failures: string[] }}
 */
export function contrastFailures(base, palettes, names) {
  const inks = [...new Set([...base.keys(), ...[...palettes.values()].flatMap((p) => [...p.keys()])])]
    .filter((k) => k.startsWith("--on-"))
    .sort();
  const failures = [];
  let pairs = 0;
  for (const name of names) {
    const env = new Map([...base, ...(palettes.get(name) ?? [])]);
    for (const ink of inks) {
      const fill = fillOf(ink);
      pairs++;
      try {
        const r = ratio(resolve(env, ink), resolve(env, fill));
        if (r < MIN_CONTRAST) failures.push(`${name}: ${ink} on ${fill} is ${r.toFixed(2)}:1 (needs ${MIN_CONTRAST}:1)`);
      } catch (e) {
        if (!(e instanceof Unresolved)) throw e;
        failures.push(`${name}: ${ink} on ${fill} is unresolved (${e.message})`);
      }
    }
  }
  return { pairs, failures };
}
