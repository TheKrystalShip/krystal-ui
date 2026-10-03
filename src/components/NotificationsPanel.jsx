import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";
import { usePortalPopover } from "../hooks/usePortalPopover.js";
import { fmtRelative } from "../lib/time.js";
import { useStore } from "../lib/store.js";
import { toast, toastStore, unreadCount, unreadTone } from "../lib/toasts.js";

// NotificationsPanel — the sidebar entry and popover for the toast history.
//
// A toast is gone in seconds by design; this is where you go when one left
// before you read it. Opening it marks every row read.
//
// The entry is drawn as a sidebar row (`nav-item`), so the sidebar that holds it
// styles it, collapsed rail included, and it needs no markup of its own for either.
// A row with a `subject` is a link: picking it calls `onOpen(subject)`.

const TONE_ICON = { error: "circle-alert", success: "circle-check", info: "info" };

function NotificationsPanel({ onOpen }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const { pos, menuRef } = usePortalPopover(open, setOpen, ref);
  const history = useStore(toastStore, s => s.history);
  const unread = useStore(toastStore, unreadCount);
  const tone = useStore(toastStore, unreadTone);

  // Opening IS the acknowledgement — the rows are on screen, so holding the
  // badge up would just make it a thing to dismiss twice.
  const toggle = () => setOpen(o => {
    const next = !o;
    if (next) toast.markAllRead();
    return next;
  });

  const pick = (t) => {
    setOpen(false);
    if (t.subject && onOpen) onOpen(t.subject);
  };

  const now = new Date();

  return (
    <div className="notif" ref={ref}>
      <div
        className={"nav-item" + (open ? " nav-item--active" : "")}
        onClick={toggle}
        role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        data-tip={"Notifications" + (unread > 0 ? " · " + unread : "")}
        aria-label={"Notifications" + (unread > 0 ? ", " + unread + " unread" : "")}
        aria-haspopup="menu" aria-expanded={open}
      >
        <Icon name="bell" size={16} />
        <span className="nav-item__label">Notifications</span>
        {unread > 0 && <span className={"nav-item__badge nav-item__badge--" + tone}>{unread}</span>}
      </div>

      {open && pos && createPortal(
        <div className="notif__menu" role="menu" ref={menuRef} style={pos}>
          <div className="notif__head">
            <span className="notif__head-label">Notifications</span>
            {history.length > 0 && (
              <button type="button" className="notif__clear" onClick={() => toast.clearHistory()}>Clear all</button>
            )}
          </div>

          <div className="notif__list">
            {history.length === 0 ? (
              <div className="notif__empty">
                <Icon name="bell-off" size={18} />
                <span>Nothing yet.</span>
                {/* Says which of the two lists this is, so it is never mistaken for Alerts. */}
                <span className="notif__empty-sub">Actions you take here show up in this list.</span>
              </div>
            ) : history.map(t => (
              <div
                key={t.id}
                className={"notif__item notif__item--" + t.tone + (t.subject ? " notif__item--link" : "")}
                onClick={() => pick(t)}
                role={t.subject ? "button" : undefined}
                tabIndex={t.subject ? 0 : undefined}
                onKeyDown={t.subject ? (e => { if (e.key === "Enter") pick(t); }) : undefined}
              >
                <span className="notif__icon"><Icon name={TONE_ICON[t.tone] || "info"} size={14} strokeWidth={2} /></span>
                <div className="notif__body">
                  <div className="notif__title">
                    {t.title}
                    {t.count > 1 && <span className="notif__count">×{t.count}</span>}
                  </div>
                  {t.detail && <div className="notif__detail">{t.detail}</div>}
                  <div className="notif__meta">
                    <span>{fmtRelative(new Date(t.ts), now)}</span>
                    {t.code && <><span className="notif__dot">·</span><code className="notif__code">{t.code}</code></>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export { NotificationsPanel };
export default NotificationsPanel;
