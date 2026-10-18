import { createStore, useStore } from "./store.js";

// theme.js — the client-only THEME preference.
//
// One user preference, persisted in this browser's localStorage under THEME_KEY. The
// value is either "auto" — follow the OS via prefers-color-scheme, live-updating on
// change — or the id of one concrete palette from THEME_OPTS below. With no preference the
// site's default applies: "dark" unless the site names another with configureThemes, which
// also names the light and dark palettes "auto" resolves to (Krystal Blue Light and Dark
// unless named).
//
// The preference is RESOLVED to a concrete palette id and written to
// <html data-theme="…">; tokens.css keys every color token off that attribute.
// CSS never sees "auto". A site that must have the attribute before first paint resolves
// it in an inline boot script of its own, which this module agrees with at load.
//
// Switching is LIVE: swapping the attribute re-cascades instantly. Anything that cannot
// read CSS custom properties (a canvas, a code editor) subscribes to `themeStore` and
// re-themes itself.
//
// Imports only store.js, and loading it applies the stored preference to the document.

const THEME_KEY = "krystal:theme";

// The offered themes, in the order a picker lists them — the id every surface validates against
// and the label it shows, in one place, because every site has a picker and a list that lives
// beside one of them is a list the others cannot reach.
//
// `mode` is the theme's own light/dark character, declared here rather than derived: it is a fact
// about the palette (whether `--canvas` is darker than `--fg-1`), and guessing it from the name
// would be wrong the first time somebody ships a dark theme called "Latte". A picker groups on it.
// `auto` carries none, because it is not a palette — it is whichever of the two the OS is asking
// for, resolved at runtime.
//
// `cvd` marks a palette from the colour-vision pack and names, in words, who it is built for. It is
// both the flag a picker groups and badges on and the sentence it shows, because those must not be
// able to disagree: a theme that is listed as colour-vision friendly but describes itself as
// something else is worse than one that says nothing. Its presence — not the `cvd-` id prefix — is
// what every surface tests, so the grouping survives an id being renamed.
//
// `tribute` works the same way for a palette quoting a screen from somewhere else, and names what
// it is quoting. It carries the source because the label alone does not: "LCARS" and "DOS Blue"
// mean nothing to somebody who has not seen them, and the sentence is what turns the swatch grid
// into something readable. A theme carries at most one of `cvd` and `tribute` — they are the two
// reasons a palette sits outside the plain Dark and Light lists, and a theme in both sections
// would be the same swatch twice.
//
// `shape` marks a theme that also re-values STRUCTURE — corner radius, border weight, elevation,
// the UI font, how fast things move — and says in words what it does, because that is a much
// bigger change than a recolour and a swatch cannot show it. Only tributes carry it: an upstream
// editor scheme is a syntax palette and never had an opinion about a corner, whereas a tribute is
// quoting a whole interface. The set of tokens a theme is permitted to re-value is fixed and
// listed in tokens.css's structural banner; this field is only the human-readable half.
/**
 * @typedef {object} ThemeOption
 * @property {string} id
 * @property {string} label
 * @property {"dark" | "light"} [mode] Absent on `auto`.
 * @property {string} [cvd] The colour-vision pack: who it is built for.
 * @property {string} [tribute] The screen a tribute quotes.
 * @property {string} [shape] What structure a tribute re-values.
 */
/** @type {ThemeOption[]} */
const THEME_OPTS = [
  { id: "auto",             label: "Auto (system)"                            },
  { id: "dark",             label: "Krystal Blue Dark",          mode: "dark"  },
  { id: "amoled",           label: "Krystal Blue Dark (AMOLED)", mode: "dark"  },
  { id: "nord",             label: "Nord",                       mode: "dark"  },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha",           mode: "dark"  },
  { id: "dracula",          label: "Dracula",                    mode: "dark"  },
  { id: "tokyo-night",      label: "Tokyo Night",                mode: "dark"  },
  { id: "synthwave",        label: "Synthwave '84",              mode: "dark"  },
  { id: "gruvbox",          label: "Gruvbox Dark",               mode: "dark"  },
  { id: "amber-crt",        label: "Amber CRT Screen",           mode: "dark"  },
  { id: "one-dark",         label: "One Dark Pro",               mode: "dark"  },
  { id: "rose-pine",        label: "Rosé Pine",                  mode: "dark"  },
  { id: "kanagawa",         label: "Kanagawa",                   mode: "dark"  },
  { id: "everforest",       label: "Everforest",                 mode: "dark"  },
  { id: "solarized-dark",   label: "Solarized Dark",             mode: "dark"  },
  { id: "github-dark",      label: "GitHub Dark",                mode: "dark"  },
  { id: "monokai",          label: "Monokai",                    mode: "dark"  },
  { id: "ayu-mirage",       label: "Ayu Mirage",                 mode: "dark"  },
  { id: "light",            label: "Krystal Blue Light",         mode: "light" },
  { id: "github-light",     label: "GitHub Light",               mode: "light" },
  { id: "solarized-light",  label: "Solarized Light",            mode: "light" },
  { id: "catppuccin-latte", label: "Catppuccin Latte",           mode: "light" },
  { id: "nord-light",       label: "Nord Light",                 mode: "light" },
  { id: "gruvbox-light",    label: "Gruvbox Light",              mode: "light" },
  { id: "everforest-light", label: "Everforest Light",           mode: "light" },
  { id: "rose-pine-dawn",   label: "Rosé Pine Dawn",             mode: "light" },
  { id: "tokyo-night-day",  label: "Tokyo Night Day",            mode: "light" },
  { id: "one-light",        label: "One Light",                  mode: "light" },
  { id: "ayu-light",        label: "Ayu Light",                  mode: "light" },

  // The tribute pack — palettes quoting a screen somebody already knows, rather than an editor
  // colour scheme. Dark first, then the one light member, since that is also the order the
  // picker's other sections run in.
  { id: "matrix",    label: "The Matrix",     mode: "dark",  tribute: "The Matrix (1999) — falling code on vampire black",
    shape: "square corners and a monospace UI — a terminal, not a window" },
  { id: "winamp",    label: "Winamp Classic", mode: "dark",  tribute: "Winamp's base skin — grey chrome and a green LCD",
    shape: "square corners and hard pixel shadows — a skin is a bitmap" },
  { id: "lcars",     label: "LCARS",          mode: "dark",  tribute: "LCARS — the TNG-era Starfleet okudagram",
    shape: "heavy rounded elbows and no elevation — the shape IS the design" },
  { id: "cyberpunk", label: "Cyberpunk 2077", mode: "dark",  tribute: "Cyberpunk 2077 — Night City's yellow-on-black HUD",
    shape: "hard corners and a snapping, unblurred HUD" },
  { id: "dos-blue",  label: "DOS Blue",       mode: "dark",  tribute: "The DOS blue screen — Norton Commander and EDIT.COM",
    shape: "square, monospace and motionless — a text mode repaints, it does not animate" },
  { id: "pico8",     label: "PICO-8",         mode: "dark",  tribute: "PICO-8 — the fantasy console's fixed sixteen colours",
    shape: "square corners and a monospace UI — a rounded corner costs a pixel" },
  { id: "c64",       label: "Commodore 64",   mode: "dark",  tribute: "The Commodore 64 boot screen — the VIC-II's screen blue",
    shape: "square, monospace and motionless, inside a screen border" },
  { id: "win95",     label: "Windows 95",     mode: "light", tribute: "Windows 95 — silver bevels, a navy title bar, the teal desktop",
    shape: "square corners, 2px edges and instant transitions — nothing in 1995 eased" },

  // The colour-vision pack. Ordered most-broadly-useful first: red-green covers by far the most
  // people, then the two single deficiencies it compromises between, then the rarer tritan, then
  // the one palette that clears all three at the cost of hues, then monochrome.
  { id: "cvd-redgreen-dark",   label: "Red–Green Safe Dark",   mode: "dark",  cvd: "protanopia + deuteranopia — red-green, either form" },
  { id: "cvd-redgreen-light",  label: "Red–Green Safe Light",  mode: "light", cvd: "protanopia + deuteranopia — red-green, either form" },
  { id: "cvd-deuteran-dark",   label: "Deuteranopia Dark",     mode: "dark",  cvd: "deuteranopia — green-blind" },
  { id: "cvd-deuteran-light",  label: "Deuteranopia Light",    mode: "light", cvd: "deuteranopia — green-blind" },
  { id: "cvd-protan-dark",     label: "Protanopia Dark",       mode: "dark",  cvd: "protanopia — red-blind" },
  { id: "cvd-protan-light",    label: "Protanopia Light",      mode: "light", cvd: "protanopia — red-blind" },
  { id: "cvd-tritan-dark",     label: "Tritanopia Dark",       mode: "dark",  cvd: "tritanopia — blue-yellow" },
  { id: "cvd-tritan-light",    label: "Tritanopia Light",      mode: "light", cvd: "tritanopia — blue-yellow" },
  { id: "cvd-universal-dark",  label: "Universal CVD Dark",    mode: "dark",  cvd: "all three — protanopia, deuteranopia and tritanopia at once" },
  { id: "cvd-universal-light", label: "Universal CVD Light",   mode: "light", cvd: "all three — protanopia, deuteranopia and tritanopia at once" },
  { id: "cvd-mono-dark",       label: "Monochrome Dark",       mode: "dark",  cvd: "achromatopsia — no colour vision; status reads by lightness" },
  { id: "cvd-mono-light",      label: "Monochrome Light",      mode: "light", cvd: "achromatopsia — no colour vision; status reads by lightness" },
];
const VALID = THEME_OPTS.map(o => o.id);
let defaultTheme = "dark";
let autoPair = { light: "light", dark: "dark" };

// A site's own palettes join the list a picker offers and the ids the store accepts. The entries
// have the shape of THEME_OPTS entries; a palette's CSS is the site's own `[data-theme="<id>"]`
// block, which `krystal-check-theme` checks against the theme contract. An id already offered is
// ignored. A stored preference naming a newly registered palette takes effect here, because it was
// read before the palette was known. Call it once, before the first render.
/**
 * @param {ThemeOption[]} options Each with a unique `id`, a `label` and a `mode`.
 * @returns {void}
 */
function registerThemes(options) {
  for (const o of options) {
    if (!o || typeof o.id !== "string" || !o.id || typeof o.label !== "string") {
      throw new TypeError("registerThemes: each option needs a string id and label");
    }
    if (o.mode !== "light" && o.mode !== "dark") {
      throw new TypeError(`registerThemes: ${o.id} needs a mode of "light" or "dark"`);
    }
    if (VALID.includes(o.id)) continue;
    THEME_OPTS.push(o);
    VALID.push(o.id);
  }
  reapply();
}

// A site's default palette and the pair "auto" resolves to, named once, before the first render and
// after registering any palette they name. Each must be an offered id, and the pair's light and dark
// palettes must be of that mode. A preference already stored still wins over the default.
/**
 * @param {object} config
 * @param {string} [config.default] The palette (or "auto") a person with no stored preference gets.
 * @param {{ light: string, dark: string }} [config.auto] The palettes "auto" resolves to.
 * @returns {void}
 */
function configureThemes({ default: next, auto } = {}) {
  const modeOf = (id) => THEME_OPTS.find((o) => o.id === id)?.mode;
  if (next !== undefined && !VALID.includes(next)) throw new TypeError(`configureThemes: ${next} is not an offered theme`);
  if (auto !== undefined) {
    for (const mode of ["light", "dark"]) {
      if (modeOf(auto[mode]) !== mode) throw new TypeError(`configureThemes: auto.${mode} needs a ${mode} palette, not ${auto[mode]}`);
    }
    autoPair = { light: auto.light, dark: auto.dark };
  }
  if (next !== undefined) defaultTheme = next;
  reapply();
}

// The light and dark palettes "auto" resolves to, for a picker drawing what auto shows.
/** @returns {{ light: string, dark: string }} */
const autoThemes = () => ({ ...autoPair });

// The preference read again and the resolved palette painted again, after the list, the default or
// the auto pair changed.
function reapply() {
  const pref = readPref();
  const resolved = resolveTheme(pref);
  const state = themeStore.getState();
  if (pref === state.pref && resolved === state.resolved) return;
  applyResolved(resolved);
  themeStore.setState({ pref, resolved });
}

// The script a site runs as the first thing in its page's head, so the stored theme, or the site's
// default, is on <html> before the first frame. Generated from the list, the default and the auto pair
// as configured when it is called, so it agrees with this module; a site writes it into a file at
// build time (its page's policy may forbid an inline script).
/** @returns {string} */
function themeBootScript() {
  const ids = VALID.filter((id) => id !== "auto");
  return `(function () {
  var IDS = ${JSON.stringify(ids)};
  var pref = ${JSON.stringify(defaultTheme)};
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    if (stored === "auto" || IDS.indexOf(stored) >= 0) pref = stored;
  } catch (e) {}
  var light = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches;
  document.documentElement.setAttribute("data-theme", pref === "auto" ? (light ? ${JSON.stringify(autoPair.light)} : ${JSON.stringify(autoPair.dark)}) : pref);
})();
`;
}

// The browser's storage, or null outside a page: a runtime with a localStorage of its own (Node) warns
// on reading it, and a module a site's tests import must load there quietly.
const storage = () => (typeof window !== "undefined" ? window.localStorage : null);

/** @returns {string} */
function readPref() {
  try {
    const v = storage()?.getItem(THEME_KEY);
    return VALID.includes(v) ? v : defaultTheme;
  } catch { return defaultTheme; }
}

const prefersLight = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: light)").matches;

// A preference → the concrete theme actually painted.
// Concrete themes (anything except "auto") pass through unchanged.
/**
 * @param {string} pref A THEME_OPTS id.
 * @returns {string} The concrete palette id.
 */
function resolveTheme(pref) {
  if (pref !== "auto") return pref;
  return prefersLight() ? autoPair.light : autoPair.dark;
}

// Push the resolved theme onto <html> and keep the browser-chrome color honest.
// We read --canvas back out of the cascade rather than hardcode it, so the meta
// tag tracks whatever the active theme defines (no second source of truth).
/** @param {string} resolved */
function applyResolved(resolved) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  try {
    const canvas = getComputedStyle(root).getPropertyValue("--canvas").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && canvas) meta.setAttribute("content", canvas);
  } catch {}
}

/**
 * @typedef {{ pref: string, resolved: string }} ThemeState
 * @typedef {import("./store.js").Store<ThemeState> & { set(pref: string): void }} ThemeStore
 */
const initialPref = readPref();
const themeStore = /** @type {ThemeStore} */ (createStore({ pref: initialPref, resolved: resolveTheme(initialPref) }));

// Set + persist the preference, then apply it live. `pref` ∈ VALID.
themeStore.set = (pref) => {
  if (!VALID.includes(pref) || pref === themeStore.getState().pref) return;
  try { storage()?.setItem(THEME_KEY, pref); } catch {}
  const resolved = resolveTheme(pref);
  applyResolved(resolved);
  themeStore.setState({ pref, resolved });
};

// Live-track the OS scheme so "auto" flips when the system does.
if (typeof matchMedia !== "undefined") {
  const mq = matchMedia("(prefers-color-scheme: light)");
  const onChange = () => {
    if (themeStore.getState().pref !== "auto") return;
    const resolved = resolveTheme("auto");
    applyResolved(resolved);
    themeStore.setState({ resolved });
  };
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);   // older Safari
}

// Sync the DOM at module load. Idempotent with a site's boot script (that one
// beats first paint); this pass also wires up the meta tag and the store.
applyResolved(themeStore.getState().resolved);

/** @returns {string} */
const useThemePref = () => useStore(themeStore, s => s.pref);
/** @returns {string} */
const useResolvedTheme = () => useStore(themeStore, s => s.resolved);

export { themeStore, useThemePref, useResolvedTheme, resolveTheme, registerThemes, configureThemes, autoThemes, themeBootScript, THEME_KEY, THEME_OPTS };
