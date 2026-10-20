import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Shelf } from "@thekrystalship/krystal";

afterEach(cleanup);

describe("Shelf", () => {
  it("names its section by its heading and draws the line, the action, the controls and the items", () => {
    render(
      <Shelf title="Quick meals" sub="Under 30 minutes" action={<a href="/all">View all</a>} controls={<button type="button">Vegan</button>}>
        <div>Stamppot</div>
        <div>Dal</div>
      </Shelf>,
    );
    const shelf = screen.getByRole("region", { name: "Quick meals" });
    expect(shelf.querySelector("h2").textContent).toBe("Quick meals");
    expect(screen.getByText("Under 30 minutes")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View all" }).getAttribute("href")).toBe("/all");
    expect(screen.getByRole("button", { name: "Vegan" })).toBeTruthy();
    expect(shelf.querySelector(".k-shelf__grid").children.length).toBe(2);
  });

  it("draws what it is given for no items in place of the grid", () => {
    render(<Shelf title="Saved" empty="Nothing saved yet.">{null}</Shelf>);
    expect(screen.getByText("Nothing saved yet.")).toBeTruthy();
    expect(document.querySelector(".k-shelf__grid")).toBeNull();
  });

  it("takes how many stand in a row as custom properties the grid reads", () => {
    render(<Shelf title="Plans" columns={3} narrowColumns={1} headingLevel="h3"><div>One</div></Shelf>);
    const shelf = screen.getByRole("region", { name: "Plans" });
    expect(shelf.style.getPropertyValue("--k-shelf-columns")).toBe("3");
    expect(shelf.style.getPropertyValue("--k-shelf-narrow-columns")).toBe("1");
    expect(shelf.querySelector("h3")).toBeTruthy();
  });
});
