import React from "react";
import { Button } from "@thekrystalship/krystal";
import { Field, Input, Textarea } from "@thekrystalship/krystal";
import { Notice } from "@thekrystalship/krystal";
import { Skeleton } from "@thekrystalship/krystal";

// AssistantMemoryEditor — reading one memory in full and correcting it, in the place of the list it
// was opened from. Opened by AssistantMemory for an existing memory or for a new one; the chat's header
// above it names it and leads back.
//
// A memory is two fields for one reason: the SUMMARY is read back at the start of every later turn
// and the BODY is not. So the summary gets a single line with a live count against the assistant's
// own cap, and the body gets an editor with room to think in. Showing them as one blob would hide the
// only difference between them that matters.
//
// The KEY is the whole update mechanism — writing one again supersedes what stood there — so it is
// fixed once a memory exists. Renaming is a write plus a forget, which is two changes wearing one
// button, and the copy says so rather than the UI pretending otherwise.
//
// `BodyEditor` draws the body: a component taking `{ value, onChange, path, readOnly }`, where
// `onChange` receives the new text and `path` names this memory so an editor can keep a model per
// memory. It may be lazy — it renders under Suspense. Without one, the body is a plain text area.

// The body's own path: a name per memory, so an editor that keeps state per document keeps it here.
const bodyPath = (key) => (key ? key : "new") + ".memory";

function PlainBody({ value, onChange, readOnly }) {
  return (
    <Textarea className="k-assistant-memory-editor__textarea" value={value} readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)} />
  );
}

// A field's length against the assistant's cap, beside its label.
function Count({ n, max }) {
  return <span className={"k-assistant-memory-editor__count" + (n > max ? " k-assistant-memory-editor__count--over" : "")}>{n} / {max}</span>;
}

/**
 * @param {object} props
 * @param {import("../chat/types.js").Memory | null} [props.memory] null is a new memory
 * @param {import("../chat/types.js").MemoryLimits | null} [props.limits] The assistant's memory limits; the summary and body counters stop at them. Absent shows no counter.
 * @param {(key: string, memory: import("../chat/types.js").MemoryWrite) => Promise<unknown> | unknown} props.onSave Called with the key and the written memory when the person saves; the editor stays open until its promise settles.
 * @param {() => Promise<unknown>} [props.onForget] Forgets the open memory; the editor stays until its promise settles and shows a rejection's message. Absent, there is no Forget.
 * @param {() => void} props.onClose Called when the person closes the editor, saved or not.
 * @param {import("react").ComponentType<import("../chat/types.js").MemoryBodyEditorProps>} [props.BodyEditor] A component that edits the body in place of the plain textarea, given `MemoryBodyEditorProps`.
 * @param {string} [props.keyPlaceholder] The placeholder in the key field of a new memory.
 */
function AssistantMemoryEditor({
  memory, limits, onSave, onForget, onClose, BodyEditor = PlainBody, keyPlaceholder = "preferred-name",
}) {
  const isNew = !memory;
  // `person` on the wire contract, `you` on an assistant that predates it.
  const byPerson = !!memory && (memory.source === "person" || memory.source === "you");
  const [key, setKey] = React.useState(memory ? memory.key : "");
  const [summary, setSummary] = React.useState(memory ? memory.summary || "" : "");
  const [body, setBody] = React.useState(memory ? memory.body || "" : "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  // Forgetting asks twice: the first press arms the button, which then says what the second does.
  const [armed, setArmed] = React.useState(false);
  const [forgetting, setForgetting] = React.useState(false);
  const settled = saving || forgetting;

  const dirty = isNew
    ? key.trim() !== "" || summary.trim() !== "" || body.trim() !== ""
    : summary !== (memory.summary || "") || body !== (memory.body || "");

  // The caps come from the assistant. Absent — one that cannot answer for them — the counters are
  // simply not drawn: the write is still refused with the number in the sentence, which is a late but
  // honest answer, where a guessed limit would be a wrong early one.
  const summaryOver = limits && summary.length > limits.maxSummaryLength;
  const bodyOver = limits && body.length > limits.maxBodyLength;
  const complete = key.trim() !== "" && summary.trim() !== "";
  const canSave = complete && dirty && !summaryOver && !bodyOver && !settled;

  function save() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    Promise.resolve(onSave(key.trim(), { summary: summary.trim(), body: body.trim() }))
      .catch((e) => {
        // Inline, against what is still on the screen. A refusal here names a limit to correct, and
        // a toast would take the note away to say so.
        setError((e && e.userMessage) || "Couldn't save that.");
        setSaving(false);
      });
  }

  function forget() {
    if (!armed) { setArmed(true); return; }
    setForgetting(true);
    setError("");
    Promise.resolve(onForget()).catch((e) => {
      setError((e && e.message) || "Couldn't forget that.");
      setForgetting(false);
      setArmed(false);
    });
  }

  return (
    <div className="k-assistant-memory-editor">
      <p className="k-assistant-memory-editor__lead">
        {isNew
          ? "The assistant reads the summary back at the start of every later conversation."
          : byPerson
            ? "You wrote this one."
            : "The assistant wrote this one down during a conversation. Correcting it makes it yours."}
      </p>

      {isNew ? (
        <Field label="Name"
          hint="What this memory is filed under, so it can be corrected or forgotten later. Letters and numbers; spaces become dashes.">
          <Input mono wide value={key} autoFocus
            placeholder={keyPlaceholder} disabled={settled}
            onChange={(e) => setKey(e.target.value)} />
        </Field>
      ) : (
        <Field label="Name" group
          hint="Fixed — writing this name again is what replaces the memory. To rename it, write a new one and forget this.">
          <span className="k-settings-value k-settings-value--mono k-assistant-memory-editor__key">{key}</span>
        </Field>
      )}

      <Field label="Summary"
        aside={limits && <Count n={summary.length} max={limits.maxSummaryLength} />}
        hint="This line goes into every later conversation, so keep it to the fact.">
        <Input wide value={summary} disabled={settled} autoFocus={!isNew}
          placeholder="States the fact itself — not that a note exists."
          onChange={(e) => setSummary(e.target.value)} />
      </Field>

      <Field label="Notes" group className="k-assistant-memory-editor__notes"
        aside={limits && <Count n={body.length} max={limits.maxBodyLength} />}
        hint="Read only when something asks for it, so it can hold the detail the summary leaves out.">
        <div className="k-assistant-memory-editor__body">
          <React.Suspense fallback={<Skeleton w="100%" h="100%" r={0} />}>
            <BodyEditor value={body} onChange={setBody} path={bodyPath(memory ? memory.key : "")}
              readOnly={settled} />
          </React.Suspense>
        </div>
      </Field>

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="k-assistant-memory-editor__foot">
        {onForget && (
          <Button variant="outline" icon="trash-2" armed={armed} busy={forgetting}
            disabled={settled} onClick={forget}>
            {forgetting ? "Forgetting…" : armed ? "Forget for good" : "Forget"}
          </Button>
        )}
        {dirty && <span className="k-assistant-memory-editor__dirty">Unsaved changes</span>}
        <span className="k-assistant-memory-editor__spacer" />
        <Button variant="outline" onClick={onClose} disabled={settled}>Cancel</Button>
        <Button variant="primary" icon="save" busy={saving} onClick={save} disabled={!canSave}>
          {saving ? "Saving…" : isNew ? "Remember this" : "Save"}
        </Button>
      </div>
    </div>
  );
}

export { AssistantMemoryEditor };
