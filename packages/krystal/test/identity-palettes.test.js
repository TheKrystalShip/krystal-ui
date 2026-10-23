// The palettes are read from the package's stylesheets on disk, as a build reads them.
import { describe, expect, it } from "vitest";
import { androidPathData, paletteColours } from "../tools/identity.js";

describe("paletteColours", () => {
  it("draws the mark in each palette's accent on the accent's tint over its canvas", () => {
    const { colours, skipped } = paletteColours();
    expect(skipped).toEqual([]);
    expect(colours.dark).toEqual({ canvas: "#0B0F14", ground: "#12232C", ink: "#40A0C0" });
    expect(Object.keys(colours)).toContain("light");
  });
});

describe("androidPathData", () => {
  it("writes every number whole and apart", () => {
    expect(androidPathData("M.5 1.5.5-3a.2.2 0 0 1-1 0Z")).toBe("M 0.5 1.5 0.5 -3 a 0.2 0.2 0 0 1 -1 0 Z");
  });
});
