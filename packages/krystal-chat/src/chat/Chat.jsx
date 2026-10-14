import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "@thekrystalship/krystal";
import { Button, IconButton } from "@thekrystalship/krystal";
import { EmptyState } from "@thekrystalship/krystal";
import { NavItem } from "@thekrystalship/krystal";
import { Spinner } from "@thekrystalship/krystal";
import { Toggle } from "@thekrystalship/krystal";
import { usePortalPopover } from "@thekrystalship/krystal";
import { VoiceComposerBar, useVoiceRecorder } from "./VoiceNote.jsx";
import { createSpokenReply, armAudio } from "./spokenReply.js";
import {
  NEW_CHAT_TITLE, conversationTitle,
  loadConversations, saveConversations,
  uid, reduceTurnFrame, promotePendingCards,
  scaffoldHistory, scaffoldConversation,
  scaffoldLiveTurn, latestUsage, mergeServerConversations, adoptServerConversation,
  settleProposal, answersText,
} from "./conversation.js";
import { ChatCommand } from "./ChatMessageParts.jsx";
import { ChatCommandMenu } from "./ChatCommandMenu.jsx";
import { MarkdownTextarea } from "./MarkdownTextarea.jsx";
import { resolveCommand, suggestFor } from "./chatCommands.js";
import { ChatContextMeter, ContextRing, contextUsage, useCompact } from "./ChatContextMeter.jsx";
import { ChatHistory } from "./ChatHistory.jsx";
import { CHAT_PRIVACY_NOTICE, ChatContext, DefaultAboveComposer, DefaultStart, renderSlot } from "./slots.jsx";
import { ChatThread } from "./ChatThread.jsx";
import { ComposerAttachments } from "./ChatAttachments.jsx";
import { prepareAttachment, textOverLimit } from "./attachments.js";
import { useConversationStream } from "./useConversationStream.js";

// Chat renders a conversation with ONE assistant, over the assistant wire contract. Everything that
// is true of the surface around it rather than of the conversation arrives as a prop, because the
// surfaces that render it differ in exactly those things: one drives a cluster (several assistants,
// a picker, per-host access, a review mode for other people's chats), another is one assistant with
// none of that. Defaults describe the smaller surface, so the smallest passes almost nothing and
// gets a chat.
//
// `assistantHost` is the identity of the assistant being addressed — `{ id, name, title }` — and
// `clientFor(id)` answers its client (`createAssistantClient`, or a site's own with the same
// methods). A client that has `attachmentLimits`, `uploadAttachment` and `attachment` lets a person
// attach files (`+` at the composer's left, paste, drop). A conversation remembers the id it lives on, so one held by another assistant is still
// addressed through its own client. `authed` says the site holds a session that assistant accepts.
//
// What a product shows of its own goes through `profile` and the render slots:
//
//   profile.adaptCard(result)      a tool result → a card for `renderCards`, or null
//   profile.proposalLabel(verb)    what a proposed action is offered as, absent its own sentence
//   profile.proposal(msg)          { meta: { label, icon, tone }, target, targetName, runnable,
//                                    unavailable, title? } for a proposed action's card and its
//                                    outcome; `title` names it when label + target does not read
//   profile.verdict(msg, targetName, response)  { ok, headline, lines } for a confirmed action
//   renderEntry(msg, key, api)     a product's own transcript roles; undefined falls through
//   renderCards(msg, api)          the cards under an answer
//   turnExtras()                   extra fields the next turn carries (a draft open for review)
//
// `api` is what those renderers may do to the conversation: `run(msg)` confirms a proposal,
// `setMessages(updater)` patches the open transcript, `client()` is the open assistant's client.
//
// The frames that belong to a running TURN, as opposed to the state events about the chat list. They
// carry no turn id of their own, so they apply to whichever turn last announced itself on the stream.
// How long the activity events stay quiet before the conversation listing is read again.
const HISTORY_REFETCH_DEBOUNCE_MS = 500;

const TURN_FRAMES = new Set([
  "text.delta", "thinking.delta", "tool.start", "tool.result", "progress",
  "command.proposed", "proposal", "question", "context.compacting", "done", "error",
  // One sentence of the reply, spoken. Handled as a side effect rather than through the message
  // reducer: it is audio to play, not state to render, and nothing about the transcript changes.
  "audio.delta",
]);

// An assistant's title reads mid-sentence ("hotrod\u2019s assistant", "the cinema\u2019s assistant"), which
// is where most of them appear. This is the same phrase starting one.
const sentence = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// How a sentence names an assistant: its title, else its name, else plainly "the assistant" — a site
// with one assistant may give it no title.
const titleOf = (host) => (host && (host.title || host.name)) || "the assistant";

// A proposed action this surface knows nothing about: named by its verb, aimed at its subject, and
// redeemable — the assistant that proposed it is the one that performs it.
/**
 * @type {import("./types.js").Profile}
 */
const DEFAULT_PROFILE = {
  adaptCard: () => null,
  proposalLabel: (verb) => (verb || "Run").replace(/_/g, " "),
  proposal: (msg) => ({
    meta: { label: (msg.verb || "Run").replace(/_/g, " "), icon: "zap", tone: "info" },
    target: msg.target || msg.subject || msg.subjectId || "",
    targetName: msg.target || msg.subject || msg.subjectId || "",
    runnable: true,
  }),
  // The assistant's own sentence, and `success` for which way it went.
  verdict: (msg, targetName, resp) => (resp && resp.success
    ? { ok: true, headline: resp.text || "Done.", lines: [] }
    : { ok: false, headline: (resp && resp.text) || "That didn’t work.", lines: [] }),
};

// What each of a conversation's switches means in the state it stands at: the composer's tooltip on
// that switch, and what the transcript says when it moves.
/**
 * @type {import("./types.js").ToggleCopy}
 */
const DEFAULT_TOGGLE_COPY = {
  thinking: {
    on:  "Thinking on — replies may take a little longer but tend to be more thorough and accurate.",
    off: "Thinking off — the assistant answers directly, for quicker replies.",
  },
  actions: {
    on:  "Auto-run on — the assistant will carry out actions immediately, without asking you to confirm each one.",
    off: "Auto-run off — the assistant will propose actions and wait for you to confirm before anything runs.",
  },
};

// Greetings for the empty-chat screen. One is drawn at random per conversation so opening a new chat
// feels like being greeted rather than reading a label. Free of product names — the header and the
// composer placeholder already say WHICH assistant is answering.
/**
 * @type {string[]}
 */
const CHAT_GREETINGS = [
  "Hello, what can I do for you?",
  "Hi there — what can I help with?",
  "What can I do for you today?",
  "Hey — what are we working on?",
  "Ready when you are. What do you need?",
  "Hi! What would you like to do?",
  "Good to see you. What can I help with?",
  "What's on your mind?",
];
function pickGreeting() {
  return CHAT_GREETINGS[Math.floor(Math.random() * CHAT_GREETINGS.length)];
}


// A popover the chat's chrome opens from one of its buttons: placed against that button, closed by a
// click outside or Escape, which hands focus back to the button. `align="start"` lines its left edge
// up with the button's — for a button at the start of a row, whose menu would otherwise hang off to
// the side away from what it belongs to.
/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.setOpen
 * @param {import("react").RefObject<HTMLElement>} props.anchorRef the button the menu opens from
 * @param {string} [props.role]
 * @param {string} props.label
 * @param {"start"} [props.align] lines the menu's left edge up with the button's
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children]
 */
function ChatMenu({ open, setOpen, anchorRef, role = "menu", label, align, className = "", children }) {
  const { pos, menuRef } = usePortalPopover(open, setOpen, anchorRef,
    align === "start" ? { placement: "bottom-start" } : undefined);
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      if (anchorRef.current) anchorRef.current.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen, anchorRef]);
  if (!open || !pos) return null;
  return createPortal(
    <div className={"k-chat-menu" + (className ? " " + className : "")} role={role} aria-label={label}
      ref={menuRef} style={pos}>
      {children}
    </div>,
    document.body);
}

// The header's menu for the open conversation. Deleting asks twice: the second press is on the same
// row, which now says what it is about to do.
function ConversationOptions({ onCompact, onDelete }) {
  const [open, setOpen] = React.useState(false);
  const [armed, setArmed] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => { if (!open) setArmed(false); }, [open]);
  return (
    <>
      <IconButton ref={ref} icon="ellipsis" label="Conversation options" variant="ghost" size="sm"
        aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)} />
      <ChatMenu open={open} setOpen={setOpen} anchorRef={ref} label="Conversation options">
        <Button variant="ghost" size="sm" wide icon="rotate-ccw" role="menuitem" className="k-chat-menu__item"
          disabled={!onCompact}
          onClick={() => { setOpen(false); Promise.resolve(onCompact()).catch(() => {}); }}>
          Compact
        </Button>
        <div className="k-chat-menu__sep" role="separator" />
        <Button variant={armed ? "danger" : "ghost"} size="sm" wide icon="trash-2" role="menuitem"
          className="k-chat-menu__item k-chat-menu__item--danger"
          onClick={() => { if (!armed) { setArmed(true); return; } setOpen(false); onDelete(); }}>
          {armed ? "Delete for good" : "Delete conversation"}
        </Button>
      </ChatMenu>
    </>
  );
}

/**
 * A conversation with one assistant over the assistant wire contract. What is true of the surface
 * around it rather than of the conversation arrives as a prop; the defaults describe the smallest
 * surface, which passes almost nothing.
 * @param {object} props
 * @param {any} [props.user] the signed-in person, handed on to the renderers of the thread
 * @param {boolean} [props.docked] drawn in the dock's window
 * @param {{ prompt?: string, nonce?: number | string }} [props.seed] words put in the composer once per `nonce`
 * @param {() => void} [props.onClose]
 * @param {() => void} [props.onExpand]
 * @param {import("./types.js").AssistantHost} [props.assistantHost] the assistant addressed
 * @param {import("./types.js").AssistantHost[]} [props.assistantHosts] every assistant a picker offers
 * @param {(id: string, opts?: { chosen?: boolean }) => void} [props.onSelectAssistantHost]
 * @param {boolean} [props.showPin]
 * @param {boolean} [props.pinned]
 * @param {boolean} [props.pinDisabled]
 * @param {() => void} [props.onTogglePin]
 * @param {import("./types.js").Review} [props.review] a conversation of another person under review: read-only, replaces the whole surface
 * @param {() => void} [props.onExitReview]
 * @param {(hostId: string) => import("./types.js").AssistantClient} props.clientFor the client of the assistant with that id (`createAssistantClient`, or a site's own with the same methods)
 * @param {boolean} [props.authed] the site holds a session the assistant accepts
 * @param {import("./types.js").Connection} [props.connection] the header badge and the usable gate
 * @param {boolean} [props.canSeeActions] the caller may see proposed actions
 * @param {boolean} [props.canUseActions] the caller may run actions without confirming
 * @param {((hostId: string, conversationId: string) => Promise<{ entries: import("./types.js").HistoryEntry[] }>) | null} [props.loadTranscript] reads a conversation under review
 * @param {((hostId: string, conversationId: string, attachment: import("./types.js").AttachmentInfo) => Promise<Blob>) | null} [props.loadReviewAttachment]
 * @param {import("react").ComponentType<import("./types.js").HostPickerProps> | null} [props.HostPicker] a picker among several assistants, in the header
 * @param {import("./types.js").ChatSlots} [props.slots] a site's blocks in the chat's frame
 * @param {string} [props.pageClass] an extra class on the page root
 * @param {"page" | "panel"} [props.layout] a panel beside or over a page, or the whole page a phone shows
 * @param {(() => void) | null} [props.onOpenSettings] the way to the surface's own settings, when the chat is the app
 * @param {HTMLElement | null} [props.railTarget] the element the conversation list is drawn into, for a site whose frame has a sidebar
 * @param {HTMLElement | null} [props.listTarget] a page of the site's own that shows the same list full width
 * @param {(() => void) | null} [props.onShowConversation] the person opened or started a conversation while the site shows something else
 * @param {boolean} [props.conversationShown] whether the chat is what is on screen
 * @param {string} [props.storageKey] where this browser caches the conversation list
 * @param {string} [props.assistantName]
 * @param {import("./types.js").Profile} [props.profile] what a product shows of its own: cards, and how a proposed action reads
 * @param {import("./types.js").ToggleCopy} [props.toggleCopy] what each switch means in the state it stands at
 * @param {import("./types.js").Suggestion[]} [props.suggestions] the empty screen's opening suggestions
 * @param {string} [props.primer] the sentence under the greeting saying what the assistant can do for this caller
 * @param {string} [props.noAssistant] what the empty screen says when there is no assistant to talk to
 * @param {{ locked: string, on?: string, off?: string }} [props.autorunHint] the auto-run switch's tooltip
 * @param {(msg: import("./types.js").Message, key: number, api: import("./types.js").ChatApi) => import("react").ReactNode | undefined} [props.renderEntry] a product's own transcript roles; `undefined` falls through
 * @param {(msg: import("./types.js").Message, api: import("./types.js").ChatApi) => import("react").ReactNode} [props.renderCards] the cards under an answer
 * @param {() => Record<string, any> | null} [props.turnExtras] extra fields the next turn carries (a draft open for review)
 */
function Chat({
  user, docked, seed, onClose, onExpand,
  assistantHost, assistantHosts = [], onSelectAssistantHost,
  showPin, pinned, pinDisabled, onTogglePin, review, onExitReview,
  // ---- the assistant ----
  clientFor, authed = false,
  // ---- the environment ----
  // `connection` is the header badge and the usable gate, already decided by the site.
  connection,
  // What the caller may do with THIS assistant: see proposed actions, and run them without
  // confirming. The site asks the assistant it talks to.
  canSeeActions = false, canUseActions = false,
  // Review of someone else's conversation: `loadTranscript(hostId, conversationId)` reads it, and
  // `loadReviewAttachment(hostId, conversationId, attachment)` (a Promise of a Blob) one of its
  // attachments, the conversation named as the site's review listing names it. Absent ⇒ the surface
  // has no review mode, and a reviewed transcript without the second shows each attachment's name.
  loadTranscript = null, loadReviewAttachment = null,
  // A picker among several assistants, in the header.
  HostPicker = null,
  // A site's blocks in the chat's frame, by place: `start`, `aboveComposer`, `headerActions` and
  // `history` (slots.jsx says what each is and what the handle every block is given offers). A place
  // left empty draws the chat's own blocks there.
  slots = {},
  // An extra class on the page root, for a surface that lays the chat out differently — a chat that
  // owns the whole viewport, or one in a content area inside a shell.
  pageClass = "",
  // Where the chat stands. `"panel"` is a panel beside or over a page: its own surface, framed, with
  // the dock's window buttons. `"page"` is the chat as the whole page a phone shows: it stands on the
  // page's own background with no frame, leaves through the site's tab bar rather than a close button,
  // offers its suggestions as a row over the composer, keeps its conversations in a sheet, and gives
  // the tab bar's room to the keyboard while the person types.
  layout = "panel",
  // The way to this surface's own settings, when the chat IS the app and so carries the only route
  // to it.
  onOpenSettings = null,
  // A site whose frame has a sidebar keeps the conversation list there instead of beside the chat:
  // `railTarget` is the element it is drawn into, and the chat takes the whole width. The list
  // stays the chat's — a site that shows something other than the chat while the list is in view
  // learns through `onShowConversation` that the person opened or started one, and says through
  // `conversationShown` whether the chat is what is on screen, so the sidebar lights the open one only then.
  // `listTarget` is a page of the site's own that shows the same list full width — a phone's tab of
  // conversations. A chat whose list a site draws elsewhere carries no history popover in its header.
  railTarget = null, listTarget = null, onShowConversation = null, conversationShown = true,
  // ---- what the product says and draws ----
  storageKey = "krystal:chat:conversations",
  assistantName = "Assistant",
  profile = DEFAULT_PROFILE,
  toggleCopy = DEFAULT_TOGGLE_COPY,
  // The empty screen's opening suggestions, and the sentence under the greeting saying what the
  // assistant can do for this caller.
  suggestions = [],
  primer = "",
  // What the empty screen says when there is no assistant to talk to.
  noAssistant = "No assistant is available right now.",
  // The auto-run switch's tooltip: `locked` when this caller may not turn it on, and `on` / `off`
  // where a product words them apart from `toggleCopy.actions`.
  autorunHint = { locked: "Auto-run is not available to you" },
  renderEntry, renderCards, turnExtras,
}) {
  const conn = connection || { tone: "muted", label: "No assistant", usable: false, message: null };
  const asPage = layout === "page";
  const assistantUsable = !!conn.usable;

  // The assistant accepts the session this surface already holds, so there is nothing to sign in to
  // here. A session that is not live is the site's own gate's business.
  const assistantAuthed = !!assistantHost && !!authed;

  const [convos, setConvos]     = React.useState(() => loadConversations(storageKey));
  const [activeId, setActiveId] = React.useState(() => loadConversations(storageKey)[0]?.id || null);
  const [input, setInput]       = React.useState("");
  const [busy, setBusy]         = React.useState(false);
  // A page's header draws its rule only once the thread has scrolled under it.
  const [lifted, setLifted]     = React.useState(false);
  // Whether the person is writing, on a page: the site's tab bar gives its room to the keyboard then
  // (`body.k-chat-typing`, tabbar.css).
  const [typing, setTyping]     = React.useState(false);
  const pressingRef = React.useRef(false);
  React.useEffect(() => {
    if (!asPage) return undefined;
    const down = () => { pressingRef.current = true; };
    const up = () => { pressingRef.current = false; };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", up, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", up, true);
    };
  }, [asPage]);
  React.useEffect(() => {
    if (!asPage || !typing) return undefined;
    document.body.classList.add("k-chat-typing");
    return () => document.body.classList.remove("k-chat-typing");
  }, [asPage, typing]);
  // A page lays the keyboard over itself rather than letting it resize the viewport, so the page
  // decides what moves: the composer rises by the keyboard's height (`env(keyboard-inset-height)`,
  // tabbar.css) and nothing else on the site changes for a keyboard while the chat is not open.
  React.useEffect(() => {
    const keyboard = typeof navigator !== "undefined" ? /** @type {any} */ (navigator).virtualKeyboard : null;
    if (!asPage || !keyboard) return undefined;
    const before = keyboard.overlaysContent;
    keyboard.overlaysContent = true;
    return () => { keyboard.overlaysContent = before; };
  }, [asPage]);


  // Thinking and auto-run are the CONVERSATION's, held by the assistant and read by the turn — so these
  // are a mirror of what the assistant last told us, never the value the turn runs on. Auto-run is
  // deliberately per-conversation: it is the one switch that skips the confirmation gate, and a
  // preference that followed the person around would arm chats they were not looking at.
  const active = convos.find(c => c.id === activeId) || null;
  const thinkOn = !!(active && active.think);
  const actionsOn = !!(active && active.autorun);
  const autoAcceptActive = actionsOn && canUseActions;
  // Whether the open conversation's transcript is known to be behind — set when the assistant says its log
  // grew somewhere else. Read as a scalar so the detail effect can depend on it without depending on
  // the whole conversation list.
  const activeStale = !!(active && active.stale);

  // Reflect what the assistant answered, and say so in the transcript. The assistant's `state` is what lands —
  // a toggle asked for is not a toggle granted, and showing the asked-for value would report a
  // change that may not have happened.
  const applySwitch = React.useCallback((convId, toggle, on) => {
    const field = toggle === "thinking" ? "think" : "autorun";
    const label = toggleCopy[toggle][on ? "on" : "off"];
    setConvos(prev => prev.map(c => c.id !== convId ? c : {
      ...c,
      [field]: on,
      messages: c.messages.length > 0
        ? [...c.messages, { role: "toggle", toggle, on, label, at: Date.now() }]
        : c.messages,
    }));
  }, [toggleCopy]);

  // What this person may type at THIS assistant, in its own words. Already filtered to what they hold,
  // so nothing here is a policy decision made in the browser — a command they cannot run never
  // arrives, and there is no disabled row to explain. An unreachable or unauthenticated assistant
  // leaves the catalog empty, which turns the whole surface off rather than offering something that
  // would fail: a slash then just starts a message.
  const [commandCatalog, setCommandCatalog] = React.useState([]);
  React.useEffect(() => {
    if (!assistantHost || !assistantUsable || !assistantAuthed) { setCommandCatalog([]); return; }
    let live = true;
    clientFor(assistantHost.id).commands()
      .then((list) => { if (live) setCommandCatalog(Array.isArray(list) ? list : []); })
      .catch(() => { if (live) setCommandCatalog([]); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [assistantHost && assistantHost.id, assistantUsable, assistantAuthed]);

  const scrollRef = React.useRef(null);
  const abortRef  = React.useRef(null);
  // Read where a callback defined above `loadTurns` needs it, without rebuilding that callback.
  const loadTurnsRef = React.useRef(() => {});

  // Reading answers aloud. Off until asked: a page that starts talking is a surprise in a room with
  // other people in it, and a browser refuses audio before a gesture anyway. Remembered per
  // conversation, because whether you want to listen belongs to the conversation you are in.
  const [speak, setSpeak] = React.useState(false);
  // The browser refused to play audio at all. Shown on the toggle, which is the control that asked.
  const [speakBlocked, setSpeakBlocked] = React.useState(false);
  // What the assistant's speech engine can do — `{ hear, speak }`, or null until asked. `hear` is what
  // decides who transcribes a voice note, so it is read before the microphone is offered rather than
  // discovered by a recording nobody can read.
  //
  // An assistant that cannot be asked reads as neither. That is the honest answer and also the safe
  // one: the microphone falls back to the browser's own recogniser, which is exactly what an assistant
  // with no speech engine gets, so an unreachable one degrades to the same place as an absent one.
  const [hostSpeech, setHostSpeech] = React.useState(null);
  React.useEffect(() => {
    if (!assistantHost || !assistantUsable || !assistantAuthed) { setHostSpeech(null); return; }
    let live = true;
    clientFor(assistantHost.id).speech()
      .then((s) => { if (live) setHostSpeech(s && typeof s === "object" ? s : null); })
      .catch(() => { if (live) setHostSpeech(null); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [assistantHost && assistantHost.id, assistantUsable, assistantAuthed]);
  // What a message may carry, as this assistant says (`wire-contract.md` §2.2), or null: nothing to
  // attach, and no `+`. A client without the attachment calls, or an assistant that cannot be asked,
  // offers none.
  const [attachLimits, setAttachLimits] = React.useState(null);
  React.useEffect(() => {
    const client = assistantHost && assistantUsable && assistantAuthed ? clientFor(assistantHost.id) : null;
    if (!client || typeof client.attachmentLimits !== "function" || typeof client.uploadAttachment !== "function") {
      setAttachLimits(null);
      return undefined;
    }
    let live = true;
    client.attachmentLimits()
      .then((l) => { if (live) setAttachLimits(l && typeof l === "object" ? l : null); })
      .catch(() => { if (live) setAttachLimits(null); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [assistantHost && assistantHost.id, assistantUsable, assistantAuthed]);

  // The files waiting in the composer, each prepared (a picture shrunk, a text file read) and then
  // uploaded as soon as it is attached, so sending waits on nothing: `{ key, kind, name, previewUrl,
  // status, progress, info, tokens, error }`. An upload belongs to the person until a turn names it.
  const [attached, setAttached] = React.useState([]);
  const attachedRef = React.useRef(attached);
  React.useEffect(() => { attachedRef.current = attached; }, [attached]);
  const fileInputRef = React.useRef(null);
  const pictureInputRef = React.useRef(null);
  const attachRef = React.useRef(null);
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  const patchAttached = (key, patch) =>
    setAttached(prev => prev.map(a => (a.key === key ? { ...a, ...patch } : a)));

  const addFiles = (list) => {
    const limits = attachLimits;
    const files = Array.from(list || []);
    if (!limits || !assistantHost || files.length === 0) return;
    const client = clientFor(assistantHost.id);
    let pictures = attachedRef.current.filter(a => a.kind === "image" && a.status !== "error").length;
    for (const file of files) {
      const key = uid();
      const ctrl = new AbortController();
      const looksLikePicture = (file.type || "").startsWith("image/");
      const item = { key, name: file.name || "file", kind: looksLikePicture ? "image" : "text", status: "preparing", progress: 0, ctrl };
      if (looksLikePicture && limits.images && limits.maxImages && pictures >= limits.maxImages) {
        setAttached(prev => [...prev, { ...item, status: "error",
          error: "A message may carry up to " + limits.maxImages + " pictures." }]);
        continue;
      }
      if (looksLikePicture) pictures++;
      setAttached(prev => [...prev, item]);
      (async () => {
        const prepared = await prepareAttachment(file, limits);
        if (ctrl.signal.aborted) return;
        if (prepared.error) { patchAttached(key, { status: "error", error: prepared.error }); return; }
        const previewUrl = prepared.kind === "image" ? URL.createObjectURL(prepared.blob) : null;
        patchAttached(key, { kind: prepared.kind, name: prepared.name, previewUrl, tokens: prepared.tokens, status: "uploading" });
        try {
          const info = await client.uploadAttachment(prepared.blob, prepared.name, {
            signal: ctrl.signal,
            onProgress: (sent, total) => patchAttached(key, { progress: total ? sent / total : 0 }),
          });
          patchAttached(key, { status: "ready", progress: 1, info });
        } catch (e) {
          if (e && e.name === "AbortError") return;
          patchAttached(key, { status: "error", error: (e && e.userMessage) || "The file couldn\u2019t be uploaded." });
        }
      })();
    }
  };

  // The file picker. Where the browser has the File System Access picker and the chat is not in another
  // origin's frame (which may not show one), that picker: Chrome on Android opens it as the phone's file
  // browser, where an `<input type=file>` opens a chooser of the camera and the photo picker alone,
  // whatever its `accept`. Everywhere else, the file input.
  const pickFiles = async () => {
    let topLevel = false;
    try { topLevel = window.self === window.top; } catch { topLevel = false; }
    if (!topLevel || typeof /** @type {any} */ (window).showOpenFilePicker !== "function") {
      if (fileInputRef.current) fileInputRef.current.click();
      return;
    }
    try {
      const handles = await /** @type {any} */ (window).showOpenFilePicker({ multiple: true });
      addFiles(await Promise.all(handles.map(h => h.getFile())));
    } catch (e) {
      if (e && e.name === "AbortError") return;
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const removeAttached = (key) => {
    const item = attachedRef.current.find(a => a.key === key);
    if (item) {
      item.ctrl.abort();
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    setAttached(prev => prev.filter(a => a.key !== key));
  };

  const readyAttached = attached.filter(a => a.status === "ready");
  const attachingNow = attached.some(a => a.status === "preparing" || a.status === "uploading");
  const attachTooLong = textOverLimit(readyAttached, attachLimits);
  // Something to send: words, or a file ready and nothing still on its way.
  const canSend = (!!input.trim() || readyAttached.length > 0) && !attachingNow && !attachTooLong;

  const onComposerPaste = (e) => {
    const files = e.clipboardData && e.clipboardData.files;
    if (!attachLimits || !files || files.length === 0) return;
    e.preventDefault();
    addFiles(files);
  };
  const dragHasFiles = (e) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");
  const onComposerDragOver = (e) => {
    if (!attachLimits || !dragHasFiles(e)) return;
    e.preventDefault();
    if (!dragging) setDragging(true);
  };
  const onComposerDrop = (e) => {
    if (!attachLimits || !dragHasFiles(e)) return;
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // The player for the turn now running. One at a time — a new turn stops the last one's audio, which
  // is what makes the stop button silence it as well.
  const spokenRef = React.useRef(null);
  const speakRef = React.useRef(false);
  React.useEffect(() => { speakRef.current = speak; }, [speak]);
  // Whether the in-flight turn's POST was let go because this surface came back from being frozen,
  // as opposed to the person pressing Stop. The two look identical to the fetch (both are an
  // AbortError) and mean opposite things in the transcript: one is "you stopped it", the other is
  // "I lost sight of it and am about to re-read what actually happened".
  const resumedRef = React.useRef(false);
  const taRef     = React.useRef(null);
  const pinnedRef = React.useRef(true);

  React.useEffect(() => { saveConversations(storageKey, convos); }, [storageKey, convos]);

  const [histLoading, setHistLoading] = React.useState(false);
  const histReqRef = React.useRef(0);
  const loadServerHistory = React.useCallback(() => {
    if (!assistantHost || !assistantUsable || !assistantAuthed) return;
    const reqId = ++histReqRef.current;
    setHistLoading(true);
    clientFor(assistantHost.id).conversations().then(
      (list) => { if (histReqRef.current === reqId) setConvos(prev => mergeServerConversations(prev, list, assistantHost.id)); },
      () => {})
      .finally(() => { if (histReqRef.current === reqId) setHistLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [assistantHost && assistantHost.id, assistantUsable, assistantAuthed]);

  // A burst of activity events (several conversations moving at once, or one turn's many updates) asks
  // for one listing: a trailing debounce, the listing read once the burst has been quiet for a moment.
  const historyTimerRef = React.useRef(null);
  const loadServerHistoryLater = React.useCallback(() => {
    clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(loadServerHistory, HISTORY_REFETCH_DEBOUNCE_MS);
  }, [loadServerHistory]);
  React.useEffect(() => () => clearTimeout(historyTimerRef.current), []);

  // The conversations the ASSISTANT holds are this list's other half — everything from another browser,
  // another device, or this one before its localStorage was cleared. Fetched as soon as there is a
  // session to fetch them with, so the rail is the whole history rather than only what this browser
  // happens to remember. loadServerHistory is a no-op until authed and re-identifies when the
  // addressed host changes, so this runs once per host per session.
  React.useEffect(() => { loadServerHistory(); }, [loadServerHistory]);

  // And again whenever this surface comes back to the foreground. The conversation's switches and the
  // chat list both live at the assistant, and another surface — the site in another tab, the installed
  // app on a phone — can move them while this one is backgrounded. Re-reading on the way back in is
  // what makes the toggles show the conversation's state rather than this browser's memory of it.
  React.useEffect(() => {
    // One return to the foreground fires visibilitychange AND focus, and the two say the same thing —
    // so the second is coalesced away rather than fetching the list twice every time.
    let last = 0;
    const refresh = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 1000) return;
      last = Date.now();
      loadServerHistory();
      loadTurnsRef.current();

      // And let go of a turn POST that was open when this surface was backgrounded. A frozen page's
      // fetch is dead whether or not its promise ever settles, and while this code believes it is open
      // three things stay wrong at once: `busy` never clears, the transcript refetch is gated off
      // behind it, and the event stream's frames keep being skipped as this surface's own. The result
      // is a permanent "the assistant is typing" over a turn that finished minutes ago — which is
      // exactly the state somebody returns to after acting on a push notification.
      //
      // Letting go costs nothing: a turn is a SESSION at the assistant, not this request, so one genuinely
      // still running is restated by the stream's next attach, and one that finished is restated by
      // the re-read.
      if (abortRef.current) {
        resumedRef.current = true;
        abortRef.current.abort();
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadServerHistory]);

  // What the assistant pushes while this surface is open, so a conversation held in two places agrees with
  // itself. Only changes made SOMEWHERE ELSE arrive here — the hook drops this surface's own echoes —
  // so every branch below is reacting to another tab, another device, or Discord.
  //
  // The switches are applied from the frame, which carries them; everything else names a conversation
  // and nothing more, and is answered by re-reading. That split is deliberate: a transcript has one
  // way to be obtained, and a second streaming path for it could drift from the first.
  // The turn running on the conversation this surface is looking at, whoever asked for it:
  // { conversationId, turnId, state, queued: [{turnId, prompt}] }. It is the CONVERSATION's, not this
  // browser's — which is why Stop is a call any surface can make and why the composer is busy for
  // everyone while a turn runs, not only for whoever typed it.
  const [liveTurn, setLiveTurn] = React.useState(null);
  // The turn this surface is streaming over its own POST. Its frames arrive twice — once on that
  // response and once on the event stream — so the event stream's copy is skipped until the POST is
  // done, at which point the next attach takes over.
  const ownTurnRef = React.useRef(null);
  // The conversation this surface last sent a turn on, and when that turn ended (null while it runs).
  // The changes a turn announces on the event stream are not stamped with who caused them, so this is
  // how a surface tells its own turn from somebody else's.
  const ownActivityRef = React.useRef({ convId: null, endedAt: 0 });
  // The id of the turn this surface's own request opened, which stays after `ownTurnRef` is released so
  // the turn's end can be taken off the open list.
  const ownTurnIdRef = React.useRef(null);
  // The assistant's turns that have not ended, from whichever surface opened them, kept by the event
  // stream and read whole when it (re)connects: `{ turnId, conversationId, prompt, startedBy,
  // startedAt, state: "running" | "queued", queuedBehind }`, oldest first. A conversation runs one at
  // a time, so on a conversation the first is running and the rest wait.
  const [openTurns, setOpenTurns] = React.useState([]);
  const noteTurnStarted = React.useCallback((evt) => {
    setOpenTurns(prev => (prev.some(t => t.turnId === evt.turnId) ? prev : [...prev, {
      turnId: evt.turnId, conversationId: evt.conversationId, prompt: evt.prompt || "",
      startedBy: evt.startedBy || null, startedAt: evt.startedAt || null,
      queuedBehind: evt.queuedBehind || null, state: evt.queuedBehind ? "queued" : "running",
    }]));
  }, []);
  // The turn that waited behind the one that ended begins.
  const noteTurnEnded = React.useCallback((turnId) => {
    setOpenTurns(prev => prev.filter(t => t.turnId !== turnId)
      .map(t => (t.queuedBehind === turnId ? { ...t, queuedBehind: null, state: "running" } : t)));
  }, []);
  const ownActivity = (convId) => {
    const own = ownActivityRef.current;
    return own.convId === convId && (own.endedAt === null || Date.now() - own.endedAt < 4000);
  };

  const applyTurnFrame = React.useCallback((convId, evt) => {
    setConvos(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: reduceTurnFrame(c.messages, evt, profile) } : c));
  }, [profile]);

  const applyAssistantEvent = React.useCallback((evt) => {
    const id = evt.conversationId;

    // ---- a turn opened, or ended, on any surface of the person's ----
    if (evt.type === "turn.started" && evt.turnId) { noteTurnStarted(evt); return; }
    if (evt.type === "turn.ended" && evt.turnId) { noteTurnEnded(evt.turnId); return; }

    // ---- the turn frames: a turn on the conversation this surface is attached to ----
    if (evt.type === "turn.attach") {
      // A turn announcing itself, or the assistant restating one after this stream fell behind. Either way
      // the snapshot is the assistant's own account and replaces whatever was being rendered for it.
      if (ownTurnRef.current === evt.turnId) return;
      setLiveTurn({
        conversationId: id, turnId: evt.turnId, state: evt.state, queued: evt.queued || [],
      });
      setConvos(prev => prev.map(c =>
        c.id === id ? { ...c, messages: scaffoldLiveTurn(c.messages, evt, profile) } : c));
      return;
    }

    if (evt.type === "turn.queue") {
      setLiveTurn(prev => {
        if (!evt.runningTurnId) return null;             // nothing is running here any more
        if (!prev || prev.turnId !== evt.runningTurnId) return prev;
        return { ...prev, queued: evt.queued || [] };
      });
      return;
    }

    if (TURN_FRAMES.has(evt.type)) {
      // Frames carry no turn id of their own — they belong to whatever turn last announced itself on
      // this stream, which is why an attach always precedes them.
      if (!liveTurnRef.current || ownTurnRef.current === liveTurnRef.current.turnId) return;
      applyTurnFrame(liveTurnRef.current.conversationId, evt);
      if (evt.type === "done" || evt.type === "error") {
        setConvos(prev => prev.map(c => c.id !== liveTurnRef.current.conversationId ? c : {
          ...c,
          messages: c.messages.map(m => (m.live ? { ...m, live: false } : m)),
        }));
        setLiveTurn(null);
      }
      return;
    }

    // The stream no longer holds what this surface missed, so the listing is the only account left.
    if (evt.type === "log.gap") { loadServerHistory(); return; }

    if (typeof id !== "string") return;

    // A proposal somebody else's surface is deciding, or decided: the card follows it. One that is not
    // on this surface's screen is restated by the conversation's next read.
    if (evt.type === "proposal.staged") {
      if (ownActivity(id)) return;
      setConvos(prev => prev.map(c => (c.id === id && !c.messages.some(m => m.live) ? { ...c, stale: true } : c)));
      return;
    }
    if (evt.type === "proposal.running") {
      setConvos(prev => prev.map(c => c.id !== id ? c : {
        ...c,
        messages: c.messages.map(m => (m.role === "command" && m.token === evt.handle && m.state === "proposed")
          ? { ...m, state: "confirmed" } : m),
      }));
      return;
    }
    if (evt.type === "proposal.resolved") {
      setConvos(prev => prev.map(c => c.id !== id ? c : {
        ...c, messages: settleProposal(c.messages, evt.handle, evt, profile),
      }));
      return;
    }

    if (evt.type === "conversation.switches") {
      // Say it in the transcript too, not only on the toggle. A switch moved elsewhere changes what
      // the NEXT turn on this conversation does, and a toggle sliding over on its own reads as a
      // glitch — the same line the surface that moved it wrote is what makes it an event that
      // happened. Which switch moved is derived by diffing: the frame states where BOTH now stand
      // (so a client applying it lands where a listing would), not which one was touched.
      setConvos(prev => prev.map(c => {
        if (c.id !== id) return c;
        const next = { ...c, think: !!evt.think, autorun: !!evt.autorun };
        // Only a conversation whose value this surface already knew can have seen it change; the
        // first read of a switch is not somebody moving it.
        const moved = /** @type {["thinking" | "actions", "think" | "autorun", boolean][]} */ ([
          ["thinking", "think", !!evt.think],
          ["actions", "autorun", !!evt.autorun],
        ]).filter(([, field, on]) => typeof c[field] === "boolean" && c[field] !== on);
        if (moved.length && c.messages.length > 0) {
          next.messages = [...c.messages, ...moved.map(([toggle, , on]) => ({
            role: "toggle", toggle, on, label: toggleCopy[toggle][on ? "on" : "off"], at: Date.now(),
          }))];
        }
        return next;
      }));
      return;
    }

    // A thumb left on an answer somewhere else. Applied by turn id, which addresses one bubble
    // wherever it is rendered, so this lands whether or not the conversation is the one on screen.
    if (evt.type === "conversation.feedback") {
      setConvos(prev => prev.map(c => c.id !== id ? c : {
        ...c,
        messages: c.messages.map(m => m.turnId !== evt.turnId ? m : {
          ...m,
          feedback: evt.rating ? { rating: evt.rating, note: evt.note || null } : null,
        }),
      }));
      return;
    }

    if (evt.type === "conversation.deleted") {
      setConvos(prev => {
        const next = prev.filter(c => c.id !== id);
        if (next.length === prev.length) return prev;
        // Deleted out from under us: fall back to the next chat rather than leaving a dead selection.
        setActiveId(current => (current === id ? (next[0]?.id || null) : current));
        return next;
      });
      return;
    }

    if (evt.type === "conversation.started") { loadServerHistory(); return; }

    if (evt.type === "conversation.activity" || evt.type === "conversation.updated") {
      // The rail's title and order come from the listing. The transcript is marked behind only for a
      // conversation this surface is NOT watching live — one it mirrored frame by frame already holds
      // what the turn produced, and refetching would replace it with an identical copy mid-render.
      if (ownActivity(id)) { loadServerHistoryLater(); return; }
      setConvos(prev => prev.map(c => (c.id === id && !c.messages.some(m => m.live)
        ? { ...c, stale: true } : c)));
      loadServerHistoryLater();
    }
    // liveTurn is absent from the deps on purpose: it is read through liveTurnRef so a frame
    // handler is not rebuilt on every delta.
  }, [loadServerHistory, loadServerHistoryLater, applyTurnFrame, profile, toggleCopy, noteTurnStarted, noteTurnEnded]);

  // Read inside the frame handler through a ref: the handler must not be rebuilt on every text delta,
  // and it needs the CURRENT turn rather than the one captured when it was created.
  const liveTurnRef = React.useRef(liveTurn);
  liveTurnRef.current = liveTurn;

  // A reconnected stream knows nothing about the gap it was down for, so the listing is re-read: it
  // restates every conversation's switches, and its turn counts are what say whether a transcript
  // actually moved on. Marking the open one behind unconditionally would refetch it on every
  // reconnect — a proxy timeout is ordinary — and each refetch would drop the rows only this browser
  // holds, so the merge decides that from the counts instead.
  // The turns that have not ended, read whole: on arrival, and wherever the event stream may have missed
  // a start or an end. An assistant with no list of them is one whose turns are mirrored on its stream.
  const loadTurns = React.useCallback(() => {
    if (!assistantHost || !assistantUsable || !assistantAuthed) return;
    const client = clientFor(assistantHost.id);
    if (typeof client.turns !== "function") return;
    client.turns().then(
      (list) => setOpenTurns(list.map(t => ({ ...t, state: t.queuedBehind ? "queued" : (t.state || "running") }))),
      () => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [assistantHost && assistantHost.id, assistantUsable, assistantAuthed]);
  loadTurnsRef.current = loadTurns;
  React.useEffect(() => { loadTurns(); }, [loadTurns]);

  // A turn running on another surface, on the conversation on screen, is followed frame by frame: the
  // prompt and the answer so far appear, and the rest is drawn as it is written. What was drawn is the
  // assistant's own stream, so when it ends the conversation is read again and that is what stays.
  const followRef = React.useRef(null);
  const [followed, setFollowed] = React.useState(0);
  // A turn is followed once; one whose end has not yet been heard is not followed again.
  const followedIds = React.useRef(new Set());
  React.useEffect(() => {
    const cur = followRef.current;
    // This surface's own request is being drawn by that request; one that has not yet learned its turn's
    // id cannot tell its own turn from another's, so it follows nothing until it does.
    const own = ownActivityRef.current;
    const ownPending = own.convId === activeId && own.endedAt === null && ownTurnRef.current === null;
    const want = ownPending ? null : openTurns.find(t => t.conversationId === activeId
      && t.state === "running" && t.turnId !== ownTurnRef.current && t.turnId !== ownTurnIdRef.current
      && !followedIds.current.has(t.turnId));
    // Looking at another conversation lets go of the draft. A turn that has ended is not let go of: its
    // stream is about to say so itself, and is what finishes the draft.
    if (cur && cur.convId !== activeId) { cur.ctrl.abort(); followRef.current = null; }
    if (!want || followRef.current || !assistantHost || !assistantUsable || !assistantAuthed) return;
    const client = clientFor(assistantHost.id);
    if (typeof client.follow !== "function") return;

    const ctrl = new AbortController();
    const convId = want.conversationId;
    followRef.current = { turnId: want.turnId, convId, ctrl };
    followedIds.current.add(want.turnId);
    const began = Date.parse(want.startedAt) || Date.now();
    setConvos(prev => prev.map(c => (c.id !== convId ? c : {
      ...c,
      messages: [...c.messages.filter(m => !m.live),
        { role: "user", content: want.prompt, ts: began, live: true },
        { role: "assistant", content: "", live: true, startedAt: began }],
    })));
    client.follow(want.turnId, {
      signal: ctrl.signal,
      onEvent: (ev) => {
        // What this surface does not draw from a turn it did not ask for: its start, the audio, a gap.
        if (ev.type === "turn.started" || ev.type === "audio.delta" || ev.type === "log.gap") return;
        setConvos(prev => prev.map(c =>
          c.id === convId ? { ...c, messages: reduceTurnFrame(c.messages, ev, profile) } : c));
      },
    }).catch(() => {}).finally(() => {
      if (followRef.current && followRef.current.ctrl === ctrl) followRef.current = null;
      setFollowed(n => n + 1);   // another turn may be waiting to be followed
      const left = ctrl.signal.aborted;
      if (left) followedIds.current.delete(want.turnId);
      setConvos(prev => prev.map(c => (c.id !== convId ? c : left
        // Looked away from: what was drawn is partial, and is dropped.
        ? { ...c, messages: c.messages.filter(m => !m.live) }
        // Ended: the conversation as the assistant recorded it replaces the draft.
        : { ...c, stale: true, messages: c.messages.map(m => (m.live ? { ...m, live: false } : m)) })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the open turns and the conversation on screen decide what is followed; the rest is read when it starts
  }, [openTurns, activeId, followed, assistantHost && assistantHost.id, assistantUsable, assistantAuthed]);
  React.useEffect(() => () => { if (followRef.current) followRef.current.ctrl.abort(); }, []);

  const resyncAfterGap = React.useCallback(() => { loadServerHistory(); loadTurns(); }, [loadServerHistory, loadTurns]);

  useConversationStream({
    client: assistantHost ? clientFor(assistantHost.id) : null,
    clientKey: assistantHost && assistantHost.id,
    enabled: !!(assistantHost && assistantUsable && assistantAuthed),
    // Turn frames arrive at token rate, so the assistant sends them only for the conversation on screen.
    conversationId: activeId,
    onEvent: applyAssistantEvent,
    onResync: resyncAfterGap,
  });

  // Switching conversations abandons whatever was being rendered for the old one's turn: the attach
  // that follows says what is happening on the new one, and the old turn goes on running without us.
  React.useEffect(() => { setLiveTurn(null); }, [activeId]);

  // Fetch the open conversation's detail when we are missing either half of it: its transcript (a
  // chat this browser has never seen) or its switches (which the assistant owns, so the composer cannot
  // know them until it asks). The response carries the switches already resolved against the host's
  // configured default, so the toggles show what the next turn will actually do rather than a guess
  // this browser made about an unset value.
  React.useEffect(() => {
    if (!assistantHost || !assistantAuthed) return;
    const c = convos.find(x => x.id === activeId);
    if (!c) return;
    if (c.hostId && c.hostId !== assistantHost.id) return;

    // `stale` is set by a conversation.activity event: the log grew somewhere else, so the transcript
    // this browser holds is behind. Deferred while a turn is streaming HERE — replacing the messages
    // mid-stream would tear out the bubble being written into — and picked up when it finishes, which
    // is why `busy` is a dependency.
    const wantsHistory = (c.remote && !c.loaded && !(c.messages && c.messages.length > 0))
      || (c.stale && !busy);
    const wantsSwitches = typeof c.think !== "boolean" || typeof c.autorun !== "boolean";
    if (!wantsHistory && !wantsSwitches) return;

    let cancelled = false;
    clientFor(assistantHost.id).conversation(c.id).then(
      (data) => {
        if (cancelled) return;
        setConvos(prev => prev.map((x) => {
          if (x.id !== c.id) return x;
          const next = { ...x, think: !!(data && data.think), autorun: !!(data && data.autorun) };
          return wantsHistory
            ? { ...next, messages: scaffoldConversation(data, profile), loaded: true, stale: false }
            : next;
        }));
      },
      () => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (in deps); convos is intentionally excluded (depping it would refetch on every streamed message) in favour of the two scalars read off the open one
  }, [activeId, assistantHost && assistantHost.id, assistantAuthed, activeStale, busy]);

  // ===== Review mode =====
  // Replaying someone ELSE's conversation, read-only. The review transcript DTO is deliberately the
  // same shape as the caller's own history, so it goes through the very same scaffoldHistory →
  // ChatThread path — a reviewer sees what that person saw, drawn by the same components, and there
  // is no second renderer able to drift from this one.
  const [reviewMessages, setReviewMessages] = React.useState(null);
  const [reviewState, setReviewState] = React.useState("idle");

  React.useEffect(() => {
    if (!review || !review.conversation || !loadTranscript) { setReviewMessages(null); setReviewState("idle"); return undefined; }
    let cancelled = false;
    setReviewState("loading");
    setReviewMessages(null);
    loadTranscript(review.hostId, review.conversation.id).then(
      (data) => {
        if (cancelled) return;
        setReviewMessages(scaffoldHistory(data && data.entries, profile));
        setReviewState("ready");
      },
      () => { if (!cancelled) setReviewState("error"); },
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the review subject; loadTranscript is the surface's fixed capability, not state
  }, [review]);

  const prevUsableRef = React.useRef(assistantUsable);
  const prevHostRef = React.useRef(assistantHost && assistantHost.id);
  React.useEffect(() => {
    const hostId = assistantHost && assistantHost.id;
    if (prevHostRef.current === hostId && prevUsableRef.current !== assistantUsable && activeId) {
      const others = (assistantHosts || []).filter(h => h.id !== hostId).map(h => h.name);
      const note = assistantUsable
        ? { role: "system", kind: "assistant-up", host: (assistantHost && assistantHost.name) || "The", at: Date.now() }
        : { role: "system", kind: "assistant-down", host: (assistantHost && assistantHost.name) || "This host", others: others, message: conn.message || null, at: Date.now() };
      setConvos(prev => prev.map(c =>
        (c.id === activeId && c.messages.length > 0) ? { ...c, messages: [...c.messages, note] } : c));
    }
    prevUsableRef.current = assistantUsable;
    prevHostRef.current = hostId;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-based edge detector on the usable-flip; the extra values are read once at the transition, minimal deps keep the edge correct
  }, [assistantUsable, assistantHost && assistantHost.id, activeId]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [active?.messages, busy]);

  React.useEffect(() => {
    pinnedRef.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeId]);

  const onThreadScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedRef.current = distanceFromBottom <= 80;
    setLifted(el.scrollTop > 0);
  }, []);

  // A deliberate pick, which is a different act from the retarget below: this one is the person
  // choosing which assistant they talk to, so the surface is told to keep it.
  const pickAssistantHost = (id) => {
    if (!onSelectAssistantHost) return;
    const next = (assistantHosts || []).find(h => h.id === id);
    onSelectAssistantHost(id, { chosen: true });
    if (activeId && next) {
      setConvos(prev => prev.map(c => (c.id === activeId && c.messages.length > 0)
        ? { ...c, messages: [...c.messages, { role: "scope", label: "Now talking to " + titleOf(next), name: titleOf(next), at: Date.now() }] }
        : c));
    }
  };

  // A conversation lives on the assistant that holds it, so opening one targets that assistant — the
  // subject decides where we're talking. A conversation whose assistant isn't among those offered is
  // opened without retargeting; the history load below then declines it rather than asking the wrong
  // one.
  //
  // Derived from what was opened, so it is NOT a choice and is not kept: reading yesterday's
  // conversation should not silently move which assistant this account talks to.
  const pickChat = (id) => {
    const c = convos.find(x => x.id === id);
    const want = c && c.hostId;
    if (want && want !== (assistantHost && assistantHost.id)
        && onSelectAssistantHost && (assistantHosts || []).some(h => h.id === want)) {
      onSelectAssistantHost(want);
    }
    setActiveId(id);
  };

  // `quiet` opens it without taking the keyboard: a page going back to its empty conversation is
  // leaving one, not starting to write.
  const newChat = (opts) => {
    const hostId = assistantHost && assistantHost.id;
    const id = uid();
    // Opened at once, so pressing the button is never a wait. What it is CALLED is the assistant's, and
    // the row below is replaced by the assistant's own the moment it answers — this is the one
    // conversation the assistant has no opinion on yet, and it carries the name the wire contract
    // states for exactly that window so nothing changes under the person when the answer lands.
    setConvos(prev => [{ id, title: NEW_CHAT_TITLE, messages: [], created: Date.now(), hostId }, ...prev]);
    setActiveId(id);
    setInput("");
    if (!(opts && opts.quiet) && taRef.current) taRef.current.focus();

    // The id is ours to pick, but the conversation is the assistant's to create — so a chat opened here
    // exists, is named, and is resumable from another device before anything is said in it. The answer
    // carries the whole row, which REPLACES what was put up above: adopting it is what makes this
    // surface show the same conversation every other surface will read out of the listing, rather than
    // its own idea of one. A failure leaves the local row standing — the first turn creates the
    // conversation anyway, so what is lost is the early visibility, not the chat.
    if (hostId && assistantUsable && assistantAuthed) {
      clientFor(hostId).runCommand("new", { conversationId: id }).then(
        (result) => {
          if (!result || !result.conversation) return;
          const adopted = adoptServerConversation(result.conversation, hostId);
          setConvos(prev => prev.map(c => (c.id === adopted.id ? { ...c, ...adopted } : c)));
        },
        () => {});
    }
  };
  const deleteChat = (id, e) => {
    if (e) e.stopPropagation();
    const chat = convos.find(c => c.id === id);
    const hostId = (chat && chat.hostId) || (assistantHost && assistantHost.id);
    if (hostId) clientFor(hostId).deleteConversation(id).catch(() => {});
    setConvos(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || null);
      return next;
    });
  };
  // Record how the user judged one of their own answers. Applied to the bubble immediately and NOT
  // rolled back on failure: the vote is a courtesy, and yanking a thumb back out from under someone
  // mid-sentence is a worse outcome than a verdict that silently didn't reach the assistant. The next
  // history load is authoritative either way, since the assistant is what the bubble is rebuilt from.
  const rateTurn = (turnId, rating, note) => {
    if (!turnId) return;
    const chat = convos.find(c => c.id === activeId);
    const hostId = (chat && chat.hostId) || (assistantHost && assistantHost.id);
    if (!hostId) return;

    setConvos(prev => prev.map(c => c.id !== activeId ? c : {
      ...c,
      messages: c.messages.map(m => m.turnId !== turnId ? m : {
        ...m,
        feedback: rating ? { rating, note: note || null } : null,
      }),
    }));

    clientFor(hostId).feedback(activeId, turnId, { rating, note }).catch(() => {});
  };

  const setMessages = (updater) => {
    setConvos(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const messages = typeof updater === "function" ? updater(c.messages) : updater;
      return { ...c, messages };
    }));
  };

  const sendLive = async (convId, text, userMsg, answers, attachmentIds) => {
    ownActivityRef.current = { convId, endedAt: null };
    ownTurnIdRef.current = null;
    // Deliberately does NOT name the conversation from the prompt. The assistant names it — first prompt,
    // one line, capped at 80 with an ellipsis — and derives that ONCE for every surface. A copy of the
    // rule here was capped at 40 with no ellipsis, so a first prompt longer than that read one way in
    // the browser that typed it and another way everywhere else, permanently: the merge only ever
    // filled an empty title, so the assistant's real name never replaced it. The name arrives with the next
    // listing read, which the turn's own completion triggers.
    setConvos(prev => prev.map(c => (c.id !== convId ? c : {
      ...c, lastActivity: Date.now(),
      messages: [...c.messages, { ...userMsg, live: true }, { role: "assistant", content: "", live: true, startedAt: Date.now() }],
    })));

    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // One answer is read aloud at a time: a new turn silences the last one rather than talking over
    // it. The player is opened before the request so the first frame has somewhere to land.
    if (spokenRef.current) spokenRef.current.stop();
    spokenRef.current = speakRef.current ? createSpokenReply() : null;

    // This POST is the turn's first attach. Its frames are the same ones every other surface receives,
    // so they are applied here directly and the event stream's copy of them is skipped — otherwise the
    // surface that asked for the turn would render it twice.
    const applyFrame = (ev) => {
      // The turn is addressed from here on: Stop reaches it by this id.
      if (ev.type === "turn.started") {
        ownTurnRef.current = ev.turnId;
        ownTurnIdRef.current = ev.turnId;
        setLiveTurn({ conversationId: convId, turnId: ev.turnId, state: "running", queued: [] });
        // Behind another turn on this conversation: the answer says it is waiting until that one ends.
        if (ev.queuedBehind) {
          setConvos(prev => prev.map(c =>
            c.id === convId ? { ...c, messages: reduceTurnFrame(c.messages, ev, profile) } : c));
        }
        return;
      }
      if (ev.type === "turn.attach") {
        ownTurnRef.current = ev.turnId;
        if (ev.state === "queued") {
          // Something else is still answering. This prompt waits its turn, and it waits as a chip on
          // the composer rather than as a message half-rendered into the transcript — the optimistic
          // bubbles put up a moment ago come back out until it actually starts.
          setConvos(prev => prev.map(c =>
            c.id === convId ? { ...c, messages: c.messages.filter(m => !m.live) } : c));
          return;
        }
        setLiveTurn({ conversationId: convId, turnId: ev.turnId, state: ev.state, queued: ev.queued || [] });
        setConvos(prev => prev.map(c =>
          c.id === convId ? { ...c, messages: scaffoldLiveTurn(c.messages, ev, profile) } : c));
        return;
      }
      // Audio is played, never rendered: it belongs to no message and changes no state, so it is
      // handled here rather than in the reducer.
      if (ev.type === "audio.delta") {
        if (spokenRef.current) spokenRef.current.push(ev);
        return;
      }
      if (ev.type === "turn.queue") {
        setLiveTurn(prev => (prev && prev.turnId === ev.runningTurnId
          ? { ...prev, queued: ev.queued || [] } : prev));
        return;
      }
      setConvos(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: reduceTurnFrame(c.messages, ev, profile) } : c));
    };

    try {
      // Answers to the questions just asked are a turn of their own, and need no words beside them.
      const prompt = answers || (attachmentIds && attachmentIds.length) ? text
        : (text || "[The user sent a voice note; transcription was unavailable.]");
      // Whatever the product has open that the turn should see (a draft under review).
      const extras = turnExtras ? turnExtras() : null;
      // Thinking and auto-run are NOT sent: they are the conversation's, held by the assistant and
      // read when the turn runs. Sending them would let this browser contradict what the conversation
      // carries — and two surfaces on one conversation would then disagree about what it is set to.
      await clientFor(assistantHost.id).turn(
        { prompt, answers, conversationId: convId, ...extras, speak: speakRef.current || undefined,
          attachments: attachmentIds && attachmentIds.length ? attachmentIds : undefined },
        { onEvent: applyFrame, signal: ctrl.signal });
    } catch (e) {
      const aborted = e && e.name === "AbortError";
      // Came back to the foreground and dropped a connection we could not have kept. Nothing is
      // written into the transcript — this surface does not know what the turn did, and the assistant's
      // own record is about to say. Marking it stale is what asks for that re-read.
      if (aborted && resumedRef.current) {
        resumedRef.current = false;
        setConvos(prev => prev.map(c => c.id !== convId ? c : { ...c, stale: true }));
        return;
      }
      const reason = e && e.code === 503 ? sentence(titleOf(assistantHost)) + " is currently unavailable."
        : e && e.code === 502 ? "Couldn\u2019t reach " + titleOf(assistantHost) + " \u2014 try again, or check that it is running."
        : e && e.code === 404 ? sentence(titleOf(assistantHost)) + " isn\u2019t answering right now."
        : (e && e.userMessage) || (sentence(titleOf(assistantHost)) + " didn\u2019t respond.");
      setConvos(prev => prev.map(c => {
        if (c.id !== convId) return c;
        const msgs = c.messages.slice();
        const lastIdx = msgs.length - 1;
        const bubble = msgs[lastIdx];
        if (!bubble || bubble.role !== "assistant") return c;
        const finalized = aborted
          ? { ...bubble, content: bubble.content || "_Stopped._" }
          : bubble.content
            ? { ...bubble, error: true, errorText: "Interrupted \u2014 the assistant connection dropped.", endedAt: Date.now() }
            : { ...bubble, error: true, errorText: reason, endedAt: Date.now() };
        // The stream ended without a done frame — still surface any gathered evidence.
        msgs[lastIdx] = promotePendingCards(finalized);
        return { ...c, messages: msgs };
      }));
    } finally {
      setBusy(false);
      resumedRef.current = false;
      abortRef.current = null;
      // The turn this request opened has ended for this surface; the event stream's word may follow, or
      // may not have been heard, and the composer must not wait on it.
      if (ownTurnIdRef.current) { noteTurnEnded(ownTurnIdRef.current); ownTurnIdRef.current = null; }
      // The queue outlives the request by design — the last sentences arrive with the terminal frame —
      // so this releases the player rather than stopping it. Stopping is what `stop` and the next turn
      // do, because those are the moments somebody decided not to listen.
      spokenRef.current = null;
      // Stop skipping the event stream's copy: from here the stream is this surface's only source, and
      // the next attach on this conversation is what re-establishes it.
      ownTurnRef.current = null;
      // What this surface just watched is already in its transcript, so the turn is counted here and
      // the changes that announce it are not read as news from elsewhere.
      ownActivityRef.current = { convId, endedAt: Date.now() };
      setConvos(prev => prev.map(c => c.id !== convId ? c : {
        ...c,
        turns: typeof c.turns === "number" ? c.turns + 1 : c.turns,
        messages: c.messages.map(m => (m.live ? { ...m, live: false } : m)),
      }));
      setLiveTurn(prev => (prev && prev.conversationId === convId ? null : prev));
    }
  };

  const send = async (override, voiceMeta) => {
    const text = (typeof override === "string" ? override : input).trim();
    // What is attached goes with a message typed here, never with a suggestion or a voice note sent
    // past it, and not while a file is still on its way.
    const carrying = typeof override === "string" || voiceMeta ? [] : readyAttached;
    if (!text && !voiceMeta && carrying.length === 0) return;
    if (carrying.length > 0 && (attachingNow || attachTooLong)) return;

    let convId = activeId;
    if (!convId) {
      convId = uid();
      const c = { id: convId, title: NEW_CHAT_TITLE, messages: [], created: Date.now(), hostId: assistantHost && assistantHost.id };
      setConvos(prev => [c, ...prev]);
      setActiveId(convId);
    }

    // A recognised command runs and never reaches the model. Anything else that merely STARTS with a
    // slash — a path, a fraction, a typo — is an ordinary message, so nothing a person types is
    // silently swallowed. `resolveCommand` is the strict half of the surface: only an exact name
    // with an argument the command offers counts.
    const command = voiceMeta || carrying.length > 0 ? null : resolveCommand(text, commandCatalog);
    if (command) {
      setInput("");
      setCommandMenu({ items: [], active: 0 });
      if (taRef.current) taRef.current.style.height = "auto";
      runCommand(command.command.name, command.argument, convId);
      return;
    }

    const userMsg = voiceMeta
      ? { role: "user", content: text, voice: voiceMeta, ts: Date.now() }
      : { role: "user", content: text, ts: Date.now() };
    if (carrying.length > 0) {
      userMsg.attachments = carrying.map(a => ({ ...a.info, localUrl: a.previewUrl || undefined }));
      // Sent, they are the message's: the composer lets go of them, and the bubble keeps the previews.
      const sent = new Set(carrying.map(a => a.key));
      setAttached(prev => prev.filter(a => !sent.has(a.key) && a.status !== "error"));
    }
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    if (!assistantHost || !assistantUsable) {
      const why = !assistantHost
        ? "No assistant is available right now."
        : conn.message || (conn.label || "This assistant is currently unavailable.");
      // Unnamed on purpose: the turn never reached the assistant, so there is no recorded first prompt for
      // it to be named after, and a name invented here would be one no other surface could arrive at.
      setConvos(prev => prev.map(c => (c.id !== convId ? c : {
        ...c, lastActivity: Date.now(),
        messages: [...c.messages, userMsg, { role: "assistant", content: "", error: true, errorText: why }],
      })));
      return;
    }

    sendLive(convId, text, userMsg, undefined, carrying.map(a => a.info.id));
  };

  // Stop the conversation's turn, whoever started it. A call rather than an abort, because a surface
  // that is only watching holds no connection to end — and ending it must end it for everyone, which a
  // local abort could never do. Aborting our own POST as well just detaches this surface early.
  // Turning it ON is the user gesture a browser needs before it will play anything, so the audio
  // context is created and resumed HERE. Armed on the frame instead it would be created seconds later
  // with no gesture behind it, and stay suspended — silence, with nothing to say why.
  const toggleSpeak = async () => {
    if (speak) {
      if (spokenRef.current) spokenRef.current.stop();
      setSpeak(false);
      return;
    }
    const ready = await armAudio();
    setSpeak(ready);
    // Refused: the control says so itself rather than raising a toast. A toast is for a shell handler
    // that owns no control to render into, and this button is right here.
    setSpeakBlocked(!ready);
  };

  const stop = () => {
    // The sound stops with the turn. A stop that left the queued sentences playing would go on reading
    // out an answer the person just asked it to abandon.
    if (spokenRef.current) spokenRef.current.stop();
    const hostId = assistantHost && assistantHost.id;
    // The turn this surface is waiting on, else the one running on the conversation from another surface.
    const running = openTurns.find(t => t.conversationId === activeId && t.state === "running");
    const turnId = (liveTurn && liveTurn.conversationId === activeId ? liveTurn.turnId : null)
      || (running ? running.turnId : null);
    if (hostId && turnId) clientFor(hostId).stopTurn(turnId).catch(() => {});
    else if (abortRef.current) abortRef.current.abort();
  };

  // Discard a turn waiting behind the running one. Stopping the running turn deliberately leaves these
  // standing, so throwing one away is its own act.
  const cancelQueued = (turnId) => {
    const hostId = assistantHost && assistantHost.id;
    if (hostId && turnId) clientFor(hostId).stopTurn(turnId).catch(() => {});
  };

  // A turn is the CONVERSATION's, so the composer is busy while one runs on the open conversation
  // whether or not this surface is the one that asked for it.
  const openHere = openTurns.filter(t => t.conversationId === activeId);
  const turnRunning = busy || openHere.length > 0 || !!(liveTurn && liveTurn.conversationId === activeId);
  // Prompts waiting behind the running turn, each with how many turns are ahead of it. This surface's
  // own waiting prompt is its bubble, and Stop is what cancels it.
  const queuedHere = (liveTurn && liveTurn.conversationId === activeId && liveTurn.queued && liveTurn.queued.length
    ? liveTurn.queued
    : openHere.filter(t => t.state === "queued" && t.turnId !== ownTurnIdRef.current)
      .map((t) => ({ turnId: t.turnId, prompt: t.prompt, ahead: openHere.indexOf(t) })));

  // Run one command at the assistant and render what it answered. The assistant performs every command it
  // lists, so there is no client-side branch on WHAT a command does — only on what its result
  // carries. A failure is shown in the transcript rather than swallowed: the person typed something
  // deliberate and is owed an answer either way.
  const runCommand = React.useCallback(async (name, argument, convId) => {
    const hostId = assistantHost && assistantHost.id;
    if (!hostId || !convId) return;

    const say = (msg) => setConvos(prev => prev.map(c =>
      c.id !== convId ? c : { ...c, messages: [...c.messages, msg] }));

    let result;
    try {
      result = await clientFor(hostId).runCommand(name, { conversationId: convId, argument });
    } catch (err) {
      say({
        role: "assistant",
        error: true,
        content: "",
        errorText: (err && err.userMessage) || "That command didn’t run — try again.",
      });
      return;
    }

    // A switch answers the state it now stands at — which is what lands, not what was asked for.
    if (typeof result.state === "boolean" && (name === "think" || name === "autorun")) {
      applySwitch(convId, name === "think" ? "thinking" : "actions", result.state);
      return;
    }

    if (result.commands) { say({ role: "commandHelp", commands: result.commands, label: result.message }); return; }
    if (result.tools)    { say({ role: "commandTools", tools: result.tools, label: result.message }); return; }

    // A command that moved the conversation says so by naming the one that now stands — `/new` is the
    // live case. The assistant decides which conversation that is (it takes up an offered id only while it
    // holds nothing), so the surface follows it there rather than reporting into the chat left behind.
    if (typeof result.conversationId === "string" && result.conversationId && result.conversationId !== convId) {
      // Named by the assistant, which answers with the whole row. A title composed here would be this
      // surface's word for a conversation every other surface reads a name for.
      const started = result.conversation
        ? adoptServerConversation(result.conversation, hostId)
        : { id: result.conversationId, title: NEW_CHAT_TITLE, messages: [], created: Date.now(), hostId };
      setConvos(prev => [started, ...prev.filter(c => c.id !== started.id)]);
      setActiveId(started.id);
      setInput("");
      if (taRef.current) taRef.current.focus();
      return;
    }

    // What any other command answered. Compacting is the one that summarizes the conversation, so it
    // is the one that reads as that event; the rest are the command's own words.
    say(name === "compact"
      ? { role: "checkpoint", label: result.message, at: Date.now() }
      : { role: "assistant", content: result.message || "", ts: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [assistantHost && assistantHost.id, applySwitch]);

  // The composer's two buttons are the same commands the popover offers, so a click and a typed
  // `/think on` travel one path and cannot disagree about what the conversation is set to.
  const toggleThinking = () => runCommand("think", thinkOn ? "off" : "on", activeId);
  const toggleActions  = () => runCommand("autorun", actionsOn ? "off" : "on", activeId);

  const compactActive = React.useCallback(async () => {
    if (!assistantHost || !activeId) return { compacted: false };
    const convId = activeId;
    const res = await clientFor(assistantHost.id).compact(convId);
    const compacted = !!(res && res.compacted);
    const n = res && typeof res.messagesCompacted === "number" ? res.messagesCompacted : 0;
    if (compacted) {
      const label = "Conversation compacted to save context"
        + (n ? " \u00b7 " + n + " message" + (n === 1 ? "" : "s") : "");
      setConvos(prev => prev.map(c => c.id === convId
        ? { ...c, messages: [...c.messages, { role: "checkpoint", label, at: Date.now() }] }
        : c));
    }
    return { compacted, messagesCompacted: n };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [assistantHost && assistantHost.id, activeId]);

  // The assistant reads voice notes whenever it can — the same engine, primed with the same names,
  // that hears a request spoken into a voice channel. Passing no transcriber is what leaves the
  // browser's own recogniser in charge, and that is only the case for an assistant without one.
  //
  // Held in a ref-stable callback per assistant so the recorder is not rebuilt on every render.
  const transcribeHere = React.useMemo(() => {
    if (!hostSpeech || !hostSpeech.hear || !assistantHost) return undefined;
    const hostId = assistantHost.id;
    return async (pcm) => {
      const answer = await clientFor(hostId).transcribe(pcm);
      return (answer && answer.text) || "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only assistantHost.id is used (and in deps); the object is re-derived each render
  }, [hostSpeech && hostSpeech.hear, assistantHost && assistantHost.id]);

  const voice = useVoiceRecorder({ transcribe: transcribeHere });
  // Opening the microphone says speech is about to be wanted, so an assistant that loads its models on
  // demand has them ready by the time the recording ends. Best effort: a recording is made either way.
  const startVoice = () => {
    if (transcribeHere && assistantHost) {
      const client = clientFor(assistantHost.id);
      if (typeof client.wakeSpeech === "function") Promise.resolve(client.wakeSpeech()).catch(() => {});
    }
    voice.start();
  };
  const sendVoice = async () => {
    const payload = await voice.finish();
    // Null is a cancelled recording or one whose transcription failed. The failure leaves the bar
    // standing with its reason and the audio still held, so there is nothing to send and nothing to
    // report here — the composer is already saying it.
    if (!payload) return;
    const { id, duration, peaks, transcript } = payload;
    send(transcript || "", { id, duration, peaks });
  };

  // Words put in the composer for the person to finish: a suggestion picked, a block's prompt, a seed.
  const draft = (text) => {
    setInput(text);
    setTimeout(() => {
      const ta = taRef.current;
      if (ta) { ta.focus(); ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px"; }
    }, 0);
  };

  React.useEffect(() => {
    if (!seed || !seed.prompt) return;
    draft(seed.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per seed via seed.nonce; seed.prompt is read fresh at that edge
  }, [seed && seed.nonce]);

  // Confirm a proposed action by handing its token back to the assistant that proposed it. The
  // assistant performs every kind itself, watches the ones with a postcondition until they reach it,
  // and answers a verdict. There is no second execution path, so one proposed action has one way to
  // happen, one authority gate, and one outcome shape.
  const runLiveCommand = (card) => {
    const proposal = profile.proposal(card);
    if (!proposal.runnable) return;
    // The name is for the copy only — the assistant resolves the target from the token it issued,
    // never from anything sent back here.
    const hostId = (assistantHost && assistantHost.id) || null;
    const serverName = proposal.targetName;
    const meta = proposal.meta;
    const verifyId = uid();
    setMessages(msgs => {
      const marked = msgs.map(m =>
        (m.role === "command" && m.cmdId === card.cmdId && m.state === "proposed")
          ? { ...m, state: "confirmed" } : m);
      return [...marked, { role: "verify", id: verifyId, cmdId: card.cmdId, action: { label: meta.label, verb: card.verb, serverName }, state: "pending" }];
    });
    const resolveVerify = (result) =>
      setMessages(msgs => msgs.map(m => (m.role === "verify" && m.id === verifyId) ? { ...m, state: "done", result, progress: null, at: Date.now() } : m));
    // The assistant's progress steps drive a live sub-label under the spinner, so a slow action
    // reads as advancing.
    const onProgress = (evt) =>
      setMessages(msgs => msgs.map(m =>
        (m.role === "verify" && m.id === verifyId) ? { ...m, progress: (evt && evt.label) || null } : m));

    // The token is what authorizes and addresses the action; without it there is nothing to confirm.
    if (!hostId || !card.token) {
      resolveVerify({ ok: false, headline: "This action has expired \u2014 ask the assistant to propose it again.", lines: [] });
      return;
    }
    clientFor(hostId).confirm({ token: card.token }, { onProgress }).then(
      resp => resolveVerify(profile.verdict(card, serverName, resp)),
      err => {
        const expired = err && err.code === 401;
        const noRoute = err && err.code === "ENOROUTE";
        const refusal = err && err.envCode;
        // The action lapsed before anyone decided: the card says so, and nothing ran.
        if (refusal === "confirmation-expired") {
          setMessages(msgs => msgs
            .filter(m => !(m.role === "verify" && m.id === verifyId))
            .map(m => (m.role === "command" && m.cmdId === card.cmdId ? { ...m, state: "expired" } : m)));
          return;
        }
        // Refusals the assistant words for the person: decided elsewhere, waiting on somebody else, gone.
        if (refusal === "confirmation-handled" || refusal === "confirmation-unknown" || refusal === "forbidden") {
          resolveVerify({ ok: false, tone: "warn", headline: err.userMessage, lines: [] });
          return;
        }
        resolveVerify(expired
          ? { ok: false, headline: "The assistant session expired \u2014 sign in again to run commands.", lines: [] }
          : noRoute
            ? { ok: false, headline: "The assistant has no address this browser can reach.", lines: [] }
            : { ok: false, headline: "Couldn\u2019t run " + meta.label.toLowerCase() + " \u2014 " + ((err && err.userMessage) || "the command failed."), lines: [] });
      });
  };

  // Decline a proposed action: it can never run, and the card says so. A refusal (it was decided
  // elsewhere, or lapsed) is the assistant's sentence, shown on the card that is still standing.
  const declineLiveCommand = (card) => {
    const hostId = (assistantHost && assistantHost.id) || null;
    const patch = (fields) => setMessages(msgs =>
      msgs.map(m => (m.role === "command" && m.cmdId === card.cmdId ? { ...m, ...fields } : m)));
    if (!hostId || !card.token) { patch({ state: "expired" }); return; }
    clientFor(hostId).confirm({ token: card.token, decision: "decline" }).then(
      () => patch({ state: "declined", error: null }),
      err => {
        const refusal = err && err.envCode;
        if (refusal === "confirmation-expired") patch({ state: "expired", error: null });
        else patch({ error: (err && err.userMessage) || "That didn’t go through." });
      });
  };

  // Send the person's answers to the questions just asked, as the next turn of the conversation.
  const answerQuestions = (_msg, answers) => {
    if (!activeId || !assistantHost || !assistantUsable) return;
    sendLive(activeId, "", { role: "user", content: answersText(answers), ts: Date.now() }, answers);
  };

  // What a product's renderers may do to the conversation.
  const api = {
    run: runLiveCommand,
    setMessages,
    client: () => (assistantHost ? clientFor(assistantHost.id) : null),
  };
  // A transcript under review offers nothing to act on: every actionable affordance a live chat would
  // offer is absent rather than present-and-inert.
  const reviewApi = { readOnly: true, run: null, setMessages: () => {}, client: api.client };
  const renderOwnEntry = renderEntry ? (m, i) => renderEntry(m, i, api) : undefined;
  const renderOwnCards = renderCards ? (m) => renderCards(m, api) : undefined;
  const renderCommand = (m, i) => {
    const p = profile.proposal(m);
    // Declining is a decision the confirm channel takes; a client whose assistant does not take one
    // leaves it off, because its confirm route would read the same request as a confirmation.
    const declines = assistantHost && clientFor(assistantHost.id).declines === true;
    return <ChatCommand key={i} msg={m} onRun={runLiveCommand} onDecline={declines ? declineLiveCommand : undefined}
      meta={p.meta} target={p.target} title={p.title} runnable={p.runnable} unavailable={p.unavailable} />;
  };
  // A proposal in someone else's transcript is shown as it stood, and confirming it does nothing.
  const renderReviewCommand = (m, i) => {
    const p = profile.proposal(m);
    return <ChatCommand key={i} msg={m} onRun={() => {}} meta={p.meta} target={p.target} title={p.title}
      runnable={p.runnable} unavailable={p.unavailable} />;
  };


  // The completion list, derived from the text on every keystroke rather than held open as a mode —
  // so a backspace walks back out of it and Escape needs nothing to reset. `dismissed` is the one
  // piece of state, because Escape has to survive the next keystroke or the list springs back.
  const [commandMenu, setCommandMenu] = React.useState({ items: [], active: 0 });
  const [menuDismissed, setMenuDismissed] = React.useState(false);
  const composerRef = React.useRef(null);

  const refreshMenu = React.useCallback((text, dismissed) => {
    const items = dismissed ? [] : suggestFor(text, commandCatalog);
    setCommandMenu(prev => ({
      items,
      // Hold the highlight where it was while the list only narrows, so typing another letter does
      // not silently move which command Enter would run.
      active: Math.min(prev.active, Math.max(0, items.length - 1)),
    }));
  }, [commandCatalog]);

  // Put a completion into the composer. A command that still wants a value lands with a trailing
  // space and re-opens on its values; one that is ready to run just sits there for Enter.
  // A command offered from the transcript (the /help card's Use) lands in the composer to be
  // finished and sent, with its values listed when it takes one.
  const offerCommand = (name) => {
    const text = "/" + name + " ";
    setInput(text);
    setMenuDismissed(false);
    refreshMenu(text, false);
    if (taRef.current) taRef.current.focus();
  };

  const applyCompletion = (item) => {
    setInput(item.insert);
    setMenuDismissed(false);
    refreshMenu(item.insert, false);
    if (taRef.current) taRef.current.focus();
  };

  const onKeyDown = (e) => {
    const items = commandMenu.items;
    if (items.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const delta = e.key === "ArrowDown" ? 1 : -1;
        setCommandMenu(prev => ({
          ...prev,
          active: (prev.active + delta + prev.items.length) % prev.items.length,
        }));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuDismissed(true);
        setCommandMenu({ items: [], active: 0 });
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        applyCompletion(items[commandMenu.active] || items[0]);
        return;
      }
      // Enter takes the highlighted row. A row that fully specifies a command (`/think on`) RUNS —
      // there is nothing left to decide, and making someone press Enter twice to confirm a choice
      // already under the cursor is friction with no question behind it. A row that still owes a
      // value (`/think`) completes instead, opening its values. Either way Enter never runs a
      // command while ignoring what is highlighted, which is the bug this shape exists to avoid.
      if (e.key === "Enter" && !e.shiftKey) {
        const picked = items[commandMenu.active] || items[0];
        if (picked && picked.insert !== input) {
          e.preventDefault();
          if (picked.runnable) send(picked.insert);
          else applyCompletion(picked);
          return;
        }
      }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    // A composer emptied back out re-arms the list, so dismissing one slash does not mute the next.
    const stillDismissed = menuDismissed && value.startsWith("/");
    if (menuDismissed !== stillDismissed) setMenuDismissed(stillDismissed);
    refreshMenu(value, stillDismissed);

    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  };

  // A fresh greeting per conversation — drawn once and held, so a re-render (typing,
  // a store tick) never swaps the wording out from under the reader.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- activeId is the POINT: it re-rolls the greeting per conversation, not a value read inside.
  const greeting = React.useMemo(() => pickGreeting(), [activeId]);

  // What every block in the frame is given, through `useChat()` and as a slot function's argument.
  /** @type {import("./types.js").ChatHandle} */
  const chat = {
    layout: asPage ? "page" : "panel",
    empty: !active || active.messages.length === 0,
    usable: assistantUsable,
    assistant: assistantHost || null,
    input,
    greeting, primer, noAssistant, suggestions,
    conversations: convos, activeId,
    ask: (text) => { if (assistantUsable) send(text); },
    draft,
    newChat: () => newChat(),
    open: pickChat,
    client: () => (assistantHost ? clientFor(assistantHost.id) : null),
  };
  // A transcript under review offers nothing to act on.
  const reviewChat = { ...chat, usable: false, ask: () => {}, draft: () => {}, newChat: () => {}, open: () => {} };

  // The composer's switches, gathered into one menu where the composer is too narrow to label them.
  const [optsOpen, setOptsOpen] = React.useState(false);
  const optsRef = React.useRef(null);
  const ctxUsage = contextUsage(latestUsage(active && active.messages));
  const compactHere = (assistantUsable && active && active.messages.length > 0) ? compactActive : null;
  const optsCompact = useCompact(compactHere, () => setOptsOpen(false));
  // What each switch does in the state it stands at, said where it is pointed at.
  const thinkTip = toggleCopy.thinking[thinkOn ? "on" : "off"];
  const speakTip = speakBlocked
    ? "This browser will not play audio on this page."
    : speak
      ? "Reading answers aloud as they are written, so it starts before the answer is finished."
      : "Answers are silent. Turn on to have them read aloud as they are written.";
  const autorunTip = !canUseActions
    ? autorunHint.locked
    : autoAcceptActive
      ? (autorunHint.on || toggleCopy.actions.on)
      : (autorunHint.off || toggleCopy.actions.off);

  const [railOpen, setRailOpen] = React.useState(false);
  const railWrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!railOpen) return;
    const h = (e) => { if (railWrapRef.current && !railWrapRef.current.contains(e.target)) setRailOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [railOpen]);
  React.useEffect(() => { setRailOpen(false); }, [activeId]);

  // A sent attachment read back for the bubble that shows it: the open conversation's through its own
  // assistant, a reviewed one's through the review route. A client without the call shows the name.
  const ownHostId = (active && active.hostId) || (assistantHost && assistantHost.id) || null;
  const loadOwnAttachment = React.useMemo(() => {
    const client = ownHostId && activeId ? clientFor(ownHostId) : null;
    if (!client || typeof client.attachment !== "function") return undefined;
    return (a) => client.attachment(activeId, a.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clientFor is the surface's fixed capability; the host and conversation decide the loader
  }, [ownHostId, activeId]);
  const reviewHostId = review && review.conversation ? review.hostId : null;
  const reviewConvId = review && review.conversation ? review.conversation.id : null;
  const reviewAttachmentLoader = React.useMemo(() => {
    if (!reviewHostId || !reviewConvId || !loadReviewAttachment) return undefined;
    return (a) => loadReviewAttachment(reviewHostId, reviewConvId, a);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadReviewAttachment is the surface's fixed capability; the host and conversation decide the loader
  }, [reviewHostId, reviewConvId]);

  // Review mode replaces the whole surface: no rail (there is no "your chats" here), no composer
  // (there is no review write, and a disabled input would still invite typing), and a banner that
  // cannot be scrolled away — a dock that is usually YOUR chat now holds someone else's, and that has
  // to be unmissable for as long as it is true.
  if (review && review.conversation) {
    const who = review.conversation.user
      ? (review.conversation.user.displayName || review.conversation.user.userId)
      : null;
    return (
      <ChatContext.Provider value={reviewChat}>
      <div className={"k-chat-page k-chat-page--review" + (docked ? " k-chat-page--docked" : "") + (pageClass ? " " + pageClass : "")}>
        <div className="k-chat-main">
          <div className="k-chat-main__head k-chat-head">
            <span className="k-chat-head__title" title={conversationTitle(review.conversation)}>
              {conversationTitle(review.conversation)}
            </span>
            <span className="k-chat-head__sub">
              {review.conversation.turnCount} turn{review.conversation.turnCount === 1 ? "" : "s"}
              {review.conversation.deleted ? " · deleted by its owner" : ""}
            </span>
            <div className="k-chat-head__actions">
              <IconButton icon="x" label="Close review" variant="ghost" size="sm" onClick={onExitReview} />
            </div>
          </div>

          <div className="k-chat-review__banner" role="status">
            <Icon name="lock" size={14} className="k-chat-review__lock" />
            <span className="k-chat-review__text">
              Reading{who ? <> <b>{who}</b>’s</> : " someone else’s"} conversation · read-only
            </span>
            <Button variant="outline" size="sm" onClick={onExitReview}>Back to your chat</Button>
          </div>

          <div className="k-chat-scroll">
            {reviewState === "loading" && (
              <div className="k-chat-start k-chat-start--note"><Spinner size={16} /><p>Loading the transcript</p></div>
            )}
            {reviewState === "error" && (
              <div className="k-chat-start k-chat-start--note">
                <h3 className="k-chat-start__greeting">Transcript unavailable</h3>
                <p className="k-chat-start__primer">This conversation could not be read.</p>
              </div>
            )}
            {reviewState === "ready" && reviewMessages && reviewMessages.length === 0 && (
              <div className="k-chat-start k-chat-start--note"><p className="k-chat-start__primer">No turns in this conversation</p></div>
            )}
            {reviewState === "ready" && reviewMessages && reviewMessages.length > 0 && (
              // Read-only: no onRun/onSaveBlueprint/onDraftEdit, so every actionable affordance a live
              // chat would offer is simply absent rather than present-and-inert.
              // readOnlyFeedback shows what the OWNER said about an answer without offering the reader
              // a way to say anything: a reviewer's opinion of someone else's conversation is a
              // different fact from that person's satisfaction, and this surface collects only the latter.
              <ChatThread messages={reviewMessages} user={user} assistantName={assistantName}
                renderEntry={renderEntry ? (m, i) => renderEntry(m, i, reviewApi) : undefined}
                renderCommand={renderReviewCommand}
                renderCards={renderCards ? (m) => renderCards(m, reviewApi) : undefined}
                loadAttachment={reviewAttachmentLoader}
                readOnlyFeedback />
            )}
          </div>
        </div>
      </div>
      </ChatContext.Provider>
    );
  }

  const shown = (fn) => (...args) => { fn(...args); if (onShowConversation) onShowConversation(); };
  const empty = !active || active.messages.length === 0;
  // A page's way back is to its empty conversation, which is a new chat: one already waiting empty is
  // reopened rather than a second one started beside it.
  const backToStart = () => {
    const hostId = assistantHost && assistantHost.id;
    const waiting = convos.find(c => c.messages.length === 0 && (!hostId || !c.hostId || c.hostId === hostId));
    if (waiting) { setActiveId(waiting.id); setInput(""); }
    else newChat({ quiet: true });
  };
  // Where the textarea takes or loses focus, the page's typing state follows it; a button pressed
  // inside the composer is not writing.
  const onComposerFocus = asPage ? (e) => { if (e.target.tagName === "TEXTAREA") setTyping(true); } : undefined;
  // A press elsewhere is what usually takes the focus, and the tab bar coming back would move what it is
  // pressing before it lets go: the page leaves typing once the press is over, and its click has landed.
  const onComposerBlur = asPage ? (e) => {
    if (e.target.tagName !== "TEXTAREA") return;
    if (!pressingRef.current) { setTyping(false); return; }
    const done = () => {
      document.removeEventListener("pointerup", done, true);
      document.removeEventListener("pointercancel", done, true);
      setTimeout(() => setTyping(false), 0);
    };
    document.addEventListener("pointerup", done, true);
    document.addEventListener("pointercancel", done, true);
  } : undefined;

  return (
    <ChatContext.Provider value={chat}>
    <div className={"k-chat-page" + (docked ? " k-chat-page--docked" : "") + (railTarget ? " k-chat-page--railless" : "")
      + (asPage ? " k-chat-page--as-page" : "") + (pageClass ? " " + pageClass : "")}>
      {railTarget && createPortal(
        <div className="k-chat-convos">
          <NavItem icon="square-pen" label="New chat" onClick={shown(newChat)} />
          {convos.length > 0 && <div className="k-sidebar__group-label k-chat-convos__label">Recent</div>}
          <div className="k-chat-convos__list">
            {convos.map(c => {
              const lit = conversationShown && c.id === activeId;
              return (
                <div key={c.id}
                  className={"k-nav-item k-chat-convos__item" + (lit ? " k-nav-item--active" : "")}
                  role="link" tabIndex={0} aria-current={lit ? "page" : undefined}
                  onClick={shown(() => pickChat(c.id))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); shown(() => pickChat(c.id))(); } }}>
                  <span className="k-nav-item__label">{conversationTitle(c)}</span>
                  <button type="button" className="k-chat-convos__del" onClick={(e) => deleteChat(c.id, e)}
                    title="Delete" aria-label={"Delete " + conversationTitle(c)}>
                    <Icon name="trash-2" size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>,
        railTarget)}
      {listTarget && createPortal(
        <div className="k-chat-list">
          <Button variant="primary" size="lg" icon="square-pen" wide onClick={shown(newChat)}>New chat</Button>
          {convos.length === 0
            ? <EmptyState icon="messages-square" title="No conversations yet" />
            : (
              <div className="k-chat-list__rows">
                {convos.map(c => {
                  // The open one is marked on the page whatever is on screen: it is a list of conversations, and
                  // which one you are in is part of what it says.
                  const lit = c.id === activeId;
                  return (
                    <div key={c.id} className={"k-chat-list__item" + (lit ? " k-chat-list__item--active" : "")}>
                      <button type="button" className="k-chat-list__open" aria-current={lit ? "page" : undefined}
                        onClick={shown(() => pickChat(c.id))}>
                        <Icon name="message-square" size={16} />
                        <span className="k-chat-list__title">{conversationTitle(c)}</span>
                      </button>
                      <IconButton icon="trash-2" label={"Delete " + conversationTitle(c)} variant="ghost"
                        tone="danger" onClick={(e) => deleteChat(c.id, e)} />
                    </div>
                  );
                })}
              </div>
            )}
        </div>,
        listTarget)}
      {!railTarget && <aside className="k-chat-rail">
        <button className="k-chat-rail__new" onClick={newChat}>
          <Icon name="plus" size={15} strokeWidth={2.2} /> New chat
        </button>
        <div className="k-chat-rail__list">
          {convos.length === 0 && <div className="k-chat-rail__empty">No conversations yet.</div>}
          {convos.map(c => (
            <div key={c.id}
              className={"k-chat-rail__item" + (c.id === activeId ? " k-chat-rail__item--active" : "")}
              onClick={() => pickChat(c.id)}>
              <Icon name="message-square" size={14} />
              <span className="k-chat-rail__title">{conversationTitle(c)}</span>
              <button className="k-chat-rail__del" onClick={(e) => deleteChat(c.id, e)} title="Delete">
                <Icon name="trash-2" size={13} />
              </button>
            </div>
          ))}
        </div>
        {/* Foot of the rail, under the conversations — the settings page is about this surface
            rather than about any one chat, so it sits below the list rather than in it. At phone
            width the rail is display:none and the same route is the header's cog. */}
        {onOpenSettings && (
          <button type="button" className="k-chat-rail__settings" onClick={onOpenSettings}>
            <Icon name="settings" size={15} className="k-chat-rail__settings-icon" />
            <span>Settings</span>
          </button>
        )}
      </aside>}

      <div className="k-chat-main">
        {/* The header names the conversation being read; which assistant answers is the surface's
            to say. The connection shows here only when it is not fine \u2014 a healthy one is what the
            whole page already demonstrates. */}
        <div className={"k-chat-main__head k-chat-head" + (docked ? " k-chat-head--docked" : "") + (asPage && lifted ? " k-chat-head--lifted" : "")}>
          {asPage && !empty && (
            <IconButton icon="arrow-left" label="Back" variant="ghost" size="sm" className="k-chat-head__back" onClick={backToStart} />
          )}
          <span className="k-chat-head__title" title={conversationTitle(active)}>{conversationTitle(active)}</span>
          {conn.tone !== "online" && (
            <span className={"k-chat-head__conn k-chat-head__conn--" + conn.tone} role="status">
              <span className="k-chat-head__dot" aria-hidden="true"></span>
              {conn.label}
            </span>
          )}
          {HostPicker && (
            <span className="k-chat-head__host">
              <HostPicker hosts={assistantHosts} current={assistantHost} onSelect={pickAssistantHost} />
            </span>
          )}
          <div className="k-chat-head__actions">
            {renderSlot(slots.headerActions, chat)}
            {/* The phone-width and dock replacement for the rail (CSS decides, at the breakpoint
                that hides it), so the rail's foot travels here with it. */}
            <div className="k-chat-head__nav">
              {!asPage && <IconButton icon="square-pen" label="New chat" variant="ghost" size="sm" onClick={newChat} />}
              {!railTarget && !listTarget && (
                <ChatHistory convos={convos} activeId={activeId} onPick={pickChat} onDelete={deleteChat} onOpen={loadServerHistory} loading={histLoading}
                  sheet={asPage} onNew={backToStart} head={renderSlot(slots.history, chat)} />
              )}
              {onOpenSettings && (
                <IconButton icon="settings" label="Settings" variant="ghost" size="sm" onClick={onOpenSettings} />
              )}
            </div>
            {!docked && !asPage && active && (
              <ConversationOptions
                onCompact={compactHere}
                onDelete={() => deleteChat(active.id)} />
            )}
            {docked && !asPage && showPin && (
              <IconButton icon={pinned ? "pin" : "pin-off"} label={pinned ? "Unpin" : "Pin"} variant="ghost" size="sm"
                pressed={!!pinned} disabled={pinDisabled} onClick={onTogglePin}
                title={pinDisabled ? "Not enough room to pin" : pinned ? "Unpin \u00b7 float over the page" : "Pin \u00b7 push the page aside"} />
            )}
            {docked && !asPage && onExpand && (
              <IconButton icon="maximize-2" label="Expand to full screen" variant="ghost" size="sm" onClick={onExpand} />
            )}
            {docked && !asPage && (
              <IconButton icon="x" label="Close assistant" variant="ghost" size="sm" onClick={onClose} />
            )}
            {!docked && onClose && (
              <IconButton icon="minimize-2" label="Exit full screen" variant="ghost" size="sm" onClick={onClose}
                title="Exit full screen (Esc)" />
            )}
          </div>
        </div>

        <div className="k-chat-scroll" ref={scrollRef} onScroll={onThreadScroll}>
          {empty ? (
            <div className="k-chat-start">
              {slots.start != null ? renderSlot(slots.start, chat) : <DefaultStart chat={chat} />}
            </div>
          ) : (
            <ChatThread messages={active.messages} user={user} assistantName={assistantName}
              renderEntry={renderOwnEntry} renderCommand={renderCommand} renderCards={renderOwnCards}
              onRate={rateTurn} onUseCommand={offerCommand} onAnswer={answerQuestions}
              loadAttachment={loadOwnAttachment} />
          )}
        </div>

        <div className="k-chat-composer">
          {!assistantUsable && (
            <div className="k-chat-composer__downhint" role="status">
              <Icon name="triangle-alert" size={14} />
              <span>
                {assistantHost
                  ? "The assistant isn\u2019t answering right now"
                  : assistantHosts.length
                    ? "Pick which assistant to talk to"
                    : "No assistant is answering right now"}
              </span>
            </div>
          )}
          {/* Prompts waiting behind the running turn. Stopping that turn leaves them standing, so
              throwing one away is its own act. */}
          {queuedHere.length > 0 && (
            <div className="k-chat-queue">
              {queuedHere.map(q => (
                <div key={q.turnId} className="k-chat-queue__row">
                  <Icon name="clock" size={14} className="k-chat-queue__icon" />
                  <span className="k-chat-queue__text" title={q.prompt}>
                    {q.ahead === undefined ? "Queued" : q.ahead > 1 ? "Queued, " + q.ahead + " ahead" : "Queued, next"}: {q.prompt}
                  </span>
                  <IconButton icon="x" label="Discard queued message" variant="ghost" size="xs"
                    onClick={() => cancelQueued(q.turnId)} />
                </div>
              ))}
            </div>
          )}
          {slots.aboveComposer != null ? renderSlot(slots.aboveComposer, chat) : <DefaultAboveComposer chat={chat} />}
          {voice.phase === "idle" ? (
            <div className={"k-chat-composer__box" + (dragging ? " k-chat-composer__box--drop" : "")} ref={composerRef}
              onFocus={onComposerFocus} onBlur={onComposerBlur} onPaste={onComposerPaste}
              onDragOver={onComposerDragOver} onDragLeave={() => setDragging(false)} onDrop={onComposerDrop}>
              <ComposerAttachments items={attached} onRemove={removeAttached} />
              {attachTooLong && <p className="k-chat-composer__attach-note" role="alert">{attachTooLong}</p>}
              {/* Name the assistant only where there is a choice of them. HostPicker is the
                  surface saying it addresses several, so there this reads "Message hotrod's
                  assistant" and stays useful; a surface with one assistant has nothing to
                  disambiguate and would just be restating its own name back at itself. The command
                  surface is advertised only when this assistant offers one. */}
              <MarkdownTextarea
                ref={taRef}
                rows={1}
                value={input}
                placeholder={"Message the assistant"
                  + (commandCatalog.length > 0 ? " \u00b7 / for commands" : "")}
                onChange={onInputChange}
                onKeyDown={onKeyDown} />
              <ChatCommandMenu
                items={commandMenu.items}
                active={commandMenu.active}
                anchorRef={composerRef}
                onPick={applyCompletion} />
              {/* The switches are labelled buttons where the composer has the room, and one menu of
                  them where it does not \u2014 both are drawn and the composer's width decides which shows
                  (chat-composer.css), so a dock dragged narrow changes over without a re-render. */}
              <div className="k-chat-composer__bar">
                {/* Two pickers, because one cannot offer both: Chrome on Android shows a picture picker
                    as the camera and the photos, and only the File System Access picker as the phone's
                    file browser (pickFiles). The file picker takes anything, and the assistant refuses
                    on the chip what it cannot read. */}
                {attachLimits && (
                  <>
                    <IconButton ref={attachRef} icon="plus" variant="ghost" size="sm" className="k-chat-composer__attach"
                      label={attachLimits.images ? "Attach a picture or a file" : "Attach a file"}
                      title={attachLimits.images ? "Attach a picture or a file" : "Attach a file"}
                      aria-haspopup={attachLimits.images ? "menu" : undefined}
                      aria-expanded={attachLimits.images ? attachOpen : undefined}
                      onClick={() => (attachLimits.images
                        ? setAttachOpen(o => !o)
                        : pickFiles())} />
                    <input ref={pictureInputRef} type="file" multiple hidden accept="image/*"
                      onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                    <input ref={fileInputRef} type="file" multiple hidden
                      onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                  </>
                )}
                {assistantHost && (
                  <div className="k-chat-composer__switches">
                    <Button variant="outline" size="xs" icon="lightbulb" pressed={thinkOn}
                      onClick={toggleThinking} title={thinkTip}>
                      Thinking
                    </Button>
                    <Button variant="outline" size="xs" icon={speakBlocked ? "volume-x" : "volume-2"} pressed={speak}
                      onClick={toggleSpeak} title={speakTip}>
                      Read aloud
                    </Button>
                    {canSeeActions && (
                      <Button variant="outline" size="xs" icon="zap" pressed={autoAcceptActive}
                        className="k-chat-switch--warn" disabled={!canUseActions}
                        onClick={toggleActions} title={autorunTip}>
                        Auto-run
                      </Button>
                    )}
                  </div>
                )}
                {assistantHost && (
                  <div className="k-chat-composer__opts">
                    <IconButton ref={optsRef} icon="sliders-horizontal" variant="ghost" size="sm"
                      label={"Chat options" + ([thinkOn && "Thinking on", speak && "Read aloud on", autoAcceptActive && "Auto-run on"]
                        .filter(Boolean).map((s, i) => (i ? ", " : ": ") + s).join(""))}
                      title="Chat options"
                      aria-haspopup="dialog" aria-expanded={optsOpen} onClick={() => setOptsOpen(o => !o)} />
                    <span className="k-chat-composer__dots" aria-hidden="true">
                      {thinkOn && <i className="k-chat-composer__dot" />}
                      {speak && <i className="k-chat-composer__dot" />}
                      {autoAcceptActive && <i className="k-chat-composer__dot k-chat-composer__dot--warn" />}
                    </span>
                  </div>
                )}
                <span className="k-chat-composer__bar-spacer"></span>
                <span className="k-chat-composer__ctx">
                  <ChatContextMeter usage={latestUsage(active && active.messages)} onCompact={compactHere} />
                </span>
                {!busy && !input.trim() && attached.length === 0 && assistantUsable && (
                  <IconButton icon="mic" label="Record a voice note" variant="ghost" size="sm" onClick={startVoice} />
                )}
                {turnRunning
                  ? <IconButton icon="square" label="Stop the answer" variant="outline" size="sm" onClick={stop} />
                  : asPage && !input.trim() && attached.length === 0 ? null
                  : <Button variant="primary" size="sm" icon="arrow-up" onClick={() => send()}
                      disabled={!canSend || !assistantUsable}
                      aria-label="Send" title={assistantUsable ? "Send" : "Assistant unavailable"} />}
              </div>
            </div>
          ) : (
            <div className="k-chat-composer__box k-chat-composer__box--voice">
              <VoiceComposerBar rec={voice} onSend={sendVoice} onCancel={voice.cancel} />
            </div>
          )}
          {asPage && empty && assistantHost && <p className="k-chat-composer__note">{CHAT_PRIVACY_NOTICE}</p>}
          <ChatMenu open={attachOpen} setOpen={setAttachOpen} anchorRef={attachRef} label="Attach"
            align={asPage ? undefined : "start"} className="k-chat-menu--attach">
            <Button variant="ghost" size="sm" wide icon="image" role="menuitem" className="k-chat-menu__item"
              onClick={() => { setAttachOpen(false); if (pictureInputRef.current) pictureInputRef.current.click(); }}>
              Picture
            </Button>
            <Button variant="ghost" size="sm" wide icon="file-text" role="menuitem" className="k-chat-menu__item"
              onClick={() => { setAttachOpen(false); pickFiles(); }}>
              File
            </Button>
          </ChatMenu>
          <ChatMenu open={optsOpen} setOpen={setOptsOpen} anchorRef={optsRef} role="dialog" label="Chat options" align={asPage ? undefined : "start"}
            className="k-chat-menu--options">
            <div className="k-chat-menu__row" title={thinkTip}>
              <Icon name="lightbulb" size={14} className="k-chat-menu__icon" />
              <span className="k-chat-menu__label">Thinking</span>
              <Toggle on={thinkOn} label="Thinking" onChange={toggleThinking} />
            </div>
            <div className="k-chat-menu__row" title={speakTip}>
              <Icon name={speakBlocked ? "volume-x" : "volume-2"} size={14} className="k-chat-menu__icon" />
              <span className="k-chat-menu__label">Read aloud</span>
              <Toggle on={speak} label="Read aloud" onChange={toggleSpeak} />
            </div>
            {canSeeActions && (
              <div className="k-chat-menu__row k-chat-menu__row--warn" title={autorunTip}>
                <Icon name="zap" size={14} className="k-chat-menu__icon" />
                <span className="k-chat-menu__label">Auto-run</span>
                <Toggle on={autoAcceptActive} label="Auto-run" disabled={!canUseActions} onChange={toggleActions} />
              </div>
            )}
            {ctxUsage && (
              <>
                <div className="k-chat-menu__sep" role="separator" />
                <div className={"k-chat-menu__row" + (ctxUsage.warn ? " k-chat-menu__row--ctxwarn" : "")}>
                  <ContextRing pct={ctxUsage.pct} />
                  <span className="k-chat-menu__label">Context {ctxUsage.pct}% used</span>
                  <Button variant="outline" size="xs" busy={optsCompact.compacting} disabled={!compactHere}
                    onClick={optsCompact.run}>
                    Compact
                  </Button>
                </div>
                {optsCompact.note && <div className="k-chat-menu__note">{optsCompact.note}</div>}
              </>
            )}
          </ChatMenu>
        </div>
      </div>
    </div>
    </ChatContext.Provider>
  );
}

export { Chat, CHAT_PRIVACY_NOTICE, DEFAULT_PROFILE, DEFAULT_TOGGLE_COPY };
