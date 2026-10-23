import React from "react";
import {
  Button, IconButton, NavItem, NotificationList, NotificationSettings, NotificationTray,
  createNotificationInbox, createNotificationsClient,
} from "@thekrystalship/krystal";
import { Section, Sub } from "../kit.jsx";

const KINDS = [
  { id: "ready", title: "A film is ready", description: "When a film you asked for can be watched.", icon: "circle-check", tone: "success", switchable: true, enabledByDefault: true },
  { id: "invite", title: "An invitation", icon: "user-plus", tone: "teal", switchable: false, enabledByDefault: true },
  { id: "alert", title: "Something needs you", description: "A server that stopped or a disk that filled.", icon: "triangle-alert", tone: "warning", switchable: true, enabledByDefault: true },
];

const ago = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const ITEMS = [
  { id: "n5", kind: "alert", text: "Factorio stopped on its own.", detail: "It was running for 3 hours.", url: "/servers/factorio", action: "Open the server", createdAt: ago(4), read: false },
  { id: "n4", kind: "ready", text: "Stalker is ready to watch.", url: "/films/stalker", action: "Watch", createdAt: ago(95), read: false },
  { id: "n3", kind: "invite", text: "Ana invited you to a plan for Friday.", url: "/plans/9", action: "See the plan", createdAt: ago(60 * 26), read: true },
  { id: "n2", kind: "ready", text: "Solaris is ready to watch.", createdAt: ago(60 * 27), read: true },
  { id: "n1", kind: "unknown", text: "A kind this page was never told about.", createdAt: ago(60 * 24 * 9), read: true },
];

// A client answering from memory, so the examples run with no server.
function staticClient(items) {
  let rows = items;
  let prefs = { ready: true, alert: false };
  return createNotificationsClient({
    request: async (method, path, body) => {
      if (path.startsWith("/notifications/kinds")) return { kinds: KINDS };
      if (path === "/notifications/preferences") {
        if (method === "PUT") prefs = { ...prefs, ...body.kinds };
        return { kinds: prefs };
      }
      if (path === "/notifications/read") {
        rows = rows.map((n) => (!body.ids || body.ids.includes(n.id) ? { ...n, read: true } : n));
        return undefined;
      }
      if (path.startsWith("/notifications")) return { unread: rows.filter((n) => !n.read).length, items: rows, more: false };
      if (path === "/push/key") return { publicKey: "", enabled: false };
      if (path === "/push/devices") return { endpoints: [] };
      return undefined;
    },
  });
}

export default function NotificationsSection() {
  const client = React.useMemo(() => staticClient(ITEMS), []);
  const inbox = React.useMemo(() => createNotificationInbox(client), [client]);
  const { items, kinds } = inbox.useInbox();
  return (
    <Section id="notifications" title="Notifications">
      <Sub title="The list: grouped by day, unread marked, a row with a link opens">
        <div style={{ maxWidth: 400, border: "1px solid var(--border-subtle)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
          <NotificationList items={items} kinds={kinds} onOpen={() => {}} footer={<Button variant="ghost" size="sm" icon="settings-2">Settings</Button>} />
        </div>
      </Sub>
      <Sub title="Empty, still loading, and a failed read">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[{ items: [] }, { items: null }, { items: null, error: new Error("The server did not answer.") }].map((p, i) => (
            <div key={i} style={{ width: 260, border: "1px solid var(--border-subtle)", borderRadius: "var(--r-sm)" }}>
              <NotificationList {...p} />
            </div>
          ))}
        </div>
      </Sub>
      <Sub title="The tray: a sidebar entry on a wide screen, a drawer on a phone">
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 220 }}>
            <NotificationTray inbox={inbox} onOpen={() => {}}
              trigger={({ open, toggle, unread }) => (
                <NavItem icon="bell" label="Notifications" badge={unread} active={open} onClick={toggle} role="button"
                  aria-haspopup="dialog" aria-expanded={open} />
              )} />
          </div>
          <NotificationTray inbox={inbox} placement="bottom-end"
            trigger={({ open, toggle, unread }) => (
              <span style={{ position: "relative", display: "inline-flex" }}>
                <IconButton icon="bell" label={"Notifications" + (unread > 0 ? ", " + unread + " unread" : "")} onClick={toggle} aria-expanded={open} />
              </span>
            )} />
        </div>
      </Sub>
      <Sub title="Settings: a switch for each kind that can be switched, and this browser's push">
        <div style={{ maxWidth: 520 }}>
          <NotificationSettings client={client} />
        </div>
      </Sub>
    </Section>
  );
}
