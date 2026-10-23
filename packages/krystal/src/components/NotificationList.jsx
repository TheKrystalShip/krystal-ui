import React from "react";
import { Icon } from "./Icon.jsx";
import { Skeleton } from "./Skeleton.jsx";
import { fmtRelative } from "../lib/time.js";

// NotificationList — a person's notifications as rows, newest first and grouped by day.
//
// A row is an icon in a square toned by its kind, the line, a second line, how long ago, the words
// of its link and a mark while it is unread. A kind is drawn from the product's own description of
// it (`kinds`, what `GET /notifications/kinds` answers); `kindStyles` overrides a kind's icon and
// tone, and a kind nobody described is drawn as a plain bell. A row opens when `canOpen` says so
// (one with a `url` by default): picking it calls `onOpen(item)`.
//
// `items` null with no `error` is a list still being read. `footer` is drawn under the rows.

const PLAIN = { icon: "bell", tone: "neutral" };

const TONES = ["neutral", "teal", "info", "success", "warning", "danger"];

/** @param {Date} d */
const dayKey = (d) => d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();

/** @param {Date} d @param {Date} now */
function dayLabel(d, now) {
  if (dayKey(d) === dayKey(now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(yesterday)) return "Yesterday";
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: sameYear ? undefined : "numeric" });
}

/**
 * @typedef {object} NotificationListOwnProps
 * @property {import("../lib/notificationsClient.js").NotificationItem[] | null} [items] Newest first; null while the first read is under way.
 * @property {import("../lib/notificationsClient.js").NotificationKind[]} [kinds] What the product tells people about, for each kind's icon and tone.
 * @property {Record<string, { icon?: string, tone?: string }>} [kindStyles] Overrides a kind's icon and tone, by kind id.
 * @property {{ message?: string } | null} [error] The failure that stopped the list being read; drawn when there are no rows.
 * @property {(item: import("../lib/notificationsClient.js").NotificationItem) => void} [onOpen] Called with a row when it is picked.
 * @property {(item: import("../lib/notificationsClient.js").NotificationItem) => boolean} [canOpen] Whether a row can be picked; a row with a `url` by default.
 * @property {import("react").ReactNode} [footer] Drawn under the rows.
 * @property {boolean} [more] Older rows are held back; draws the "Show older" row.
 * @property {() => void} [onMore] Called by "Show older".
 * @property {Date} [now] The moment times are told against; the present by default.
 * @property {string} [className] Class name added to the root element.
 * @typedef {NotificationListOwnProps & Omit<import("react").ComponentPropsWithoutRef<"div">, keyof NotificationListOwnProps>} NotificationListProps
 */
/** @param {NotificationListProps} props */
function NotificationList({
  items, kinds = [], kindStyles, error, onOpen, canOpen = (n) => !!n.url, footer, more = false, onMore, now: nowProp, className, ...rest
}) {
  const now = nowProp || new Date();
  const described = React.useMemo(() => {
    const map = {};
    for (const k of kinds) map[k.id] = { icon: k.icon, tone: k.tone };
    return map;
  }, [kinds]);
  const style = (id) => {
    const kind = { ...PLAIN, ...(described[id] || {}), ...((kindStyles && kindStyles[id]) || {}) };
    return { icon: kind.icon || PLAIN.icon, tone: TONES.includes(kind.tone) ? kind.tone : PLAIN.tone };
  };

  const groups = [];
  for (const n of items || []) {
    const when = new Date(n.createdAt);
    const key = dayKey(when);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.rows.push(n);
    else groups.push({ key, label: dayLabel(when, now), rows: [n] });
  }

  return (
    <div className={"k-notification-list" + (className ? " " + className : "")} {...rest}>
      {!items && !error && (
        <div className="k-notification-list__loading" aria-busy="true">
          {[0, 1, 2].map((i) => <Skeleton key={i} h={36} />)}
        </div>
      )}
      {!items && error && (
        <div className="k-notification-list__empty k-notification-list__empty--error" role="alert">
          <Icon name="circle-alert" size={18} />
          <span>{error.message || "Notifications couldn’t be read."}</span>
        </div>
      )}
      {items && items.length === 0 && (
        <div className="k-notification-list__empty">
          <Icon name="bell-off" size={18} />
          <span>Nothing yet.</span>
        </div>
      )}
      {groups.map((g) => (
        <section key={g.key} className="k-notification-list__day" aria-label={g.label}>
          <h3 className="k-notification-list__heading">{g.label}</h3>
          {g.rows.map((n) => {
            const kind = style(n.kind);
            const link = !!onOpen && canOpen(n);
            return (
              <div key={n.id}
                className={"k-notification" + (n.read ? "" : " k-is-unread") + (link ? " k-is-link" : "")}
                role={link ? "button" : undefined} tabIndex={link ? 0 : undefined}
                onClick={link ? () => onOpen(n) : undefined}
                onKeyDown={link ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(n); } } : undefined}>
                <span className={"k-notification__icon k-notification__icon--" + kind.tone}>
                  <Icon name={kind.icon} size={16} strokeWidth={2} />
                </span>
                <div className="k-notification__body">
                  <span className="k-notification__text">{n.text}</span>
                  {n.detail && <span className="k-notification__detail">{n.detail}</span>}
                  <span className="k-notification__meta">
                    <time className="k-notification__time" dateTime={n.createdAt}>{fmtRelative(new Date(n.createdAt), now)}</time>
                    {n.action && n.url && <span className="k-notification__action">{n.action} →</span>}
                  </span>
                </div>
                {!n.read && <span className="k-notification__mark" role="img" aria-label="Unread" />}
              </div>
            );
          })}
        </section>
      ))}
      {more && onMore && (
        <button type="button" className="k-notification-list__more" onClick={onMore}>Show older</button>
      )}
      {footer != null && <div className="k-notification-list__footer">{footer}</div>}
    </div>
  );
}

export { NotificationList };
export default NotificationList;
