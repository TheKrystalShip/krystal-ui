import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The theme module keeps its list, default and auto pair for the page's life, so each test loads it fresh.
const load = async () => {
  vi.resetModules();
  return import("../src/lib/theme.js");
};

const harbour = [
  { id: "harbour", label: "Harbour", mode: "light" },
  { id: "harbour-night", label: "Harbour night", mode: "dark" },
];

let light = false;
beforeEach(() => {
  localStorage.clear();
  light = false;
  window.matchMedia = () => ({ get matches() { return light; }, addEventListener() {}, removeEventListener() {} });
});
afterEach(() => { delete document.documentElement.dataset.theme; });

describe("a site's default and auto pair", () => {
  it("paints Krystal Blue Dark with nothing configured", async () => {
    const { themeStore } = await load();
    expect(themeStore.getState()).toEqual({ pref: "dark", resolved: "dark" });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("paints the site's default palette for a person with no preference", async () => {
    const { registerThemes, configureThemes, themeStore } = await load();
    registerThemes(harbour);
    configureThemes({ default: "harbour", auto: { light: "harbour", dark: "harbour-night" } });
    expect(themeStore.getState()).toEqual({ pref: "harbour", resolved: "harbour" });
    expect(document.documentElement.dataset.theme).toBe("harbour");
  });

  it("keeps a stored preference over the default", async () => {
    localStorage.setItem("krystal:theme", "nord");
    const { registerThemes, configureThemes, themeStore } = await load();
    registerThemes(harbour);
    configureThemes({ default: "harbour" });
    expect(themeStore.getState().resolved).toBe("nord");
  });

  it("resolves auto to the site's pair", async () => {
    localStorage.setItem("krystal:theme", "auto");
    light = true;
    const { registerThemes, configureThemes, themeStore } = await load();
    registerThemes(harbour);
    configureThemes({ auto: { light: "harbour", dark: "harbour-night" } });
    expect(themeStore.getState()).toEqual({ pref: "auto", resolved: "harbour" });
  });

  it("refuses an unknown default and a pair of the wrong modes", async () => {
    const { registerThemes, configureThemes } = await load();
    registerThemes(harbour);
    expect(() => configureThemes({ default: "nowhere" })).toThrow(TypeError);
    expect(() => configureThemes({ auto: { light: "harbour-night", dark: "harbour" } })).toThrow(TypeError);
  });
});

describe("the boot script", () => {
  const run = (source) => { new Function(source)(); return document.documentElement.dataset.theme; };

  it("agrees with the module on the default, a stored palette and auto", async () => {
    const { registerThemes, configureThemes, themeBootScript } = await load();
    registerThemes(harbour);
    configureThemes({ default: "harbour", auto: { light: "harbour", dark: "harbour-night" } });
    const source = themeBootScript();
    expect(run(source)).toBe("harbour");
    localStorage.setItem("krystal:theme", "nord");
    expect(run(source)).toBe("nord");
    localStorage.setItem("krystal:theme", "auto");
    expect(run(source)).toBe("harbour-night");
    light = true;
    expect(run(source)).toBe("harbour");
    localStorage.setItem("krystal:theme", "a-palette-from-elsewhere");
    expect(run(source)).toBe("harbour");
  });
});
