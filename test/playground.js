// What the browser suites share: where the playground is, the page that draws every section, the
// palettes, and how a page is put in one.

export const PORT = 5231;
export const ORIGIN = "http://127.0.0.1:" + PORT;

/** The page that draws every section, one under another. */
export const ALL_SECTIONS = "/";

/** The preference key `lib/theme.js` stores the palette under. */
export const THEME_KEY = "krystal:theme";

/** A dark palette, a light one, and a tribute that re-values structure: corners, edges, elevation. */
export const PALETTES = { dark: "dark", light: "light", tribute: "lcars" };

/**
 * Opens the all-sections page in `palette` with animations and transitions off, and waits for the fonts and every section.
 * @param {import("@playwright/test").Page} page
 * @param {string} palette A palette id.
 */
export async function openPlayground(page, palette) {
  await page.addInitScript(([key, id]) => {
    try { localStorage.setItem(key, id); } catch { /* storage refused */ }
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
