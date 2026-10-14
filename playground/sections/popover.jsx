import React from "react";
import { Button, Checkbox, Dialog, Field, IconButton, Input, Popover } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

const PLACEMENTS = ["bottom-start", "bottom-end", "top-start", "right-start", "left-start"];

export default function PopoverSection() {
  const [open, setOpen] = React.useState(false);
  const [dialog, setDialog] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(false);
  const anchor = React.useRef(null);
  return (
    <Section id="popover" title="Popover">
      <Sub title="Trigger, title and form content (Done closes it)">
        <div style={row}>
          <Popover trigger={<Button variant="outline" icon="sliders-horizontal">Filters</Button>} title="Filters">
            {({ close }) => (
              <div style={{ display: "grid", gap: 10, padding: 14, width: 260 }}>
                <Checkbox checked={a} onChange={setA}>Online only</Checkbox>
                <Checkbox checked={b} onChange={setB}>Has players</Checkbox>
                <Field label="Name"><Input wide value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                <Button size="sm" variant="primary" onClick={close}>Done</Button>
              </div>
            )}
          </Popover>
          <Popover trigger={<IconButton icon="info" label="About" />} label="About this page">
            <p style={{ margin: 0, padding: 14, maxWidth: 240 }}>A popover with no title takes its name from <code>label</code>.</p>
          </Popover>
        </div>
      </Sub>
      <Sub title="Placement">
        <div style={{ ...row, gap: 8, padding: "60px 120px" }}>
          {PLACEMENTS.map((p) => (
            <Popover key={p} placement={p} trigger={<Button size="sm" variant="secondary">{p}</Button>} label={p}>
              <div style={{ padding: 12 }}>{p}</div>
            </Popover>
          ))}
        </div>
      </Sub>
      <Sub title="Controlled, anchored to another element">
        <div style={row}>
          <span ref={anchor} style={{ padding: "6px 10px", border: "1px dashed currentColor", borderRadius: 4 }}>anchor</span>
          <Button size="sm" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Open"}</Button>
          <Popover open={open} onOpenChange={setOpen} anchorRef={anchor} title="Controlled">
            <div style={{ padding: 14 }}>Open is the caller's.</div>
          </Popover>
        </div>
      </Sub>
      <Sub title="Inside a dialog (Escape closes the popover, then the dialog)">
        <Button onClick={() => setDialog(true)}>Open dialog</Button>
        {dialog && (
          <Dialog title="A dialog" onClose={() => setDialog(false)}>
            <Popover trigger={<Button variant="outline">Options</Button>} title="Options">
              <div style={{ padding: 14 }}>Escape closes this first.</div>
            </Popover>
          </Dialog>
        )}
      </Sub>
    </Section>
  );
}
