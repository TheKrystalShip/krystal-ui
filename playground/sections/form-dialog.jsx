import React from "react";
import { Button, FormDialog, FormField, Notice, useForm } from "@thekrystalship/krystal";
import { Section, Sub, row } from "../kit.jsx";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function Add({ onClose, withNotice }) {
  const form = useForm({
    defaultValues: { username: "", status: "active" },
    rules: { username: { required: true } },
    onSubmit: async (v) => {
      await wait(600);
      if (v.username === "taken") return { message: "That username is taken." };
      onClose();
    },
  });
  return (
    <FormDialog form={form} title="Add an account" icon="user-plus" onClose={onClose} submit="Create" busyLabel="Creating…"
      notice={withNotice ? <Notice tone="warn" icon="lock">Changing accounts needs a recent sign-in.</Notice> : undefined}>
      <FormField name="username" label="Username" control="input" autoCapitalize="off" spellCheck="false" autoFocus
        hint='"taken" is refused; submit empty to see the field error.' />
      <FormField name="status" label="Status" control="select">
        <option value="active">Active</option>
        <option value="pending">Awaiting approval</option>
      </FormField>
    </FormDialog>
  );
}

export default function FormDialogSection() {
  const [open, setOpen] = React.useState(null);
  return (
    <Section id="form-dialog" title="FormDialog">
      <Sub title="The form's own error, and a notice of the site's own">
        <div style={row}>
          <Button onClick={() => setOpen("plain")}>Add an account</Button>
          <Button onClick={() => setOpen("notice")}>With a notice</Button>
        </div>
      </Sub>
      {open && <Add onClose={() => setOpen(null)} withNotice={open === "notice"} />}
    </Section>
  );
}
