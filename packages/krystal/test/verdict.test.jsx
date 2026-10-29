import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Verdict } from "@thekrystalship/krystal";

describe("Verdict", () => {
  it("presses Like from neither to 1", async () => {
    const onChange = vi.fn();
    render(<Verdict label="Verdict" value={0} onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Like" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("clears a like when Like is pressed again", async () => {
    const onChange = vi.fn();
    render(<Verdict label="Verdict" value={1} onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Liked" }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("moves a like to a dislike", async () => {
    const onChange = vi.fn();
    render(<Verdict label="Verdict" value={1} onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Dislike" }));
    expect(onChange).toHaveBeenCalledWith(-1);
  });

  it("reflects the value in aria-pressed and switches to the lit labels", () => {
    const { rerender } = render(<Verdict label="Verdict" value={-1} />);
    expect(screen.getByRole("button", { name: "Disliked" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Like" }).getAttribute("aria-pressed")).toBe("false");
    rerender(<Verdict label="Verdict" value={1} />);
    expect(screen.getByRole("button", { name: "Liked" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Dislike" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("takes its words from props and names the group", () => {
    render(<Verdict label="On this film" value={1} likedLabel="Found good" dislikeLabel="Bad" />);
    expect(screen.getByRole("group", { name: "On this film" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Found good" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bad" })).toBeTruthy();
  });

  it("disables both options when the value is not known", async () => {
    const onChange = vi.fn();
    render(<Verdict label="Verdict" onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.every((b) => b.disabled)).toBe(true);
    await userEvent.setup().click(buttons[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the group when it grows and when it lies over art", () => {
    render(<Verdict label="Verdict" value={0} grow onArt />);
    const group = screen.getByRole("group", { name: "Verdict" });
    expect(group.classList.contains("k-verdict--grow")).toBe(true);
    expect(group.classList.contains("k-verdict--on-art")).toBe(true);
  });

  it("draws neither modifier by default", () => {
    render(<Verdict label="Verdict" value={0} />);
    const group = screen.getByRole("group", { name: "Verdict" });
    expect(group.classList.contains("k-verdict--grow")).toBe(false);
    expect(group.classList.contains("k-verdict--on-art")).toBe(false);
  });
});
