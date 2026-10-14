import React from "react";
import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useFollowTail } from "@thekrystalship/krystal";

function Log({ lines }) {
  const ref = React.useRef(null);
  const tail = useFollowTail(ref, { threshold: 10, deps: [lines.length] });
  React.useEffect(() => { tail.onContentChange(1); }, [lines.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <div ref={ref} data-testid="log" onScroll={tail.onScroll}>{lines.map((l) => <p key={l}>{l}</p>)}</div>
      <output data-testid="unread">{tail.unread}</output>
      <output data-testid="bottom">{String(tail.atBottom)}</output>
      <button onClick={tail.scrollToBottom}>jump</button>
    </div>
  );
}

// jsdom has no layout: the scroll metrics are set by hand.
function metrics(el, { scrollHeight, clientHeight, scrollTop }) {
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => clientHeight });
  el.scrollTop = scrollTop;
}

describe("useFollowTail", () => {
  it("follows the tail while at the bottom and counts nothing unread", () => {
    const { rerender } = render(<Log lines={["a"]} />);
    rerender(<Log lines={["a", "b"]} />);
    expect(screen.getByTestId("unread").textContent).toBe("0");
    expect(screen.getByTestId("bottom").textContent).toBe("true");
  });

  it("counts new lines as unread once scrolled away, and clears on returning or jumping", () => {
    const { rerender } = render(<Log lines={["a"]} />);
    const log = screen.getByTestId("log");
    metrics(log, { scrollHeight: 1000, clientHeight: 100, scrollTop: 100 });
    act(() => { log.dispatchEvent(new Event("scroll", { bubbles: true })); });
    expect(screen.getByTestId("bottom").textContent).toBe("false");

    rerender(<Log lines={["a", "b"]} />);
    rerender(<Log lines={["a", "b", "c"]} />);
    expect(screen.getByTestId("unread").textContent).toBe("2");
    expect(log.scrollTop).toBe(100);

    metrics(log, { scrollHeight: 1000, clientHeight: 100, scrollTop: 895 });
    act(() => { log.dispatchEvent(new Event("scroll", { bubbles: true })); });
    expect(screen.getByTestId("unread").textContent).toBe("0");
    expect(screen.getByTestId("bottom").textContent).toBe("true");

    metrics(log, { scrollHeight: 1000, clientHeight: 100, scrollTop: 0 });
    act(() => { log.dispatchEvent(new Event("scroll", { bubbles: true })); });
    rerender(<Log lines={["a", "b", "c", "d"]} />);
    expect(screen.getByTestId("unread").textContent).toBe("1");
    act(() => { screen.getByRole("button", { name: "jump" }).click(); });
    expect(screen.getByTestId("unread").textContent).toBe("0");
    expect(log.scrollTop).toBe(1000);
  });
});
