import React from "react";
import { Notice } from "@thekrystalship/krystal";
import { SettingsRow, SettingsSection } from "@thekrystalship/krystal";
import { Skeleton } from "@thekrystalship/krystal";

// AssistantSkills — what the assistant knows how to do, drawn by the chat in the conversation's place:
// each skill its product registered, by name and by the description the assistant itself reads for it
// (`GET /skills`). A skill is used by asking for what it describes, so the list offers nothing to press.
//
// `client` is the assistant client (`createAssistantClient`), stable across renders. With no client
// there is nothing to read, and the view shows `unavailable`.

// A skill's name as a person reads it: "find-a-forgotten-film" is "Find a forgotten film".
function skillTitle(name) {
  const words = String(name || "").replace(/-/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

/**
 * @param {object} props
 * @param {import("../chat/types.js").AssistantClient | null} props.client The assistant's client; its skills call lists them. Null shows `unavailable`.
 * @param {import("react").ReactNode} [props.unavailable] why there is nothing to show
 */
function AssistantSkills({ client, unavailable = null }) {
  const [skills, setSkills] = React.useState(null);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    if (!client) return undefined;
    let live = true;
    setSkills(null);
    setErr(null);
    Promise.resolve(typeof client.skills === "function" ? client.skills() : []).then(
      (rows) => { if (live) setSkills(Array.isArray(rows) ? rows : []); },
      (e) => { if (live) setErr((e && e.userMessage) || "Couldn't read what the assistant can do."); },
    );
    return () => { live = false; };
  }, [client]);

  if (!client) return <div className="k-assistant-panel">{unavailable}</div>;

  return (
    <div className="k-assistant-panel">
      <SettingsSection icon="sparkles" title="What it knows how to do"
        meta="Ask for any of these in your own words, and the assistant follows its steps.">
        {err && <Notice tone="danger">{err}</Notice>}
        {!err && skills === null && [0, 1, 2].map((i) => (
          <SettingsRow key={i} icon="sparkles" title={<Skeleton w={160} />} sub={<Skeleton w="70%" h={10} />} />
        ))}
        {!err && skills && skills.length === 0 && (
          <Notice>This assistant has no skills of its own; it answers from its tools alone.</Notice>
        )}
        {!err && skills && skills.map((s) => (
          <SettingsRow key={s.name} icon="sparkles" title={skillTitle(s.name)} sub={s.description} />
        ))}
      </SettingsSection>
    </div>
  );
}

export { AssistantSkills };
