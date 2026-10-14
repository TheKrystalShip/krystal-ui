import React from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

// A capped window: rows are 20px tall, laid out by hand because jsdom has no layout.
describe("useFollowTail with keys and an anchor", () => {
  const ROW = 20;
  const offsets = {
    offsetTop: { configurable: true, get() { return Number(this.dataset.index || 0) * ROW; } },
    offsetHeight: { configurable: true, get() { return ROW; } },
  };
  const saved = {};
  beforeAll(() => {
    for (const [k, d] of Object.entries(offsets)) {
      saved[k] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, k);
      Object.defineProperty(HTMLElement.prototype, k, d);
    }
  });
  afterAll(() => {
    for (const k of Object.keys(offsets)) {
      if (saved[k]) Object.defineProperty(HTMLElement.prototype, k, saved[k]); else delete HTMLElement.prototype[k];
    }
  });

  function Feed({ ids }) {
    const ref = React.useRef(null);
    const tail = useFollowTail(ref, { threshold: 10, keys: ids, anchorAttribute: "data-k" });
    return (
      <div>
        <div ref={ref} data-testid="feed" onScroll={tail.onScroll}>
          {ids.map((id, i) => <p key={id} data-k={id} data-index={i}>{id}</p>)}
        </div>
        <output data-testid="unread">{tail.unread}</output>
        <output data-testid="bottom">{String(tail.atBottom)}</output>
      </div>
    );
  }
  const window_ = (from, to) => Array.from({ length: to - from }, (_, i) => "k" + (from + i));
  const park = (feed, top, rows) => {
    Object.defineProperty(feed, "scrollHeight", { configurable: true, get: () => rows * ROW });
    Object.defineProperty(feed, "clientHeight", { configurable: true, get: () => 100 });
    feed.scrollTop = top;
    act(() => { feed.dispatchEvent(new Event("scroll", { bubbles: true })); });
  };

  it("holds the visible row still when rows are trimmed off the top, and counts the arrivals", () => {
    const { rerender } = render(<Feed ids={window_(0, 30)} />);
    const feed = screen.getByTestId("feed");
    park(feed, 200, 30); // k10 is the top row, at offset 0
    expect(screen.getByTestId("bottom").textContent).toBe("false");

    rerender(<Feed ids={window_(2, 32)} />); // two trimmed off the top, two arrived: same length
    expect(feed.scrollTop).toBe(160); // k10 is now index 8
    expect(screen.getByTestId("unread").textContent).toBe("2");

    rerender(<Feed ids={window_(3, 33)} />);
    expect(feed.scrollTop).toBe(140);
    expect(screen.getByTestId("unread").textContent).toBe("3");
  });

  it("reports the whole window unread, at the top, when the row being read is trimmed away", () => {
    const { rerender } = render(<Feed ids={window_(0, 30)} />);
    const feed = screen.getByTestId("feed");
    park(feed, 200, 30);
    rerender(<Feed ids={window_(40, 70)} />);
    expect(feed.scrollTop).toBe(0);
    expect(screen.getByTestId("unread").textContent).toBe("30");
  });

  it("follows and counts nothing while at the bottom", () => {
    const { rerender } = render(<Feed ids={window_(0, 30)} />);
    rerender(<Feed ids={window_(1, 31)} />);
    expect(screen.getByTestId("unread").textContent).toBe("0");
    expect(screen.getByTestId("bottom").textContent).toBe("true");
  });
});
