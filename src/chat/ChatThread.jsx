// ChatThread — renders a conversation's message list, dispatching each entry to the part that draws
// its role. A product's own roles go through `renderEntry(msg, key)` first: whatever it returns other
// than `undefined` is drawn for that entry, and `undefined` falls through to the shared roles below.
// `renderCommand(msg, key)` draws a proposed action; the shared roles cover events, the command
// cards, verification, and the two sides of the conversation.
//
// The thread also reads the entries as a sequence. A `verify` entry carrying the `cmdId` of a command
// drawn here is folded into that command as `msg.verify`, so the action's card shows what it came to.
// Each assistant answer learns whether it leads its run (`lead`), the run being the assistant-side
// entries between two messages from the person. A day separator goes in where the calendar day changes
// between timestamped entries, and above the first one when that is not today.
// `onUseCommand(name)` is handed to the /help card's Use buttons.

import { ChatEvent, ChatVerify, ChatDaySeparator, entryTime, dayKeyOf } from "./ChatMessageParts.jsx";
import { ChatMessage } from "./ChatMessage.jsx";
import { ChatCommandHelp, ChatCommandTools } from "./ChatCommandCards.jsx";
import { ChatQuestions } from "./ChatQuestions.jsx";

const EVENT_ROLES = new Set(["system", "scope", "checkpoint", "toggle"]);

function ChatThread({
  messages, user, assistantName, renderEntry, renderCommand, renderCards, onRate, readOnlyFeedback, onUseCommand,
  onAnswer,
}) {
  // Questions are answerable while they are the last thing said: once the person has written
  // something else beneath them, they stay on the page as plain text.
  let lastUser = -1;
  messages.forEach((m, i) => { if (m.role === "user") lastUser = i; });
  const outcomes = new Map();
  for (const m of messages) {
    if (m.role === "verify" && m.cmdId != null) outcomes.set(m.cmdId, m);
  }
  const folded = new Set();
  const out = [];
  // Starting from today puts a separator above the first dated entry only when it is from another day.
  let day = dayKeyOf(Date.now());
  let runLed = false;

  const commandEntry = (m, i) => {
    if (!renderCommand) return null;
    const verify = m.cmdId != null ? outcomes.get(m.cmdId) : undefined;
    if (!verify) return renderCommand(m, i);
    folded.add(m.cmdId);
    return renderCommand({ ...m, verify }, i);
  };

  const turn = (m, i) => {
    const lead = m.role !== "user" && !runLed;
    if (m.role !== "user") runLed = true;
    return (
      <ChatMessage key={i} msg={m} lead={lead} user={user} assistantName={assistantName}
        renderCards={renderCards} onRate={onRate} readOnlyFeedback={readOnlyFeedback} />
    );
  };

  messages.forEach((m, i) => {
    const t = entryTime(m);
    if (t != null) {
      const key = dayKeyOf(t);
      if (key !== day) out.push(<ChatDaySeparator key={"day:" + i} at={t} />);
      day = key;
    }

    if (m.role === "user") runLed = false;
    const own = renderEntry ? renderEntry(m, i) : undefined;
    if (own !== undefined) { out.push(own); return; }

    if (m.role === "verify" && m.cmdId != null && folded.has(m.cmdId)) return;

    out.push(
      EVENT_ROLES.has(m.role)
          ? <ChatEvent key={i} msg={m} />
        : m.role === "commandHelp"
          ? <ChatCommandHelp key={i} msg={m} onUseCommand={onUseCommand} />
        : m.role === "commandTools"
          ? <ChatCommandTools key={i} msg={m} />
        : m.role === "command"
          ? commandEntry(m, i)
        : m.role === "question"
          ? <ChatQuestions key={i} msg={m} onAnswer={onAnswer}
              open={!!onAnswer && m.state === "open" && i > lastUser} />

        : m.role === "verify"
          ? <ChatVerify key={i} msg={m} />
          : turn(m, i),
    );
  });

  return <div className="chat-thread">{out}</div>;
}

export { ChatThread };
