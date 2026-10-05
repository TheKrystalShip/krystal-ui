// Chat message sub-components — leaf renderers with narrow prop interfaces.
// No parent state awareness, no conversation coupling.

import React from "react";
import { Icon } from "../components/Icon.jsx";
import { Spinner } from "../components/Spinner.jsx";

function ChatContextPill({ msg }) {
  const pending = msg.state === "pending";
  const label = msg.label || "Working";
  const summary = msg.summary || "";
  const verbose = !pending && (summary.length > 120 || summary.includes("\n"));
  const [open, setOpen] = React.useState(false);

  if (verbose) {
    return (
      <div className={"chat-disc chat-disc--tool" + (open ? " chat-disc--open" : "")}>
        <button
          type="button"
          className="chat-disc__toggle"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          <Icon name="database" size={13} className="chat-disc__icon" />
          <span className="chat-disc__label">{label}</span>
          <Icon name="chevron-down" size={13} strokeWidth={2.2} className="chat-disc__chev" />
        </button>
        {open && <div className="chat-disc__body">{summary}</div>}
      </div>
    );
  }

  return (
    <div className={"chat-context" + (pending ? " chat-context--pending" : "")}>
      <span className="chat-context__icon">
        {pending
          ? <span className="chat-context__spinner"></span>
          : <Icon name="database" size={12} />}
      </span>
      <span className="chat-context__label">
        {pending ? label + "…" : label}
        {!pending && summary && <span className="chat-context__detail"> · {summary}</span>}
      </span>
      {!pending && <Icon name="check" size={12} strokeWidth={2.6} className="chat-context__check" />}
    </div>
  );
}

// Live progress stepper for a long-running tool call: a check-them-off list built from `progress`
// frames (see reduceTurnFrame's "progress" case). Renders inline in the assistant bubble, next to the
// tool pills — it is NOT held back with the cards, so it updates live while the tool is still running.
function ChatSteps({ steps }) {
  if (!steps || !steps.length) return null;
  return (
    <div className="chat-steps">
      {steps.map((s, i) => (
        <div key={s.id + ":" + s.key + ":" + i} className={"chat-steps__step chat-steps__step--" + s.status}>
          <span className="chat-steps__mark">
            {s.status === "active"
              ? <span className="chat-steps__spinner"></span>
              : <Icon name="check" size={11} strokeWidth={2.6} />}
          </span>
          <span className="chat-steps__label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChatThinking({ text, streaming }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={"chat-disc chat-disc--think" + (open ? " chat-disc--open" : "")}>
      <button
        type="button"
        className="chat-disc__toggle"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <Icon name="brain" size={13} className="chat-disc__icon" />
        <span className="chat-disc__label">{streaming ? "Thinking…" : "Thinking"}</span>
        <Icon name="chevron-down" size={13} strokeWidth={2.2} className="chat-disc__chev" />
      </button>
      {open && <div className="chat-disc__body">{text}</div>}
    </div>
  );
}

// A proposed action, waiting on the person. `meta` is what the product calls the action —
// `{ label, icon, tone }` — and `target` what it acts on; `runnable` is false for an action this
// surface cannot redeem, which renders as a proposal with `unavailable` as its reason and no Run.
// Running it is two presses, Run then Confirm, and `onRun(msg)` is called on the second.
function ChatCommand({ msg, onRun, meta, target, runnable = true, unavailable = "Not available here yet" }) {
  const [armed, setArmed] = React.useState(false);

  if (msg.state === "confirmed") {
    return (
      <div className="chat-actions">
        <div className="chat-actions__done">
          <Icon name="check" size={13} strokeWidth={2.6} />
          <span>Confirmed <b>{meta.label}</b> on {target}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="chat-actions">
      <div className="chat-actions__label">
        <Icon name="zap" size={12} /> Suggested action
      </div>
      {msg.file && (
        <div className="chat-filepreview">
          <div className="chat-filepreview__path">
            <Icon name="file-pen" size={11} strokeWidth={2.2} />
            <code>{msg.file.path}</code>
          </div>
          <pre className="chat-filepreview__body">{msg.file.proposedContent}</pre>
        </div>
      )}
      <div className="chat-actions__row">
        {!runnable ? (
          <button className="chat-action chat-action--disabled" disabled title={unavailable + "."}>
            <Icon name={meta.icon} size={13} strokeWidth={2.2} />
            <span>{meta.label} {target}</span>
            <span className="chat-action__reason">{unavailable}</span>
          </button>
        ) : armed ? (
          <div className="chat-action chat-action--armed">
            <span className="chat-action__confirm-q">{msg.confirm}</span>
            <div className="chat-action__confirm-btns">
              <button className={"chat-action__go chat-action__go--" + meta.tone} onClick={() => { setArmed(false); onRun(msg); }}>
                <Icon name="check" size={13} strokeWidth={2.4} /> Confirm
              </button>
              <button className="chat-action__cancel" onClick={() => setArmed(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className={"chat-action chat-action--" + meta.tone} onClick={() => setArmed(true)}>
            <Icon name={meta.icon} size={13} strokeWidth={2.2} />
            <span>{meta.label} {target}</span>
            {msg.reason && <span className="chat-action__reason">{msg.reason}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

function ChatScopeNotice({ msg }) {
  return (
    <div className="chat-scope-notice">
      <Icon name="crosshair" size={12} />
      <span>{msg.label}</span>
    </div>
  );
}

function ChatCheckpointNotice({ msg }) {
  return (
    <div className="chat-scope-notice" style={{ opacity: 0.65 }}>
      <Icon name="history" size={12} />
      <span>{msg.label || "Conversation compacted"}</span>
    </div>
  );
}

function ChatToggleNotice({ msg }) {
  const isThink = msg.toggle === "thinking";
  const icon = isThink ? "brain" : (msg.on ? "zap" : "zap-off");
  const cls = "chat-toggle-notice"
    + (msg.on ? " chat-toggle-notice--on" : "")
    + (isThink ? " chat-toggle-notice--think" : " chat-toggle-notice--actions");
  return (
    <div className={cls}>
      <Icon name={icon} size={12} className="chat-toggle-notice__icon" />
      <span className="chat-toggle-notice__text">{msg.label}</span>
    </div>
  );
}

// What a confirmed action came to. Pending shows the assistant's latest progress step, so a
// multi-minute action reads as advancing rather than as a spinner that might have died.
function ChatVerify({ msg }) {
  if (msg.state === "pending") {
    return (
      <div className="chat-verify chat-verify--pending">
        <Spinner />
        <span>{msg.progress || ("Verifying " + msg.action.label.toLowerCase() + "…")}</span>
      </div>
    );
  }
  const r = msg.result || { ok: true, headline: "Done.", lines: [] };
  return (
    <div className={"chat-verify chat-verify--" + (r.ok ? "ok" : "warn")}>
      <div className="chat-verify__head">
        <Icon name={r.ok ? "circle-check-big" : "alert-triangle"} size={14} />
        <span>{r.headline}</span>
      </div>
      {r.lines && r.lines.length > 0 && (
        <div className="chat-verify__lines">
          {r.lines.map((l, i) => (
            <span key={i} className={"chat-verify__chip chat-verify__chip--" + l.status}>
              {l.label}: <b>{l.detail}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// The assistant went away or came back while a conversation was open. `others` names the other
// assistants a picker offers, which hold their own conversations and so cannot carry this one on.
function ChatSystemNotice({ msg }) {
  const down = msg.kind === "assistant-down";
  return (
    <div className={"chat-system chat-system--" + (down ? "down" : "up")}>
      <span className={"status-led status-led--" + (down ? "down" : "live")}></span>
      <div className="chat-system__body">
        <span className="chat-system__title">
          {down ? msg.host + "’s assistant is unavailable" : msg.host + "’s assistant reconnected"}
        </span>
        {down && (
          <span className="chat-system__detail">
            {(msg.message || "The connection to this host’s assistant dropped.") + " Your messages will send once it’s back."}
            {msg.others && msg.others.length > 0 &&
              " Other assistants are online (" + msg.others.join(", ") + "), but they run on different hosts and can’t see this host’s data — so they can’t pick up where this one left off."}
          </span>
        )}
      </div>
    </div>
  );
}

function ChatPending() {
  return (
    <div className="chat-typing" role="status" aria-label="The assistant is typing">
      <span></span><span></span><span></span>
    </div>
  );
}

export {
  ChatContextPill, ChatSteps, ChatThinking, ChatCommand, ChatScopeNotice,
  ChatCheckpointNotice, ChatToggleNotice, ChatVerify, ChatPending, ChatSystemNotice,
};
