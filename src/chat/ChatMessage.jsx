// ChatMessage — one bubble: a person's message, or the assistant's answer with its thinking, its tool
// pills and steps, and whatever cards the product draws under it (`renderCards(msg)`, given the
// message when it carries `cards`).

import { AccountAvatar } from "../components/AccountAvatar.jsx";
import { Icon } from "../components/Icon.jsx";
import { VoiceNoteBubble } from "./VoiceNote.jsx";
import { renderMarkdown } from "./markdown.jsx";
import { ChatThinking, ChatContextPill, ChatSteps, ChatPending } from "./ChatMessageParts.jsx";
import { ChatFeedback } from "./ChatFeedback.jsx";

function ChatMessage({ msg, user, assistantName = "Assistant", renderCards, onRate, readOnlyFeedback }) {
  const isUser = msg.role === "user";
  return (
    <div className={"chat-msg" + (isUser ? " chat-msg--user" : " chat-msg--assistant")}>
      <div className="chat-msg__avatar">
        {isUser
          ? <AccountAvatar user={user} size={28} />
          : <span className="chat-msg__bot"><Icon name="bot" size={16} /></span>}
      </div>
      <div className="chat-msg__body">
        <div className="chat-msg__name">
          {isUser ? (user.display || user.name) : assistantName}
          {msg.voice && <span className="chat-msg__voicetag"><Icon name="mic" size={11} strokeWidth={2.2} /> Voice note</span>}
        </div>
        {msg.ts && <span className="chat-msg__ts" title={new Date(msg.ts).toLocaleString()}>{new Date(msg.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
        {msg.voice && <VoiceNoteBubble voice={msg.voice} />}
        {!isUser && msg.thinking && <ChatThinking text={msg.thinking} streaming={!msg.content} />}
        {!isUser && msg.tools && msg.tools.map((t, i) => <ChatContextPill key={(t.id || "t") + ":" + i} msg={t} />)}
        {!isUser && msg.steps && msg.steps.length > 0 && <ChatSteps steps={msg.steps} />}
        <div className="chat-msg__content">
          {msg.content
            ? renderMarkdown(msg.content)
            : (msg.thinking || (msg.tools && msg.tools.length))
              ? null
              : <ChatPending />}
        </div>
        {!isUser && msg.cards && msg.cards.length > 0 && renderCards && renderCards(msg)}
        {/* Only a finished answer can be judged: a bubble still streaming has nothing to rate yet. */}
        {!isUser && msg.content && (onRate || readOnlyFeedback) && (
          <ChatFeedback
            turnId={msg.turnId}
            feedback={msg.feedback}
            readOnly={readOnlyFeedback}
            onRate={(rating, note) => onRate && onRate(msg.turnId, rating, note)} />
        )}
      </div>
    </div>
  );
}

export { ChatMessage };
