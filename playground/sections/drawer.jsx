import React from "react";
import { Drawer, Button, Cluster, Stack, Pill } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

export default function DrawerSection() {
  const [which, setWhich] = React.useState(null);
  const close = () => setWhich(null);
  const foot = (
    <>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button onClick={close}>Save</Button>
    </>
  );
  const lines = (n) => Array.from({ length: n }, (_, i) => <p key={i} style={{ margin: 0 }}>Line {i + 1} of the drawer's body.</p>);
  return (
    <Section id="drawer" title="Drawer">
      <Sub title="Sides, sizes and states">
        <Cluster gap="sm">
          <Button onClick={() => setWhich("bottom")}>Bottom</Button>
          <Button onClick={() => setWhich("right")}>Right</Button>
          <Button onClick={() => setWhich("left")}>Left</Button>
          <Button onClick={() => setWhich("lg")}>Right, lg</Button>
          <Button onClick={() => setWhich("tall")}>Bottom, fill, long body</Button>
          <Button onClick={() => setWhich("locked")}>Cannot close</Button>
        </Cluster>
      </Sub>
      <Sub title="Back, action, menu role, forced theme, contained">
        <Cluster gap="sm">
          <Button onClick={() => setWhich("nested")}>Back and action</Button>
          <Button onClick={() => setWhich("menu")}>Menu role</Button>
          <Button onClick={() => setWhich("dark")}>Dark palette</Button>
          <Button onClick={() => setWhich("light")}>Light palette</Button>
          <Button onClick={() => setWhich("head")}>Own head</Button>
          <Button onClick={() => setWhich("contained")}>Contained in a frame</Button>
        </Cluster>
        <div id="drawer-frame" style={{ position: "relative", marginTop: 12, maxWidth: 520, height: 280, overflow: "hidden", background: "var(--surface-2)", display: "grid", placeItems: "center" }}>
          <Button id="frame-button">A control in the frame</Button>
          {which === "contained" && (
            <Drawer contained title="Quality" back={{ label: "Back to the menu", onClick: close }} onClose={close}>
              <Stack gap="sm"><Button variant="ghost" data-autofocus>Auto</Button><Button variant="ghost">1080p</Button><Button variant="ghost">720p</Button></Stack>
            </Drawer>
          )}
        </div>
      </Sub>
      {which === "bottom" && <Drawer title="Bottom" icon="download" sub="A sheet from the bottom edge." onClose={close} foot={foot}><Stack gap="sm">{lines(3)}</Stack></Drawer>}
      {which === "right" && <Drawer side="right" title="Right" sub="A panel from the right edge." onClose={close} foot={foot}><Stack gap="sm">{lines(3)}</Stack></Drawer>}
      {which === "left" && <Drawer side="left" title="Left" onClose={close}><Stack gap="sm">{lines(3)}</Stack></Drawer>}
      {which === "lg" && <Drawer side="right" size="lg" title="Right, lg" onClose={close} foot={foot}>{lines(2)}</Drawer>}
      {which === "tall" && <Drawer fill title="Fill" onClose={close} foot={foot}><Stack gap="sm">{lines(40)}</Stack></Drawer>}
      {which === "nested" && (
        <Drawer title="Subtitles" back={{ label: "Back to settings", onClick: close }} action={<Pill tone="info">3 tracks</Pill>} onClose={close}>
          <Stack gap="sm">{lines(3)}</Stack>
        </Drawer>
      )}
      {which === "menu" && (
        <Drawer role="menu" title="Save to" onClose={close}>
          <Stack gap="sm">
            {["Watchlist", "Favourites", "Weekend"].map((n) => <Button key={n} variant="ghost" role="menuitem" data-autofocus={n === "Watchlist" ? "" : undefined}>{n}</Button>)}
          </Stack>
        </Drawer>
      )}
      {which === "dark" && <Drawer theme="dark" title="Always dark" sub="Reads the dark palette whatever the page's." onClose={close} foot={foot}><Stack gap="sm">{lines(2)}</Stack></Drawer>}
      {which === "light" && <Drawer theme="light" title="Always light" sub="Reads the light palette whatever the page's." onClose={close} foot={foot}><Stack gap="sm">{lines(2)}</Stack></Drawer>}
      {which === "head" && (
        <Drawer label="Own head" onClose={close} head={<div style={{ padding: "16px 20px", fontWeight: 700 }}>A head of the site's own</div>}>
          <Stack gap="sm">{lines(2)}</Stack>
        </Drawer>
      )}
      {which === "locked" && (
        <Drawer title="Cannot close" onClose={close} canClose={false} foot={<Button onClick={() => setWhich(null)}>Done</Button>}>
          Escape, the scrim and the close button are held off.
        </Drawer>
      )}
    </Section>
  );
}
