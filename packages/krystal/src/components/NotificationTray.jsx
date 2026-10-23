import React from "react";
import { Button } from "./Button.jsx";
import { Drawer } from "./Drawer.jsx";
import { NotificationList } from "./NotificationList.jsx";
import { Popover } from "./Popover.jsx";
import { usePhone } from "../hooks/usePhone.js";

// NotificationTray — the trigger and the list it opens: beside the sidebar on a wide screen, in a
// drawer on a phone, with Mark all read in its head.
//
// `trigger` is a render function that draws the opener and receives `{ open, toggle, unread }`: a
// sidebar `NavItem` with `badge={unread}` (`role="button"`, `aria-haspopup="dialog"`), or an
// `IconButton` with a dot while `unread` is above zero. `inbox` is `createNotificationInbox`'s
// answer; the tray reads it, marks a row read when it is picked and Mark all read through it.
//
//   <NotificationTray inbox={inbox} onOpen={(n) => navigate(n.url)}
//     trigger={({ open, toggle, unread }) => (
//       <NavItem icon="bell" label="Notifications" badge={unread} active={open} onClick={toggle} role="button" />
//     )} />
//
// A press outside the popover, or Escape, closes it. `footer` is drawn under the rows, and may be a
// function receiving `{ close }`.

/**
 * @typedef {object} NotificationTrayOwnProps
 * @property {import("../lib/notificationInbox.js").NotificationInbox} inbox The notifications to show.
 * @property {(api: { open: boolean, toggle: () => void, unread: number }) => import("react").ReactNode} trigger Draws the opener.
 * @property {(item: import("../lib/notificationsClient.js").NotificationItem) => void} [onOpen] Called with a row when it is picked, after the tray has closed.
 * @property {(item: import("../lib/notificationsClient.js").NotificationItem) => boolean} [canOpen] Whether a row can be picked; a row with a `url` by default.
 * @property {Record<string, { icon?: string, tone?: string }>} [kindStyles] Overrides a kind's icon and tone, by kind id.
 * @property {import("react").ReactNode | ((api: { close: () => void }) => import("react").ReactNode)} [footer] Drawn under the rows, for a link to the settings.
 * @property {import("@floating-ui/react-dom").Placement} [placement] Which side of the opener the popover takes on a wide screen; `right-end` by default.
 * @property {string} [title] The heading; `Notifications` by default.
 * @property {string} [className] Class name added to the root element.
 */
/** @param {NotificationTrayOwnProps} props */
function NotificationTray({ inbox, trigger, onOpen, canOpen, kindStyles, footer, placement = "right-end", title = "Notifications", className }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const phone = usePhone();
  const { unread, items, more, kinds, error } = inbox.useInbox();
  const close = React.useCallback(() => setOpen(false), []);

  const pick = (item) => {
    close();
    if (!item.read) inbox.markRead([item.id]);
    if (onOpen) onOpen(item);
  };

  const markAll = unread > 0 && (
    <Button variant="link" size="xs" onClick={() => inbox.markRead()}>Mark all read</Button>
  );
  const list = (
    <NotificationList items={items} kinds={kinds} kindStyles={kindStyles} error={error} onOpen={pick} canOpen={canOpen}
      more={more} onMore={inbox.loadMore}
      footer={typeof footer === "function" ? footer({ close }) : footer} />
  );

  return (
    <div className={"k-notification-tray" + (className ? " " + className : "")} ref={anchorRef}>
      {trigger({ open, toggle: () => setOpen((o) => !o), unread })}
      {phone ? open && (
        <Drawer title={title} action={markAll} onClose={close} className="k-notification-tray__drawer">
          {list}
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen} anchorRef={anchorRef} placement={placement} label={title}
          className="k-notification-tray__panel">
          <div className="k-notification-tray__head">
            <span className="k-notification-tray__title">{title}</span>
            {markAll}
          </div>
          {list}
        </Popover>
      )}
    </div>
  );
}

export { NotificationTray };
export default NotificationTray;
