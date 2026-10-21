import React from "react";
import { DatePicker, DateTimePicker, Field } from "@thekrystalship/krystal";
import { addDays, dateKey, momentKey, nextStep } from "@thekrystalship/krystal/lib/datetime";
import { Section, Sub, col } from "../kit.jsx";

export default function DateTimePickerSection() {
  const soonest = momentKey(nextStep(new Date(), 30));
  const latest = addDays(dateKey(new Date()), 30) + "T23:30";
  const [at, setAt] = React.useState("");
  const [day, setDay] = React.useState(dateKey(new Date()));
  return (
    <Section id="date-time-picker" title="DateTimePicker and DatePicker">
      <Sub title="A moment from the next half hour to a month ahead">
        <div style={col}>
          <Field label="Starts" hint={at || "Nothing picked"}>
            <DateTimePicker wide value={at} onChange={setAt} min={soonest} max={latest} />
          </Field>
        </div>
      </Sub>
      <Sub title="States">
        <div style={col}>
          <Field label="Small"><DateTimePicker size="sm" wide value={soonest} /></Field>
          <Field label="Invalid" error="At least five minutes from now"><DateTimePicker wide invalid value={dateKey(new Date()) + "T00:00"} /></Field>
          <Field label="Disabled"><DateTimePicker wide disabled value={soonest} /></Field>
        </div>
      </Sub>
      <Sub title="DatePicker: a day, picked in one press">
        <div style={col}>
          <Field label="Release date"><DatePicker wide clearable value={day} onChange={setDay} /></Field>
        </div>
      </Sub>
    </Section>
  );
}
