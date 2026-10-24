import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PosterCard } from "@thekrystalship/krystal";

afterEach(cleanup);

describe("PosterCard", () => {
  it("opens the thing from its name, the card's one button to open it", () => {
    const onPick = vi.fn();
    render(<PosterCard name="Raiders of the Lost Ark" onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: "Raiders of the Lost Ark" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Raiders of the Lost Ark" })).toBeTruthy();
  });

  it("plays from its own button, named by the action and the thing, without opening it", () => {
    const onPick = vi.fn();
    const onPlay = vi.fn();
    render(<PosterCard name="Superstore" onPick={onPick} action={{ label: "Resume", onClick: onPlay }} />);
    fireEvent.click(screen.getByRole("button", { name: "Resume Superstore" }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("draws no play button without an action", () => {
    render(<PosterCard name="Coraline" />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("lists the facts it knows, each titled by its label, and leaves the unknown out", () => {
    render(<PosterCard name="2001" facts={[{ value: "8.3", label: "Rating", icon: "star" }, { value: null, label: "Year" }, { value: "2h 29m", label: "Length" }]} />);
    expect(screen.getByTitle("Rating").textContent).toBe("8.3");
    expect(screen.getByTitle("Length").textContent).toBe("2h 29m");
    expect(screen.queryByTitle("Year")).toBeNull();
  });

  it("keeps the status line when it has nothing to say", () => {
    const { container, rerender } = render(<PosterCard name="Dal" />);
    expect(container.querySelector(".k-poster__status")).toBeTruthy();
    rerender(<PosterCard name="Dal" status={{ label: "1h 36m left", tone: "active" }} />);
    expect(screen.getByText("1h 36m left")).toBeTruthy();
  });

  it("switches its ribbon without opening the thing", () => {
    const onPick = vi.fn();
    const onClick = vi.fn();
    render(<PosterCard name="Pho" onPick={onPick} ribbon={{ icon: "bookmark", label: "Want to watch", on: true, onClick }} />);
    const ribbon = screen.getByRole("button", { name: "Want to watch" });
    expect(ribbon.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(ribbon);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });
});
