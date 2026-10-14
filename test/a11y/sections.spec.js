import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PALETTES, openPlayground, sectionIds } from "../playground.js";

// axe over every playground section, scoped to the section's own element, in a dark and a light
// palette. A serious or critical violation fails the run; the report names the section, the rule and
// the elements.
const PALETTES_CHECKED = ["dark", "light"];

// What is not held against a component, each with the reason it is not a violation of it.
const ALLOWED = [
  {
    rule: "color-contrast",
    within: ".k-is-disabled",
    reason: "WCAG 1.4.3 exempts text that is part of an inactive component.",
  },
  {
    rule: "nested-interactive",
    element: ".k-showcase-card",
    reason: "A catalogue card is one control that holds its own buttons, which is what a television page's spatial focus enters and leaves (lib/spatialFocus.js, enterCard).",
  },
];

/**
 * Whether the allow-list excuses this node of this rule.
 * @param {import("@playwright/test").Page} page
 * @param {string} rule
 * @param {string[]} target An axe selector path.
 */
function allowed(page, rule, target) {
  const entries = ALLOWED.filter((a) => a.rule === rule);
  if (entries.length === 0 || target.length !== 1) return Promise.resolve(false);
  return page.evaluate(([selector, list]) => {
    const el = document.querySelector(selector);
    return !!el && list.some((a) => (a.within ? el.closest(a.within) : el.matches(a.element)));
  }, [target[0], entries]);
}

for (const name of PALETTES_CHECKED) {
  test("no serious or critical axe violation in any section: " + name, async ({ page }) => {
    await openPlayground(page, PALETTES[name]);
    const ids = await sectionIds(page);
    expect(ids.length).toBeGreaterThan(0);

    const found = [];
    for (const id of ids) {
      const result = await new AxeBuilder({ page })
        .include("#" + id)
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();
      for (const v of result.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
        const held = [];
        for (const n of v.nodes) if (!(await allowed(page, v.id, n.target))) held.push(n);
        if (held.length === 0) continue;
        found.push(
          "[" + name + "] #" + id + ": " + v.id + " (" + v.impact + ") " + v.help + "\n"
          + held.slice(0, 6).map((n) => "    " + n.target.join(" ") + "\n      " + (n.failureSummary || "").split("\n").slice(0, 3).join(" ")).join("\n"),
        );
      }
    }
    expect(found, found.join("\n")).toEqual([]);
  });
}
