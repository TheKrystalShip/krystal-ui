// What the browser suites share: where the playground is, the page that draws every section, the
// palettes, and how a page is put in one.

export const PORT = 5231;
export const ORIGIN = "http://127.0.0.1:" + PORT;

/** The page that draws every section, one under another. */
export const ALL_SECTIONS = "/#/all";

/** The preference key `lib/theme.js` stores the palette under. */
export const THEME_KEY = "krystal:theme";

/** A dark palette, a light one, and a tribute that re-values structure: corners, edges, elevation. */
export const PALETTES = { dark: "dark", light: "light", tribute: "lcars" };

/** The moment every page sees, so a relative time or a day label reads the same on every run. */
export const FIXED_TIME = new Date("2026-10-14T10:00:00Z");

/**
 * Opens the all-sections page in `palette` with animations and transitions off, the clock fixed and
 * `Math.random` seeded, and waits for the fonts and every section.
 * @param {import("@playwright/test").Page} page
 * @param {string} palette A palette id.
 */
export async function openPlayground(page, palette) {
  await page.clock.setFixedTime(FIXED_TIME);
  await page.addInitScript(([key, id]) => {
    try { localStorage.setItem(key, id); } catch { /* storage refused */ }
    let seed = 0x2f6e2b1;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, [THEME_KEY, palette]);
  await page.goto(ORIGIN + ALL_SECTIONS);
  await page.waitForSelector("main section[id], body section[id]");
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }",
  });
  await page.evaluate(() => document.fonts.ready);
  const resolved = await page.evaluate(() => document.documentElement.dataset.theme);
  if (resolved !== palette) throw new Error("The playground resolved the palette " + resolved + ", not " + palette + ".");
}

/**
 * The id of every section on the page, in page order.
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<string[]>}
 */
export function sectionIds(page) {
  return page.$$eval("section[id]", (els) => els.map((el) => el.id));
}
