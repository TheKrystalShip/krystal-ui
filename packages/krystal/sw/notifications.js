// notifications.js — the service-worker half of the notifications system: shows a push, opens the
// page it names, and posts a button's handle.
//
// A classic worker script, for a site's `sw.js` to load with `importScripts`; it defines
// `self.krystalNotifications` and imports nothing. The `notificationsWorker()` Vite plugin
// (`@thekrystalship/krystal/vite`) serves it at `/krystal-notifications.js` in development and emits it
// at the build root:
//
//   importScripts("/krystal-notifications.js");
//   self.addEventListener("push", (event) => self.krystalNotifications.handleNotificationPush(event, { icon: "/icons/icon-192.png" }));
//   self.addEventListener("notificationclick", (event) => self.krystalNotifications.handleNotificationClick(event));
//
// The push payload is `{ title, body, url?, tag, actions?: [{ id, title, url }], data? }`. `tag` is
// `<kind>:<key>`, so an update to a row replaces its notification on the shade. A button's `url` is
// the absolute address of the product's anonymous `POST /push/actions/{handle}`, which answers
// `{ ok, message }`: the worker posts to it and shows `message` as a follow-up under the same tag.
// A browser subscribes with `userVisibleOnly`, so every push shows something; a payload that cannot
// be read says little rather than inventing what it was about.

const FALLBACK_BODY = "There is something new for you.";
const FAILED_BODY = "That didn’t go through.";

/**
 * Shows a push.
 * @param {PushEvent} event
 * @param {{ title?: string, icon?: string, badge?: string }} [options] The site's own words and marks: `title` stands in when the payload has none.
 */
function handleNotificationPush(event, options = {}) {
  let payload = {};
  try {
    if (event.data) payload = event.data.json() || {};
  } catch {
    try { payload = { body: event.data.text() }; } catch { payload = {}; }
  }

  const max = typeof Notification !== "undefined" && Notification.maxActions ? Notification.maxActions : 0;
  const actions = (Array.isArray(payload.actions) ? payload.actions : [])
    .filter((a) => a && a.id && a.title && a.url)
    .slice(0, max);

  event.waitUntil(
    self.registration.showNotification(payload.title || options.title || "Notification", {
      body: payload.body || FALLBACK_BODY,
      icon: options.icon,
      badge: options.badge,
      tag: payload.tag || undefined,
      renotify: !!payload.tag,
      actions: actions.map((a) => ({ action: a.id, title: a.title })),
      data: { ...(payload.data || {}), url: payload.url || "/", actions: actions.map((a) => ({ id: a.id, url: a.url })) },
    }),
  );
}

/**
 * Handles a tap on a notification or on one of its buttons.
 *
 * A tap on the notification opens the page it names, in a window of this site already open, else a
 * new one. A tap on a button posts to the button's address and shows the answer as a follow-up
 * notification in the original's place.
 * @param {NotificationEvent} event
 */
function handleNotificationClick(event) {
  const shown = event.notification;
  shown.close();
  const data = shown.data || {};

  if (event.action) {
    const button = (data.actions || []).find((a) => a.id === event.action);
    if (button) event.waitUntil(answerButton(shown, button));
    return;
  }

  const target = new URL(data.url || "/", self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if (new URL(win.url).origin !== self.location.origin) continue;
        return win.focus().then((w) => (w && "navigate" in w ? w.navigate(target.href) : w));
      }
      return self.clients.openWindow(target.href);
    }),
  );
}

// The button's handle is single-use and anonymous: whoever holds the address may press it once, so
// it is posted with no credentials.
async function answerButton(shown, button) {
  let body = FAILED_BODY;
  try {
    const res = await fetch(button.url, { method: "POST", credentials: "omit" });
    const answer = await res.json();
    if (answer && answer.message) body = answer.message;
  } catch { /* the failure is what the follow-up says */ }

  await self.registration.showNotification(shown.title, {
    body,
    icon: shown.icon,
    badge: shown.badge,
    tag: shown.tag || undefined,
    renotify: !!shown.tag,
    data: { url: (shown.data && shown.data.url) || "/" },
  });
}

self.krystalNotifications = { handleNotificationClick, handleNotificationPush };
