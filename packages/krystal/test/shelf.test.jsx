import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Shelf } from "@thekrystalship/krystal";

afterEach(cleanup);

/** Gives the shelf's track a scroll width past its own, as a browser lays out a row that overflows. */
function overflow(track, { scrollLeft = 0 } = {}) {
  Object.defineProperty(track, "clientWidth", { configurable: true, value: 400 });
  Object.defineProperty(track, "scrollWidth", { configurable: true, value: 1200 });
  track.scrollLeft = scrollLeft;
  fireEvent.scroll(track);
}

describe("Shelf", () => {
  it("names its section and its row by its heading and draws the line, the action, the controls and the items", () => {
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
    const row = screen.getByRole("group", { name: "Quick meals" });
    expect(row.querySelectorAll(".k-shelf__item").length).toBe(2);
  });

  it("draws what it is given for no items in place of the row", () => {
    render(<Shelf title="Saved" empty="Nothing saved yet.">{null}</Shelf>);
    expect(screen.getByText("Nothing saved yet.")).toBeTruthy();
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("draws no arrows while the row fits", () => {
    render(<Shelf title="Plans"><div>One</div></Shelf>);
    expect(screen.queryByRole("button", { name: /Scroll/ })).toBeNull();
  });

  it("draws arrows named by the heading once the row overflows, the one at the end it stands at disabled", () => {
    render(<Shelf title="Movies"><div>One</div><div>Two</div></Shelf>);
    overflow(screen.getByRole("group", { name: "Movies" }));
    const left = screen.getByRole("button", { name: "Scroll Movies left" });
    const right = screen.getByRole("button", { name: "Scroll Movies right" });
    expect(left.disabled).toBe(true);
    expect(right.disabled).toBe(false);
  });

  it("pages the row by just under its width", () => {
    render(<Shelf title="Movies"><div>One</div><div>Two</div></Shelf>);
    const track = screen.getByRole("group", { name: "Movies" });
    const calls = [];
    track.scrollBy = (opts) => calls.push(opts.left);
    overflow(track, { scrollLeft: 200 });
    fireEvent.click(screen.getByRole("button", { name: "Scroll Movies right" }));
    fireEvent.click(screen.getByRole("button", { name: "Scroll Movies left" }));
    expect(calls).toEqual([360, -360]);
  });

  it("writes a number of items in view on the row as the custom property it reads", () => {
    render(<Shelf title="Plans" perView={3.4} headingLevel="h3"><div>One</div></Shelf>);
    const row = screen.getByRole("group", { name: "Plans" });
    expect(row.style.getPropertyValue("--k-shelf-per-view")).toBe("3.4");
    expect(document.querySelector("h3")).toBeTruthy();
  });
});
