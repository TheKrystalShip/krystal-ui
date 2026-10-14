import React from "react";
import { RadioGroup } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

const OPTS = [
  { value: "auto", label: "Auto" },
  { value: "1080", label: "1080p" },
  { value: "720", label: "720p" },
  { value: "480", label: "480p", disabled: true },
];
const ICONS = [
  { value: "list", label: "List", icon: "list" },
  { value: "grid", label: "Grid", icon: "layout-grid" },
  { value: "cols", label: "Columns", icon: "columns-3" },
];

const SWATCHES = [
  { value: "#ffffff", label: "White", color: "#ffffff" },
  { value: "#ffd400", label: "Yellow", color: "#ffd400" },
  { value: "#00e5ff", label: "Cyan", color: "#00e5ff" },
  { value: "#ff4081", label: "Pink", color: "#ff4081" },
];

export default function RadiosSection() {
  const [a, setA] = React.useState("auto");
  const [b, setB] = React.useState("1080");
  const [c, setC] = React.useState("grid");
  const [hue, setHue] = React.useState("#ffd400");
  return (
    <Section id="radios" title="RadioGroup">
      <Sub title="Radio, horizontal (md and sm)">
        <div style={row}><RadioGroup label="Quality" options={OPTS} value={a} onChange={setA} /></div>
        <div style={row}><RadioGroup size="sm" label="Quality small" options={OPTS} value={a} onChange={setA} /></div>
      </Sub>
      <Sub title="Radio, vertical">
        <RadioGroup orientation="vertical" label="Quality stacked" options={OPTS} value={b} onChange={setB} />
      </Sub>
      <Sub title="Segmented (md, sm, icons, nothing chosen, disabled group)">
        <div style={row}><RadioGroup variant="segmented" label="Quality strip" options={OPTS} value={b} onChange={setB} /></div>
        <div style={row}><RadioGroup variant="segmented" size="sm" label="View" options={ICONS} value={c} onChange={setC} /></div>
        <div style={row}><RadioGroup variant="segmented" label="Nothing chosen" options={ICONS} /></div>
        <div style={row}><RadioGroup disabled label="Disabled" options={OPTS} value="auto" /></div>
        <div style={{ maxWidth: 300 }}><RadioGroup variant="segmented" label="Overflow" options={[...OPTS, ...ICONS]} value={b} onChange={setB} /></div>
      </Sub>
      <Sub title="Swatch: a palette, with a picker for anything else (md and sm)">
        <div style={row}><RadioGroup variant="swatch" label="Text colour" picker="Another colour" options={SWATCHES} value={hue} onChange={setHue} /><code>{hue}</code></div>
        <div style={row}><RadioGroup variant="swatch" size="sm" label="Edge colour" options={SWATCHES} value="#00e5ff" /></div>
        <div style={row}><RadioGroup variant="swatch" disabled label="Disabled" options={SWATCHES} value="#ffffff" /></div>
      </Sub>
    </Section>
  );
}
