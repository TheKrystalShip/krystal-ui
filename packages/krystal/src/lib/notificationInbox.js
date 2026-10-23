import React from "react";
import { createStore, useStore } from "./store.js";

// notificationInbox.js — a person's notifications as a bell shows them.
//
// The list is read from the product while any component using `useInbox` is mounted: on an
// interval and whenever the page is shown again, so a push that arrived while the app was closed is
// in the list the moment it is opened. Marking is shown at once and confirmed by the next read.

const EVERY_MS = 60 * 1000;

/**
 * @typedef {object} InboxState
 * @property {number} unread How many rows are unread.
 * @property {import("./notificationsClient.js").NotificationItem[] | null} items Newest first; null until the first read.
 * @property {boolean} more Whether older rows are held back.
 * @property {import("./notificationsClient.js").NotificationKind[]} kinds What the product tells people about; empty until read.
 * @property {Error | null} error The last read's failure, cleared by the next success.
 */
/**
 * @typedef {object} NotificationInbox
 * @property {() => InboxState} useInbox The state, kept fresh while the calling component is mounted.
 * @property {() => () => void} watch Keeps the state fresh until the returned function is called, for a caller that cannot hold a hook.
 * @property {() => Promise<void>} refresh Reads the newest rows now.
 * @property {(ids?: string[]) => Promise<void>} markRead Marks the named rows read, or every row when none are named.
 * @property {() => Promise<void>} loadMore Appends the next older rows.
 * @property {import("./store.js").Store<InboxState>} store The state's store.
 * @property {import("./notificationsClient.js").NotificationsClient} client The client it reads through.
 */

/**
 * @param {import("./notificationsClient.js").NotificationsClient} client
 * @param {object} [options]
 * @param {number} [options.everyMs] Milliseconds between reads while watched; a minute by default.
 * @returns {NotificationInbox}
 */
function createNotificationInbox(client, { everyMs = EVERY_MS } = {}) {
  /** @type {import("./store.js").Store<InboxState>} */
  const store = createStore({ unread: 0, items: null, more: false, kinds: [], error: null });
  let watchers = 0;
  let timer = null;
  let kindsRead = false;
  let kindsPending = false;

  async function refresh() {
    readKinds();
    try {
      const reply = await client.list();
      store.setState((s) => {
        // Rows paged in beyond the newest read stay under it.
        const last = reply.items.length ? reply.items[reply.items.length - 1].id : null;
        const at = last && s.items ? s.items.findIndex((n) => n.id === last) : -1;
        const older = at >= 0 ? s.items.slice(at + 1) : [];
        return { ...s, unread: reply.unread, items: [...reply.items, ...older], more: older.length ? s.more : !!reply.more, error: null };
      });
    } catch (error) {
      store.setState({ error });
    }
  }

  async function readKinds() {
    if (kindsRead || kindsPending) return;
    kindsPending = true;
    try {
      const reply = await client.kinds();
      kindsRead = true;
      store.setState({ kinds: (reply && reply.kinds) || [] });
    } catch { /* rows of a kind nobody described are drawn plainly */ }
    kindsPending = false;
  }

  const onVisible = () => { if (document.visibilityState === "visible") refresh(); };

  function watch() {
    if (watchers++ > 0) return;
    refresh();
    timer = setInterval(refresh, everyMs);
    document.addEventListener("visibilitychange", onVisible);
  }

  function unwatch() {
    if (--watchers > 0) return;
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  }

  function keep() {
    watch();
    let held = true;
    return () => { if (held) { held = false; unwatch(); } };
  }

  async function markRead(ids) {
    store.setState((s) => {
      const items = (s.items || []).map((n) => (!n.read && (!ids || ids.includes(n.id)) ? { ...n, read: true } : n));
      return { ...s, items, unread: ids ? items.filter((n) => !n.read).length : 0 };
    });
    try {
      await client.markRead(ids);
    } finally {
      refresh();
    }
  }

  async function loadMore() {
    const { items, more } = store.getState();
    if (!more || !items || !items.length) return;
    try {
      const reply = await client.list({ before: items[items.length - 1].id });
      store.setState((s) => ({ ...s, items: [...(s.items || []), ...reply.items], more: !!reply.more, error: null }));
    } catch (error) {
      store.setState({ error });
    }
  }

  function useInbox() {
    React.useEffect(keep, []);
    return useStore(store);
  }

  return { useInbox, watch: keep, refresh, markRead, loadMore, store, client };
}

export { createNotificationInbox };
