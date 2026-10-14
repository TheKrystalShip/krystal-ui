import React from "react";
import { Button, FormField, SettingsPage, ThemePicker, Toggle, useForm } from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

function Frame({ children }) {
  return (
    <div style={{ border: "var(--edge)", borderRadius: "var(--r-md)", padding: "var(--s-4)", background: "var(--surface-0)" }}>
      {children}
    </div>
  );
}

function Fields() {
  return (
    <>
      <FormField name="display" label="Display name" control="input" />
      <FormField name="email" label="Email" control="input" hint="Used for sign-in notices." />
    </>
  );
}

function WithForm() {
  const [saved, setSaved] = React.useState(null);
  const form = useForm({
    defaultValues: { display: "Ada", email: "ada@example.com", notify: true },
    rules: { display: { required: true } },
    onSubmit: async (v) => { await new Promise((r) => setTimeout(r, 600)); setSaved(v); form.reset(v); },
  });
  const sections = [
    { id: "profile", title: "Profile", icon: "user", description: "How you appear to others.", content: <div style={{ padding: 14, display: "grid", gap: 12 }}><Fields /></div> },
    { id: "notifications", title: "Notifications", icon: "bell", description: "What is sent to you.", content: <div style={{ padding: 14 }}><FormField name="notify" label="Send notices" control="toggle" /></div> },
    { id: "appearance", title: "Appearance", icon: "palette", description: "Saved on this device.", content: <ThemePicker /> },
    { id: "sessions", title: "Sessions", icon: "monitor-smartphone", rows: [{ icon: "laptop", title: "This browser", sub: "Signed in today", control: <Button size="sm" variant="outline">End</Button> }] },
    { id: "danger", title: "Danger zone", icon: "triangle-alert", rows: [{ icon: "trash-2", tone: "danger", title: "Delete account", sub: "Removes it for good.", control: <Button size="sm" variant="danger">Delete</Button> }] },
  ];
  return (
    <>
      <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.6 }}>Last saved: {saved ? JSON.stringify(saved) : "nothing yet"}. Edit a field to show the save bar.</p>
      <SettingsPage title="Settings" sub="Your account." sections={sections} form={form} />
    </>
  );
}

function Plain() {
  const [on, setOn] = React.useState(false);
  const [base, setBase] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const save = () => { setSaving(true); setTimeout(() => { setBase(on); setSaving(false); }, 600); };
  return (
    <SettingsPage title="Preferences" dirty={on !== base} saving={saving} onSave={save} onRevert={() => setOn(base)}
      sections={[
        { id: "general", title: "General", icon: "settings", rows: [
          { icon: "bell", title: "Notices", sub: "Tell me when something happens.", control: <Toggle on={on} onChange={setOn} /> },
        ] },
        { id: "more", title: "More", icon: "info", rows: [{ icon: "info", title: "Version", control: <span className="k-settings-value k-settings-value--mono">1.0.0</span> }] },
      ]} />
  );
}

export default function PagesSettings() {
  return (
    <Section id="pages-settings" title="Page patterns: SettingsPage">
      <Sub title="Five sections: side nav, form-aware save bar (edit a field)"><Frame><WithForm /></Frame></Sub>
      <Sub title="Two sections, no nav, save bar without a form (flip the toggle)"><Frame><Plain /></Frame></Sub>
    </Section>
  );
}
