import React from "react";
import { Button, Dialog } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

const LINES = Array.from({ length: 120 }, (_, i) => "2026-10-14 12:00:" + String(i % 60).padStart(2, "0") + "  line " + (i + 1) + " of the feed");

function Feed() {
  return (
    <div data-testid="own-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", font: "12px/1.6 var(--font-mono)", border: "var(--edge)", borderRadius: "var(--r-sm)", padding: 8 }}>
      {LINES.map((l) => <div key={l}>{l}</div>)}
    </div>
  );
}

export default function FullscreenSection() {
  const [open, setOpen] = React.useState(null);
  const close = () => setOpen(null);
  return (
    <Section id="fullscreen" title="Dialog fullscreen">
      <Sub title="Scrolling body, and a self-sizing body with fill">
        <div style={row}>
          <Button onClick={() => setOpen("scroll")}>Fullscreen, body scrolls</Button>
          <Button onClick={() => setOpen("fill")}>Fullscreen + fill, child scrolls</Button>
        </div>
      </Sub>
      {open === "scroll" && (
        <Dialog fullscreen title="Console" icon="terminal" sub="The body scrolls." onClose={close}
          foot={<Button variant="outline" onClick={close}>Restore</Button>}>
          {LINES.map((l) => <div key={l} style={{ font: "12px/1.6 var(--font-mono)" }}>{l}</div>)}
        </Dialog>
      )}
      {open === "fill" && (
        <Dialog fullscreen fill title="Console" icon="terminal" onClose={close}>
          <Feed />
        </Dialog>
      )}
    </Section>
  );
}
