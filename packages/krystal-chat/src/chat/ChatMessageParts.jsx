// Chat message sub-components — leaf renderers with narrow prop interfaces.
// No parent state awareness, no conversation coupling.

import React from "react";
import { Button } from "@thekrystalship/krystal";
import { Icon } from "@thekrystalship/krystal";
import { Spinner } from "@thekrystalship/krystal";
import { ChatCard, ChatCardRow, ChatCardRows } from "./ChatCard.jsx";
import { diffHunks, diffLines } from "./diffLines.js";

// ---------- time ----------
// An entry's moment is `ts` (epoch ms) or `at` (epoch ms or an ISO string, as a stored entry carries
// it); null when it has neither or it does not parse.
/**
 * An entry's moment in epoch ms from its `ts` or `at`; null when it has neither or it does not parse.
 * @param {{ ts?: number, at?: number | string } | null | undefined} msg
 * @returns {number | null}
 */
function entryTime(msg) {
  const v = msg && (msg.ts != null ? msg.ts : msg.at);
  if (v == null) return null;
  const t = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

function clockOf(t) {
  return t == null ? null : new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// The local calendar day a moment falls on, as a key two moments compare equal on.
/**
 * @param {number} t epoch ms
 * @returns {string}
 */
function dayKeyOf(t) {
  const d = new Date(t);
  return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
}

function dayLabel(t, now = Date.now()) {
  const key = dayKeyOf(t);
  if (key === dayKeyOf(now)) return "Today";
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (key === dayKeyOf(y.getTime())) return "Yesterday";
  const d = new Date(t);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString([], sameYear
    ? { weekday: "long", month: "long", day: "numeric" }
    : { month: "long", day: "numeric", year: "numeric" });
}

// ---------- the action card ----------
// One card per proposed action, changing in place as it goes: proposed, armed for the second press,
// running while the assistant performs and watches it, then what it came to. The outcome is drawn
// where the question was asked, so scrolling back finds both together.

// A verdict line's `status` as the row's mark.
/** @type {Record<string, "ok" | "warn" | "danger">} */
const LINE_VERDICT = { pass: "ok", ok: "ok", success: "ok", warn: "warn", fail: "danger", danger: "danger" };

// A sentence used as a title loses its full stop; an ellipsis stays.
function asTitle(text) {
  return typeof text === "string" && /[^.]\.$/.test(text) ? text.slice(0, -1) : text;
}

function baseName(path) {
  const s = String(path || "");
  return s.slice(s.lastIndexOf("/") + 1) || s;
}

// What a confirmed action came to, as the card's state. A pending outcome shows the assistant's
// latest progress step, so a multi-minute action reads as advancing rather than as a spinner that
// might have died. `result` is the product's verdict, `{ ok, headline, lines, tone? }`: ok is
// verified; otherwise `tone` says warn (it ran, the end state was not seen) or danger (it did not
// run), and without one a warn line marks it as the former. `auto` is an action that ran without
// being asked, so the card does not say somebody confirmed it.
/**
 * What a confirmed action came to, as the card's state.
 * @param {object} props
 * @param {import("./types.js").Message} props.msg The `verify` message holding the outcome of a confirmed action.
 * @param {import("react").ReactNode} [props.title] names the action; defaults to its label and target
 * @param {boolean} [props.auto] ran without being asked
 */
function ChatVerify({ msg, title, auto }) {
  const action = msg.action || /** @type {{ label?: string, serverName?: string }} */ ({});
  const running = title || [action.label, action.serverName].filter(Boolean).join(" ");
  if (msg.state === "pending") {
    return (
      <ChatCard className="k-chat-actcard" tone="accent" icon={<Spinner size={14} />}
        title={running} sub={msg.progress || "Waiting for the result"} subMono={false} />
    );
  }
  const r = msg.result || { ok: true, headline: "Done.", lines: [] };
  const lines = r.lines || [];
  const tone = r.ok ? "ok"
    : (r.tone === "warn" || r.tone === "danger") ? r.tone
      : lines.some(l => LINE_VERDICT[l.status] === "warn") ? "warn" : "danger";
  const at = clockOf(entryTime(msg) ?? (r.at != null ? entryTime({ at: r.at }) : null));
  const who = (auto || msg.auto) ? "Auto-run" : "You confirmed";
  const sub = who + (at ? " · " + (tone === "ok" ? "verified " : tone === "warn" ? "checked " : "") + at : "");
  return (
    <ChatCard className="k-chat-actcard" tone={tone}
      icon={tone === "ok" ? "circle-check" : tone === "warn" ? "alert-triangle" : "circle-x"}
      title={asTitle(r.headline)} sub={sub} subMono={false}>
      {lines.length > 0 && (
        <ChatCardRows>
          {lines.map((l, i) => (
            <ChatCardRow key={i} label={l.label} value={l.detail} verdict={LINE_VERDICT[l.status]} />
          ))}
        </ChatCardRows>
      )}
    </ChatCard>
  );
}

// The file a write_file proposal would save: a line diff against the file as it stands when the
// assistant sent `currentContent`, else the proposed content whole.
// Why there is no "before" to compare with, by the proposal's `currentOmitted`.
const OMITTED = {
  too_large: "Too large to compare",
  binary: "Not a text file",
  unavailable: "Couldn’t read what the file holds now",
};

// The proposal's change. With the file's current text it is a line diff; a file that does not exist
// yet (`currentContent` null, nothing omitted) is every line added; a "before" the assistant held back
// says why, over the proposed text.
/**
 * A proposal's file change: a line diff, or every line added for a file that does not exist yet.
 * @param {object} props
 * @param {import("./types.js").FileChange} props.file The file change to draw: its path, proposed content and, when held, the current content.
 */
function ChatFileChange({ file }) {
  const omitted = file.currentOmitted ? (OMITTED[file.currentOmitted] || OMITTED.unavailable) : null;
  const before = typeof file.currentContent === "string" ? file.currentContent
    : file.currentContent === null && !omitted ? "" : null;
  const rows = React.useMemo(
    () => (before != null ? diffHunks(diffLines(before, file.proposedContent || "")) : null),
    [before, file.proposedContent]);
  if (!rows) {
    return (
      <>
        {omitted && <div className="k-chat-diff__line k-chat-diff__line--skip">{omitted}</div>}
        <pre className="k-chat-actcard__file">{file.proposedContent}</pre>
      </>
    );
  }
  return (
    <div className="k-chat-diff" role="group" aria-label={"Changes to " + baseName(file.path)}>
      {rows.map((r, i) => r.type === "skip"
        ? <div key={i} className="k-chat-diff__line k-chat-diff__line--skip">{r.count + " unchanged line" + (r.count === 1 ? "" : "s")}</div>
        : (
          <div key={i} className={"k-chat-diff__line k-chat-diff__line--" + r.type}>
            <span className="k-chat-diff__mark" aria-label={r.type === "add" ? "added" : r.type === "del" ? "removed" : undefined}>
              {r.type === "add" ? "+" : r.type === "del" ? "-" : " "}
            </span>
            <span className="k-chat-diff__text">{r.text}</span>
          </div>
        ))}
    </div>
  );
}

// A proposed action, waiting on the person. `meta` is what the product calls the action —
// `{ label, icon, tone }` — and `target` what it acts on; `runnable` is false for an action this
// surface cannot redeem, which renders with `unavailable` as its reason and its button disabled.
// Running it is two presses, the verb then Confirm, and `onRun(msg)` is called on the second.
// `verify` (or `msg.verify`, as the thread folds it in) is the outcome entry the confirmation
// produced; with it the card shows that outcome instead of the question.
// `title` is what the card calls the action when the verb's button label does not read as one ahead
// of its target ("Notify me" is a button; "Get notified about Dune" is a title); without it the title
// is the label followed by the target.
// Whether a proposal's window has closed. The window ends at `expiresAt`, so a card left open past it
// changes where it stands without anything arriving.
function useLapsed(expiresAt) {
  const end = expiresAt ? Date.parse(expiresAt) : NaN;
  const [lapsed, setLapsed] = React.useState(Number.isFinite(end) && end <= Date.now());
  React.useEffect(() => {
    if (!Number.isFinite(end)) { setLapsed(false); return undefined; }
    const wait = end - Date.now();
    if (wait <= 0) { setLapsed(true); return undefined; }
    setLapsed(false);
    // A timer past 24 days overflows; the card is re-examined at the next render long before.
    const t = setTimeout(() => setLapsed(true), Math.min(wait, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [end]);
  return lapsed;
}

/**
 * A proposed action's card, through its states: offered, armed, confirmed, declined, expired, and its outcome.
 * @param {object} props
 * @param {import("./types.js").Message} props.msg The `command` message holding the proposed action.
 * @param {(msg: import("./types.js").Message) => void} props.onRun Called with the message when the person confirms the action.
 * @param {(msg: import("./types.js").Message) => void} [props.onDecline] absent: no Decline button
 * @param {import("./types.js").ProposalView['meta']} props.meta The action's label, icon and tone, from the profile's `proposal`.
 * @param {string} [props.target] What the action is aimed at, named after the label in the title.
 * @param {string} [props.title] names the action when label and target do not read
 * @param {boolean} [props.runnable] False draws a disabled button instead of the confirm flow.
 * @param {string} [props.unavailable] why it cannot run here
 * @param {import("./types.js").Message} [props.verify] The outcome message; when present the card draws it instead of the proposal.
 */
function ChatCommand({
  msg, onRun, onDecline, meta, target, title: named, runnable = true, unavailable = "Not available here yet", verify,
}) {
  const [armed, setArmed] = React.useState(false);
  const cancelRef = React.useRef(null);
  React.useEffect(() => {
    if (armed && cancelRef.current) cancelRef.current.focus({ preventScroll: true });
  }, [armed]);
  const lapsed = useLapsed(msg.state === "proposed" ? msg.expiresAt : null);

  const outcome = verify || msg.verify;
  const file = msg.file;
  const creates = !!file && file.currentContent === null && !file.currentOmitted;
  const title = file ? (creates ? "Create " : "Edit ") + baseName(file.path)
    : named || (meta.label + " " + (target || "")).trim();
  const word = file ? "save" : meta.label.toLowerCase();

  if (outcome) return <ChatVerify msg={outcome} title={title} auto={msg.auto} />;

  if (msg.state === "confirmed") {
    return <ChatCard className="k-chat-actcard" icon="check" title={title} sub="You confirmed" subMono={false} />;
  }
  if (msg.state === "declined") {
    return <ChatCard className="k-chat-actcard" tone="muted" icon="x" title={title} sub="Declined" subMono={false} />;
  }
  if (msg.state === "expired" || lapsed) {
    return <ChatCard className="k-chat-actcard" tone="muted" icon="clock" title={title} sub="Expired" subMono={false} />;
  }

  const body = file && <ChatFileChange file={file} />;
  const sub = file ? file.path : null;

  if (!runnable) {
    return (
      <ChatCard className="k-chat-actcard" icon={file ? "file-pen" : meta.icon} title={title}
        sub={file ? sub : unavailable} subMono={!!file}
        action={<Button size="sm" disabled title={unavailable}>{file ? "Save the file" : meta.label}</Button>}>
        {body}
      </ChatCard>
    );
  }

  if (armed) {
    // A confirm question that only restates the verb says nothing the title does not.
    const question = msg.confirm && msg.confirm !== title + "?" && msg.confirm !== meta.label + "?" ? msg.confirm : null;
    return (
      <ChatCard className="k-chat-actcard" tone="warn" icon={file ? "file-pen" : meta.icon}
        title={title + "?"} sub={question} subMono={false}
        action={(
          <div className="k-chat-actcard__btns">
            <Button ref={cancelRef} variant="ghost" size="sm" onClick={() => setArmed(false)}>Cancel</Button>
            <Button variant={meta.tone === "danger" ? "danger" : "primary"} size="sm" armed
              onClick={() => { setArmed(false); onRun(msg); }}>
              {"Confirm " + word}
            </Button>
          </div>
        )}>
        {body}
      </ChatCard>
    );
  }

  return (
    <ChatCard className="k-chat-actcard" tone={msg.error ? "warn" : "accent"} icon={file ? "file-pen" : meta.icon} title={title}
      sub={file ? sub : msg.error || msg.summary || msg.reason} subMono={!!file}
      action={(
        <div className="k-chat-actcard__btns">
          {onDecline && <Button variant="ghost" size="sm" onClick={() => onDecline(msg)}>Decline</Button>}
          <Button variant="primary" size="sm" onClick={() => setArmed(true)}>
            {file ? "Save the file" : meta.label}
          </Button>
        </div>
      )}>
      {body}
    </ChatCard>
  );
}

// ---------- events ----------
// Something that happened to the conversation rather than in it: one quiet centred line, an icon, a
// few words, the time. Colour is on the icon only, and only for a mode or an outcome — `tone` accent,
// warning or success; `alert` sets the whole line in the warning colour, for the one event that
// changes what the person can do next. `icon` is a Lucide name or a node.
/**
 * @param {object} props
 * @param {string | import("react").ReactNode} [props.icon] a Lucide name or a node
 * @param {"accent" | "warning" | "success"} [props.tone] The icon's colour; accent, warning or success.
 * @param {boolean} [props.alert] sets the whole line in the warning colour
 * @param {number | null} [props.at] epoch ms
 * @param {string} [props.className] Extra class on the row.
 * @param {import("react").ReactNode} [props.children] The words of the event.
 */
function ChatEventRow({ icon, tone, alert = false, at, className, children }) {
  const time = clockOf(entryTime({ at }));
  return (
    <div className={"k-chat-event" + (alert ? " k-chat-event--alert" : "") + (className ? " " + className : "")}>
      {icon && (
        <span className={"k-chat-event__icon" + (tone ? " k-chat-event__icon--" + tone : "")}>
          {typeof icon === "string" ? <Icon name={icon} size={14} strokeWidth={2} /> : icon}
        </span>
      )}
      <span className="k-chat-event__text">{children}</span>
      {time && <span className="k-chat-event__time">{"· " + time}</span>}
    </div>
  );
}

// Where a conversation crosses into another day.
/**
 * @param {object} props
 * @param {number | string | null} props.at epoch ms or an ISO string
 */
function ChatDaySeparator({ at }) {
  const t = entryTime({ at });
  if (t == null) return null;
  return <div className="k-chat-event k-chat-event--day" role="separator">{dayLabel(t)}</div>;
}

// An event entry in the transcript, worded from what it records — which switch moved and where it
// stands, which assistant is now spoken to, which host's assistant left or came back.
/**
 * An event entry in the transcript, worded from what it records.
 * @param {object} props
 * @param {import("./types.js").Message} props.msg The event message: a `toggle`, `scope`, `checkpoint`, `system` or `day` entry, or any entry with a `label`.
 */
function ChatEvent({ msg }) {
  const at = entryTime(msg);
  switch (msg.role) {
    case "toggle":
      if (msg.toggle === "thinking") {
        return (
          <ChatEventRow icon="lightbulb" tone={msg.on ? "accent" : undefined} at={at}>
            {msg.on ? "Thinking turned on" : "Thinking turned off"}
          </ChatEventRow>
        );
      }
      return (
        <ChatEventRow icon={msg.on ? "zap" : "zap-off"} tone={msg.on ? "warning" : undefined} at={at}>
          {msg.on ? "Auto-run turned on: actions run without asking" : "Auto-run turned off"}
        </ChatEventRow>
      );
    case "scope":
      return <ChatEventRow icon="target" at={at}>{msg.name ? "Talking to " + msg.name : msg.label}</ChatEventRow>;
    case "checkpoint":
      return <ChatEventRow icon="history" at={at}>Earlier messages summarized</ChatEventRow>;
    case "system":
      return msg.kind === "assistant-down"
        ? (
          <ChatEventRow icon="alert-triangle" alert at={at}>
            The assistant stopped answering · messages wait until it’s back
          </ChatEventRow>
        )
        : <ChatEventRow icon={<span className="k-chat-event__dot" />} at={at}>Reconnected</ChatEventRow>;
    case "day":
      return <ChatDaySeparator at={at} />;
    default:
      return msg.label ? <ChatEventRow at={at}>{msg.label}</ChatEventRow> : null;
  }
}

export {
  ChatCommand, ChatVerify, ChatEvent, ChatEventRow, ChatDaySeparator, ChatFileChange, entryTime, dayKeyOf,
};
