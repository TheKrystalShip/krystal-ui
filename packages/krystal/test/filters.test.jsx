import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterDrawer, SearchField } from "@thekrystalship/krystal";

const options = (...labels) => labels.map((label) => ({ value: label.toLowerCase(), label }));
const sections = [
  { id: "kind", label: "Kind", kind: "one", base: "all", options: options("All", "Movies", "Shows") },
  { id: "genre", label: "Genre", kind: "many", options: options("Comedy", "Drama", "Horror") },
  { id: "rating", label: "Rating", kind: "optional", options: options("Eight", "Seven") },
  { id: "watched", label: "Watched", kind: "toggle", option: "Hide watched", note: "From your history" },
  { id: "count", label: "Ingredients", kind: "range", min: 1, max: 10, any: 10, format: (v) => (v === 10 ? "Any" : "Up to " + v) },
  { id: "have", label: "I have", kind: "tokens", placeholder: "Add one" },
];

/** A page holding the values, as a site does in its address. */
function Page({ start = {}, onValues = () => {}, onSubmit = () => {}, drawerRef, list = sections }) {
  const [values, setValues] = React.useState(start);
  return (
    <>
      <SearchField value="" onSubmit={onSubmit} placeholder="Search"
        filters={<FilterDrawer ref={drawerRef} sections={list} values={values} onChange={(v) => { setValues(v); onValues(v); }} />} />
      <p>Outside</p>
    </>
  );
}

const trigger = () => screen.getByRole("button", { name: /^Filters/ });

describe("FilterDrawer", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-tv");
  });

  it("stands in the field's icon place and counts what is picked", () => {
    render(<Page start={{ genre: ["comedy", "horror"], kind: "movies" }} />);
    expect(trigger().getAttribute("aria-label")).toBe("Filters (3)");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().closest("form").className).toContain("k-searchfield--filters");
  });

  it("stays open while options are picked, each section answering its own kind", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();
    render(<Page onValues={onValues} />);
    await user.click(trigger());
    const panel = screen.getByRole("group", { name: "Filters" });

    await user.click(within(panel).getByRole("button", { name: "Comedy" }));
    await user.click(within(panel).getByRole("button", { name: "Horror" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ genre: ["comedy", "horror"] }));

    await user.click(within(panel).getByRole("button", { name: "Eight" }));
    await user.click(within(panel).getByRole("button", { name: "Seven" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ rating: "seven" }));
    await user.click(within(panel).getByRole("button", { name: "Seven" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ rating: null }));

    await user.click(within(panel).getByRole("button", { name: "Movies" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "movies" }));

    await user.click(within(panel).getByRole("button", { name: "Hide watched" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ watched: true }));

    expect(within(panel).getByRole("button", { name: "Comedy" }).getAttribute("aria-pressed")).toBe("true");
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("adds a typed word without submitting the search", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValues = vi.fn();
    render(<Page onSubmit={onSubmit} onValues={onValues} />);
    await user.click(trigger());
    await user.type(screen.getByRole("textbox", { name: "I have" }), "eggs{Enter}");
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ have: ["eggs"] }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("puts a chip on every pick in its footer, each taking its pick off, and Clear all every one", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();
    render(<Page onValues={onValues} start={{ kind: "shows", genre: ["drama"], count: 4, watched: true, have: ["eggs"] }} />);
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Remove Drama" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ genre: [] }));
    await user.click(screen.getByRole("button", { name: "Remove Up to 4" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ count: 10 }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({
      kind: "all", genre: [], rating: null, watched: false, count: 10, have: [],
    }));
    expect(trigger().getAttribute("aria-label")).toBe("Filters");
  });

  it("counts a toggle only away from its base, and Clear all puts it back on", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();
    const list = [
      { id: "genre", label: "Genre", kind: "many", options: options("Comedy", "Drama") },
      { id: "allergens", label: "Allergens", kind: "toggle", option: "Hide my allergens", offOption: "Showing my allergens", base: true, note: "Peanuts" },
    ];
    render(<Page list={list} onValues={onValues} />);
    expect(trigger().getAttribute("aria-label")).toBe("Filters");
    await user.click(trigger());
    const panel = screen.getByRole("group", { name: "Filters" });
    expect(within(panel).getByRole("button", { name: "Hide my allergens" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("button", { name: /^Remove/ })).toBeNull();

    await user.click(within(panel).getByRole("button", { name: "Hide my allergens" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ allergens: false }));
    expect(trigger().getAttribute("aria-label")).toBe("Filters (1)");
    await user.click(screen.getByRole("button", { name: "Remove Showing my allergens" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ allergens: true }));

    await user.click(within(panel).getByRole("button", { name: "Hide my allergens" }));
    await user.click(within(panel).getByRole("button", { name: "Comedy" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ genre: [], allergens: true }));
    expect(trigger().getAttribute("aria-label")).toBe("Filters");
  });

  it("closes on a press outside it, on the search and on Escape", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(trigger());
    fireEvent.pointerDown(screen.getByText("Outside"));
    expect(screen.queryByRole("group", { name: "Filters" })).toBeNull();

    await user.click(trigger());
    fireEvent.submit(trigger().closest("form"));
    expect(screen.queryByRole("group", { name: "Filters" })).toBeNull();

    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: "Filters" })).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("packs a short section under an earlier one and wraps a long list into sub-columns", async () => {
    const user = userEvent.setup();
    const many = { id: "region", label: "Region", kind: "many", options: Array.from({ length: 20 }, (_, i) => ({ value: "r" + i, label: "Region " + i })) };
    const short = [
      { id: "kind", label: "Kind", kind: "one", base: "a", options: options("A", "B", "C") },
      many,
      { id: "watched", label: "Watched", kind: "toggle", option: "Hide watched" },
    ];
    render(<SearchField filters={<FilterDrawer sections={short} values={{}} onChange={() => {}} />} />);
    await user.click(trigger());
    const columns = document.querySelectorAll(".k-filters__column");
    expect(columns).toHaveLength(2);
    expect(within(columns[0]).getByRole("group", { name: "Watched" })).toBeTruthy();
    expect(columns[1].querySelector(".k-filters__grid").style.gridTemplateRows).toBe("repeat(10, auto)");
  });

  const order = { id: "sort", label: "Sort by", kind: "sort", base: "added", options: [
    { value: "added", label: "Recently added" }, { value: "first", label: "First added" },
    { value: "best", label: "Highest rated" }, { value: "worst", label: "Lowest rated" },
  ] };

  it("draws a sort first, in a column of its own, and never counts it, chips it or clears it", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();
    render(<Page list={[...sections, order]} start={{ genre: ["drama"], sort: "best" }} onValues={onValues} />);
    expect(trigger().getAttribute("aria-label")).toBe("Filters (1)");
    await user.click(trigger());
    const columns = document.querySelectorAll(".k-filters__column");
    expect(within(columns[0]).getByRole("group", { name: "Sort by" })).toBeTruthy();
    expect(within(columns[0]).queryByRole("group", { name: "Kind" })).toBeNull();
    expect(within(columns[0]).getByRole("button", { name: "Highest rated" }).getAttribute("aria-pressed")).toBe("true");

    const foot = document.querySelector(".k-filters__foot");
    expect(within(foot).queryByRole("button", { name: /Highest rated/ })).toBeNull();
    await user.click(within(columns[0]).getByRole("button", { name: "Lowest rated" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "worst" }));
    expect(trigger().getAttribute("aria-label")).toBe("Filters (1)");

    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "worst", genre: [] }));
  });

  it("on a phone opens on the sort, its row naming the order in force", async () => {
    const user = userEvent.setup();
    const original = window.matchMedia;
    window.matchMedia = (query) => ({ ...original(query), matches: query === "(max-width: 768px)" });
    try {
      const onValues = vi.fn();
      render(<Page list={[...sections, order]} onValues={onValues} />);
      await user.click(trigger());
      const body = document.querySelector(".k-filters__body");
      const head = body.firstElementChild.querySelector(".k-filters__fold-head");
      expect(head.getAttribute("aria-expanded")).toBe("true");
      expect(head.textContent).toContain("Sort by");
      expect(head.textContent).toContain("Recently added");
      await user.click(screen.getByRole("button", { name: "First added" }));
      expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "first" }));
      expect(head.textContent).toContain("First added");
    } finally {
      window.matchMedia = original;
    }
  });

  it("on a television starts its rail on the sort", async () => {
    document.documentElement.setAttribute("data-tv", "");
    const user = userEvent.setup();
    render(<Page list={[...sections, order]} />);
    await user.click(trigger());
    expect(document.activeElement).toBe(document.querySelector('[data-filter-rail="sort"]'));
    const pane = document.querySelector(".k-filters__pane");
    expect(within(pane).getByRole("button", { name: "Recently added" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("on a phone folds its sections, keeps a short one-of row in view and draws toggles as switches", async () => {
    const user = userEvent.setup();
    const original = window.matchMedia;
    window.matchMedia = (query) => ({ ...original(query), matches: query === "(max-width: 768px)" });
    try {
      const onValues = vi.fn();
      render(<Page onValues={onValues} start={{ genre: ["drama"] }} />);
      await user.click(trigger());
      expect(screen.getByRole("button", { name: "Movies" })).toBeTruthy();
      const genre = screen.getByRole("button", { name: /^Genre/ });
      expect(genre.getAttribute("aria-expanded")).toBe("true");
      expect(genre.textContent).toContain("Drama");
      await user.click(screen.getByRole("button", { name: /^Rating/ }));
      expect(screen.getByRole("button", { name: /^Genre/ }).getAttribute("aria-expanded")).toBe("false");
      await user.click(screen.getByRole("button", { name: "Eight" }));
      expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ rating: "eight" }));
      await user.click(screen.getByRole("switch", { name: "Hide watched" }));
      expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ watched: true }));
      await user.click(screen.getByRole("button", { name: "Done" }));
      expect(screen.queryByRole("group", { name: "Filters" })).toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });

  it("on a television shows the rail's section beside it, and Back leaves the section and then closes", async () => {
    document.documentElement.setAttribute("data-tv", "");
    const user = userEvent.setup();
    const ref = React.createRef();
    const onValues = vi.fn();
    render(<Page drawerRef={ref} onValues={onValues} />);
    expect(ref.current.back()).toBe(false);
    await user.click(trigger());
    const rail = (name) => document.querySelector(`[data-filter-rail="${name}"]`);
    expect(document.activeElement).toBe(rail("kind"));

    await user.click(rail("watched"));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ watched: true }));

    fireEvent.focus(rail("genre"));
    const pane = document.querySelector(".k-filters__pane");
    expect(within(pane).getByRole("button", { name: "Horror" })).toBeTruthy();
    await user.click(rail("genre"));
    await user.click(within(pane).getByRole("button", { name: "Horror" }));
    expect(onValues).toHaveBeenLastCalledWith(expect.objectContaining({ genre: ["horror"] }));

    within(pane).getByRole("button", { name: "Horror" }).focus();
    let used;
    act(() => { used = ref.current.back(); });
    expect(used).toBe(true);
    expect(document.activeElement).toBe(rail("genre"));
    act(() => { used = ref.current.back(); });
    expect(used).toBe(true);
    expect(screen.queryByRole("group", { name: "Filters" })).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });
  it("tells the page each opening and closing, and nothing on its first render", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SearchField value="" onSubmit={() => {}} placeholder="Search"
        filters={<FilterDrawer sections={sections} values={{}} onChange={() => {}} onOpenChange={onOpenChange} />} />,
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("dims beside the field, in its parent, with the field raised over it until it closes", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div className="frame">
        <SearchField value="" onSubmit={() => {}} placeholder="Search" style={{ zIndex: 1 }}
          filters={<FilterDrawer sections={sections} values={{}} onChange={() => {}} />} />
      </div>,
    );
    const frame = container.querySelector(".frame");
    const field = trigger().closest("form");
    await user.click(trigger());
    const scrim = document.querySelector(".k-filters__scrim");
    expect(scrim.parentElement).toBe(frame);
    expect(field.style.zIndex).toBe("36");
    await user.keyboard("{Escape}");
    expect(document.querySelector(".k-filters__scrim")).toBeNull();
    expect(field.style.zIndex).toBe("1");
  });

  it("on a television sizes its option cells for the longest name", async () => {
    document.documentElement.setAttribute("data-tv", "");
    const user = userEvent.setup();
    const long = [{ id: "genre", label: "Genre", kind: "many", options: options("War", "Action & Adventure", "Drama") }];
    // Every character is 7px wide here, so the longest name is 126px.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(/** @type {any} */ ({ font: "", measureText: (t) => ({ width: t.length * 7 }) }));
    render(
      <SearchField value="" onSubmit={() => {}} placeholder="Search"
        filters={<FilterDrawer sections={long} values={{}} onChange={() => {}} />} />,
    );
    await user.click(trigger());
    const targets = document.querySelector(".k-filters__targets");
    expect(targets.style.getPropertyValue("--k-filters-cell")).toBe(18 * 7 + 32 + "px");
  });
});
