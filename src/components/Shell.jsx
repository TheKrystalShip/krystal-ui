import React from "react";
import { AccountAvatar } from "./AccountAvatar.jsx";
import { Icon } from "./Icon.jsx";

// The application frame: a sidebar beside a scrolling main column, with whatever floats over both
// (a dock, its launcher, the toasts) after them. On wide screens the sidebar collapses to an icon
// rail. On phones it is an off-canvas drawer, opened by the edge handle or a swipe and closed by
// the scrim behind it, unless the site gives a `tabBar`: then the phone has the bar along its
// bottom edge instead, and neither the drawer nor its handle.
//
// `dockPush` is the width a pinned dock takes from the page, in pixels; the frame pads its right
// edge by it so the page reflows rather than sitting under the dock.
function AppShell({ sidebar, collapsed, drawerOpen, onDrawer, dockPush = 0, aside, tabBar, mainRef, children }) {
  return (
    <div
      className={"app" + (tabBar ? " app--tabbed" : "")}
      style={{ "--dock-push": dockPush + "px", ...(collapsed ? { "--sidebar-w": "64px" } : {}) }}>
      {sidebar}
      {drawerOpen
        ? <div className="sidebar-scrim sidebar-scrim--open" onClick={() => onDrawer(false)} />
        : !tabBar && <MobileNavToggle onOpen={() => onDrawer(true)} />}
      <main className="app__main" ref={mainRef}>{children}</main>
      {aside}
      {tabBar}
    </div>
  );
}

// The phone's way around a site: a row of tabs along the bottom edge, each an icon over its label,
// the current one in the accent. Drawn only on phones; on a wide screen the sidebar is the way
// around. Each item is `{ id, icon, label, active, onClick, badge, tone }`, where `badge` is a count
// drawn on the icon when it is above zero, in a `tone` of info, warn or danger. The bar clears the
// home indicator of a phone that has one.
function TabBar({ items, label = "Main" }) {
  return (
    <nav className="tabbar" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id || item.label}
          type="button"
          className={"tabbar__tab" + (item.active ? " tabbar__tab--active" : "")}
          aria-current={item.active ? "page" : undefined}
          onClick={item.onClick}>
          <span className="tabbar__icon">
            <Icon name={item.icon} size={22} />
            {item.badge > 0 && <span className={"tabbar__badge tabbar__badge--" + (item.tone || "warn")}>{item.badge}</span>}
          </span>
          <span className="tabbar__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// The sidebar: the brand row with its collapse toggle, an optional `top` slot under it (a search
// field), the nav groups as children, and the `foot` pinned to the bottom. Only the nav scrolls, so
// the foot stays reachable in a short window. The hairline under the brand moves under `top` when
// there is one, so the header reads as one block. `closeNav` rules off the last group too, for a
// site whose nav and foot are far apart.
function Sidebar({ mark, wordmark, open, collapsed, onToggleCollapse, top, closeNav, foot, children }) {
  return (
    <aside className={"sidebar" + (open ? " sidebar--open" : "") + (collapsed ? " sidebar--rail" : "")}>
      <div className="sidebar__brand">
        <img src={mark} width="32" height="32" alt="" style={{ objectFit: "contain" }} />
        <span className="sidebar__brand-wordmark">{wordmark}</span>
        <button
          type="button"
          className="sidebar__collapse"
          onClick={onToggleCollapse}
          data-tip={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={16} />
        </button>
      </div>
      {top && <div className="sidebar__top">{top}</div>}
      <nav className={"sidebar__nav" + (closeNav ? " sidebar__nav--closed" : "")}>{children}</nav>
      {foot && <div className="sidebar__foot">{foot}</div>}
    </aside>
  );
}

// The signed-in person, at the bottom of the sidebar's foot: their avatar, their name and a `sub`
// line under it, opening a menu upward of `items` — `{ icon, label, onClick, danger }`. `detail` is
// what the menu's head says under the name. On the collapsed rail the row is the avatar alone.
function SidebarAccount({ user, sub, detail, items = [], collapsed }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const escape = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const name = user.display || user.name;
  return (
    <div className="sidebar__account-wrap" ref={ref}>
      {open && (
        <div className="sidebar__account-menu" role="menu">
          <div className="sidebar__account-menu__head">
            <div className="sidebar__account-menu__name">{name}</div>
            {detail && <div className="sidebar__account-menu__detail">{detail}</div>}
          </div>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={"sidebar__account-menu__item" + (item.danger ? " sidebar__account-menu__item--danger" : "")}
              onClick={() => { setOpen(false); item.onClick && item.onClick(); }}>
              <Icon name={item.icon} size={14} />{item.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={"sidebar__account" + (open ? " sidebar__account--open" : "")}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={name}
        data-tip={collapsed && !open ? name : undefined}>
        <AccountAvatar user={user} size={28} />
        {!collapsed && (
          <>
            <span className="sidebar__account__text">
              <span className="sidebar__account__name">{name}</span>
              {sub && <span className="sidebar__account__sub">{sub}</span>}
            </span>
            <Icon name="chevrons-up-down" size={14} className="sidebar__account__caret" />
          </>
        )}
      </button>
    </div>
  );
}

// A run of related links. Groups are ruled off from each other by a hairline, so a group with
// nothing in it should not be rendered at all. The label is for a group whose links do not say
// what they share on their own; the collapsed rail hides it.
function SidebarGroup({ label, children }) {
  return (
    <div className="sidebar__group">
      {label && <div className="sidebar__group-label">{label}</div>}
      {children}
    </div>
  );
}

// One link. `badge` is a count drawn after the label when it is above zero, in a `tone` of info,
// warn or danger; on the collapsed rail it becomes a pip on the icon. `tip` is what the rail's
// tooltip says, defaulting to the label.
function NavItem({ icon, label, active, onClick, badge = 0, tone = "info", tip, iconSize = 16 }) {
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick && onClick(e); }
  };
  return (
    <div
      className={"nav-item" + (active ? " nav-item--active" : "")}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={0}
      aria-current={active ? "page" : undefined}
      data-tip={tip || label}
      aria-label={label}>
      <Icon name={icon} size={iconSize} />
      <span className="nav-item__label">{label}</span>
      {badge > 0 && <span className={"nav-item__badge nav-item__badge--" + tone}>{badge}</span>}
    </div>
  );
}

// The drawer's opener on phones: a slim handle on the left edge, where the swipe lives.
function MobileNavToggle({ onOpen }) {
  return (
    <button className="mnav mnav--edge" onClick={onOpen} aria-label="Open menu" title="Menu">
      <Icon name="chevron-right" size={16} />
    </button>
  );
}

export { AppShell, MobileNavToggle, NavItem, Sidebar, SidebarAccount, SidebarGroup, TabBar };
