// The chat's slots: the places in its frame a site fills with blocks of its own, and the blocks the
// chat draws there itself when a site fills nothing.
//
// A slot is a node, or a function of the chat's handle returning one. Every block inside the chat,
// a site's or one of these, reads the same handle through `useChat()`: what the chat is showing and
// what a block may do to it. The chat fetches nothing for a block; a site's block brings its own data.
//
//   start          the empty conversation's column
//   aboveComposer  a row over the composer
//   headerActions  buttons in the header, before the chat's own
//   history        the head of the conversation list, in the sheet or the popover
//
// The handle:
//   layout         "page" or "panel" (Chat's `layout`)
//   empty          whether the open conversation has nothing in it yet
//   usable         whether the assistant is answering
//   assistant      the assistant addressed, or null
//   input          what the composer holds
//   greeting, noAssistant, suggestions           the empty conversation's words (Chat's props)
//   conversations, activeId                     the conversation list and the one open
//   ask(text)      sends `text` as the next turn
//   draft(text)    puts `text` in the composer and focuses it, for the person to finish
//   newChat()      opens an empty conversation
//   open(id)       opens a conversation
//   client()       the assistant's client, or null

import React from "react";
import { Icon } from "@thekrystalship/krystal";
import { RecentConversations } from "./RecentConversations.jsx";

/** @type {React.Context<import("./types.js").ChatHandle | null>} */
const ChatContext = React.createContext(null);

/**
 * The handle of the chat a block is drawn in.
 * @returns {import("./types.js").ChatHandle}
 */
function useChat() {
  const chat = React.useContext(ChatContext);
  if (!chat) throw new Error("useChat() is for a block drawn inside a Chat.");
  return chat;
}

/**
 * A slot's content: a node as given, a function given the handle.
 * A slot's content: a node as given, a function given the handle.
 * @param {import("./types.js").Slot} slot
 * @param {import("./types.js").ChatHandle} chat
 * @returns {import("react").ReactNode}
 */
function renderSlot(slot, chat) {
  if (slot == null) return null;
  return typeof slot === "function" ? slot(chat) : slot;
}

/** The assistant's mark and the greeting; or that there is no assistant to talk to. */
function ChatGreeting() {
  const chat = useChat();
  return (
    <>
      <span className="k-chat-start__disc"><Icon name="bot" size={24} /></span>
      <h3 className="k-chat-start__greeting">{chat.assistant ? chat.greeting : "No assistant available"}</h3>
      {!chat.assistant && chat.noAssistant && <p className="k-chat-start__primer">{chat.noAssistant}</p>}
    </>
  );
}

/** The opening suggestions as a grid, each one put in the composer to finish. A suggestion is its words, or `{ text, icon }`. */
function ChatSuggestions() {
  const chat = useChat();
  if (!chat.assistant || chat.suggestions.length === 0) return null;
  return (
    <div className="k-chat-start__suggestions">
      {chat.suggestions.map((s, i) => {
        const text = typeof s === "string" ? s : s.text;
        return (
          <button key={i} type="button" className="k-chat-start__suggestion" onClick={() => chat.draft(text)}>
            <Icon name={(s && /** @type {{ icon?: string }} */ (s).icon) || "message-circle"} size={15} className="k-chat-start__suggestion-icon" />
            <span>{text}</span>
          </button>
        );
      })}
    </div>
  );
}

/** The opening suggestions as a row of chips, each one sent as it is picked. */
function ChatSuggestionChips() {
  const chat = useChat();
  if (!chat.assistant || !chat.usable || chat.suggestions.length === 0) return null;
  return (
    <div className="k-chat-chips" role="list">
      {chat.suggestions.map((s, i) => {
        const text = typeof s === "string" ? s : s.text;
        return (
          <button key={i} type="button" role="listitem" className="k-chat-chips__chip" onClick={() => chat.ask(text)}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The conversations to pick up again, newest first.
 * @param {object} props
 * @param {number} [props.max] how many conversations to list
 */
function ChatRecent({ max }) {
  const chat = useChat();
  return <RecentConversations convos={chat.conversations} activeId={chat.activeId} onPick={chat.open} max={max} />;
}

/** That conversations are kept and may be read. */
function ChatPrivacyNote() {
  const chat = useChat();
  return chat.assistant ? <p className="k-chat-start__privacy">{CHAT_PRIVACY_NOTICE}</p> : null;
}

/**
 * A site's block in the empty conversation's column: the column's width, its own content left-aligned.
 * @param {object} props
 * @param {string} [props.className] Extra class on the block.
 * @param {import("react").ReactNode} [props.children] The block's content.
 */
function ChatBlock({ className = "", children }) {
  return <div className={"k-chat-start__block" + (className ? " " + className : "")}>{children}</div>;
}

const CHAT_PRIVACY_NOTICE =
  "Conversations are saved and may be reviewed to improve the assistant.";

/**
 * What the empty conversation's column holds when a site fills nothing: on a page, the greeting alone.
 * @param {object} props
 * @param {import("./types.js").ChatHandle} props.chat
 */
function DefaultStart({ chat }) {
  return (
    <>
      <ChatGreeting />
      {chat.layout !== "page" && <><ChatSuggestions /><ChatRecent /><ChatPrivacyNote /></>}
    </>
  );
}

/**
 * What stands over the composer when a site fills nothing: a page's suggestions until the person writes.
 * @param {object} props
 * @param {import("./types.js").ChatHandle} props.chat
 */
function DefaultAboveComposer({ chat }) {
  return chat.layout === "page" && chat.empty && !chat.input.trim() ? <ChatSuggestionChips /> : null;
}

export {
  CHAT_PRIVACY_NOTICE, ChatBlock, ChatContext, ChatGreeting, ChatPrivacyNote, ChatRecent, ChatSuggestionChips,
  ChatSuggestions, DefaultAboveComposer, DefaultStart, renderSlot, useChat,
};
