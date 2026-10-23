// identity.js — a site's mark in each of its palettes: the colours, the drawing, and the script that
// keeps a page's icon, browser colour and splash in the theme it shows.
//
// A site's identity is its name and its mark: a Lucide glyph, as the paths of its 24-unit viewBox.
// Every place the mark is drawn draws the same tile: the glyph stroked in the palette's accent
// (--krystal-teal) on the accent's tint (--krystal-teal-dim) laid over the canvas, the glyph taking
// GLYPH of the tile. The colours are read from the palettes' stylesheets, so a palette re-valued there
// re-colours the mark with nothing copied.
//
// Node-only, depending on nothing but its sibling: the Vite plugin (`../vite.js`) and the icon writer
// (`../bin/krystal-icons.mjs`) are its callers.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Unresolved, collectScopes, resolve } from "./theme-css.js";

/** The glyph's share of the tile's edge. */
export const GLYPH = 26 / 56;
/** The glyph's stroke, in its 24-unit viewBox. */
export const STROKE = 1.7;

/**
 * @typedef {string | { d: string, fill?: boolean }} MarkPath A path of the glyph; a string is stroked,
 *   and `fill` also fills it (the dot of a key, the pupil of an eye).
 * @typedef {{ canvas: string, ground: string, ink: string }} Colours As `#rrggbb`.
 */

const hex = (rgb) => "#" + rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("").toUpperCase();

// A token that may be translucent, as [r, g, b, a]: an rgba() or an eight-digit hex is read here, and
// anything opaque goes to the shared resolver.
function resolveWithAlpha(env, name) {
  const raw = env.get(name)?.trim();
  let m;
  if (raw && (m = /^rgba\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*[,/]\s*([\d.]+%?)\s*\)$/i.exec(raw))) {
    const alpha = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), alpha];
  }
  if (raw && (m = /^#([0-9a-f]{8})$/i.exec(raw))) {
    return [0, 2, 4, 6].map((i, n) => parseInt(m[1].slice(i, i + 2), 16) / (n === 3 ? 255 : 1));
  }
  return [...resolve(env, name), 1];
}

const over = ([r, g, b, a], under) => [r, g, b].map((c, i) => c * a + under[i] * (1 - a));

/**
 * Each palette's colours for the mark, from the package's tokens and a site's own palette sheets.
 * A palette whose colours do not resolve to opaque values is left out, and named in `skipped`.
 * @param {string[]} sheets Paths of the site's stylesheets holding `[data-theme]` palettes.
 * @returns {{ colours: Record<string, Colours>, skipped: string[] }}
 */
export function paletteColours(sheets = []) {
  const read = (file) => collectScopes(readFileSync(file, "utf8"));
  const scopes = [read(join(dirname(fileURLToPath(import.meta.url)), "..", "styles", "tokens.css")), ...sheets.map(read)];
  const base = new Map();
  const palettes = new Map();
  for (const s of scopes) {
    for (const [k, v] of s.base) base.set(k, v);
    for (const [id, tokens] of s.palettes) palettes.set(id, new Map([...(palettes.get(id) ?? []), ...tokens]));
  }
  const colours = {};
  const skipped = [];
  for (const id of ["dark", ...palettes.keys()]) {
    const env = new Map([...base, ...(palettes.get(id) ?? [])]);
    try {
      const canvas = resolve(env, "--canvas");
      const ink = resolve(env, "--krystal-teal");
      const ground = over(resolveWithAlpha(env, "--krystal-teal-dim"), canvas);
      colours[id] = { canvas: hex(canvas), ground: hex(ground), ink: hex(ink) };
    } catch (e) {
      if (!(e instanceof Unresolved)) throw e;
      skipped.push(`${id}: ${e.message}`);
    }
  }
  return { colours, skipped };
}

/**
 * The iOS launch images a site carries: each device's portrait size in points and its pixel ratio.
 * The icon writer draws one per entry and the plugin links each under its media query.
 */
export const LAUNCH_SIZES = [
  [320, 568, 2], [375, 667, 2], [414, 896, 2], [375, 812, 3], [414, 896, 3], [390, 844, 3],
  [428, 926, 3], [393, 852, 3], [430, 932, 3], [402, 874, 3], [420, 912, 3], [440, 956, 3],
  [744, 1133, 2], [768, 1024, 2], [810, 1080, 2], [820, 1180, 2], [834, 1194, 2], [834, 1210, 2],
  [1024, 1366, 2], [1032, 1376, 2],
];

/** The launch image of one entry of `LAUNCH_SIZES`, by its file name under `splash/`. */
export const launchImage = ([w, h, dpr]) => `splash-${w * dpr}x${h * dpr}.png`;

/**
 * The palette a site's fixed artwork is drawn in: the default, or the dark half of "auto".
 * @param {{ default: string, auto: { dark: string } }} config
 */
export const fixedPalette = (config) => (config.default === "auto" ? config.auto.dark : config.default);

/**
 * The head links of a site's fixed artwork, under its `base`: the favicon (the vector, and a PNG for a
 * browser that takes none), the home-screen icons and the launch images. The boot script's icon, in
 * the palette shown, comes after them and wins wherever a browser follows a change.
 * @param {string} base
 */
export function artworkLinks(base) {
  const icon = (name) => base + "icons/" + name;
  return [
    { rel: "icon", type: "image/svg+xml", href: icon("icon.svg") },
    { rel: "icon", type: "image/png", sizes: "32x32", href: icon("icon-32.png") },
    ...[180, 167, 152].map((px) => ({ rel: "apple-touch-icon", sizes: `${px}x${px}`, href: icon(`apple-touch-icon-${px}.png`) })),
    ...LAUNCH_SIZES.map((size) => ({
      rel: "apple-touch-startup-image",
      href: base + "splash/" + launchImage(size),
      media: `(device-width: ${size[0]}px) and (device-height: ${size[1]}px) and (-webkit-device-pixel-ratio: ${size[2]}) and (orientation: portrait)`,
    })),
  ];
}

/**
 * A path's data as Android's vector drawables read it: every number written out whole, spaced from
 * its neighbours, as SVG's shorthand (`.5`, `1.5.5`, `2-3`) is not read the same everywhere.
 * @param {string} d
 */
export function androidPathData(d) {
  return (d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [])
    .map((t) => t.replace(/^(-?)\./, "$10."))
    .join(" ");
}

const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * The glyph's paths as SVG elements, inheriting their stroke from the group they sit in.
 * @param {MarkPath[]} mark
 * @param {string} [fill] The colour of a filled path; absent, it takes the class `k-splash__fill`.
 */
export function glyphPaths(mark, fill) {
  return mark.map((p) => {
    const d = typeof p === "string" ? p : p.d;
    const filled = typeof p === "object" && p.fill;
    if (!filled) return `<path d="${attr(d)}"/>`;
    return fill ? `<path d="${attr(d)}" fill="${fill}"/>` : `<path class="k-splash__fill" d="${attr(d)}"/>`;
  }).join("");
}

/**
 * The tile at `px` square, as a standalone SVG document.
 * @param {MarkPath[]} mark
 * @param {Colours} colours
 * @param {number} [px]
 */
export function markSvg(mark, { ground, ink }, px = 512) {
  const s = (px * GLYPH) / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">`
    + `<rect width="${px}" height="${px}" fill="${ground}"/>`
    + `<g transform="translate(${px / 2},${px / 2}) scale(${s}) translate(-12,-12)" fill="none" stroke="${ink}"`
    + ` stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${glyphPaths(mark, ink)}</g></svg>`;
}

/**
 * The splash's markup, the first thing in the body: the tile, coloured by `splash.css` from the
 * properties the boot script sets.
 * @param {MarkPath[]} mark
 */
export function splashMarkup(mark) {
  const s = (512 * GLYPH) / 24;
  return `<div id="k-splash" aria-hidden="true"><svg viewBox="0 0 512 512">`
    + `<rect class="k-splash__ground" width="512" height="512"/>`
    + `<g class="k-splash__glyph" transform="translate(256,256) scale(${s}) translate(-12,-12)">${glyphPaths(mark)}</g>`
    + `</svg></div>`;
}

/**
 * The script a page runs first in its head. It puts the stored theme, or the site's default, on
 * <html data-theme>, and from then on keeps three things in whatever palette that attribute names:
 * the tab's icon, the browser's colour (`theme-color`) and the splash's colours. It watches the
 * attribute rather than the theme store, so it needs nothing loaded but itself. A file, not inline
 * script, so a page under a policy with no inline script runs it; it writes no style attribute, only
 * custom properties through the CSSOM, which such a policy allows.
 * @param {object} config
 * @param {string[]} config.ids Every palette id a preference may name.
 * @param {string} config.default The preference with none stored.
 * @param {{ light: string, dark: string }} config.auto The palettes "auto" resolves to.
 * @param {string} config.key The storage key of the preference.
 * @param {MarkPath[]} config.mark
 * @param {Record<string, Colours>} config.colours
 */
export function identityBootScript({ ids, default: fallback, auto, key, mark, colours }) {
  const known = Object.fromEntries(Object.entries(colours).filter(([id]) => ids.includes(id)));
  const s = (64 * GLYPH) / 24;
  return `(function () {
  var IDS = ${JSON.stringify(ids)};
  var COLOURS = ${JSON.stringify(known)};
  var GLYPH = ${JSON.stringify(glyphPaths(mark, "INK"))};
  var root = document.documentElement;
  var pref = ${JSON.stringify(fallback)};
  try {
    var stored = localStorage.getItem(${JSON.stringify(key)});
    if (stored === "auto" || IDS.indexOf(stored) >= 0) pref = stored;
  } catch (e) {}
  if (pref === "auto") {
    var light = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches;
    pref = light ? ${JSON.stringify(auto.light)} : ${JSON.stringify(auto.dark)};
  }
  root.setAttribute("data-theme", pref);
  root.setAttribute("data-k-splash", "");

  var shown = null;
  function paint() {
    var theme = root.getAttribute("data-theme");
    var c = COLOURS[theme] || COLOURS[${JSON.stringify(fallback in known ? fallback : auto.dark)}] || COLOURS.dark;
    if (!c || theme === shown) return;
    shown = theme;
    root.style.setProperty("--k-splash-canvas", c.canvas);
    root.style.setProperty("--k-splash-ground", c.ground);
    root.style.setProperty("--k-splash-ink", c.ink);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.setAttribute("content", c.canvas);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="' + c.ground + '"/>'
      + '<g transform="translate(32,32) scale(${s}) translate(-12,-12)" fill="none" stroke="' + c.ink + '" stroke-width="${STROKE}"'
      + ' stroke-linecap="round" stroke-linejoin="round">' + GLYPH.split("INK").join(c.ink) + '</g></svg>';
    // A new element rather than a new address on the old one: a browser re-reads the icon when the
    // link is added, and not every one does when an address changes.
    var link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
    link.setAttribute("data-k-icon", "");
    var old = document.querySelectorAll('link[data-k-icon]');
    document.head.appendChild(link);
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
  }
  paint();
  // The icon is written while the head is still being read, ahead of the page's own icon links; once
  // they are in, it moves behind them, where a browser choosing among several takes it.
  document.addEventListener("DOMContentLoaded", function () {
    var link = document.querySelector("link[data-k-icon]");
    if (link) document.head.appendChild(link);
  });
  if (window.MutationObserver) new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
})();
`;
}
