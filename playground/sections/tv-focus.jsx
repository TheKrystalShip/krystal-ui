import React from "react";
import { Button, Dialog, TvCard, TvRow, TvTile, useSpatialFocus } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const rows = [
  { id: "long", title: "Long row", cards: 9, shape: "poster" },
  { id: "short", title: "Short row", cards: 3, shape: "poster" },
  { id: "wide", title: "Wide row", cards: 5, shape: "wide" },
];

// The navigator takes the arrow keys for the whole document, so it runs only while the demo is on.
function Demo() {
  const [dialog, setDialog] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  useSpatialFocus({ root: document.getElementById("tv-focus-demo") });
  return (
    <>
      <aside style={{ display: "grid", gap: 8, alignContent: "start", width: 110, flex: "none" }} aria-label="Side column">
        <Button id="side-a" variant="ghost" size="sm">Side A</Button>
        <Button id="side-b" variant="ghost" size="sm" aria-current="page">Side B</Button>
        <Button id="open-dialog" size="sm" onClick={() => setDialog(true)}>Open dialog</Button>
        <Button id="open-menu" size="sm" onClick={() => setMenu(true)}>Open menu</Button>
        <input id="side-text" defaultValue="abc" aria-label="Text" style={{ width: "100%", boxSizing: "border-box" }} />
        <input id="side-range" type="range" aria-label="Range" style={{ width: "100%" }} />
      </aside>
      <main style={{ minWidth: 0, flex: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 4 }}>
        {rows.map((r) => (
          <TvRow key={r.id} title={r.title} count={r.cards} end={r.id === "wide" ? <TvTile id="wide-end" shape="wide" label="More" href="#" /> : null}>
            {Array.from({ length: r.cards }, (_, i) => (
              <TvCard key={i} id={`${r.id}-${i}`} href="#" shape={r.shape} label={`${r.title} ${i + 1}`} onClick={(e) => e.preventDefault()} />
            ))}
          </TvRow>
        ))}
      </main>
      {menu && (
        <div role="menu" aria-label="Plain overlay" style={{ position: "fixed", top: 120, right: 40, display: "grid", gap: 6, padding: 12, background: "var(--surface-2)", zIndex: 60 }}>
          <button id="menu-a" role="menuitem" type="button" aria-checked="false">Alpha</button>
          <button id="menu-b" role="menuitem" type="button" aria-checked="true">Beta</button>
          <button id="menu-close" role="menuitem" type="button" onClick={() => setMenu(false)}>Close</button>
        </div>
      )}
      {dialog && (
        <Dialog title="Trapped" onClose={() => setDialog(false)} foot={<Button id="dlg-close" onClick={() => setDialog(false)}>Close</Button>}>
          <Button id="dlg-a" variant="ghost">First</Button>
          <Button id="dlg-b" variant="ghost">Second</Button>
        </Dialog>
      )}
    </>
  );
}

export default function TvFocusSection() {
  const [on, setOn] = React.useState(false);
  return (
    <Section id="tv-focus" title="TV spatial focus">
      <Sub title="Arrow keys move focus by geometry">
        <style>{`
          #tv-focus-demo :is(a, button):focus-visible { outline: 3px solid var(--krystal-teal); outline-offset: 3px; }
          #tv-focus-demo {
            --tv-poster-w: 90px; --tv-poster-h: 135px; --tv-wide-w: 160px; --tv-wide-h: 90px;
            --tv-gap: 12px; --tv-margin-x: 6px; --tv-dim: 0.7;
          }
        `}</style>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input id="tv-focus-toggle" type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
          Take the arrow keys
        </label>
        <div id="tv-focus-demo" style={{ display: "flex", gap: 20, maxWidth: 760, overflow: "hidden" }}>
          {on ? <Demo /> : <span style={{ opacity: 0.6 }}>Off.</span>}
        </div>
      </Sub>
    </Section>
  );
}
