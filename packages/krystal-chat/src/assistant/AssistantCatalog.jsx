import React from "react";
import { Notice } from "@thekrystalship/krystal";
import { SettingsRow, SettingsSection } from "@thekrystalship/krystal";
import { Skeleton } from "@thekrystalship/krystal";
import { toolLabel } from "../chat/conversation.js";

// AssistantSkills and AssistantTools — what the assistant knows how to do, and what it can use on the
// person's behalf, drawn by the chat in the conversation's place. Both are the assistant's own lists,
// the same for every person, read once and offering nothing to press: a skill is used by asking for what
// it describes, and a tool is the assistant's to call.
//
// `client` is the assistant client (`createAssistantClient`), stable across renders. With no client
// there is nothing to read, and the view shows `unavailable`.

// A skill's name as a person reads it: "find-a-forgotten-film" is "Find a forgotten film".
function skillTitle(name) {
  const words = String(name || "").replace(/-/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

// A tool's description is written for the model: its first sentence says what the tool is, and what
// follows tells the model how to call it and what to say about it.
function firstSentence(text) {
  const line = String(text || "").split("\n")[0].trim();
  const stop = line.indexOf(". ");
  return stop < 0 ? line : line.slice(0, stop + 1);
}

// A tool that proposes rather than acts waits for the person (wire contract §7), which is worth knowing
// before asking for it.
function toolSub(tool) {
  const what = firstSentence(tool.description);
  return tool.class === "staged" ? (what ? what + " · " : "") + "Asks you to confirm first" : what;
}

// One of the assistant's own lists, read from `load(client)` and drawn as rows of `row(item)`.
function AssistantCatalog({ client, unavailable, load, icon, title, meta, empty, failed, row }) {
  const [items, setItems] = React.useState(null);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    if (!client) return undefined;
    let live = true;
    setItems(null);
    setErr(null);
    Promise.resolve(load(client)).then(
      (rows) => { if (live) setItems(Array.isArray(rows) ? rows : []); },
      (e) => { if (live) setErr((e && e.userMessage) || failed); },
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `load` and `failed` are fixed per list; the client decides what is read
  }, [client]);

  if (!client) return <div className="k-assistant-panel">{unavailable}</div>;

  return (
    <div className="k-assistant-panel">
      <SettingsSection icon={icon} title={title} meta={meta}>
        {err && <Notice tone="danger">{err}</Notice>}
        {!err && items === null && [0, 1, 2].map((i) => (
          <SettingsRow key={i} icon={icon} title={<Skeleton w={160} />} sub={<Skeleton w="70%" h={10} />} />
        ))}
        {!err && items && items.length === 0 && <Notice>{empty}</Notice>}
        {!err && items && items.map((item) => {
          const r = row(item);
          return <SettingsRow key={item.name} icon={icon} title={r.title} sub={r.sub} />;
        })}
      </SettingsSection>
    </div>
  );
}

/**
 * @param {object} props
 * @param {import("../chat/types.js").AssistantClient | null} props.client The assistant's client; its skills call lists them. Null shows `unavailable`.
 * @param {import("react").ReactNode} [props.unavailable] why there is nothing to show
 */
function AssistantSkills({ client, unavailable = null }) {
  return (
    <AssistantCatalog client={client} unavailable={unavailable}
      load={(c) => (typeof c.skills === "function" ? c.skills() : [])}
      icon="sparkles" title="What it knows how to do"
      meta="Ask for any of these in your own words, and the assistant follows its steps."
      empty="This assistant has no skills of its own; it answers from its tools alone."
      failed="Couldn't read what the assistant can do."
      row={(s) => ({ title: skillTitle(s.name), sub: s.description })} />
  );
}

/**
 * @param {object} props
 * @param {import("../chat/types.js").AssistantClient | null} props.client The assistant's client; its tools call lists them. Null shows `unavailable`.
 * @param {import("react").ReactNode} [props.unavailable] why there is nothing to show
 */
function AssistantTools({ client, unavailable = null }) {
  return (
    <AssistantCatalog client={client} unavailable={unavailable}
      load={(c) => (typeof c.tools === "function" ? c.tools() : [])}
      icon="wrench" title="What it can use for you"
      meta="The assistant reaches for these as it answers, only as far as you are allowed to yourself."
      empty="This assistant has no tools; it answers from what it knows."
      failed="Couldn't read what the assistant can use."
      row={(t) => ({ title: toolLabel(t.name), sub: toolSub(t) })} />
  );
}

export { AssistantSkills, AssistantTools };
