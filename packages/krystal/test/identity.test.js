import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { identityBootScript } from "../tools/identity.js";

const MARK = ["M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z", { d: "M16 7.5a.5.5 0 1 0 1 0a.5.5 0 1 0-1 0z", fill: true }];

describe("identityBootScript", () => {
  const colours = {
    dark: { canvas: "#000001", ground: "#000002", ink: "#000003" },
    light: { canvas: "#FFFFF1", ground: "#FFFFF2", ink: "#FFFFF3" },
  };
  const run = (config = {}) => new Function(identityBootScript({
    ids: ["dark", "light"], default: "dark", auto: { light: "light", dark: "dark" }, key: "krystal:theme",
    mark: MARK, colours, ...config,
  }))();
  const icon = () => decodeURIComponent(document.querySelector("link[data-k-icon]").href);

  let light = false;
  beforeEach(() => {
    localStorage.clear();
    light = false;
    window.matchMedia = () => ({ get matches() { return light; } });
  });
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("style");
  });

  it("paints the site's default with nothing stored", () => {
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--k-splash-canvas")).toBe("#000001");
    expect(document.querySelector('meta[name="theme-color"]').content).toBe("#000001");
    expect(icon()).toContain('fill="#000002"');
    expect(icon()).toContain('stroke="#000003"');
  });

  it("paints the stored preference, and auto by the system's scheme", () => {
    localStorage.setItem("krystal:theme", "auto");
    light = true;
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(icon()).toContain('fill="#FFFFF2"');
  });

  it("ignores a stored id the site does not offer", () => {
    localStorage.setItem("krystal:theme", "nowhere");
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("fills a filled path in the ink", () => {
    run();
    expect(icon()).toContain('fill="#000003"');
  });

  it("follows the theme the page switches to, with one icon at a time", async () => {
    run();
    document.documentElement.setAttribute("data-theme", "light");
    await vi.waitFor(() => expect(icon()).toContain('fill="#FFFFF2"'));
    expect(document.querySelectorAll("link[data-k-icon]")).toHaveLength(1);
    expect(document.querySelector('meta[name="theme-color"]').content).toBe("#FFFFF1");
  });
});
