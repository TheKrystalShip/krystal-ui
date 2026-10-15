import React from "react";
import { Button } from "@thekrystalship/krystal";
import { Notice } from "@thekrystalship/krystal";
import { PageHeader } from "@thekrystalship/krystal";
import { SettingsRow, SettingsSection } from "@thekrystalship/krystal";
import { Skeleton } from "@thekrystalship/krystal";
import { toolLabel } from "../chat/conversation.js";
import { AssistantMemory } from "./AssistantMemory.jsx";

// The pages a site hosting an assistant gives it beside the chat, each at a reading measure
// (`.k-assistant-page`): its conversations, what it remembers, and what it can do. Each talks to the
// assistant through `client` (`createAssistantClient`), stable across renders.

// AssistantPage — the column a page beside the chat stands in: a reading measure, centred, with the
// page's own padding and gap. A site's own page about the assistant (its settings) is drawn in it too.
/**
 * @param {import("react").ComponentPropsWithoutRef<"div">} props
 */
function AssistantPage({ className, ...rest }) {
  return <div {...rest} className={"k-assistant-page" + (className ? " " + className : "")} />;
}

// The conversations, as a page — a phone's tab of them. The list is the chat's own: `Chat` draws it
// into the element this page hands back through `listRef` (its `listTarget`), so what is listed,
// opened and deleted here is exactly what the chat holds.
/**
 * @param {object} props
 * @param {import("react").Ref<HTMLDivElement>} [props.listRef] the element `Chat` draws its list into (its `listTarget`)
 * @param {string} [props.title] The page's heading.
 */
function AssistantChatsPage({ listRef, title = "Chats" }) {
  return (
    <AssistantPage>
      <PageHeader title={title} />
      <div ref={listRef} />
    </AssistantPage>
  );
}

// What the assistant has written down about you, as a page of its own: somewhere a person goes back
// to — to check what it believes and to correct it — rather than a preference set once. Every prop
// besides `title` is AssistantMemory's.
/**
 * @typedef {object} AssistantMemoryPageOwnProps
 * @property {string} [title] the page's heading
 */
/**
 * @param {AssistantMemoryPageOwnProps & Parameters<typeof AssistantMemory>[0]} props every prop besides `title` is AssistantMemory's
 */
function AssistantMemoryPage({ title = "Memory", ...memory }) {
  return (
    <AssistantPage>
      <PageHeader title={title} />
      <AssistantMemory {...memory} />
    </AssistantPage>
  );
}

// The first sentence of a tool's description. The rest is written for the model — which arguments to
// pass, which tool to reach for instead — and reads as noise to a person.
function firstSentence(text) {
  if (!text) return "";
  const stop = text.indexOf(". ");
  return stop < 0 ? text : text.slice(0, stop + 1);
}

function Rows({ n }) {
  return Array.from({ length: n }, (_, i) => (
    <SettingsRow key={i} icon="wrench" title={<Skeleton w={160} />} sub={<Skeleton w="70%" h={10} />} />
  ));
}

// What the assistant can do for the person reading: the commands they can type, and the tools it can
// use on their behalf. Both lists are the assistant's own answers, already filtered to what this
// caller holds — nothing is listed that would then be refused.
//
// A command is offered through `onUse(name)`, for the site to put in the composer: the person still
// sends it, the same as one they typed. A tool is not something a person runs, so it is listed and
// not offered.
/**
 * @param {object} props
 * @param {Pick<import("../chat/types.js").AssistantClient, "commands" | "tools">} props.client The assistant's client; its commands and tools calls give the two lists.
 * @param {(name: string) => void} props.onUse puts a command in the composer
 * @param {string} [props.title] The page's heading.
 */
function AssistantSkillsPage({ client, onUse, title = "Skills" }) {
  const [commands, setCommands] = React.useState(null);
  const [tools, setTools] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let live = true;
    Promise.all([client.commands(), client.tools()]).then(
      ([c, t]) => {
        if (!live) return;
        setCommands(Array.isArray(c) ? c : []);
        setTools(Array.isArray(t) ? t : []);
      },
      () => { if (live) setError("The assistant didn’t say what it can do. Try again in a moment."); });
    return () => { live = false; };
  }, [client]);

  return (
    <AssistantPage>
      <PageHeader title={title} />

      {error && <Notice tone="danger">{error}</Notice>}

      {!error && <>
      <SettingsSection icon="square-slash" title="Commands">
        {commands === null && <Rows n={3} />}
        {commands && commands.map((c) => (
          <SettingsRow key={c.name} icon="square-slash" title={<code>/{c.name}</code>} sub={c.description}>
            <Button size="sm" variant="outline" iconRight="arrow-right" onClick={() => onUse(c.name)}>Use</Button>
          </SettingsRow>
        ))}
      </SettingsSection>

      <SettingsSection icon="wrench" title="Tools">
        {tools === null && <Rows n={4} />}
        {tools && tools.map((t) => (
          <SettingsRow key={t.name} icon="wrench" title={toolLabel(t.name)} sub={firstSentence(t.description)} />
        ))}
      </SettingsSection>
      </>}
    </AssistantPage>
  );
}

export { AssistantChatsPage, AssistantMemoryPage, AssistantPage, AssistantSkillsPage };
