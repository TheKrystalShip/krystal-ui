import { expect, test } from "@playwright/test";
import { PALETTES, openPlayground, sectionIds } from "../playground.js";

// Every playground section, screenshotted at a desktop and a phone width in three palettes: the
// default dark, a light one and a tribute, which re-values corner radius, edge weight and elevation,
// so a change to structure shows where a change of colour would not. Each is compared with the
// committed baseline in __screenshots__/<palette>-<width>/<section>.png.
const WIDTHS = { 1280: 900, 390: 844 };

// What still changes between two runs once the clock and Math.random are fixed and animation is off.
const MASKED = [".k-spinner"];

for (const [name, palette] of Object.entries(PALETTES)) {
  for (const [width, height] of Object.entries(WIDTHS)) {
    test("sections match their baselines: " + name + " at " + width, async ({ page }) => {
      await page.setViewportSize({ width: Number(width), height });
      await openPlayground(page, palette);
      for (const id of await sectionIds(page)) {
        const section = page.locator("section#" + id);
        await section.scrollIntoViewIfNeeded();
        await expect.soft(section).toHaveScreenshot(name + "-" + width + "/" + id + ".png", {
          mask: MASKED.map((s) => section.locator(s)),
        });
      }
    });
  }
}
