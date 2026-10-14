import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Steps } from "@thekrystalship/krystal";

const steps = [
  { value: "a", label: "First", detail: "answered", done: true },
  { value: "b", label: "Second" },
  { value: "c", label: "Third" },
];

describe("Steps", () => {
  it("marks the current step, and chooses one with the keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Steps label="Questions" steps={steps} value="b" onChange={onChange} />);
    const nav = screen.getByRole("navigation", { name: "Questions" });
    const buttons = nav.querySelectorAll("button");
    expect(buttons[1].getAttribute("aria-current")).toBe("step");
    expect(buttons[0].getAttribute("aria-current")).toBeNull();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("a");
    await user.tab();
    await user.tab();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith("c");
  });

  it("names a dot by its step's label, and the rail shows done and detail", () => {
    const { container, rerender } = render(<Steps label="Tour" variant="dots" steps={steps} value="a" />);
    expect(screen.getByRole("button", { name: "Second" })).toBeTruthy();
    rerender(<Steps label="Tour" steps={steps} value="b" />);
    expect(screen.getByText("answered")).toBeTruthy();
    expect(container.querySelector(".k-steps__step.k-is-done")).toBeTruthy();
  });
});
