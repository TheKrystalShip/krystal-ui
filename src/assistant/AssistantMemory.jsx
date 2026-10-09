import React from "react";
import { Button } from "../components/Button.jsx";
import { Notice } from "../components/Notice.jsx";
import { SettingsRow, SettingsSection } from "../components/settings-primitives.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { fmtRelative } from "../lib/time.js";
import { AssistantMemoryEditor } from "./AssistantMemoryEditor.jsx";

// AssistantMemory — what the assistant has written down about you, and the one place to correct it:
// the list, written by the assistant or by you, each editable in AssistantMemoryEditor and forgettable
// in place, with the counts read from the assistant's own limits.
//
//   <AssistantMemory client={client} />
//
// `client` is the assistant client (`createAssistantClient`), stable across renders. The assistant,
// not this card, decides what "yours" means, so this can only ever list, write or forget the caller's
// own memory. With no client there is nothing to read, and the section shows `unavailable` — the
// site's own words for why.
//
// `whose` names the assistant in the section's line ("What the assistant has written down…"), for a
// site that talks to more than one. `BodyEditor` and `keyPlaceholder` pass to the editor.

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

function AssistantMemory({
  client, unavailable = null, whose = "the assistant", BodyEditor, keyPlaceholder,
}) {
  const [memories, setMemories] = React.useState([]);
  const [limits, setLimits] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [busy, setBusy] = React.useState(null);   // the key being forgotten, or null
  const [editing, setEditing] = React.useState(null); // null | { memory } — a null memory is a new one

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

  const forget = (key) => {
    setBusy(key);
    setErr(null);
    client.deleteMemory(key).then(
      () => { setMemories((prev) => prev.filter((m) => m.key !== key)); setBusy(null); },
      (e) => { setBusy(null); setErr((e && e.userMessage) || "Couldn't forget that."); },
    );
  };

  // Resolves to nothing on success and REJECTS with the assistant's own sentence otherwise, because
  // the editor keeps what was typed on the screen and renders the refusal against it — a cap or a
  // length is something to correct in place, not a reason to lose the note.
  const save = (key, memory) =>
    client.writeMemory(key, memory).then((row) => {
      setMemories((prev) => withWritten(prev, row));
      setEditing(null);
    });

  if (!client) {
    return (
      <SettingsSection icon="brain" title="Memory"
        meta="What the assistant has written down about you.">
        {unavailable}
      </SettingsSection>
    );
  }

  const cap = limits ? (limits.maxPerPerson ?? limits.maxPerOwner) : null;
  const full = cap != null && memories.length >= cap;
  const lead = `What ${whose} has written down about you, across your conversations.`;
  const meta = cap != null ? `${lead} ${memories.length} of ${cap} kept.` : lead;

  return (
    <>
      <SettingsSection icon="brain" title="Memory" meta={meta}
        action={(
          <Button variant="outline" icon="plus" disabled={loading || !!err || full}
            title={full ? "You're at the limit — forget one first." : undefined}
            onClick={() => setEditing({ memory: null })}>
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
            icon={byPerson(m) ? "user-pen" : "brain"}
            title={m.summary || m.key}
            sub={(
              <>
                <span className="settings-value settings-value--mono">{m.key}</span>
                {" · " + (byPerson(m) ? "Written by you" : "Learned in a conversation")}
                {m.plugin ? " · " + m.plugin : ""}
                {" " + written(m.writtenAt)}
                {m.body ? " · has a longer note" : ""}
              </>
            )}
          >
            <Button variant="outline" icon="pencil" onClick={() => setEditing({ memory: m })}
              disabled={busy != null}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => forget(m.key)} disabled={busy != null}
              busy={busy === m.key}>
              {busy === m.key ? "Forgetting…" : "Forget"}
            </Button>
          </SettingsRow>
        ))}
      </SettingsSection>

      {editing && (
        <AssistantMemoryEditor
          memory={editing.memory}
          limits={limits}
          onSave={save}
          onClose={() => setEditing(null)}
          BodyEditor={BodyEditor}
          keyPlaceholder={keyPlaceholder}
        />
      )}
    </>
  );
}

export { AssistantMemory };
