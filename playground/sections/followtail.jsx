import React from "react";
import { Button, useFollowTail } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

// A feed that keeps its newest lines only: its length never changes, so the keys say what arrived.
function CappedFeed() {
  const ref = React.useRef(null);
  const [from, setFrom] = React.useState(0);
  const ids = React.useMemo(() => Array.from({ length: 30 }, (_, i) => "line-" + (from + i + 1)), [from]);
  const tail = useFollowTail(ref, { threshold: 40, keys: ids, anchorAttribute: "data-k" });
  return (
    <>
      <div style={row}>
        <Button size="sm" onClick={() => setFrom((n) => n + 1)}>Add a line (drops the oldest)</Button>
        <Button size="sm" onClick={() => setFrom((n) => n + 10)}>Add ten</Button>
        <span data-testid="capped-state" style={{ fontSize: 12, opacity: 0.7 }}>
          {tail.atBottom ? "following" : "parked"} · {tail.unread} unread
        </span>
      </div>
      <div style={{ position: "relative", maxWidth: 420 }}>
        <div ref={ref} onScroll={tail.onScroll} data-testid="capped-feed" tabIndex={0}
          style={{ height: 180, overflowY: "auto", overflowAnchor: "none", font: "12px/1.6 var(--font-mono)", padding: 8, border: "var(--edge)", borderRadius: "var(--r-sm)" }}>
          {ids.map((id) => <div key={id} data-k={id}>{id}</div>)}
        </div>
        {!tail.atBottom && (
          <Button size="xs" variant="primary" icon="arrow-down" onClick={tail.scrollToBottom}
            style={{ position: "absolute", right: 14, bottom: 10 }}>
            {tail.unread ? tail.unread + " new" : "Latest"}
          </Button>
        )}
      </div>
    </>
  );
}

export default function FollowTailSection() {
  const ref = React.useRef(null);
  const [lines, setLines] = React.useState(() => Array.from({ length: 30 }, (_, i) => "line " + (i + 1)));
  const tail = useFollowTail(ref, { threshold: 40, deps: [lines.length] });
  const add = (n) => {
    setLines((l) => [...l, ...Array.from({ length: n }, (_, i) => "line " + (l.length + i + 1))]);
    tail.onContentChange(n);
  };
  return (
    <Section id="followtail" title="useFollowTail">
      <Sub title="A feed that tails while the reader is at the bottom">
        <div style={row}>
          <Button size="sm" onClick={() => add(1)}>Add a line</Button>
          <Button size="sm" onClick={() => add(10)}>Add ten</Button>
          <span data-testid="state" style={{ fontSize: 12, opacity: 0.7 }}>
            {tail.atBottom ? "following" : "parked"} · {tail.unread} unread
          </span>
        </div>
        <div style={{ position: "relative", maxWidth: 420 }}>
          <div ref={ref} onScroll={tail.onScroll} data-testid="feed" tabIndex={0}
            style={{ height: 180, overflowY: "auto", font: "12px/1.6 var(--font-mono)", padding: 8, border: "var(--edge)", borderRadius: "var(--r-sm)" }}>
            {lines.map((l) => <div key={l}>{l}</div>)}
          </div>
          {!tail.atBottom && (
            <Button size="xs" variant="primary" icon="arrow-down" onClick={tail.scrollToBottom}
              style={{ position: "absolute", right: 14, bottom: 10 }}>
              {tail.unread ? tail.unread + " new" : "Latest"}
            </Button>
          )}
        </div>
      </Sub>
      <Sub title="A capped window: keys measure the unread count, anchorAttribute holds the line being read"><CappedFeed /></Sub>
    </Section>
  );
}
