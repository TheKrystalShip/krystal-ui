import { createStore } from "./store.js";

// toasts.js — transient outcome messages.
//
// A toast reports the outcome of something the person DID in this browser. What a site routes here
// is its own policy; what this module guarantees is the mechanism: a live stack that clears itself,
// and nothing kept once a card is gone. What a person is told about, and keeps, is the notifications
// system (`createNotificationInbox`).
//
// It depends on nothing beyond store.js, so any surface can hold it.

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

/**
 * @typedef {object} Toast
 * @property {string} id The toast's unique id.
 * @property {"error" | "success" | "info"} tone `error`, `success` or `info`.
 * @property {string} title The headline.
 * @property {string | null} detail A second line giving the reason, or null.
 * @property {string | null} code A machine code shown with the detail, or null.
 * @property {{ label: import("react").ReactNode, onClick: () => void } | null} action A button on the card.
 * @property {boolean} sticky Stays until dismissed instead of clearing itself.
 * @property {number} count How many identical repeats the card folds.
 * @property {number} ts Epoch milliseconds of the latest occurrence.
 */
/**
 * @typedef {object} ToastOptions
 * @property {string} [detail] A second line giving the reason.
 * @property {string | number} [code] A machine code shown with the detail.
 * @property {{ label: import("react").ReactNode, onClick: () => void }} [action] A button on the live toast.
 * @property {boolean} [sticky] Stays until dismissed; true by default for an error only.
 */
/** @type {import("./store.js").Store<{ live: Toast[] }>} */
const toastStore = createStore({ live: [] });

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
    toastStore.setState({ live: state.live.map(t => (t.id === dupe.id ? bumped : t)) });
    return dupe.id;
  }

  const t = {
    id: nextId(),
    tone,
    title: String(title || ""),
    detail: o.detail || null,
    code: o.code != null ? String(o.code) : null,
    action: o.action || null,
    sticky: o.sticky != null ? !!o.sticky : TIMEOUT[tone] == null,
    count: 1,
    ts: now,
  };

  toastStore.setState({ live: [...state.live, t].slice(-LIVE_MAX) });
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
    });
  },

  dismiss(id) {
    const state = toastStore.getState();
    if (!state.live.some(t => t.id === id)) return;
    toastStore.setState({ live: state.live.filter(t => t.id !== id) });
  },

  // Every live card off the screen.
  clearLive() { toastStore.setState({ live: [] }); },
};

export { toast, toastStore };
