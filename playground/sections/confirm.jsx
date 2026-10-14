import React from "react";
import { Button, ConfirmDialog, Notice } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = {
  ok: { tone: "danger", icon: "trash-2", title: "Remove this client?", confirm: "Remove client", busyLabel: "Removing…", run: async () => { await wait(900); } },
  refuse: { tone: "danger", icon: "trash-2", title: "Remove this node?", confirm: "Remove", busyLabel: "Working…", run: async () => { await wait(700); return { refusal: "The node holds a capability for the cluster. Reassign it first." }; } },
  node: { tone: "danger", icon: "trash-2", title: "Remove this account?", confirm: "Remove", busyLabel: "Working…", run: async () => { await wait(500); return { refusal: <Notice tone="warn" icon="lock">Removing an account needs a recent sign-in. <a href="#confirm">Sign in again</a></Notice> }; } },
  reject: { tone: "neutral", icon: "refresh-cw", title: "Make a new secret?", confirm: "Make a new secret", busyLabel: "Working…", run: async () => { await wait(500); throw new Error("The provider did not answer."); } },
};

export default function ConfirmSection() {
  const [open, setOpen] = React.useState(null);
  const c = open && CASES[open];
  return (
    <Section id="confirm" title="ConfirmDialog">
      <Sub title="Resolves, is refused, rejects">
        <div style={row}>
          <Button variant="danger" onClick={() => setOpen("ok")}>Succeeds</Button>
          <Button onClick={() => setOpen("refuse")}>Refused</Button>
          <Button onClick={() => setOpen("node")}>Refused with a node</Button>
          <Button onClick={() => setOpen("reject")}>Rejects</Button>
        </div>
      </Sub>
      {c && (
        <ConfirmDialog title={c.title} icon={c.icon} tone={c.tone} confirm={c.confirm} busyLabel={c.busyLabel}
          onConfirm={c.run} onClose={() => setOpen(null)}>
          <p>Anything that signed in through it stops working at once.</p>
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      )}
    </Section>
  );
}
