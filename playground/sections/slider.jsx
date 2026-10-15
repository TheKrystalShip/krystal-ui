import React from "react";
import { Slider } from "@thekrystalship/krystal";
import { Section, Sub, col } from "../kit.jsx";

const pct = (v) => v + "%";

export default function SliderSection() {
  const [vol, setVol] = React.useState(40);
  const [committed, setCommitted] = React.useState(40);
  const [ram, setRam] = React.useState(8);
  return (
    <Section id="slider" title="Slider">
      <Sub title={"Controlled with showValue; onChangeEnd committed: " + committed}>
        <div style={col}>
          <Slider label="Volume" value={vol} onChange={setVol} onChangeEnd={setCommitted} format={pct} showValue />
          <Slider size="sm" label="Volume small" value={vol} onChange={setVol} format={pct} showValue />
        </div>
      </Sub>
      <Sub title="Marks with labels, step 4, custom format">
        <div style={col}>
          <Slider label="Memory" min={4} max={32} step={4} value={ram} onChange={setRam} format={(v) => v + " GB"} showValue
            marks={[{ value: 4, label: "4" }, { value: 16, label: "16" }, { value: 32, label: "32" }]} />
        </div>
      </Sub>
      <Sub title="On a television (data-tv) only Left and Right move the thumb">
        <div style={col}>
          <button type="button" onClick={() => document.documentElement.toggleAttribute("data-tv")}>Toggle data-tv</button>
          <Slider label="Television" defaultValue={30} showValue format={pct} />
        </div>
      </Sub>
      <Sub title="Uncontrolled with unlabelled marks, decimals, disabled">
        <div style={col}>
          <Slider label="Opacity" min={0} max={1} step={0.1} defaultValue={0.5} marks={[0, 0.25, 0.5, 0.75, 1]} showValue />
          <Slider label="Locked" defaultValue={60} disabled showValue format={pct} />
        </div>
      </Sub>
    </Section>
  );
}
