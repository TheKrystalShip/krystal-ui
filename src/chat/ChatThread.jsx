// ChatThread — renders a conversation's message list, dispatching each entry to the part that draws
// its role. A product's own roles go through `renderEntry(msg, key)` first: whatever it returns other
// than `undefined` is drawn for that entry, and `undefined` falls through to the shared roles below.
// `renderCommand(msg, key)` draws a proposed action; the shared roles cover tool pills, notices,
// verification, and the two sides of the conversation.

import {
  ChatContextPill, ChatScopeNotice, ChatCheckpointNotice, ChatToggleNotice, ChatVerify, ChatSystemNotice,
} from "./ChatMessageParts.jsx";
import { ChatMessage } from "./ChatMessage.jsx";
import { ChatCommandHelp, ChatCommandTools } from "./ChatCommandCards.jsx";

function ChatThread({ messages, user, assistantName, renderEntry, renderCommand, renderCards, onRate, readOnlyFeedback }) {
  return (
    <div className="chat-thread">
      {messages.map((m, i) => {
        const own = renderEntry ? renderEntry(m, i) : undefined;
        if (own !== undefined) return own;
        return m.role === "context"
          ? <ChatContextPill key={i} msg={m} />
          : m.role === "system"
            ? <ChatSystemNotice key={i} msg={m} />
          : m.role === "scope"
            ? <ChatScopeNotice key={i} msg={m} />
          : m.role === "checkpoint"
            ? <ChatCheckpointNotice key={i} msg={m} />
          : m.role === "toggle"
            ? <ChatToggleNotice key={i} msg={m} />
          : m.role === "commandHelp"
            ? <ChatCommandHelp key={i} msg={m} />
          : m.role === "commandTools"
            ? <ChatCommandTools key={i} msg={m} />
          : m.role === "command"
            ? (renderCommand ? renderCommand(m, i) : null)
          : m.role === "verify"
            ? <ChatVerify key={i} msg={m} />
            : <ChatMessage key={i} msg={m} user={user} assistantName={assistantName} renderCards={renderCards} onRate={onRate} readOnlyFeedback={readOnlyFeedback} />;
      })}
    </div>
  );
}

export { ChatThread };
