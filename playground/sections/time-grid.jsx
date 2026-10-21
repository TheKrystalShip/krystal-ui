import React from "react";
import { TimeGrid } from "@thekrystalship/krystal";
import { Section, Sub, col } from "../kit.jsx";

export default function TimeGridSection() {
  const [one, setOne] = React.useState(null);
  const [many, setMany] = React.useState(["20:00", "21:30"]);
  return (
    <Section id="time-grid" title="TimeGrid">
      <Sub title="From the first step after now to the end of the day">
        <div style={{ ...col, maxWidth: 560 }}><TimeGrid label="Start" value={one} onChange={setOne} empty="No time left today" /></div>
      </Sub>
      <Sub title="Several times, with earlier ones disabled, seven across">
        <div style={{ ...col, maxWidth: 560 }}>
          <TimeGrid label="Start times" multiple from="17:00" to="23:30" min="18:30" columns={7} value={many} onChange={setMany} />
          <code>{many.join(", ") || "none"}</code>
        </div>
      </Sub>
    </Section>
  );
}
