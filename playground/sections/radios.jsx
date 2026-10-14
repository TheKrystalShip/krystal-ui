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

export default function RadiosSection() {
  const [a, setA] = React.useState("auto");
  const [b, setB] = React.useState("1080");
  const [c, setC] = React.useState("grid");
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
    </Section>
  );
}
