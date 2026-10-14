import React from "react";
import { Icon } from "@thekrystalship/krystal";
import { fmtRelative } from "@thekrystalship/krystal";
import { conversationTitle } from "./conversation.js";

// RecentConversations — the fresh-chat screen's "pick up where you left off" list.
//
// The conversation list is already the chat's own state (hydrated from localStorage, merged with what
// the assistant holds), so this renders it rather than fetching anything: the list is a second view
// of the history, placed where a person who has just opened a new chat is actually looking.

// When a conversation was last touched. The assistant's `lastActivityAt` when it has said, the creation
// time otherwise — never now(), which would sort every unknown conversation to the top and read as
// a timestamp this surface does not have.
function lastTouched(c) { return c.lastActivity || c.created || 0; }

// Worth offering: somebody said something in it. The assistant's turn count when it has said, the
// transcript this browser holds otherwise. A conversation nobody has spoken in is the screen the
// person is already looking at, so listing one would offer them a second empty chat.
function hasContent(c) {
  if (typeof c.turns === "number") return c.turns > 0;
  return Array.isArray(c.messages) && c.messages.some(m => m && m.role === "user");
}

/**
 * The fresh-chat screen's list of conversations to pick up again.
 * @param {object} props
 * @param {import("./types.js").Conversation[]} props.convos
 * @param {string | null} props.activeId
 * @param {(id: string) => void} props.onPick
 * @param {number} [props.max]
 */
function RecentConversations({ convos, activeId, onPick, max = 3 }) {
  const recent = React.useMemo(() => (convos || [])
    .filter(c => c && c.id !== activeId && hasContent(c))
    .sort((a, b) => lastTouched(b) - lastTouched(a))
    .slice(0, max), [convos, activeId, max]);

  // Nothing to resume: this is a first conversation, and a list saying so would be a list about the
  // absence of the thing it exists to offer.
  if (recent.length === 0) return null;

  return (
    <section className="chat-recent" aria-label="Pick up where you left off">
      <span className="chat-recent__label">Pick up where you left off</span>
      <div className="chat-recent__list">
        {recent.map(c => {
          const when = lastTouched(c);
          return (
            <button key={c.id} type="button" className="chat-recent__row" onClick={() => onPick(c.id)}>
              <Icon name="message-square" size={14} className="chat-recent__icon" />
              <span className="chat-recent__title">{conversationTitle(c)}</span>
              {when > 0 && <span className="chat-recent__time">{fmtRelative(new Date(when))}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { RecentConversations };
