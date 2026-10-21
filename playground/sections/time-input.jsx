import React from "react";
import { Field, TimeInput } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

export default function TimeInputSection() {
  const [time, setTime] = React.useState("21:15");
  return (
    <Section id="time-input" title="TimeInput">
      <Sub title="Sizes">
        <div style={row}>
          <TimeInput size="sm" label="Small" value={time} onChange={setTime} />
          <TimeInput label="Medium" value={time} onChange={setTime} />
          <TimeInput size="lg" label="Large" value={time} onChange={setTime} />
          <code>{time || "none"}</code>
        </div>
      </Sub>
      <Sub title="Empty, invalid, disabled, and in a Field">
        <div style={row}>
          <TimeInput label="Empty" />
          <TimeInput label="Invalid" value="17:30" invalid />
          <TimeInput label="Disabled" value="04:30" disabled />
        </div>
        <div style={{ maxWidth: 260 }}>
          <Field label="Daily backup" hint="On the host's clock"><TimeInput label="Daily backup" minuteStep={15} value="04:30" /></Field>
        </div>
      </Sub>
    </Section>
  );
}
