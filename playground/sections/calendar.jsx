import React from "react";
import { Calendar } from "@thekrystalship/krystal";
import { addDays, dateKey } from "@thekrystalship/krystal/lib/datetime";
import { Section, Sub, row } from "../kit.jsx";

const box = { width: 300, padding: 14, border: "var(--edge)", borderRadius: "var(--r-sm)", background: "var(--surface-1)" };

export default function CalendarSection() {
  const today = dateKey(new Date());
  const [day, setDay] = React.useState(addDays(today, 2));
  return (
    <Section id="calendar" title="Calendar">
      <Sub title="A month to pick from, inside a range, with marked days">
        <div style={row}>
          <div style={box}>
            <Calendar value={day} onChange={setDay} min={today} max={addDays(today, 30)}
              marked={[addDays(today, 2), addDays(today, 9), addDays(today, 16)]} />
          </div>
          <code>{day}</code>
        </div>
      </Sub>
      <Sub title="Sunday first, in another locale">
        <div style={box}><Calendar locale="es-ES" weekStartsOn={0} value={day} onChange={setDay} /></div>
      </Sub>
    </Section>
  );
}
