import React from "react";
import { Drawer, Button, Cluster, Stack } from "@thekrystalship/krystal";
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
      {which === "bottom" && <Drawer title="Bottom" icon="download" sub="A sheet from the bottom edge." onClose={close} foot={foot}><Stack gap="sm">{lines(3)}</Stack></Drawer>}
      {which === "right" && <Drawer side="right" title="Right" sub="A panel from the right edge." onClose={close} foot={foot}><Stack gap="sm">{lines(3)}</Stack></Drawer>}
      {which === "left" && <Drawer side="left" title="Left" onClose={close}><Stack gap="sm">{lines(3)}</Stack></Drawer>}
      {which === "lg" && <Drawer side="right" size="lg" title="Right, lg" onClose={close} foot={foot}>{lines(2)}</Drawer>}
      {which === "tall" && <Drawer fill title="Fill" onClose={close} foot={foot}><Stack gap="sm">{lines(40)}</Stack></Drawer>}
      {which === "locked" && (
        <Drawer title="Cannot close" onClose={close} canClose={false} foot={<Button onClick={() => setWhich(null)}>Done</Button>}>
          Escape, the scrim and the close button are held off.
        </Drawer>
      )}
    </Section>
  );
}
