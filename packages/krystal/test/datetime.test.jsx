import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar, DatePicker, DateTimePicker, TimeGrid, TimeInput } from "@thekrystalship/krystal";
import { addDays, momentKey, nextStep, parseMoment, timeRange } from "@thekrystalship/krystal/lib/datetime";

// Every test reads the clock as Wednesday 21 October 2026, 16:15 local.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 21, 16, 15));
});
afterEach(() => vi.useRealTimers());

describe("lib/datetime", () => {
  it("steps to the first boundary after a time, and reads keys back", () => {
    expect(momentKey(nextStep(new Date(2026, 9, 21, 16, 15)))).toBe("2026-10-21T16:30");
    expect(momentKey(nextStep(new Date(2026, 9, 21, 16, 30)))).toBe("2026-10-21T17:00");
    expect(momentKey(nextStep(new Date(2026, 9, 21, 23, 45)))).toBe("2026-10-22T00:00");
    expect(momentKey(nextStep(new Date(2026, 9, 21, 16, 2), 15))).toBe("2026-10-21T16:15");
    expect(timeRange("22:30", "23:30", 30)).toEqual(["22:30", "23:00", "23:30"]);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(parseMoment("2026-02-30T10:00")).toBeNull();
    expect(parseMoment("2026-10-21T24:00")).toBeNull();
  });
});

describe("Calendar", () => {
  it("draws the month, rings today, and picks a day inside the range only", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar locale="en-GB" min="2026-10-21" max="2026-11-20" marked={["2026-10-23"]} onChange={onChange} />);
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeTruthy();
    const today = screen.getByRole("button", { name: "Wednesday, 21 October 2026" });
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(today.tabIndex).toBe(0);
    await user.click(screen.getByRole("button", { name: "Tuesday, 20 October 2026" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Friday, 23 October 2026" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-23");
    expect(screen.getByRole("button", { name: "Previous month" }).hasAttribute("disabled")).toBe(true);
  });

  it("marks the chosen day's cell selected, and the arrows cross into the next month", async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-GB" value="2026-10-30" />);
    const chosen = screen.getByRole("button", { name: "Friday, 30 October 2026" });
    expect(chosen.closest("td").getAttribute("aria-selected")).toBe("true");
    chosen.focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(document.activeElement.getAttribute("aria-label")).toBe("Friday, 6 November 2026"));
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeTruthy();
    await user.keyboard("{PageUp}");
    await waitFor(() => expect(document.activeElement.getAttribute("aria-label")).toBe("Tuesday, 6 October 2026"));
    await user.keyboard("{Home}");
    await waitFor(() => expect(document.activeElement.getAttribute("aria-label")).toBe("Monday, 5 October 2026"));
  });
});

describe("TimeGrid", () => {
  it("starts at the first step after now and reports the time pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeGrid label="Start" to="18:00" onChange={onChange} />);
    const slots = within(screen.getByRole("group", { name: "Start" })).getAllByRole("button");
    expect(slots.map((b) => b.textContent)).toEqual(["16:30", "17:00", "17:30", "18:00"]);
    await user.click(slots[1]);
    expect(onChange).toHaveBeenCalledWith("17:00");
  });

  it("holds several times with multiple, and disables what min and disable rule out", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeGrid label="Start" multiple from="20:00" to="21:30" min="20:30" disable={(t) => t === "21:30"}
      value={["21:00"]} onChange={onChange} />);
    const slot = (t) => screen.getByRole("button", { name: t });
    expect(slot("20:00").hasAttribute("disabled")).toBe(true);
    expect(slot("21:30").hasAttribute("disabled")).toBe(true);
    expect(slot("21:00").getAttribute("aria-pressed")).toBe("true");
    await user.click(slot("20:30"));
    expect(onChange).toHaveBeenLastCalledWith(["20:30", "21:00"]);
    await user.click(slot("21:00"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("moves its one tab stop with the arrows", async () => {
    const user = userEvent.setup();
    render(<TimeGrid label="Start" from="20:00" to="21:00" />);
    screen.getByRole("button", { name: "20:00" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement.textContent).toBe("20:30");
    await user.keyboard("{End}");
    expect(document.activeElement.textContent).toBe("21:00");
  });
});

describe("TimeInput", () => {
  it("reports a time once both fields hold one, moving on as the hours fill", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" onChange={onChange} />);
    const hours = screen.getByRole("spinbutton", { name: "Hours" });
    await user.click(hours);
    await user.keyboard("21");
    expect(document.activeElement).toBe(screen.getByRole("spinbutton", { name: "Minutes" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("3");
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("0");
    expect(onChange).toHaveBeenLastCalledWith("21:30");
  });

  it("steps with the arrows round the clock and takes a value from outside", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<TimeInput label="Start" value="23:55" minuteStep={5} onChange={onChange} />);
    await user.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith("00:55");
    await user.click(screen.getByRole("spinbutton", { name: "Minutes" }));
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith("00:00");
    rerender(<TimeInput label="Start" value="09:10" minuteStep={5} onChange={onChange} />);
    expect(screen.getByRole("spinbutton", { name: "Hours" }).value).toBe("09");
    expect(screen.getByRole("spinbutton", { name: "Minutes" }).value).toBe("10");
  });

  it("a single digit that can start nothing longer fills the hours", async () => {
    const user = userEvent.setup();
    render(<TimeInput label="Start" />);
    await user.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("7");
    expect(screen.getByRole("spinbutton", { name: "Hours" }).value).toBe("07");
    expect(document.activeElement).toBe(screen.getByRole("spinbutton", { name: "Minutes" }));
  });
});

describe("DateTimePicker", () => {
  it("shows the value in words and hands over the draft on Done", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimePicker locale="en-GB" aria-label="Starts" value="2026-10-21T21:00" min="2026-10-21T16:30" onChange={onChange} />);
    const field = screen.getByRole("button", { name: "Starts" });
    expect(field.textContent).toContain("21 Oct 2026");
    await user.click(field);
    const panel = await screen.findByRole("dialog", { name: "Pick a date and time" });
    await waitFor(() => expect(document.activeElement.getAttribute("aria-label")).toBe("Wednesday, 21 October 2026"));
    await user.click(within(panel).getByRole("button", { name: "Friday, 23 October 2026" }));
    await user.click(within(panel).getByRole("button", { name: "20:30" }));
    await user.click(within(panel).getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-23T20:30");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables times before min on its day, holds Done until the draft fits, and Escape changes nothing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimePicker locale="en-GB" aria-label="Starts" min="2026-10-21T16:30" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Starts" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("button", { name: "16:00" }).hasAttribute("disabled")).toBe(true);
    expect(within(panel).getByRole("button", { name: "Done" }).hasAttribute("disabled")).toBe(true);
    await user.click(within(panel).getByRole("button", { name: "16:30" }));
    expect(within(panel).getByRole("button", { name: "Done" }).hasAttribute("disabled")).toBe(false);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Clear hands over nothing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimePicker locale="en-GB" aria-label="Starts" value="2026-10-22T10:00" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Starts" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("DatePicker", () => {
  it("hands over the day picked and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker locale="en-GB" aria-label="Released" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Released" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Saturday, 24 October 2026" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-24");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
