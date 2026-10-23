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
// `onUseCommand(name)` is handed to the /help card's Use buttons, and `loadAttachment(attachment)` reads
// a sent attachment back for the bubble that shows it.

import { ChatEvent, ChatMemoryNote, ChatVerify, ChatDaySeparator, entryTime, dayKeyOf } from "./ChatMessageParts.jsx";
import { ChatMessage } from "./ChatMessage.jsx";
import { ChatCommandHelp, ChatCommandTools } from "./ChatCommandCards.jsx";
import { ChatQuestions } from "./ChatQuestions.jsx";

const EVENT_ROLES = new Set(["system", "scope", "checkpoint", "toggle"]);

/**
 * @param {object} props
 * @param {import("./types.js").Message[]} props.messages The conversation's entries, oldest first.
 * @param {any} [props.user] The signed-in person, passed to the renderers.
 * @param {string} [props.assistantName] What the assistant's turns are named.
 * @param {(msg: import("./types.js").Message, key: number) => import("react").ReactNode | undefined} [props.renderEntry] a product's own roles; `undefined` falls through to the shared ones
 * @param {(msg: import("./types.js").Message, key: number) => import("react").ReactNode} [props.renderCommand] draws a proposed action
 * @param {(msg: import("./types.js").Message) => import("react").ReactNode} [props.renderCards] Draws the cards under a finished answer, given the message.
 * @param {(turnId: number, rating: "up" | "down" | null, note?: string) => void} [props.onRate] Called with the record id, the rating (null clears it) and an optional note when the person rates an answer.
 * @param {boolean} [props.readOnlyFeedback] Shows each answer's rating without letting it change.
 * @param {(name: string) => void} [props.onUseCommand] given to the /help card's Use buttons
 * @param {(msg: import("./types.js").Message, answers: import("./types.js").Answer[]) => void} [props.onAnswer] Called with the question message and the person's answers when they answer an asked question.
 * @param {(attachment: import("./types.js").AttachmentInfo) => Promise<Blob>} [props.loadAttachment] Reads a sent attachment back as a Blob.
 * @param {(key: string) => void} [props.onOpenMemory] Opens a memory the assistant wrote, from the line under its answer; without it the line is only read.
 */
function ChatThread({
  messages, user, assistantName, renderEntry, renderCommand, renderCards, onRate, readOnlyFeedback, onUseCommand,
  onAnswer, loadAttachment, onOpenMemory,
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
        renderCards={renderCards} onRate={onRate} readOnlyFeedback={readOnlyFeedback} loadAttachment={loadAttachment} />
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
    // What the turn changed in the person's memory follows its answer, one line per change.
    if (m.role === "assistant" && m.memories) {
      m.memories.forEach((note, n) => out.push(<ChatMemoryNote key={i + ":memory:" + n} note={note} onOpen={onOpenMemory} />));
    }
  });

  return <div className="k-chat-thread">{out}</div>;
}

export { ChatThread };
