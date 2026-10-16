import { createStore } from "./store.js";

// toasts.js — transient outcome messages, and the history that outlives them.
//
// A toast reports the outcome of something the person DID in this browser. What a site
// routes here is its own policy; what this module guarantees is the mechanism: a live stack
// that clears itself, and a per-browser history (localStorage, newest HISTORY_MAX, kept for
// HISTORY_TTL_MS) that `<NotificationsPanel>` reads back.
//
// `subject` is opaque here. A site that can lead somewhere from a row passes whatever it
// needs to find that place again, and gets it back through `NotificationsPanel`'s `onOpen`.
//
// It depends on nothing beyond store.js, so any surface can hold it.

const KEY = "krystal:notifications";
const HISTORY_MAX = 50;
const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LIVE_MAX = 4;
// Repeats of the same message inside this window fold into a count instead of
// stacking. One mis-click that retries six times is one card, not six.
const DEDUPE_MS = 5000;

// Auto-dismiss. An ERROR is sticky: a failure reason that vanishes before it is
// read is barely better than no reason at all, which is the whole complaint this
// feature answers.
const TIMEOUT = { success: 4000, info: 6000, error: null };

let seq = 0;
const nextId = () => "t" + (++seq) + "_" + Date.now().toString(36);

// `action` holds a function and is deliberately dropped on the way to storage —
// a callback cannot survive a reload, and JSON.stringify would silently write
// null for it anyway. History rows are data; only live toasts carry behaviour.
/**
 * @typedef {object} Toast
 * @property {string} id The toast's unique id.
 * @property {"error" | "success" | "info"} tone `error`, `success` or `info`.
 * @property {string} title The headline.
 * @property {string | null} detail A second line giving the reason, or null.
 * @property {string | null} code A machine code shown with the detail, or null.
 * @property {any} subject Opaque; handed back through NotificationsPanel's `onOpen`.
 * @property {{ label: import("react").ReactNode, onClick: () => void } | null} action Live toasts only.
 * @property {boolean} sticky Stays until dismissed instead of clearing itself.
 * @property {number} count How many identical repeats the card folds.
 * @property {number} ts Epoch milliseconds of the latest occurrence.
 * @property {boolean} read Whether the person has seen it in the notifications panel.
 */
/**
 * @typedef {object} ToastOptions
 * @property {string} [detail] A second line giving the reason.
 * @property {string | number} [code] A machine code shown with the detail.
 * @property {any} [subject] An opaque value a site hands back through the notifications panel's `onOpen`.
 * @property {{ label: import("react").ReactNode, onClick: () => void }} [action] A button on the live toast.
 * @property {boolean} [sticky] Stays until dismissed; true by default for an error only.
 */
/**
 * @typedef {object} ToastHistoryState
 * @property {Toast[]} history The notification history, newest first.
 */
/** @param {Toast} t */
function persistable(t) {
  const rest = { ...t };
  delete rest.action;
  return rest;
}

/** @param {Toast[]} history @param {number} now */
function prune(history, now) {
  return history
    .filter(t => (now - (t.ts || 0)) < HISTORY_TTL_MS)
    .slice(0, HISTORY_MAX);
}

// The browser's storage, or null outside a page: a runtime with a localStorage of its own (Node) warns
// on reading it, and a module a site's tests import must load there quietly.
const storage = () => (typeof window !== "undefined" ? window.localStorage : null);

/** @returns {Toast[]} */
function load() {
  try {
    const raw = storage()?.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return prune(arr.filter(t => t && typeof t === "object" && t.id), Date.now());
  } catch { return []; }
}

/** @param {Toast[]} history */
function save(history) {
  try { storage()?.setItem(KEY, JSON.stringify(history.map(persistable))); } catch {}
}

/** @type {import("./store.js").Store<{ live: Toast[], history: Toast[] }>} */
const toastStore = createStore({ live: [], history: load() });

/** @param {ToastHistoryState} state @returns {number} */
function unreadCount(state) {
  let n = 0;
  for (const t of state.history) if (!t.read) n++;
  return n;
}

// "danger" the moment any unread one is an error, so the badge tells you whether
// what you missed needs you.
/** @param {ToastHistoryState} state @returns {"danger" | "info"} */
function unreadTone(state) {
  for (const t of state.history) if (!t.read && t.tone === "error") return "danger";
  return "info";
}

/**
 * @param {"error" | "success" | "info"} tone
 * @param {string} title
 * @param {ToastOptions} [opts]
 * @returns {string} The toast's id.
 */
function push(tone, title, opts) {
  const o = opts || {};
  const now = Date.now();
  const state = toastStore.getState();

  // Fold a repeat into the card already on screen.
  const dupe = state.live.find(t => t.tone === tone && t.title === title && (now - t.ts) < DEDUPE_MS);
  if (dupe) {
    const bumped = { ...dupe, count: (dupe.count || 1) + 1, ts: now };
    toastStore.setState({
      live: state.live.map(t => (t.id === dupe.id ? bumped : t)),
      history: state.history.map(t => (t.id === dupe.id ? { ...bumped, read: t.read } : t)),
    });
    save(toastStore.getState().history);
    return dupe.id;
  }

  const t = {
    id: nextId(),
    tone,
    title: String(title || ""),
    detail: o.detail || null,
    code: o.code != null ? String(o.code) : null,
    subject: o.subject || null,
    action: o.action || null,
    sticky: o.sticky != null ? !!o.sticky : TIMEOUT[tone] == null,
    count: 1,
    ts: now,
    read: false,
  };

  // Dropping off the live stack is not dismissal — the card leaves the screen,
  // the row stays in the history.
  const live = [...state.live, t].slice(-LIVE_MAX);
  const history = prune([{ ...t }, ...state.history], now);
  toastStore.setState({ live, history });
  save(history);
  return t.id;
}

const toast = {
  error:   (title, opts) => push("error", title, opts),
  success: (title, opts) => push("success", title, opts),
  info:    (title, opts) => push("info", title, opts),

  // An error turned into a card. A client that has a sentence written for a person
  // carries it as `userMessage`, which wins over the raw `message`; the code is the
  // envelope's own (`envCode`), else the HTTP status, else the error's code.
  fromError(err, title, opts) {
    const detail = (err && (err.userMessage || err.message)) || null;
    const code = err ? (err.envCode || err.status || err.code) : null;
    return push("error", title, {
      // Never guessed. An error carrying nothing says so rather than having a
      // plausible cause invented for it.
      detail: detail || "The backend gave no reason.",
      code: code != null ? code : null,
      subject: (opts && opts.subject) || null,
    });
  },

  dismiss(id) {
    const state = toastStore.getState();
    if (!state.live.some(t => t.id === id)) return;
    toastStore.setState({ live: state.live.filter(t => t.id !== id) });
  },

  // Every live card off the screen. The history is untouched.
  clearLive() { toastStore.setState({ live: [] }); },

  markAllRead() {
    const state = toastStore.getState();
    if (!state.history.some(t => !t.read)) return;
    const history = state.history.map(t => (t.read ? t : { ...t, read: true }));
    toastStore.setState({ history });
    save(history);
  },

  clearHistory() {
    toastStore.setState({ history: [] });
    save([]);
  },
};

export { toast, toastStore, unreadCount, unreadTone };
