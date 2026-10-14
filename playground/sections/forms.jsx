import React from "react";
import { Button, Dialog, Form, FormError, FormField, FormScope, FormSubmit, Notice, useForm } from "@thekrystalship/krystal";
import { Section, Sub, col, row } from "../kit.jsx";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// A sign-in: required fields, a form-level error from a refused credential.
function SignIn() {
  const [done, setDone] = React.useState(null);
  const form = useForm({
    defaultValues: { username: "", password: "" },
    rules: { username: { required: "Enter your username" }, password: { required: "Enter your password" } },
    onSubmit: async (v) => {
      await wait(500);
      if (v.password !== "krystal") return { message: "That username and password do not match." };
      setDone(v.username);
    },
  });
  return (
    <div style={col}>
      <Form form={form} data-testid="signin">
        <FormField name="username" label="Username" autoComplete="username" />
        <FormField name="password" label="Password" control="password" autoComplete="current-password"
          aside="the password is krystal" />
        <FormSubmit busyLabel="Signing in…" wide>Sign in</FormSubmit>
      </Form>
      {done && <Notice tone="ok">Signed in as {done}.</Notice>}
    </div>
  );
}

const SIZES = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
];
const TOPPINGS = [
  { value: "a", label: "Anchovies", detail: "salty" },
  { value: "b", label: "Basil" },
  { value: "c", label: "Capers", aside: "12 g" },
];

// Every control, with rules, a hint, requireDirty and the values it holds.
function Settings() {
  const form = useForm({
    defaultValues: { name: "Krystal", bio: "", port: "8080", size: "m", notify: true, beta: false, plan: "b", extras: ["a"] },
    rules: {
      name: { required: true, maxLength: 12 },
      port: { required: true, min: { value: 1024, message: "Ports start at 1024" }, max: 65535, pattern: /^\d+$/ },
      bio: { maxLength: 60 },
    },
    onSubmit: async (v) => { await wait(400); form.reset(v); },
  });
  return (
    <div style={col}>
      <Form form={form}>
        <FormField name="name" label="Name" aside={form.values.name.length + "/12"} />
        <FormField name="port" label="Port" control="input" type="number" mono hint="Between 1024 and 65535" />
        <FormField name="bio" label="Bio" control="textarea" rows={3} hint="Optional" />
        <FormField name="size" label="Size" control="select" options={SIZES} />
        <FormField name="plan" label="Plan" control="options" options={[
          { value: "a", label: "Free" }, { value: "b", label: "Pro", aside: "9/mo" }, { value: "c", label: "Team" },
        ]} />
        <FormField name="extras" label="Extras" control="options" multiple options={TOPPINGS} />
        <FormField name="notify" label="Tell me when it finishes" control="checkbox" />
        <FormField name="beta" label="Beta features" control="toggle" />
        <div style={row}>
          <FormSubmit requireDirty busyLabel="Saving…">Save</FormSubmit>
          <Button onClick={() => form.reset()} disabled={!form.isDirty}>Revert</Button>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{form.isDirty ? "unsaved" : "saved"}</span>
        </div>
      </Form>
    </div>
  );
}

// A server that answers with field errors and a message, as a 400 would, or throws.
function ServerErrors() {
  const form = useForm({
    defaultValues: { handle: "", email: "" },
    rules: { handle: { required: true }, email: { required: true } },
    onSubmit: async (v) => {
      await wait(500);
      if (v.handle === "boom") throw new Error("The server is not feeling well.");
      if (v.handle === "taken" || !v.email.includes("@")) {
        return {
          errors: {
            ...(v.handle === "taken" ? { handle: "That handle is taken." } : {}),
            ...(!v.email.includes("@") ? { email: "That is not an address." } : {}),
          },
          message: "The server refused the form.",
        };
      }
    },
  });
  return (
    <div style={col}>
      <Form form={form}>
        <FormField name="handle" label="Handle" hint={'Try "taken", or "boom" to throw'} />
        <FormField name="email" label="Email" type="email" />
        <FormSubmit busyLabel="Sending…">Send</FormSubmit>
      </Form>
    </div>
  );
}

// Async validation on a custom-placed form error, a render-function control, and mode "touched".
function Async() {
  const form = useForm({
    defaultValues: { name: "", again: "", pick: 3 },
    mode: "touched",
    rules: { name: { required: true, minLength: 3 } },
    validate: {
      name: async (v) => { await wait(300); return v === "admin" ? "That name is reserved." : undefined; },
      again: (v, all) => (v && v !== all.name ? "Does not match" : undefined),
    },
    onSubmit: () => ({ message: "Nothing was saved; this is a playground." }),
  });
  return (
    <div style={col}>
      <Form form={form}>
        <FormField name="name" label="Name" hint={'"admin" is checked asynchronously'} />
        <FormField name="again" label="Name again" />
        <FormField name="pick" label="Pick a number" control={({ value, onChange, onBlur, describedBy }) => (
          <div style={row}>
            {[1, 2, 3].map((n) => (
              <Button key={n} pressed={value === n} onBlur={onBlur} aria-describedby={describedBy}
                onClick={() => onChange(n)}>{n}</Button>
            ))}
          </div>
        )} />
        <FormSubmit>Check</FormSubmit>
        <FormError />
      </Form>
    </div>
  );
}

// A dialog is the form element itself: FormScope carries the handle, the dialog submits it.
function InDialog() {
  const [open, setOpen] = React.useState(false);
  const form = useForm({
    defaultValues: { name: "" },
    rules: { name: { required: "A name is needed" } },
    onSubmit: async () => { await wait(300); setOpen(false); },
  });
  return (
    <>
      <Button onClick={() => { form.reset(); setOpen(true); }}>Rename…</Button>
      {open && (
        <FormScope form={form}>
          <Dialog title="Rename" as="form" onSubmit={form.submit} onClose={() => setOpen(false)}
            canClose={!form.isSubmitting}
            foot={(
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <FormSubmit busyLabel="Saving…">Save</FormSubmit>
              </>
            )}>
            <FormError />
            <FormField name="name" label="Name" autoFocus />
          </Dialog>
        </FormScope>
      )}
    </>
  );
}

export default function FormsSection() {
  return (
    <Section id="forms" title="Forms">
      <Sub title="Sign-in: required fields, a refused credential as the form error"><SignIn /></Sub>
      <Sub title="Settings: every control, rules, requireDirty, reset"><Settings /></Sub>
      <Sub title="Server field errors and a thrown error"><ServerErrors /></Sub>
      <Sub title="Async and cross-field validation, a render-function control, FormError placed"><Async /></Sub>
      <Sub title="Inside a dialog"><InDialog /></Sub>
    </Section>
  );
}
