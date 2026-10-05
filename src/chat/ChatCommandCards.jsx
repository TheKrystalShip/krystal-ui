// The cards `/help` and `/tools` leave in the transcript. Both render the ASSISTANT's own answer — the
// commands it says this person can type, and the tools it says it can use for them — so nothing here
// is a list maintained in the browser that could drift from what the assistant actually offers.
//
// They stay in the conversation rather than opening a panel because looking something up is part of
// what happened: scrolling back to what you were told is the point.

import { Button } from "../components/Button.jsx";
import { ChatCard, ChatCardRow, ChatCardRows } from "./ChatCard.jsx";
import { usageOf } from "./chatCommands.js";
import { toolLabel } from "./conversation.js";

// Split into what reads and what changes something. It is the question someone opens a command
// list with. `onUseCommand(name)` puts the command in the composer; without it a row has no Use.
function ChatCommandHelp({ msg, onUseCommand }) {
  const commands = msg.commands || [];
  const reads = commands.filter(c => !c.mutates);
  const acts = commands.filter(c => c.mutates);
  const groups = [["Reference", reads], ["Changes something", acts]].filter(([, g]) => g.length > 0);

  return (
    <ChatCard icon="square-slash" title="Commands you can type" className="chat-cmds">
      <ChatCardRows>
        {groups.map(([title, group]) => (
          <div key={title} className="chat-cmds__group">
            {groups.length > 1 && <div className="chat-cmds__grouphead">{title}</div>}
            {group.map(c => (
              <ChatCardRow key={c.name} mono label={usageOf(c)} value={c.description}
                action={onUseCommand && (
                  <Button variant="outline" size="xs" className="chat-cmds__use"
                    aria-label={"Use /" + c.name} onClick={() => onUseCommand(c.name)}>
                    Use
                  </Button>
                )} />
            ))}
          </div>
        ))}
        {commands.length === 0 && <ChatCardRow value="No commands here." />}
      </ChatCardRows>
    </ChatCard>
  );
}

// Tool descriptions are written for the model and run several sentences; the card shows the first
// one. Truncating by sentence rather than by width keeps a line from stopping mid-word.
function firstSentence(text) {
  if (!text) return "";
  const stop = text.indexOf(". ");
  return stop < 0 ? text : text.slice(0, stop + 1);
}

function ChatCommandTools({ msg }) {
  const tools = msg.tools || [];
  return (
    <ChatCard icon="wrench" title="What I can do for you" className="chat-cmds chat-cmds--tools">
      <ChatCardRows>
        {tools.map(t => (
          <ChatCardRow key={t.name} label={toolLabel(t.name)} value={firstSentence(t.description)} />
        ))}
        {tools.length === 0 && <ChatCardRow value="No tools available." />}
      </ChatCardRows>
    </ChatCard>
  );
}

export { ChatCommandHelp, ChatCommandTools };
