// ChatMessage — one turn of the conversation. A person's message is a bubble on the right with what
// they attached above it, its time shown under it on hover. The assistant's answer is text in the column: its Activity line, the answer,
// whatever cards the product draws under it (`renderCards(msg)`, given the message when it carries
// `cards`), and once it is finished a meta row to copy it, rate it and read its time.
//
// `lead` marks the first assistant entry of a run — consecutive assistant-side entries with no message
// from the person between them — and only that one carries the assistant's mark and name. A turn that
// failed (`error`) says so in a warning line under whatever it had already written; `errorText` is the
// reason, and without one the content is the reason.

import React from "react";

import { IconButton } from "../components/Button.jsx";
import { Icon } from "../components/Icon.jsx";
import { copyText } from "../lib/clipboard.js";
import { VoiceNoteBubble } from "./VoiceNote.jsx";
import { ChatMessageAttachments } from "./ChatAttachments.jsx";
import { renderMarkdown } from "./markdown.jsx";
import { ChatActivity } from "./ChatActivity.jsx";
import { ChatFeedback } from "./ChatFeedback.jsx";

const FAILED = "This turn didn’t complete.";

function TurnTime({ ts }) {
  if (!ts) return null;
  const d = new Date(ts);
  return (
    <time className="chat-turn__time" dateTime={d.toISOString()} title={d.toLocaleString()}>
      {d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

function CopyAnswer({ text }) {
  const [copied, setCopied] = React.useState(null);
  React.useEffect(() => {
    if (copied === null) return undefined;
    const t = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <IconButton variant="ghost" size="xs" className="chat-turn__copy"
      icon={copied === true ? "check" : "copy"}
      label={copied === true ? "Copied" : copied === false ? "Couldn’t copy" : "Copy answer"}
      onClick={() => copyText(text).then(setCopied)} />
  );
}

function UserTurn({ msg, loadAttachment }) {
  return (
    <div className="chat-turn chat-turn--user">
      <ChatMessageAttachments attachments={msg.attachments} load={loadAttachment} />
      {(msg.voice || msg.content) && (
        <div className={"chat-turn__bubble" + (msg.voice ? " chat-turn__bubble--voice" : "")}>
          {msg.voice && <VoiceNoteBubble voice={msg.voice} />}
          {msg.content && <div className="chat-turn__said">{renderMarkdown(msg.content)}</div>}
        </div>
      )}
      <TurnTime ts={msg.ts} />
    </div>
  );
}

function AssistantTurn({ msg, assistantName, lead, renderCards, onRate, readOnlyFeedback }) {
  // Content written by an older surface as the failure itself, with no separate reason.
  const errorOnly = msg.error && !msg.errorText;
  const answer = errorOnly ? "" : msg.content;
  const errorText = msg.error ? (msg.errorText || msg.content || FAILED) : null;
  const finished = !msg.live && !!answer;

  return (
    <div className={"chat-turn chat-turn--assistant" + (lead ? " chat-turn--lead" : "") + (msg.error ? " chat-turn--error" : "")}>
      {lead && (
        <div className="chat-turn__head">
          <span className="chat-turn__tile" aria-hidden="true"><Icon name="bot" size={13} strokeWidth={2} /></span>
          <span className="chat-turn__name">{assistantName}</span>
        </div>
      )}
      <ChatActivity msg={msg} />
      {answer && <div className="chat-turn__answer">{renderMarkdown(answer)}</div>}
      {errorText && (
        <div className="chat-turn__warning" role="alert">
          <Icon name="alert-triangle" size={14} strokeWidth={2} />
          <span>{errorText}</span>
        </div>
      )}
      {msg.cards && msg.cards.length > 0 && renderCards && renderCards(msg)}
      {/* Only a finished answer can be copied or judged: a turn still streaming has nothing to rate yet. */}
      {finished && (
        <div className="chat-turn__meta">
          <CopyAnswer text={answer} />
          {/* Only an answer the assistant recorded as a turn can be rated; a command's reply has none. */}
          {(onRate || readOnlyFeedback) && msg.turnId != null && (
            <ChatFeedback
              turnId={msg.turnId}
              feedback={msg.feedback}
              readOnly={readOnlyFeedback}
              onRate={(rating, note) => onRate && onRate(msg.turnId, rating, note)} />
          )}
          <TurnTime ts={msg.ts} />
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg, assistantName = "Assistant", lead = true, renderCards, onRate, readOnlyFeedback, loadAttachment }) {
  if (msg.role === "user") return <UserTurn msg={msg} loadAttachment={loadAttachment} />;
  return (
    <AssistantTurn msg={msg} assistantName={assistantName} lead={lead}
      renderCards={renderCards} onRate={onRate} readOnlyFeedback={readOnlyFeedback} />
  );
}

export { ChatMessage };
