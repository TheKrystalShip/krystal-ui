import React from "react";
import { Button } from "@thekrystalship/krystal";
import { Notice } from "@thekrystalship/krystal";
import { SettingsRow, SettingsSection } from "@thekrystalship/krystal";
import { Skeleton } from "@thekrystalship/krystal";
import { fmtRelative } from "@thekrystalship/krystal";
import { AssistantMemoryEditor } from "./AssistantMemoryEditor.jsx";

// AssistantMemory — what the assistant has written down about you, and the one place to correct it,
// drawn by the chat in its own panel: the list, written by the assistant or by you, each opened in
// AssistantMemoryEditor in the list's place and forgettable from either.
//
// `client` is the assistant client (`createAssistantClient`), stable across renders. The assistant,
// not this view, decides what "yours" means, so this can only ever list, write or forget the caller's
// own memory. With no client there is nothing to read, and the view shows `unavailable`.
//
// Which memory is open is the chat's to hold, because the chat's header names it and its back button
// leaves it: `editing` is null for the list and `{ memory }` for the editor, a null memory being a new
// one, and `onEdit` is called with the next value.
//
// Forgetting asks twice: the first press arms the button, which then says what the second does.

/** @type {Intl.DateTimeFormatOptions} */
const WHEN = { hour: "2-digit", minute: "2-digit", hour12: false };

// A memory the person wrote or rewrote by hand is `person` on the wire contract and `you` on an
// assistant that predates it.
const byPerson = (m) => m.source === "person" || m.source === "you";

function written(ts) {
  const d = ts ? new Date(String(ts).replace(" ", "T")) : null;
  if (!d || isNaN(d.getTime())) return "— (—)";
  return fmtRelative(d) + " (" + d.toLocaleTimeString([], WHEN) + ")";
}

// Most recently written first, which is the order the assistant lists them in. A memory just written
// IS the most recent, so replacing-then-prepending reproduces that order exactly and saves a re-read
// whose failure would read as a failed save.
function withWritten(rows, memory) {
  return [memory, ...rows.filter((m) => m.key !== memory.key)];
}

/**
 * @param {object} props
 * @param {import("../chat/types.js").AssistantClient | null} props.client The assistant's client; its memory calls read, write and delete the rows. Null shows `unavailable`.
 * @param {import("react").ReactNode} [props.unavailable] why there is nothing to show
 * @param {{ memory: import("../chat/types.js").Memory | null } | null} props.editing the memory open in the editor (a null memory is a new one), or null for the list
 * @param {(editing: { memory: import("../chat/types.js").Memory | null } | null) => void} props.onEdit Called with the memory to open, or null to go back to the list.
 * @param {import("react").ComponentType<import("../chat/types.js").MemoryBodyEditorProps>} [props.BodyEditor] A component that edits a memory's body in place of the plain textarea, given `MemoryBodyEditorProps`.
 * @param {string} [props.keyPlaceholder] The placeholder in the editor's key field.
 */
function AssistantMemory({ client, unavailable = null, editing, onEdit, BodyEditor, keyPlaceholder }) {
  const [memories, setMemories] = React.useState([]);
  const [limits, setLimits] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [busy, setBusy] = React.useState(null);   // the key being forgotten, or null
  const [armed, setArmed] = React.useState(null); // the key whose Forget was pressed once, or null

  React.useEffect(() => {
    if (!client) { setLoading(false); return undefined; }
    let live = true;
    setLoading(true);
    setErr(null);
    // The limits describe the assistant and the list describes you; neither waits on the other. One
    // that cannot answer for its limits still lists and forgets — the editor is what needs them.
    Promise.all([
      client.memories(),
      client.memoryLimits().catch(() => null),
    ]).then(
      ([rows, caps]) => { if (live) { setMemories(rows || []); setLimits(caps); setLoading(false); } },
      (e) => {
        if (!live) return;
        setErr((e && e.userMessage) || "Couldn't load what the assistant remembers.");
        setLoading(false);
      },
    );
    return () => { live = false; };
  }, [client]);

  // Opening or leaving the editor disarms whatever was armed, so a Forget seen armed is always the
  // press just made.
  React.useEffect(() => { setArmed(null); }, [editing]);

  // Resolves once the memory is gone and rejects with the assistant's sentence, which the list shows
  // and the editor shows against the memory still open.
  const forgetNow = (key) => {
    setBusy(key);
    setErr(null);
    return Promise.resolve(client.deleteMemory(key)).then(
      () => { setMemories((prev) => prev.filter((m) => m.key !== key)); setBusy(null); setArmed(null); },
      (e) => {
        setBusy(null);
        setArmed(null);
        throw new Error((e && e.userMessage) || "Couldn't forget that.");
      },
    );
  };

  const forget = (key) => {
    if (armed !== key) { setArmed(key); return; }
    forgetNow(key).catch((e) => setErr(e.message));
  };

  // Resolves to nothing on success and REJECTS with the assistant's own sentence otherwise, because
  // the editor keeps what was typed on the screen and renders the refusal against it — a cap or a
  // length is something to correct in place, not a reason to lose the note.
  const save = (key, memory) =>
    client.writeMemory(key, memory).then((row) => {
      setMemories((prev) => withWritten(prev, row));
      onEdit(null);
    });

  if (!client) {
    return <div className="k-assistant-memory">{unavailable}</div>;
  }

  if (editing) {
    return (
      <div className="k-assistant-memory">
        <AssistantMemoryEditor
          key={editing.memory ? editing.memory.key : ""}
          memory={editing.memory}
          limits={limits}
          onSave={save}
          onForget={editing.memory ? () => forgetNow(editing.memory.key).then(() => onEdit(null)) : undefined}
          onClose={() => onEdit(null)}
          BodyEditor={BodyEditor}
          keyPlaceholder={keyPlaceholder}
        />
      </div>
    );
  }

  const cap = limits ? (limits.maxPerPerson ?? limits.maxPerOwner) : null;
  const full = cap != null && memories.length >= cap;
  const lead = "What the assistant has written down about you, across your conversations.";
  const meta = cap != null && !loading ? `${lead} ${memories.length} of ${cap} kept.` : lead;

  return (
    <div className="k-assistant-memory">
      <SettingsSection icon="brain" title="Written down" meta={meta}
        action={(
          <Button variant="outline" icon="plus" disabled={loading || !!err || full}
            title={full ? "You're at the limit — forget one first." : undefined}
            onClick={() => onEdit({ memory: null })}>
            Write one
          </Button>
        )}>
        {err && <Notice tone="danger">{err}</Notice>}
        {loading && [0, 1].map((i) => (
          <SettingsRow key={i} icon="brain" title={<Skeleton w={160} />} sub={<Skeleton w="70%" h={10} />} />
        ))}
        {!loading && !err && memories.length === 0 && (
          <Notice>
            The assistant hasn't written anything down yet. It writes things down as they come up in a
            conversation, and you can write one yourself.
          </Notice>
        )}
        {!loading && memories.map((m) => (
          <SettingsRow
            key={m.key}
            controlsBelow
            icon={byPerson(m) ? "user-pen" : "brain"}
            title={m.summary || m.key}
            sub={(
              <>
                <span className="k-settings-value k-settings-value--mono">{m.key}</span>
                {" · " + (byPerson(m) ? "Written by you" : "Learned in a conversation")}
                {m.plugin ? " · " + m.plugin : ""}
                {" · " + written(m.writtenAt)}
                {m.body ? " · has a longer note" : ""}
              </>
            )}
          >
            <Button variant="outline" size="sm" icon="pencil" onClick={() => onEdit({ memory: m })}
              disabled={busy != null}>
              Edit
            </Button>
            <Button variant="outline" size="sm" icon="trash-2" armed={armed === m.key}
              onClick={() => forget(m.key)} disabled={busy != null} busy={busy === m.key}>
              {busy === m.key ? "Forgetting…" : armed === m.key ? "Forget for good" : "Forget"}
            </Button>
          </SettingsRow>
        ))}
      </SettingsSection>
    </div>
  );
}

export { AssistantMemory };
