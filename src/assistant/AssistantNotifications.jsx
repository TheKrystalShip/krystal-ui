import React from "react";
import { Notice } from "../components/Notice.jsx";
import { SettingsRow, SettingsSection } from "../components/settings-primitives.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { Toggle } from "../components/Toggle.jsx";
import { pushStatus, pushSubscribe, pushUnsubscribe } from "./push.js";

// AssistantNotifications — one switch, for one thing: being told about an action the assistant
// proposed and is waiting on you for, once you have stopped looking at the chat.
//
// It is per DEVICE rather than per account, because that is what a push subscription is — this
// browser, on this origin, with keys it minted itself. Signing in on a second phone notifies neither
// until that one is registered too. It offers no list of events: the assistant announces the one
// thing that is its own.
//
//   <AssistantNotifications client={client}>
//     <Notice>Where everything else you are told about is switched.</Notice>
//   </AssistantNotifications>
//
// `client` is the assistant client (`createAssistantClient`), stable across renders. `offSub` is the
// row's sentence when the assistant sends nothing at all, and `children` close the section.

const BLOCKED = {
  "needs-install": {
    icon: "smartphone",
    title: "Add the assistant to your Home Screen first",
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
    sub: "The browser won’t ask again — you’ll have to re-allow them in its site settings.",
  },
};

function AssistantNotifications({
  client,
  offSub = "Switched off by whoever runs this assistant, so nothing would be sent.",
  children,
}) {
  const [state, setState] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(() => {
    pushStatus(client).then(setState).catch(() => setState({ state: "unsupported", registered: false }));
  }, [client]);

  React.useEffect(refresh, [refresh]);

  async function toggle(next) {
    setBusy(true);
    setError("");
    try {
      // Called straight off the click. The permission prompt has to come from a real gesture, and
      // an `await` before it is what turns a prompt into a silent denial on some browsers.
      if (next) await pushSubscribe(client);
      else await pushUnsubscribe(client);
      refresh();
    } catch (e) {
      setError(e && e.message ? e.message : "That didn’t work.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <SettingsSection icon="bell" title="Notifications">
        <SettingsRow icon="bell" title={<Skeleton w={220} />} sub={<Skeleton w="60%" h={10} />} />
      </SettingsSection>
    );
  }

  // The three states where there is nothing to switch each get their own sentence, because the thing
  // to do about them is different — and "unsupported" would be false for two of them.
  const blocked = BLOCKED[state.state];

  return (
    <SettingsSection icon="bell" title="Notifications"
      meta="This device only. A push subscription belongs to one browser.">
      {blocked
        ? <SettingsRow icon={blocked.icon} title={blocked.title} sub={blocked.sub} tone="warn" />
        : (
          <SettingsRow icon="bell" title="Tell me about actions waiting on me"
            sub={state.enabled
              ? "When the assistant proposes something and you’ve closed the chat, it’ll send it here with Confirm and Cancel. A proposal expires a few minutes after it’s made, so this is a nudge, not an inbox."
              : offSub}>
            <Toggle on={state.registered} disabled={busy || !state.enabled}
              onChange={toggle} label="Notify this device about waiting actions" />
          </SettingsRow>
        )}

      {state.unreachable && <Notice tone="warn">{state.reason || "The assistant didn’t answer."}</Notice>}

      {error && <Notice tone="danger">{error}</Notice>}

      {children}
    </SettingsSection>
  );
}

export { AssistantNotifications };
