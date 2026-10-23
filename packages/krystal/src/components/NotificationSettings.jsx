import React from "react";
import { Notice } from "./Notice.jsx";
import { SettingsRow, SettingsSection } from "./settings-primitives.jsx";
import { Skeleton } from "./Skeleton.jsx";
import { Toggle } from "./Toggle.jsx";
import { acquire, currentEndpoint, release, support } from "../lib/pushBrowser.js";

// NotificationSettings — what a person chooses about being told: a switch for each kind the product
// lets them switch, whether this browser receives pushes, and how many devices do.
//
// `client` is `createNotificationsClient`'s answer, stable across renders. The kinds and their
// words come from the product (`kinds()`), the switches' values from `preferences()`; a kind that
// cannot be switched is not offered. The push row is per browser, because a subscription is: it asks
// the browser for permission from the press itself, since a prompt the person did not ask for is
// refused. It is on when the browser has a subscription and this server lists its endpoint; switching
// it on registers the browser's existing subscription with this server when its key is the server's,
// and switching it off removes only this server's registration, since the browser's one subscription
// per site may serve other servers. The row says why when this browser cannot receive pushes, and when the product sends none.
//
//   <NotificationSettings client={client} />
//
// `children` close the section.

const BLOCKED = {
  "needs-install": {
    icon: "smartphone",
    title: "Add this to your Home Screen first",
    sub: "On iPhone and iPad, notifications only work once this is installed as an app. Share → Add to Home Screen, then open it from there.",
  },
  unsupported: {
    icon: "bell-off",
    title: "This browser can’t receive notifications",
    sub: "It doesn’t support the Push API. A recent Chrome, Firefox, Edge or Safari does.",
  },
  denied: {
    icon: "bell-off",
    title: "Notifications are blocked for this site",
    sub: "The browser won’t ask again. You’ll have to re-allow them in its site settings.",
  },
};

/** @param {any} e */
const message = (e) => (e && (e.userMessage || e.message)) || "That didn’t work.";

/**
 * @typedef {object} NotificationSettingsOwnProps
 * @property {import("../lib/notificationsClient.js").NotificationsClient} client The product's notifications client.
 * @property {Record<string, { icon?: string }>} [kindStyles] Overrides a kind's icon, by kind id.
 * @property {string} [title] The section's heading; `Notifications` by default.
 * @property {import("react").ReactNode} [children] Close the section.
 */
/** @param {NotificationSettingsOwnProps} props */
function NotificationSettings({ client, kindStyles, title = "Notifications", children }) {
  const [kinds, setKinds] = React.useState(/** @type {import("../lib/notificationsClient.js").NotificationKind[] | null} */ (null));
  const [values, setValues] = React.useState(/** @type {Record<string, boolean>} */ ({}));
  const [push, setPush] = React.useState(/** @type {any} */ (null));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let live = true;
    Promise.all([client.kinds(), client.preferences()]).then(
      ([k, p]) => { if (live) { setKinds((k && k.kinds) || []); setValues((p && p.kinds) || {}); } },
      (e) => { if (live) { setKinds([]); setError(message(e)); } },
    );
    return () => { live = false; };
  }, [client]);

  const readPush = React.useCallback(async () => {
    const browser = support();
    try {
      const key = await client.pushKey();
      const enabled = key.enabled !== false;
      const endpoint = browser.state === "ready" || browser.state === "denied" ? await currentEndpoint() : null;
      const devices = enabled ? ((await client.devices()).endpoints || []) : [];
      setPush({ ...browser, enabled, publicKey: key.publicKey, devices: devices.length, registered: !!endpoint && devices.includes(endpoint) });
    } catch (e) {
      setPush({ ...browser, enabled: false, publicKey: "", devices: 0, registered: false, unreachable: message(e) });
    }
  }, [client]);

  React.useEffect(() => { readPush(); }, [readPush]);

  async function flip(id, next) {
    setValues((v) => ({ ...v, [id]: next }));
    setError("");
    try {
      const reply = await client.setPreferences({ [id]: next });
      if (reply && reply.kinds) setValues(reply.kinds);
    } catch (e) {
      setValues((v) => ({ ...v, [id]: !next }));
      setError(message(e));
    }
  }

  // Called straight off the press: the permission prompt has to come from a real gesture, and an
  // `await` before it turns a prompt into a silent refusal on some browsers.
  async function togglePush(next) {
    setBusy(true);
    setError("");
    try {
      if (next) {
        const sub = await acquire(push.publicKey);
        const json = sub.toJSON();
        await client.subscribe({ endpoint: json.endpoint, p256dh: json.keys && json.keys.p256dh, auth: json.keys && json.keys.auth });
      } else {
        await release((endpoint) => client.unsubscribe(endpoint));
      }
      await readPush();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  if (!kinds || !push) {
    return (
      <SettingsSection icon="bell" title={title}>
        <SettingsRow icon="bell" title={<Skeleton w={220} />} sub={<Skeleton w="60%" h={10} />} />
      </SettingsSection>
    );
  }

  const blocked = BLOCKED[push.state];
  const switchable = kinds.filter((k) => k.switchable && k.id in values);
  const iconOf = (k) => (kindStyles && kindStyles[k.id] && kindStyles[k.id].icon) || k.icon || "bell";

  return (
    <SettingsSection icon="bell" title={title}>
      {switchable.map((k) => (
        <SettingsRow key={k.id} icon={iconOf(k)} title={k.title} sub={k.description}>
          <Toggle on={!!values[k.id]} onChange={(next) => flip(k.id, next)} label={"Tell me: " + k.title} />
        </SettingsRow>
      ))}

      {blocked
        ? <SettingsRow icon={blocked.icon} title={blocked.title} sub={blocked.sub} tone="warn" />
        : (
          <SettingsRow icon="smartphone" title="Notify this browser"
            sub={push.enabled
              ? "A push reaches this browser even when the site is closed."
              : "Switched off by whoever runs this, so nothing would be sent."}
            value={push.enabled ? (push.devices === 1 ? "1 device" : push.devices + " devices") : undefined}>
            <Toggle on={push.registered} disabled={busy || !push.enabled} onChange={togglePush} label="Notify this browser" />
          </SettingsRow>
        )}

      {push.unreachable && <Notice tone="warn">{push.unreachable}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      {children}
    </SettingsSection>
  );
}

export { NotificationSettings };
export default NotificationSettings;
