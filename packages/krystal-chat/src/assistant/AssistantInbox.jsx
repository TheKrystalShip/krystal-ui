import { Button } from "@thekrystalship/krystal";
import { Notice } from "@thekrystalship/krystal";
import { NotificationList } from "@thekrystalship/krystal";
import { NotificationSettings } from "@thekrystalship/krystal";

// AssistantInbox — what the assistant has told the person, drawn by the chat in the conversation's
// place. The rows are the assistant's own notifications (`GET /notifications` on the plugin); one
// that belongs to a conversation (`data.conversationId`) opens it. "Settings" turns the view to the
// per-kind switches and this browser's push, and the header's back returns to the list.
//
// `inbox` is `createNotificationInbox`'s answer and `client` the matching `createNotificationsClient`.
// With neither there is nothing to read, and the view shows `unavailable`.

/**
 * @param {object} props
 * @param {import("@thekrystalship/krystal/lib/notificationInbox").NotificationInbox | null} props.inbox The assistant's notifications. Null shows `unavailable`.
 * @param {boolean} props.settings Whether the settings are shown in place of the list.
 * @param {() => void} props.onSettings Called by the Settings button.
 * @param {(conversationId: string) => void} props.onOpenConversation Called with the conversation a picked row belongs to.
 * @param {import("react").ReactNode} [props.unavailable] why there is nothing to show
 */
function AssistantInbox({ inbox, settings, onSettings, onOpenConversation, unavailable = null }) {
  if (!inbox) return <div className="k-assistant-panel">{unavailable}</div>;
  if (settings) return <div className="k-assistant-panel"><NotificationSettings client={inbox.client} /></div>;
  return <InboxList inbox={inbox} onSettings={onSettings} onOpenConversation={onOpenConversation} />;
}

/** @param {{ inbox: import("@thekrystalship/krystal/lib/notificationInbox").NotificationInbox, onSettings: () => void, onOpenConversation: (id: string) => void }} props */
function InboxList({ inbox, onSettings, onOpenConversation }) {
  const { unread, items, more, kinds, error } = inbox.useInbox();
  const pick = (item) => {
    if (!item.read) inbox.markRead([item.id]);
    onOpenConversation(item.data.conversationId);
  };
  return (
    <div className="k-assistant-panel">
      <div className="k-chat-inbox__bar">
        <Button variant="link" size="xs" disabled={unread === 0} onClick={() => inbox.markRead()}>Mark all read</Button>
        <Button variant="ghost" size="sm" icon="settings-2" onClick={onSettings}>Settings</Button>
      </div>
      {error && items && <Notice tone="warn">{error.message || "Notifications couldn’t be refreshed."}</Notice>}
      <NotificationList items={items} kinds={kinds} error={error} more={more} onMore={inbox.loadMore}
        onOpen={pick} canOpen={(n) => !!(n.data && n.data.conversationId)} />
    </div>
  );
}

export { AssistantInbox };
