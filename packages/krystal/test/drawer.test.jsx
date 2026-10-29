import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Drawer, MenuItem } from "@thekrystalship/krystal";

describe("Drawer", () => {
  it("draws a menu's sheet at a finger's size, and any other sheet as it is", () => {
    const { rerender } = render(<Drawer role="menu" label="Arrival" onClose={() => {}}><MenuItem>Like</MenuItem></Drawer>);
    expect(screen.getByRole("menu", { name: "Arrival" }).className).toContain("k-drawer--menu");
    rerender(<Drawer title="Settings" onClose={() => {}}>Body</Drawer>);
    expect(screen.getByRole("dialog", { name: "Settings" }).className).not.toContain("k-drawer--menu");
  });
});
