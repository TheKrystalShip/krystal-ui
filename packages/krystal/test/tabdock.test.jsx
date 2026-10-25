import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TabDock } from "@thekrystalship/krystal";
import { pointer } from "./pointer.js";

const DEFAULTS = ["movies", "discover", "assistant", "me"];
const PAGES = [
  { id: "watch", label: "Watch", items: [["home", "house"], ["movies", "film"], ["discover", "compass"], ["anime", "sparkles"]] },
  { id: "more", label: "More", items: [["assistant", "bot"], ["me", "user"], ["about", "info"]] },
];
const labelOf = (id) => id.charAt(0).toUpperCase() + id.slice(1);

function Site({ slots = DEFAULTS, defaults = DEFAULTS, onSlots, controlled = true, start = "home", dockProps }) {
  const [page, setPage] = React.useState(start);
  const [own, setOwn] = React.useState(slots);
  const item = (id, icon) => ({ id, icon, label: labelOf(id), active: page === id, onClick: () => setPage(id) });
  const sections = PAGES.map((s) => ({ id: s.id, label: s.label, items: s.items.map(([id, icon]) => item(id, icon)) }));
  return (
    <>
      <output data-testid="page">{page}</output>
      <TabDock home={item("home", "house")} sections={sections} defaultSlots={defaults}
        {...(controlled ? { slots: own } : {})}
        onSlotsChange={(ids) => { setOwn(ids); if (onSlots) onSlots(ids); }} {...dockProps} />
    </>
  );
}

const bar = () => screen.getByRole("navigation", { name: "Main" });
const sheet = () => screen.getByRole("dialog", { hidden: true });
const handle = () => bar().querySelector(".k-tabdock__handle");
const tabs = () => [...bar().querySelectorAll("[data-tab]")];
const tab = (name) => tabs().find((t) => t.textContent === name);
const tile = (name) => [...sheet().querySelectorAll(".k-tabdock__tile")].find((t) => t.querySelector(".k-tabdock__tile-label").textContent === name);
const isOpen = () => handle().getAttribute("aria-expanded") === "true";
const labels = () => tabs().map((t) => t.textContent);

// jsdom has no layout: the head and the content are given heights, the screen a size.
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      if (this.classList.contains("k-tabdock__head")) return 50;
      if (this.classList.contains("k-tabdock__content")) return 300;
      return 0;
    },
  });
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 800 });
});
afterEach(() => {
  delete HTMLElement.prototype.offsetHeight;
  delete document.documentElement.clientHeight;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("TabDock bar", () => {
  it("draws five tabs, Home in the middle, in the tab bar's classes", () => {
    render(<Site />);
    expect(labels()).toEqual(["Movies", "Discover", "Home", "Assistant", "Me"]);
    expect(bar().classList.contains("k-tabbar")).toBe(true);
    expect(tabs().every((t) => t.classList.contains("k-tabbar__tab"))).toBe(true);
  });

  it("lights the tab of the current page, and no tab on a page that is not on the bar", () => {
    const { unmount } = render(<Site start="movies" />);
    expect(tab("Movies").getAttribute("aria-current")).toBe("page");
    expect(bar().querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    unmount();
    render(<Site start="anime" />);
    expect(bar().querySelectorAll('[aria-current="page"]')).toHaveLength(0);
    expect(tile("Anime").getAttribute("aria-current")).toBe("page");
  });

  it("goes to a tapped tab's page", () => {
    render(<Site />);
    fireEvent.click(tab("Discover"));
    expect(screen.getByTestId("page").textContent).toBe("discover");
    expect(tab("Discover").getAttribute("aria-current")).toBe("page");
  });

  it("draws a badge on the tab and on the page's tile", () => {
    const sections = [{ id: "a", label: "A", items: [{ id: "movies", icon: "film", label: "Movies", badge: 3, tone: "info" }, { id: "home", icon: "house", label: "Home" }] }];
    render(<TabDock home={{ id: "home", icon: "house", label: "Home" }} sections={sections} defaultSlots={["movies", "", "", ""]} />);
    expect(bar().querySelector(".k-tabbar__badge--info").textContent).toBe("3");
    expect(sheet().querySelector(".k-tabdock__tile-badge--info").textContent).toBe("3");
  });
});

describe("TabDock slots", () => {
  it("takes a position's default for an id no section holds, a repeated id or a missing entry", () => {
    render(<Site slots={["gone", "movies", "movies"]} />);
    expect(labels()).toEqual(["Movies", "Discover", "Home", "Assistant", "Me"]);
  });

  it("keeps the person's choice where the site still has it", () => {
    render(<Site slots={["anime", "about", "me", "movies"]} />);
    expect(labels()).toEqual(["Anime", "About", "Home", "Me", "Movies"]);
  });

  it("never takes Home for a free slot", () => {
    render(<Site slots={["home", "movies", "discover", "assistant"]} />);
    expect(labels()).toEqual(["Movies", "Discover", "Home", "Assistant", "Me"]);
  });

  it("leaves a slot empty when its default is no section's, drawn as nothing", () => {
    render(<Site slots={[]} defaults={["movies", "nope", "assistant", "me"]} />);
    expect(labels()).toEqual(["Movies", "Home", "Assistant", "Me"]);
    expect(bar().querySelectorAll(".k-tabdock__gap")).toHaveLength(1);
    expect(bar().querySelectorAll("button.k-tabbar__tab")).toHaveLength(4);
  });
});

describe("TabDock sheet", () => {
  it("opens and closes by the handle, and carries data-tabdock-open while drawn", async () => {
    render(<Site />);
    expect(isOpen()).toBe(false);
    expect(handle().getAttribute("aria-label")).toBe("Open pages");
    fireEvent.click(handle());
    expect(isOpen()).toBe(true);
    expect(handle().getAttribute("aria-label")).toBe("Close pages");
    expect(document.body.hasAttribute("data-tabdock-open")).toBe(true);
    fireEvent.click(handle());
    expect(isOpen()).toBe(false);
    await waitFor(() => expect(document.body.hasAttribute("data-tabdock-open")).toBe(false));
  });

  it("is a dialog named by its title, with the pages in sections of tiles", () => {
    render(<Site />);
    expect(screen.getByRole("dialog", { name: "Pages", hidden: true })).toBeTruthy();
    expect(within(screen.getByRole("group", { name: "Watch", hidden: true })).getAllByRole("button", { hidden: true }).map((b) => b.textContent))
      .toEqual(["Home", "Movies", "Discover", "Anime"]);
    expect(within(screen.getByRole("group", { name: "More", hidden: true })).getAllByRole("button", { hidden: true })).toHaveLength(3);
  });

  it("marks the pages on the bar with a dot, and not Home", () => {
    render(<Site />);
    expect(within(tile("Movies")).getByRole("img", { name: "On the tab bar", hidden: true })).toBeTruthy();
    expect(within(tile("Anime")).queryByRole("img", { hidden: true })).toBeNull();
    expect(within(tile("Home")).queryByRole("img", { hidden: true })).toBeNull();
  });

  it("goes to a tile's page and closes", () => {
    render(<Site />);
    fireEvent.click(handle());
    fireEvent.click(tile("Anime"));
    expect(screen.getByTestId("page").textContent).toBe("anime");
    expect(isOpen()).toBe(false);
  });

  it("closes on a tapped tab, the scrim and Escape, and focus in the sheet returns to the handle", () => {
    render(<Site />);
    fireEvent.click(handle());
    fireEvent.click(tab("Me"));
    expect(isOpen()).toBe(false);
    fireEvent.click(handle());
    fireEvent.click(document.querySelector(".k-tabdock__scrim"));
    expect(isOpen()).toBe(false);
    fireEvent.click(handle());
    tile("Anime").focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(handle());
  });

  it("focuses the current page's tile when it opens, else the first", async () => {
    const { unmount } = render(<Site start="anime" />);
    fireEvent.click(handle());
    await waitFor(() => expect(document.activeElement).toBe(tile("Anime")));
    unmount();
    render(<Site start="elsewhere" />);
    fireEvent.click(handle());
    await waitFor(() => expect(document.activeElement).toBe(tile("Home")));
  });

  it("is controlled by open and onOpenChange", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Site dockProps={{ open: false, onOpenChange }} />);
    fireEvent.click(handle());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(isOpen()).toBe(false);
    rerender(<Site dockProps={{ open: true, onOpenChange }} />);
    expect(isOpen()).toBe(true);
  });

  it("draws every word from strings", () => {
    render(<Site dockProps={{ strings: { pages: "Pagina's", edit: "Wijzig", open: "Open pagina's", close: "Sluit pagina's" } }} />);
    expect(handle().getAttribute("aria-label")).toBe("Open pagina's");
    expect(screen.getByRole("dialog", { name: "Pagina's", hidden: true })).toBeTruthy();
    expect(within(sheet()).getByRole("button", { name: "Wijzig", hidden: true })).toBeTruthy();
  });
});

describe("TabDock edit mode", () => {
  const edit = () => fireEvent.click(within(sheet()).getByRole("button", { name: "Edit", hidden: true }));

  it("enters by Edit with the first free slot chosen, locks Home, and leaves by Done keeping the sheet open", () => {
    render(<Site />);
    fireEvent.click(handle());
    edit();
    expect(screen.getByRole("dialog", { name: "Edit tab bar", hidden: true })).toBeTruthy();
    expect(tab("Movies").classList.contains("k-tabdock__tab--chosen")).toBe(true);
    expect(tab("Home").classList.contains("k-tabdock__tab--locked")).toBe(true);
    expect(within(tab("Home")).getByRole("img", { name: "Locked" })).toBeTruthy();
    expect(tile("Home").disabled).toBe(true);
    fireEvent.click(within(sheet()).getByRole("button", { name: "Done" }));
    expect(isOpen()).toBe(true);
    expect(screen.getByRole("dialog", { name: "Pages", hidden: true })).toBeTruthy();
    expect(tab("Movies").classList.contains("k-tabdock__tab--chosen")).toBe(false);
  });

  it("chooses a slot by a tap on it, and puts a tapped page there at once", () => {
    const onSlots = vi.fn();
    render(<Site onSlots={onSlots} />);
    fireEvent.click(handle());
    edit();
    fireEvent.click(tab("Discover"));
    expect(tab("Discover").classList.contains("k-tabdock__tab--chosen")).toBe(true);
    expect(screen.getByTestId("page").textContent).toBe("home");
    fireEvent.click(tile("Anime"));
    expect(onSlots).toHaveBeenLastCalledWith(["movies", "anime", "assistant", "me"]);
    expect(labels()).toEqual(["Movies", "Anime", "Home", "Assistant", "Me"]);
  });

  it("swaps a page already on the bar with the one it replaces", () => {
    const onSlots = vi.fn();
    render(<Site onSlots={onSlots} />);
    fireEvent.click(handle());
    edit();
    fireEvent.click(tile("Me"));
    expect(onSlots).toHaveBeenLastCalledWith(["me", "discover", "assistant", "movies"]);
    expect(labels()).toEqual(["Me", "Discover", "Home", "Assistant", "Movies"]);
  });

  it("does not put Home in a slot", () => {
    const onSlots = vi.fn();
    render(<Site onSlots={onSlots} />);
    fireEvent.click(handle());
    edit();
    fireEvent.click(tile("Home"));
    expect(onSlots).not.toHaveBeenCalled();
  });

  it("puts the defaults back with Reset", () => {
    const onSlots = vi.fn();
    render(<Site slots={["anime", "about", "me", "movies"]} onSlots={onSlots} />);
    fireEvent.click(handle());
    edit();
    fireEvent.click(within(sheet()).getByRole("button", { name: "Reset" }));
    expect(onSlots).toHaveBeenLastCalledWith(DEFAULTS);
    expect(labels()).toEqual(["Movies", "Discover", "Home", "Assistant", "Me"]);
  });

  it("keeps its own slots without a slots prop", () => {
    render(<Site controlled={false} />);
    fireEvent.click(handle());
    edit();
    fireEvent.click(tile("About"));
    expect(labels()).toEqual(["About", "Discover", "Home", "Assistant", "Me"]);
  });

  it("leaves edit mode when the sheet closes", () => {
    render(<Site />);
    fireEvent.click(handle());
    edit();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(handle());
    expect(screen.getByRole("dialog", { name: "Pages", hidden: true })).toBeTruthy();
  });

  it("draws an empty slot as a choosable outline in edit mode", () => {
    const onSlots = vi.fn();
    render(<Site slots={[]} defaults={["movies", "nope", "assistant", "me"]} onSlots={onSlots} />);
    fireEvent.click(handle());
    edit();
    fireEvent.click(screen.getByRole("button", { name: "Empty slot" }));
    fireEvent.click(tile("Anime"));
    expect(onSlots).toHaveBeenLastCalledWith(["movies", "anime", "assistant", "me"]);
  });
});

describe("TabDock gestures", () => {
  it("opens the sheet in edit mode on a long-press on a tab, with that tab's slot chosen, and does not press the tab", () => {
    vi.useFakeTimers();
    render(<Site />);
    pointer(tab("Assistant"), "pointerdown", { x: 300, y: 780, t: 1000 });
    expect(isOpen()).toBe(false);
    act(() => { vi.advanceTimersByTime(500); });
    expect(isOpen()).toBe(true);
    expect(screen.getByRole("dialog", { name: "Edit tab bar", hidden: true })).toBeTruthy();
    expect(tab("Assistant").classList.contains("k-tabdock__tab--chosen")).toBe(true);
    pointer(tab("Assistant"), "pointerup", { x: 300, y: 780, t: 1600 });
    fireEvent.click(tab("Assistant"));
    expect(screen.getByTestId("page").textContent).toBe("home");
    expect(isOpen()).toBe(true);
  });

  it("chooses the first free slot on a long-press on Home", () => {
    vi.useFakeTimers();
    render(<Site />);
    pointer(tab("Home"), "pointerdown", { x: 200, y: 780, t: 1000 });
    act(() => { vi.advanceTimersByTime(500); });
    expect(tab("Movies").classList.contains("k-tabdock__tab--chosen")).toBe(true);
  });

  it("is not a long-press when the press is released early or travels", () => {
    vi.useFakeTimers();
    render(<Site />);
    pointer(tab("Me"), "pointerdown", { y: 780, t: 1000 });
    act(() => { vi.advanceTimersByTime(300); });
    pointer(tab("Me"), "pointerup", { y: 780, t: 1300 });
    act(() => { vi.advanceTimersByTime(500); });
    expect(isOpen()).toBe(false);
    pointer(tab("Me"), "pointerdown", { y: 780, t: 2000 });
    pointer(tab("Me"), "pointermove", { y: 760, t: 2100 });
    act(() => { vi.advanceTimersByTime(600); });
    expect(screen.queryByRole("dialog", { name: "Edit tab bar", hidden: true })).toBeNull();
  });

  it("opens the sheet by a drag up from a tab, and swallows the tap that ends the drag", () => {
    render(<Site />);
    pointer(tab("Discover"), "pointerdown", { y: 780, t: 1000 });
    pointer(tab("Discover"), "pointermove", { y: 680, t: 1300 });
    pointer(tab("Discover"), "pointerup", { y: 680, t: 1400 });
    expect(isOpen()).toBe(true);
    fireEvent.click(tab("Discover"));
    expect(screen.getByTestId("page").textContent).toBe("home");
    expect(isOpen()).toBe(true);
  });

  it("opens the sheet by a drag up from the handle, and does not toggle it again", () => {
    render(<Site />);
    pointer(handle(), "pointerdown", { y: 780, t: 1000 });
    pointer(handle(), "pointermove", { y: 680, t: 1300 });
    pointer(handle(), "pointerup", { y: 680, t: 1400 });
    expect(isOpen()).toBe(true);
    fireEvent.click(handle());
    expect(isOpen()).toBe(true);
  });

  it("closes the sheet by a drag down on its head", () => {
    render(<Site />);
    fireEvent.click(handle());
    const head = sheet().querySelector(".k-tabdock__head");
    pointer(head, "pointerdown", { y: 400, t: 1000 });
    pointer(head, "pointermove", { y: 520, t: 1300 });
    pointer(head, "pointerup", { y: 520, t: 1400 });
    expect(isOpen()).toBe(false);
  });

  it("refuses the context menu on the bar", () => {
    render(<Site />);
    expect(fireEvent.contextMenu(bar())).toBe(false);
  });
});
