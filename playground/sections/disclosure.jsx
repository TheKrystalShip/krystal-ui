import React from "react";
import { Accordion, Disclosure, Pill } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const TEXT = "Content that is long enough to wrap onto a second line at phone width, so the animated height has something to measure.";

export default function DisclosureSection() {
  const [open, setOpen] = React.useState(true);
  const [multi, setMulti] = React.useState(["a"]);
  return (
    <Section id="disclosure" title="Disclosure and Accordion">
      <Sub title={"Disclosure, controlled (open: " + open + "), with icon and aside"}>
        <Disclosure summary="Advanced settings" icon="settings" aside={<Pill size="sm">3</Pill>} open={open} onOpenChange={setOpen}>
          {TEXT}
        </Disclosure>
      </Sub>
      <Sub title="Caret at the end, heading level 4, disabled">
        <div style={{ display: "grid", gap: 8 }}>
          <Disclosure summary="Caret at the end" caret="end" level={4}>{TEXT}</Disclosure>
          <Disclosure summary="Disabled" disabled>{TEXT}</Disclosure>
        </div>
      </Sub>
      <Sub title="Plain (a section head)">
        <Disclosure variant="plain" summary="Alerts" icon="bell" aside={<Pill size="sm" tone="muted">12</Pill>} defaultOpen>
          {TEXT}
        </Disclosure>
      </Sub>
      <Sub title="Accordion, single (collapsible)">
        <Accordion type="single" defaultValue="a">
          <Disclosure value="a" summary="First">{TEXT}</Disclosure>
          <Disclosure value="b" summary="Second">{TEXT}</Disclosure>
          <Disclosure value="c" summary="Third" disabled>{TEXT}</Disclosure>
          <Disclosure value="d" summary="Fourth">{TEXT}</Disclosure>
        </Accordion>
      </Sub>
      <Sub title="Accordion, single, not collapsible">
        <Accordion type="single" collapsible={false} defaultValue="a">
          <Disclosure value="a" summary="First">{TEXT}</Disclosure>
          <Disclosure value="b" summary="Second">{TEXT}</Disclosure>
        </Accordion>
      </Sub>
      <Sub title={"Accordion, multiple, controlled: " + multi.join(",")}>
        <Accordion type="multiple" value={multi} onChange={setMulti}>
          <Disclosure value="a" summary="First">{TEXT}</Disclosure>
          <Disclosure value="b" summary="Second">{TEXT}</Disclosure>
          <Disclosure value="c" summary="Third">{TEXT}</Disclosure>
        </Accordion>
      </Sub>
      <Sub title="Accordion, plain">
        <Accordion type="multiple" variant="plain" defaultValue={["a"]}>
          <Disclosure value="a" summary="First">{TEXT}</Disclosure>
          <Disclosure value="b" summary="Second">{TEXT}</Disclosure>
        </Accordion>
      </Sub>
    </Section>
  );
}
