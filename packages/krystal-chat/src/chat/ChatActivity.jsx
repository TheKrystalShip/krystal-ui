// ChatActivity — the one line above an answer that says what the assistant did to produce it: its
// thinking, the tools it called and the steps a long-running tool reported, drawn as a single line
// that opens to a list.
//
// It has three states. Working: a spinner and the step in hand ("Reading the console"), or "Thinking"
// before anything has arrived. Done: a summary of the work ("Thought and used 3 tools") and how long
// the turn took. Open: the list, one row per thing done. An answer reached with no thinking and no
// tools has no line at all.
//
// The duration is the answer's own `endedAt − startedAt`, taken where the turn was watched or recorded;
// a turn with either stamp missing shows none rather than one measured from the wrong moment.

import React from "react";

import { Button } from "@thekrystalship/krystal";
import { Icon } from "@thekrystalship/krystal";
import { Spinner } from "@thekrystalship/krystal";

function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

function summarize(thought, toolCount) {
  if (thought && toolCount) return "Thought and used " + plural(toolCount, "tool", "tools");
  if (toolCount) return "Used " + plural(toolCount, "tool", "tools");
  return "Thought";
}

function formatDuration(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  return m + "m" + (s % 60 ? " " + (s % 60) + "s" : "");
}

// What the turn is doing right now, or null once it is only writing (or finished). A tool's own step
// is more specific than the tool, and either is more specific than the thinking.
function currentWork(msg) {
  if (msg.waiting) {
    return { label: "Waiting for the turn ahead", count: msg.waiting > 1 ? msg.waiting + " ahead" : null };
  }
  if (msg.compacting) {
    return { label: msg.compacting === "summarizing" ? "Summarizing earlier messages" : "Clearing old tool output" };
  }
  const steps = msg.steps || [];
  const tools = msg.tools || [];
  const activeStep = steps.find((s) => s.status === "active");
  const pending = tools.filter((t) => t.state === "pending");
  if (activeStep) return { label: activeStep.label || pending[0]?.label || "Working" };
  if (pending.length) {
    // Several calls in flight at once is the one case where "which of how many" is known.
    const done = tools.length - pending.length;
    return { label: pending[0].label || "Working", count: pending.length > 1 ? (done + 1) + " of " + tools.length : null };
  }
  if (!msg.content && !msg.error && !msg.endedAt) return { label: "Thinking" };
  return null;
}

// A summary short enough to sit after its label on one line; anything longer is shown as a block.
function isLong(summary) {
  return summary.length > 80 || summary.includes("\n");
}

function ActivityList({ id, msg }) {
  const tools = msg.tools || [];
  const steps = msg.steps || [];
  return (
    <ol className="k-chat-activity__list" id={id}>
      {msg.thinking && (
        <li className="k-chat-activity__row">
          <span className="k-chat-activity__mark"><Icon name="brain" size={11} strokeWidth={2} /></span>
          <div className="k-chat-activity__row-body">
            <span className="k-chat-activity__label">Thought</span>
            <p className="k-chat-activity__thought">{msg.thinking}</p>
          </div>
        </li>
      )}
      {tools.map((t, i) => {
        const pending = t.state === "pending";
        const summary = t.summary || "";
        const long = !pending && isLong(summary);
        return (
          <li key={(t.id || "t") + ":" + i} className={"k-chat-activity__row" + (pending ? " k-is-active" : " k-is-done")}>
            <span className="k-chat-activity__mark">
              {pending ? <Spinner size={10} /> : <Icon name="check" size={11} strokeWidth={2.4} />}
            </span>
            <div className="k-chat-activity__row-body">
              <span className="k-chat-activity__label">{t.label}</span>
              {!pending && summary && !long && <span className="k-chat-activity__detail"> · {summary}</span>}
              {long && <pre className="k-chat-activity__block">{summary}</pre>}
            </div>
          </li>
        );
      })}
      {steps.map((s, i) => {
        const active = s.status === "active";
        return (
          <li key={(s.key || "s") + ":" + i} className={"k-chat-activity__row" + (active ? " k-is-active" : " k-is-done")}>
            <span className="k-chat-activity__mark">
              {active ? <Spinner size={10} /> : <Icon name="check" size={11} strokeWidth={2.4} />}
            </span>
            <div className="k-chat-activity__row-body">
              <span className="k-chat-activity__label">{s.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * @param {object} props
 * @param {import("./types.js").Message} props.msg The assistant message whose thinking, tool rows, steps and compaction state the line summarizes.
 */
function ChatActivity({ msg }) {
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();

  const tools = msg.tools || [];
  const steps = msg.steps || [];
  const thought = !!msg.thinking;
  const hasList = thought || tools.length > 0 || steps.length > 0;
  const work = currentWork(msg);

  if (!work && !hasList) return null;

  const duration = !work && msg.startedAt && msg.endedAt && msg.endedAt >= msg.startedAt
    ? formatDuration(msg.endedAt - msg.startedAt) : null;

  const lead = work
    ? <Spinner size={12} />
    : <Icon name={open ? "chevron-down" : "chevron-right"} size={13} strokeWidth={2.2} />;
  const words = (
    <>
      <span className="k-chat-activity__text" role={work ? "status" : undefined}>
        {work ? work.label : summarize(thought, tools.length)}
      </span>
      {work && work.count && <span className="k-chat-activity__aside">· {work.count}</span>}
      {duration && <span className="k-chat-activity__aside">· {duration}</span>}
    </>
  );

  return (
    <div className={"k-chat-activity" + (work ? " k-chat-activity--working" : "") + (open ? " k-chat-activity--open" : "")}>
      {hasList ? (
        <Button variant="ghost" size="xs" className="k-chat-activity__toggle" icon={lead}
          aria-expanded={open} aria-controls={open ? listId : undefined}
          onClick={() => setOpen((o) => !o)}>
          {words}
        </Button>
      ) : (
        <div className="k-chat-activity__toggle k-chat-activity__toggle--static">{lead}{words}</div>
      )}
      {open && hasList && <ActivityList id={listId} msg={msg} />}
    </div>
  );
}

export { ChatActivity };
