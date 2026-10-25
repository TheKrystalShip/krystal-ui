import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useDockDrag } from "@thekrystalship/krystal";
import { pointer, touch } from "./pointer.js";

// The heights at rest (jsdom has no border, so the content is as tall as the panel open): closed at 40, the open content 440 tall, room for 600. The drag between them
// is 400, so a drag commits at 100 (a quarter of 400, between the floor of 36 and the cap of 100).
const measure = () => ({ shut: 40, natural: 440, cap: 600 });

function Harness({ start = false, onChange, ...options }) {
  const [open, setOpen] = React.useState(start);
  const drag = useDockDrag({
    open,
    onOpenChange: (next) => { setOpen(next); if (onChange) onChange(next); },
    measure,
    ...options,
  });
  return (
    <div>
      <div ref={drag.scrim} data-testid="scrim" />
      <div ref={drag.panel} data-testid="panel" data-open={String(open)} data-live={String(drag.live)} {...drag.handlers}>
        <div ref={drag.head} data-testid="head">head</div>
        <div ref={drag.body} data-testid="body"><button type="button" data-testid="inside">inside</button></div>
      </div>
    </div>
  );
}

const panel = () => screen.getByTestId("panel");
const height = () => panel().style.height;
const passed = (ms) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("useDockDrag", () => {
  it("rests at the closed height, or the open one", () => {
    const { unmount } = render(<Harness />);
    expect(height()).toBe("40px");
    expect(panel().style.getPropertyValue("--dock-p")).toBe("0");
    unmount();
    render(<Harness start />);
    expect(height()).toBe("440px");
    expect(panel().style.getPropertyValue("--dock-p")).toBe("1");
    expect(panel().style.getPropertyValue("--dock-open-h")).toBe("440px");
  });

  it("follows the finger from the first move past the slop, with the progress and the scrim", () => {
    render(<Harness />);
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    pointer(panel(), "pointermove", { y: 695, t: 1010 });
    expect(height()).toBe("40px");
    pointer(panel(), "pointermove", { y: 600, t: 1200 });
    expect(height()).toBe("140px");
    expect(panel().style.getPropertyValue("--dock-p")).toBe("0.25");
    expect(screen.getByTestId("scrim").style.getPropertyValue("--dock-p")).toBe("0.25");
    expect(panel().classList.contains("k-is-held")).toBe(true);
  });

  it("commits at a quarter of the way, and settles open", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    pointer(panel(), "pointermove", { y: 590, t: 1500 });
    pointer(panel(), "pointerup", { y: 590, t: 1600 });
    expect(onChange).toHaveBeenCalledWith(true);
    expect(panel().dataset.open).toBe("true");
    expect(height()).toBe("440px");
    expect(panel().classList.contains("k-is-held")).toBe(false);
  });

  it("settles back when a slow drag falls short", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    pointer(panel(), "pointermove", { y: 640, t: 1600 });
    pointer(panel(), "pointerup", { y: 640, t: 1700 });
    expect(onChange).not.toHaveBeenCalled();
    expect(height()).toBe("40px");
  });

  it("commits a short drag that is a fast flick, and not one that is under the flick floor", () => {
    const onChange = vi.fn();
    const { unmount } = render(<Harness onChange={onChange} />);
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    pointer(panel(), "pointermove", { y: 670, t: 1040 });
    pointer(panel(), "pointerup", { y: 670, t: 1050 });
    expect(onChange).toHaveBeenCalledWith(true);
    unmount();
    onChange.mockClear();
    render(<Harness onChange={onChange} />);
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    pointer(panel(), "pointermove", { y: 690, t: 1010 });
    pointer(panel(), "pointerup", { y: 690, t: 1015 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("follows a push past the open height a fifth of the way, at most 24px", () => {
    render(<Harness start />);
    pointer(screen.getByTestId("head"), "pointerdown", { y: 500, t: 1000 });
    pointer(screen.getByTestId("head"), "pointermove", { y: 400, t: 1200 });
    expect(height()).toBe("460px");
    pointer(screen.getByTestId("head"), "pointermove", { y: 100, t: 1400 });
    expect(height()).toBe("464px");
  });

  it("closes the open panel by a drag down on its head, and only from its head", () => {
    const onChange = vi.fn();
    render(<Harness start onChange={onChange} />);
    pointer(screen.getByTestId("inside"), "pointerdown", { y: 300, t: 1000 });
    pointer(screen.getByTestId("inside"), "pointermove", { y: 450, t: 1500 });
    pointer(screen.getByTestId("inside"), "pointerup", { y: 450, t: 1600 });
    expect(onChange).not.toHaveBeenCalled();
    pointer(screen.getByTestId("head"), "pointerdown", { y: 300, t: 2000 });
    pointer(screen.getByTestId("head"), "pointermove", { y: 450, t: 2500 });
    pointer(screen.getByTestId("head"), "pointerup", { y: 450, t: 2600 });
    expect(onChange).toHaveBeenCalledWith(false);
    expect(height()).toBe("40px");
  });

  it("lets the open content go once the closed panel has settled", () => {
    render(<Harness start />);
    expect(panel().dataset.live).toBe("true");
    pointer(screen.getByTestId("head"), "pointerdown", { y: 300, t: 1000 });
    pointer(screen.getByTestId("head"), "pointermove", { y: 450, t: 1500 });
    pointer(screen.getByTestId("head"), "pointerup", { y: 450, t: 1600 });
    expect(panel().dataset.live).toBe("true");
    passed(220);
    expect(panel().dataset.live).toBe("false");
  });

  it("swallows the click that ends a drag, and not a tap's", () => {
    const onClick = vi.fn();
    render(<Harness />);
    screen.getByTestId("inside").addEventListener("click", onClick);
    pointer(screen.getByTestId("inside"), "pointerdown", { y: 700, t: 1000 });
    pointer(screen.getByTestId("inside"), "pointermove", { y: 600, t: 1200 });
    pointer(screen.getByTestId("inside"), "pointerup", { y: 600, t: 1250 });
    act(() => { screen.getByTestId("inside").click(); });
    expect(onClick).not.toHaveBeenCalled();
    passed(1);
    pointer(screen.getByTestId("inside"), "pointerdown", { y: 700, t: 3000 });
    pointer(screen.getByTestId("inside"), "pointerup", { y: 700, t: 3050 });
    act(() => { screen.getByTestId("inside").click(); });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("vibrates when a drag commits", () => {
    const vibrate = vi.fn();
    navigator.vibrate = vibrate;
    render(<Harness />);
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    pointer(panel(), "pointermove", { y: 590, t: 1500 });
    pointer(panel(), "pointerup", { y: 590, t: 1600 });
    expect(vibrate).toHaveBeenCalledWith(15);
    delete navigator.vibrate;
  });

  it("hands a press held for 500ms with no drag to onHold, vibrates, and swallows the click that ends it", () => {
    const vibrate = vi.fn();
    navigator.vibrate = vibrate;
    const onHold = vi.fn(() => true);
    const onClick = vi.fn();
    render(<Harness onHold={onHold} />);
    screen.getByTestId("inside").addEventListener("click", onClick);
    pointer(screen.getByTestId("inside"), "pointerdown", { y: 700, t: 1000 });
    passed(499);
    expect(onHold).not.toHaveBeenCalled();
    passed(1);
    expect(onHold).toHaveBeenCalledTimes(1);
    expect(onHold.mock.calls[0][0].target).toBe(screen.getByTestId("inside"));
    expect(vibrate).toHaveBeenCalledWith(15);
    pointer(screen.getByTestId("inside"), "pointerup", { y: 700, t: 1600 });
    act(() => { screen.getByTestId("inside").click(); });
    expect(onClick).not.toHaveBeenCalled();
    delete navigator.vibrate;
  });

  it("does not hold a press that travels, nor one onHold refuses", () => {
    const vibrate = vi.fn();
    navigator.vibrate = vibrate;
    const onHold = vi.fn(() => false);
    render(<Harness onHold={onHold} />);
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    passed(500);
    expect(onHold).toHaveBeenCalledTimes(1);
    expect(vibrate).not.toHaveBeenCalled();
    pointer(panel(), "pointerup", { y: 700, t: 1600 });
    onHold.mockClear();
    pointer(panel(), "pointerdown", { y: 700, t: 2000 });
    pointer(panel(), "pointermove", { y: 650, t: 2100 });
    passed(600);
    expect(onHold).not.toHaveBeenCalled();
    delete navigator.vibrate;
  });

  it("slides the closed panel away on a sideways swipe when it is given onAway, and ignores one otherwise", () => {
    const onAway = vi.fn();
    const { unmount } = render(<Harness onAway={onAway} />);
    pointer(panel(), "pointerdown", { x: 300, y: 700, t: 1000 });
    pointer(panel(), "pointermove", { x: 100, y: 702, t: 1300 });
    expect(panel().style.transform).toBe("translateX(-200px)");
    pointer(panel(), "pointerup", { x: 100, y: 702, t: 1400 });
    expect(onAway).not.toHaveBeenCalled();
    passed(180);
    expect(onAway).toHaveBeenCalledTimes(1);
    unmount();
    render(<Harness />);
    pointer(panel(), "pointerdown", { x: 300, y: 700, t: 1000 });
    pointer(panel(), "pointermove", { x: 100, y: 702, t: 1300 });
    expect(panel().style.transform).toBe("");
  });

  it("draws the open content as soon as a press lands when eager, and once a drag begins when not", () => {
    const { unmount } = render(<Harness />);
    passed(220);
    expect(panel().dataset.live).toBe("false");
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    expect(panel().dataset.live).toBe("true");
    unmount();
    render(<Harness eager={false} />);
    passed(220);
    expect(panel().dataset.live).toBe("false");
    pointer(panel(), "pointerdown", { y: 700, t: 1000 });
    expect(panel().dataset.live).toBe("false");
    pointer(panel(), "pointermove", { y: 650, t: 1100 });
    expect(panel().dataset.live).toBe("true");
  });

  it("pulls the open panel down from a body scrolled to its top, and leaves a body that has scrolled", () => {
    const onChange = vi.fn();
    render(<Harness start onChange={onChange} />);
    const body = screen.getByTestId("body");
    body.scrollTop = 40;
    touch(body, "touchstart", { y: 300, t: 1000 });
    touch(body, "touchmove", { y: 450, t: 1100 });
    touch(body, "touchend", { t: 1200 });
    expect(onChange).not.toHaveBeenCalled();
    body.scrollTop = 0;
    touch(body, "touchstart", { y: 300, t: 2000 });
    touch(body, "touchmove", { y: 330, t: 2100 });
    expect(height()).toBe("410px");
    touch(body, "touchmove", { y: 450, t: 2400 });
    touch(body, "touchend", { t: 2500 });
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("keeps a touch that starts on what pullIgnore names", () => {
    const onChange = vi.fn();
    render(<Harness start onChange={onChange} pullIgnore="[data-testid=inside]" />);
    const body = screen.getByTestId("body");
    touch(screen.getByTestId("inside"), "touchstart", { y: 300, t: 1000 });
    touch(screen.getByTestId("inside"), "touchmove", { y: 450, t: 1100 });
    touch(screen.getByTestId("inside"), "touchend", { t: 1200 });
    expect(onChange).not.toHaveBeenCalled();
    expect(body).toBeTruthy();
  });
});
