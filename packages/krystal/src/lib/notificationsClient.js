// notificationsClient.js — the calls of the shared notifications routes, over a site's own request.
//
// Every product that tells people things serves one route shape (`/notifications`, `/push/...`).
// What differs is how a call is made and signed, so that arrives as a parameter and this module
// imports nothing: `request(method, path, body)` is the site's signed-in call with its prefix
// applied, and resolves with the parsed JSON reply (nothing for a 204).

/**
 * @typedef {object} NotificationKind
 * @property {string} id The kind's id.
 * @property {string} title Its name for a person.
 * @property {string} [description] A sentence saying what the kind tells.
 * @property {string} icon A Lucide name.
 * @property {string} tone `neutral`, `teal`, `info`, `success`, `warning` or `danger`.
 * @property {boolean} switchable Whether a person may switch it off.
 * @property {boolean} enabledByDefault Whether it is on until a person says otherwise.
 */
/**
 * @typedef {object} NotificationItem
 * @property {string} id The row's id.
 * @property {string} kind A kind's id.
 * @property {string} text The line.
 * @property {string} [detail] A second line.
 * @property {string} [url] A path in the product's site the row opens.
 * @property {string} [action] The words for that link.
 * @property {Record<string, any>} [data] The product's own fields.
 * @property {string} createdAt ISO 8601.
 * @property {string} [updatedAt] ISO 8601.
 * @property {boolean} read Whether the person has read it.
 */
/**
 * @typedef {object} NotificationsClient
 * @property {(opts?: { before?: string, limit?: number }) => Promise<{ unread: number, items: NotificationItem[], more: boolean }>} list The person's notifications, newest first.
 * @property {(ids?: string[]) => Promise<void>} markRead Marks the named rows read, or every row when none are named.
 * @property {() => Promise<{ kinds: NotificationKind[] }>} kinds What this product tells people about.
 * @property {() => Promise<{ kinds: Record<string, boolean> }>} preferences Each switchable kind's effective value.
 * @property {(kinds: Record<string, boolean>) => Promise<{ kinds: Record<string, boolean> }>} setPreferences Sets any subset of the switches.
 * @property {() => Promise<{ publicKey: string, enabled: boolean }>} pushKey The application server key, and whether the product pushes at all.
 * @property {(subscription: { endpoint: string, p256dh: string, auth: string }) => Promise<void>} subscribe Registers a browser.
 * @property {(endpoint: string) => Promise<void>} unsubscribe Gives a browser up.
 * @property {() => Promise<{ endpoints: string[] }>} devices The caller's registered browsers.
 */

/**
 * @param {object} options
 * @param {(method: string, path: string, body?: any) => Promise<any>} options.request The site's own signed-in call, with the product's route prefix applied.
 * @returns {NotificationsClient}
 */
function createNotificationsClient({ request }) {
  return {
    list({ before, limit } = {}) {
      const query = [];
      if (before) query.push("before=" + encodeURIComponent(before));
      if (limit) query.push("limit=" + encodeURIComponent(limit));
      return request("GET", "/notifications" + (query.length ? "?" + query.join("&") : ""));
    },
    markRead: (ids) => request("POST", "/notifications/read", ids ? { ids } : {}),
    kinds: () => request("GET", "/notifications/kinds"),
    preferences: () => request("GET", "/notifications/preferences"),
    setPreferences: (kinds) => request("PUT", "/notifications/preferences", { kinds }),
    pushKey: () => request("GET", "/push/key"),
    subscribe: (subscription) => request("POST", "/push/subscribe", subscription),
    unsubscribe: (endpoint) => request("DELETE", "/push/subscribe", { endpoint }),
    devices: () => request("GET", "/push/devices"),
  };
}

export { createNotificationsClient };
